import type { LexicalEditorWithDispose, Signal } from "@lexical/extension";
import {
  $addUpdateTag,
  $createParagraphNode,
  $createRangeSelectionFromDom,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $getStateChange,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  $onUpdate,
  $setSelection,
  COMMAND_PRIORITY_BEFORE_EDITOR,
  COMMAND_PRIORITY_EDITOR,
  type EditorState,
  getComposedEventTarget,
  getDOMSelection,
  getParentElement,
  HISTORIC_TAG,
  HISTORY_MERGE_TAG,
  HISTORY_PUSH_TAG,
  isDOMNode,
  isHTMLElement,
  KEY_ESCAPE_COMMAND,
  type LexicalCommand,
  type LexicalEditor,
  mergeRegister,
  type PointType,
  type RangeSelection,
  REDO_COMMAND,
  registerEventListeners,
  RootNode,
  SELECTION_CHANGE_COMMAND,
  type SerializedEditorState,
  UNDO_COMMAND,
} from "lexical";

import { CLOSE_PAGE_SLOT_COMMAND, EDIT_PAGE_SLOT_COMMAND } from "./commands";
import { HEADER_FOOTER_COMMIT_TAG, SLOT_SYNC_TAG, SLOT_WRITE_BACK_DELAY_MS } from "./constants";
import { resolveSlotVariant } from "./geometry";
import type { PagesLayout, PagesLayoutSlotProvider } from "./layout";
import { $writeCountersIntoEditor, normalizeCounterText, writeCountersIntoDOM } from "./nodes";
import { $getPageSlotContent, $setPageSlotContent, slotStateFor } from "./states";
import type { ActivePageSlot, PageSetup, PageSlotKind, PageSlotVariant, SlotHeights } from "./types";

/** Builds one nested header/footer editor for `parent` */
export type SlotEditorBuilder = (parent: LexicalEditor) => LexicalEditorWithDispose;

/**
 * Makes the static copy of a header or footer look like its live editor, for
 * content that cloning the DOM does not carry over, such as shadow roots
 */
export type SlotCloneRenderer = (clone: HTMLElement, source: HTMLElement) => void;

const SLOT_KINDS: readonly PageSlotKind[] = ["header", "footer"];
const CLONE_ATTRIBUTES_TO_STRIP = [
  "contenteditable",
  "data-lexical-editor",
  "role",
  "spellcheck",
  "autocapitalize",
  "autocorrect",
];
const LIVE_CONTENT_CLASS = "Pages__slotContent--live";
const LIVE_SLOT_CLASS = "Pages__slot--live";

type SlotKey = `${PageSlotKind}:${PageSlotVariant}`;

interface Point {
  x: number;
  y: number;
}

/** Whether a selection point saved from an earlier state still exists */
function $isPointValid(point: PointType): boolean {
  const node = $getNodeByKey(point.key);
  if (node === null) return false;
  const size = $isElementNode(node) ? node.getChildrenSize() : node.getTextContentSize();
  return point.offset <= size;
}

/** The form in which header/footer content is compared */
function serializeSlotContent(content: SerializedEditorState | null): string {
  return JSON.stringify(content ?? null);
}

/**
 * Whether a header or footer holds nothing to show: only paragraphs of blank
 * text. Math or any other node is content, even without text.
 */
function $isSlotEmpty(): boolean {
  return $getRoot()
    .getChildren()
    .every(
      (block) =>
        $isParagraphNode(block) &&
        block.getChildren().every((child) => $isTextNode(child) && child.getTextContent().trim() === "")
    );
}

/** The caret position under a client point, using whichever API exists */
function caretRangeAt(doc: Document, point: Point): Range | null {
  if (typeof doc.caretPositionFromPoint === "function") {
    const position = doc.caretPositionFromPoint(point.x, point.y);
    if (!position) return null;
    const range = doc.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.collapse(true);
    return range;
  }
  return doc.caretRangeFromPoint ? doc.caretRangeFromPoint(point.x, point.y) : null;
}

interface SlotEditor {
  kind: PageSlotKind;
  variant: PageSlotVariant;
  editor: LexicalEditorWithDispose;
  /** The nested editor's root element, parked in the layer when not live */
  root: HTMLElement;
  /** Cached static render, recreated after every nested update */
  clone: HTMLElement | null;
  refreshRafId: number | null;
  empty: boolean;
  /** The user has edited this editor since its content was last stored */
  dirty: boolean;
  /**
   * What the document stored for this variant when the editor last loaded or
   * wrote it. A document whose copy no longer matches was changed by someone
   * else, and that change wins.
   */
  baseline: string;
  cleanup: () => void;
}

interface ActiveSession {
  slotEditor: SlotEditor;
  slot: HTMLElement;
  pageIndex: number;
}

export interface PageSlotsOptions {
  activeSlot: Signal<ActivePageSlot | null>;
  activeSlotEditor: Signal<LexicalEditor | null>;
  buildSlotEditor: SlotEditorBuilder;
  renderClone?: SlotCloneRenderer;
  /**
   * Every nested editor created so far, for a React host to render their
   * decorators and plugins inside the application's own tree
   */
  slotEditors: Signal<readonly LexicalEditorWithDispose[]>;
}

/**
 * Header and footer content for the page layer.
 *
 * Content lives on the RootNode as NodeState, one serialized editor state per
 * variant. Each `(kind, variant)` that a page needs gets a nested editor,
 * created lazily and parked in the layer, and every slot on every page shows a
 * static copy of that editor's root, so pages cost no JavaScript. Clicking a
 * slot moves the nested editor's root into it and makes it editable; edits
 * refresh the copies live and are written back to the root, debounced, as the
 * document's own undo steps.
 */
export class PageSlots implements PagesLayoutSlotProvider {
  private readonly editors = new Map<SlotKey, SlotEditor>();
  private readonly heightObserver: ResizeObserver | null;
  private readonly cleanup: () => void;
  private readonly win: Window & typeof globalThis;
  private pageSetup: PageSetup | null = null;
  private active: ActiveSession | null = null;
  private writeBackTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * The document's last range selection. Focusing a nested editor sets the
   * document's selection to null, so this is where the caret goes back to
   * when a header or footer is closed from the keyboard.
   */
  private parentSelection: RangeSelection | null = null;
  /**
   * The live editor whose undo or redo is being applied to the document, and
   * whether that step changed its content (so that it stays open)
   */
  private replaying: { slotEditor: SlotEditor; changed: boolean } | null = null;
  private disposed = false;

  constructor(
    private readonly parent: LexicalEditor,
    private readonly layout: PagesLayout,
    private readonly options: PageSlotsOptions
  ) {
    this.win = layout.win;
    this.heightObserver =
      typeof this.win.ResizeObserver !== "undefined" ? new this.win.ResizeObserver(() => this.measureHeights()) : null;
    this.cleanup = mergeRegister(
      registerEventListeners(layout.layer, { click: (event) => this.onClick(event) }),
      // the user clicked back into the document, but not while an undo started
      // in a header is applied: restoring the document's selection moves the
      // focus, and the header decides afterwards whether it stays open
      registerEventListeners(layout.rootElement, {
        focusin: () => {
          if (this.replaying === null) this.close(true);
        },
      }),
      parent.registerCommand(
        EDIT_PAGE_SLOT_COMMAND,
        ({ kind, pageIndex, variant }) => {
          const index = variant !== undefined ? this.findPageForVariant(kind, variant) : (pageIndex ?? 0);
          return index !== null && this.open(kind, index);
        },
        COMMAND_PRIORITY_EDITOR
      ),
      parent.registerCommand(
        CLOSE_PAGE_SLOT_COMMAND,
        () => {
          const wasOpen = this.active !== null;
          this.close(true);
          return wasOpen;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      parent.registerMutationListener(RootNode, (_mutations, { prevEditorState }) =>
        this.onRootMutation(prevEditorState)
      ),
      parent.registerEditableListener((editable) => this.setEditable(editable)),
      parent.registerUpdateListener(({ editorState }) => {
        const selection = editorState.read($getSelection);
        if ($isRangeSelection(selection)) this.parentSelection = selection.clone();
      })
    );
    layout.setSlotProvider(this);
    this.setEditable(parent.isEditable());
  }

  /**
   * Mirrors the document's editable state onto the layer, so that the
   * stylesheet can drop the hints while read-only, and closes the open slot
   */
  private setEditable(editable: boolean): void {
    this.layout.layer.dataset.pageEditable = String(editable);
    if (!editable) this.close(true);
  }

  setPageSetup(pageSetup: PageSetup): void {
    this.pageSetup = pageSetup;
    const active = this.active;
    if (active) {
      const setup = pageSetup[active.slotEditor.kind];
      if (!setup.enabled || resolveSlotVariant(setup, active.pageIndex) !== active.slotEditor.variant) {
        this.close(true);
      }
    }
    this.layout.refreshSlots();
    this.measureHeights();
  }

  /** The first rendered page whose `kind` slot shows `variant`, if any */
  findPageForVariant(kind: PageSlotKind, variant: PageSlotVariant): number | null {
    const setup = this.pageSetup?.[kind];
    if (!setup || !setup.enabled) return null;
    for (let i = 0; i < this.layout.getPageCount(); i++) {
      if (resolveSlotVariant(setup, i) === variant) return i;
    }
    return null;
  }

  dispose(): void {
    if (this.disposed) return;
    // commits only real edits, and only if the document still holds what they
    // were made against; the header editor is about to be disposed, so it
    // cannot hand the selection back itself
    const hadActive = this.active !== null;
    this.close(true, false);
    this.disposed = true;
    if (hadActive) {
      // tell the toolbar, which may still target the disposed header editor,
      // that the document is active again, unless the document is going away
      this.win.queueMicrotask(() => {
        if (this.parent.getRootElement() !== null) {
          this.parent.dispatchCommand(SELECTION_CHANGE_COMMAND, undefined);
        }
      });
    }
    this.cleanup();
    this.heightObserver?.disconnect();
    for (const slotEditor of this.editors.values()) {
      slotEditor.cleanup();
      slotEditor.editor.dispose();
      slotEditor.root.remove();
    }
    this.editors.clear();
    this.options.slotEditors.value = [];
  }

  // ---- PagesLayoutSlotProvider ------------------------------------------

  fillSlot(slot: HTMLElement, kind: PageSlotKind, pageIndex: number): void {
    const setup = this.pageSetup?.[kind];
    const enabled = setup !== undefined && setup.enabled;
    const variant = enabled ? resolveSlotVariant(setup, pageIndex) : null;
    const active = this.active;
    if (active && active.slot === slot) {
      if (active.slotEditor.kind !== kind || active.pageIndex !== pageIndex) {
        // this element now belongs to another page (the last page's footer
        // after the page count changed); the editor stays with its page
        if (!this.rehome(active)) this.close(true);
      } else if (variant !== null && active.slotEditor.variant === variant) {
        this.syncLiveCounters(active);
        return;
      } else {
        // the page now shows another variant, or none
        this.close(true);
      }
    }
    slot.dataset.pageSlotEnabled = String(enabled);
    const content = slot.firstElementChild;
    if (variant === null) {
      delete slot.dataset.pageVariant;
      slot.dataset.empty = "true";
      if (content) content.replaceChildren();
      return;
    }
    const slotEditor = this.getSlotEditor(kind, variant);
    slot.dataset.pageVariant = variant;
    slot.dataset.empty = String(slotEditor.empty);
    const clone = this.cloneFor(slotEditor);
    writeCountersIntoDOM(clone, pageIndex + 1, this.layout.getPageCount());
    slot.replaceChildren(clone);
  }

  /**
   * The layout is about to remove `slot` along with its page. A live editor in
   * it moves to the page it was opened on if that page remains, else to the
   * last page if that shows the same variant, else it closes.
   */
  releaseSlot(slot: HTMLElement): void {
    const active = this.active;
    if (active !== null && active.slot === slot && !this.rehome(active)) this.close(true);
  }

  private rehome(active: ActiveSession): boolean {
    const { kind, variant } = active.slotEditor;
    const setup = this.pageSetup?.[kind];
    if (!setup || !setup.enabled) return false;
    const pageCount = this.layout.getPageCount();
    for (const pageIndex of [active.pageIndex, pageCount - 1]) {
      if (pageIndex < 0 || pageIndex >= pageCount || resolveSlotVariant(setup, pageIndex) !== variant) continue;
      const target = this.layout.getSlot(kind, pageIndex);
      if (target !== null && target !== active.slot) {
        this.moveLive(active, target, pageIndex);
        return true;
      }
    }
    return false;
  }

  /**
   * Puts the live editor's root into `target` in place of its copy. Moving a
   * focused element takes the focus away, so it is given back.
   */
  private moveLive(active: ActiveSession, target: HTMLElement, pageIndex: number): void {
    const { slotEditor } = active;
    const doc = slotEditor.root.ownerDocument;
    const hadFocus = slotEditor.root.contains(doc.activeElement);
    target.replaceChildren(slotEditor.root);
    active.slot.classList.remove(LIVE_SLOT_CLASS);
    target.classList.add(LIVE_SLOT_CLASS);
    target.dataset.pageVariant = slotEditor.variant;
    target.dataset.pageSlotEnabled = "true";
    active.slot = target;
    active.pageIndex = pageIndex;
    this.options.activeSlot.value = { kind: slotEditor.kind, pageIndex, variant: slotEditor.variant };
    this.syncLiveCounters(active);
    if (hadFocus) slotEditor.editor.focus();
  }

  /** Shows the real page number and count in the editor of the live slot */
  private syncLiveCounters(active: ActiveSession): void {
    const pageNumber = active.pageIndex + 1;
    const pageCount = this.layout.getPageCount();
    active.slotEditor.editor.update(() => $writeCountersIntoEditor(pageNumber, pageCount), {
      tag: [HISTORY_MERGE_TAG, SLOT_SYNC_TAG],
    });
  }

  // ---- live editing -----------------------------------------------------

  /**
   * Opens a slot for editing. With `point` (the click's client coordinates)
   * the caret lands where the user clicked, otherwise at the end.
   */
  open(kind: PageSlotKind, pageIndex: number, point?: Point): boolean {
    const setup = this.pageSetup?.[kind];
    if (this.disposed || !this.parent.isEditable() || !setup || !setup.enabled) return false;
    const slot = this.layout.getSlot(kind, pageIndex);
    if (slot === null) return false;
    const slotEditor = this.getSlotEditor(kind, resolveSlotVariant(setup, pageIndex));
    if (this.active) {
      if (this.active.slot === slot) return true;
      this.close(true);
    }
    slot.replaceChildren(slotEditor.root);
    slot.classList.add(LIVE_SLOT_CLASS);
    this.layout.layer.removeAttribute("aria-hidden");
    this.active = { pageIndex, slot, slotEditor };
    // `setEditable` only flips the editor's flag, the attribute is the host's job
    slotEditor.root.contentEditable = "true";
    slotEditor.editor.setEditable(true);
    this.options.activeSlot.value = { kind, pageIndex, variant: slotEditor.variant };
    this.options.activeSlotEditor.value = slotEditor.editor;
    this.syncLiveCounters(this.active);
    this.placeCaret(slotEditor, point);
    slotEditor.editor.focus(undefined, { defaultSelection: "rootEnd" });
    this.handOver(this.parent, slotEditor.editor);
    return true;
  }

  /**
   * Tells the floating toolbar and other listeners of SELECTION_CHANGE_COMMAND
   * that `to` is active now instead of `from`. `from`'s selection is cleared,
   * and `to` announced only after that update has committed, so that `from`'s
   * own notification cannot point them back at `from`.
   */
  private handOver(from: LexicalEditor, to: LexicalEditor): void {
    const target = this.active?.slotEditor.editor ?? this.parent;
    if (target !== to) return;
    from.update(
      () => {
        $setSelection(null);
        $onUpdate(() =>
          this.win.queueMicrotask(() => {
            const current = this.active?.slotEditor.editor ?? this.parent;
            if (!this.disposed && current === to) to.dispatchCommand(SELECTION_CHANGE_COMMAND, undefined);
          })
        );
      },
      // selection bookkeeping, not an edit: keep it out of the undo history
      { tag: [HISTORIC_TAG, SLOT_SYNC_TAG] }
    );
  }

  /**
   * The live root replaced a copy with the same layout, so the caret position
   * under the click resolves against the live editor's DOM
   */
  private placeCaret(slotEditor: SlotEditor, point: Point | undefined): void {
    const { editor, root } = slotEditor;
    const doc = root.ownerDocument;
    const win = doc.defaultView;
    const range = point ? caretRangeAt(doc, point) : null;
    if (!win || range === null || !root.contains(range.startContainer)) return;
    const domSelection = getDOMSelection(win);
    if (domSelection === null) return;
    domSelection.removeAllRanges();
    domSelection.addRange(range);
    editor.update(
      () => {
        const selection = $createRangeSelectionFromDom(domSelection, editor);
        if (selection !== null) $setSelection(selection);
      },
      { discrete: true }
    );
  }

  /**
   * Closes the live slot. With `commit`, edits not yet written back are
   * written now. With `handBack`, the document is announced as the active
   * editor again.
   */
  close(commit: boolean, handBack = true): void {
    const active = this.active;
    if (active === null) return;
    this.active = null;
    if (this.writeBackTimer !== null) {
      clearTimeout(this.writeBackTimer);
      this.writeBackTimer = null;
    }
    if (commit) this.writeBack(active);
    const { slotEditor, slot } = active;
    slotEditor.editor.setEditable(false);
    slotEditor.root.contentEditable = "false";
    slot.classList.remove(LIVE_SLOT_CLASS);
    slotEditor.root.replaceWith(this.cloneFor(slotEditor));
    slot.dataset.empty = String(slotEditor.empty);
    this.layout.parking.appendChild(slotEditor.root);
    this.layout.layer.setAttribute("aria-hidden", "true");
    this.options.activeSlot.value = null;
    this.options.activeSlotEditor.value = null;
    if (handBack) this.handOver(slotEditor.editor, this.parent);
  }

  /**
   * Closes the live slot and puts the caret back where it was in the
   * document before the slot opened, rather than at the end of the document
   */
  private closeAndFocusParent(): void {
    this.close(true);
    const saved = this.parentSelection;
    this.parent.update(() => {
      if ($getSelection() === null && saved !== null && $isPointValid(saved.anchor) && $isPointValid(saved.focus)) {
        $setSelection(saved.clone());
      }
    });
    this.parent.focus();
  }

  private onClick(event: MouseEvent): void {
    const target = getComposedEventTarget(event);
    const element = isHTMLElement(target) ? target : isDOMNode(target) ? getParentElement(target) : null;
    if (element === null) return;
    const slot = element.closest<HTMLElement>("[data-page-slot]");
    if (slot === null || slot.dataset.pageSlotEnabled !== "true" || slot.classList.contains(LIVE_SLOT_CLASS)) return;
    const kind = slot.dataset.pageSlot as PageSlotKind;
    const pageIndex = Number(slot.dataset.pageIndex);
    if (Number.isInteger(pageIndex)) {
      event.preventDefault();
      this.open(kind, pageIndex, { x: event.clientX, y: event.clientY });
    }
  }

  // ---- write-back and external changes ----------------------------------

  private scheduleWriteBack(): void {
    if (this.writeBackTimer !== null) clearTimeout(this.writeBackTimer);
    this.writeBackTimer = setTimeout(() => {
      this.writeBackTimer = null;
      if (this.active) this.writeBack(this.active);
    }, SLOT_WRITE_BACK_DELAY_MS);
  }

  /**
   * Stores the live editor's content in the document, if the user changed it,
   * and only over the content those changes were made against: when the
   * document's copy changed meanwhile (a revision was restored, or undo
   * replaced it), that change wins.
   *
   * These writes are the document's undo steps, one per burst of typing. An
   * empty header is stored as no header, and content that ends where it
   * started is not written, so that undo never has a step that changes nothing.
   */
  private writeBack(session: ActiveSession, discrete = false): void {
    const { slotEditor } = session;
    if (!slotEditor.dirty) return;
    slotEditor.dirty = false;
    const content = slotEditor.editor.read("latest", $isSlotEmpty)
      ? null
      : normalizeCounterText(slotEditor.editor.getEditorState().toJSON());
    if (serializeSlotContent(content) === slotEditor.baseline) return;
    this.parent.update(
      () => {
        const stored = $getPageSlotContent(slotEditor.kind)?.[slotEditor.variant] ?? null;
        if (serializeSlotContent(stored) !== slotEditor.baseline) return;
        $setPageSlotContent(slotEditor.kind, slotEditor.variant, content);
        $addUpdateTag(HEADER_FOOTER_COMMIT_TAG);
        slotEditor.baseline = serializeSlotContent(content);
      },
      discrete ? { discrete: true, tag: HISTORY_PUSH_TAG } : { tag: HISTORY_PUSH_TAG }
    );
  }

  /**
   * Undo or redo pressed in a header. The header has no history of its own,
   * so the step comes from the document's: typing not yet written back is
   * written first, then the document's history applies the step. If that step
   * changed this header, it reloads in place and keeps the focus, otherwise
   * the step was the body's and the header closes.
   */
  private replay(slotEditor: SlotEditor, command: LexicalCommand<void>): boolean {
    const active = this.active;
    if (active === null || active.slotEditor !== slotEditor) return false;
    if (this.writeBackTimer !== null) {
      clearTimeout(this.writeBackTimer);
      this.writeBackTimer = null;
    }
    this.writeBack(active, true);
    this.win.queueMicrotask(() => {
      if (this.disposed || this.active !== active) return;
      this.replaying = { changed: false, slotEditor };
      try {
        this.parent.dispatchCommand(command, undefined);
        // commit the step now, so that its root mutation is seen below
        this.parent.read(() => {});
      } finally {
        const { changed } = this.replaying;
        this.replaying = null;
        if (this.active === active) {
          if (changed) {
            this.parent.update(() => $setSelection(null), { discrete: true, tag: HISTORIC_TAG });
            slotEditor.editor.focus(undefined, { defaultSelection: "rootEnd" });
          } else {
            this.close(false);
            this.parent.focus();
          }
        }
      }
    });
    return true;
  }

  private onRootMutation(prevEditorState: EditorState): void {
    // our own write-backs are recognized by the baseline comparison below,
    // not by their tag: an outside change batched into the same update must
    // still load
    if (this.disposed) return;
    const root = this.parent.read("latest", $getRoot);
    const prevRoot = prevEditorState.read($getRoot);
    for (const kind of SLOT_KINDS) {
      const change = $getStateChange(root, prevRoot, slotStateFor(kind));
      if (change === null) continue;
      const [content] = change;
      for (const slotEditor of this.editors.values()) {
        if (slotEditor.kind !== kind) continue;
        const next = content?.[slotEditor.variant] ?? null;
        if (serializeSlotContent(next) === slotEditor.baseline) continue;
        if (this.active && this.active.slotEditor === slotEditor) {
          if (this.replaying?.slotEditor === slotEditor) {
            // an undo or redo pressed in this header: it stays open
            this.replaying.changed = true;
          } else {
            // a restored revision or an undo in the body replaced what is
            // being edited
            this.close(false);
          }
        }
        this.load(slotEditor, next);
      }
    }
  }

  // ---- nested editors ---------------------------------------------------

  private getSlotEditor(kind: PageSlotKind, variant: PageSlotVariant): SlotEditor {
    const key: SlotKey = `${kind}:${variant}`;
    const existing = this.editors.get(key);
    if (existing) return existing;
    const editor = this.options.buildSlotEditor(this.parent);
    const doc = this.layout.layer.ownerDocument;
    const root = doc.createElement("div");
    root.className = `Pages__slotContent ${LIVE_CONTENT_CLASS}`;
    root.dataset.pageSlotEditor = key;
    this.layout.parking.appendChild(root);
    editor.setRootElement(root);
    editor.setEditable(false);
    root.contentEditable = "false";
    const slotEditor: SlotEditor = {
      baseline: serializeSlotContent(null),
      cleanup: () => {},
      clone: null,
      dirty: false,
      editor,
      empty: true,
      kind,
      refreshRafId: null,
      root,
      variant,
    };
    this.editors.set(key, slotEditor);
    this.options.slotEditors.value = [...this.options.slotEditors.value, editor];
    // React renders decorators (math, ...) into the root after the Lexical
    // update that created them, so the copies also follow the DOM
    const domObserver =
      typeof this.win.MutationObserver !== "undefined"
        ? new this.win.MutationObserver(() => this.scheduleCloneRefresh(slotEditor))
        : null;
    domObserver?.observe(root, { attributes: true, characterData: true, childList: true, subtree: true });
    // listen before loading, so that the initial content refreshes `empty`
    // and the copies like any later change
    slotEditor.cleanup = mergeRegister(
      () => {
        domObserver?.disconnect();
        if (slotEditor.refreshRafId !== null) this.win.cancelAnimationFrame(slotEditor.refreshRafId);
      },
      editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, tags }) => {
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          this.onNestedUpdate(slotEditor, !tags.has(SLOT_SYNC_TAG));
        }
      }),
      editor.registerCommand(UNDO_COMMAND, () => this.replay(slotEditor, UNDO_COMMAND), COMMAND_PRIORITY_EDITOR),
      editor.registerCommand(REDO_COMMAND, () => this.replay(slotEditor, REDO_COMMAND), COMMAND_PRIORITY_EDITOR),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (this.active && this.active.slotEditor === slotEditor) {
            this.closeAndFocusParent();
            return true;
          }
          return false;
        },
        // after an open typeahead menu, which handles Escape at LOW, but
        // before rich text's own Escape handler, which blurs
        COMMAND_PRIORITY_BEFORE_EDITOR
      )
    );
    this.load(slotEditor, this.parent.read("latest", () => $getPageSlotContent(kind))?.[variant] ?? null);
    this.heightObserver?.observe(root);
    return slotEditor;
  }

  private load(slotEditor: SlotEditor, content: SerializedEditorState | null): void {
    const { editor } = slotEditor;
    slotEditor.baseline = serializeSlotContent(content);
    slotEditor.dirty = false;
    let loaded = false;
    if (content !== null) {
      try {
        editor.setEditorState(editor.parseEditorState(content), { tag: SLOT_SYNC_TAG });
        loaded = true;
      } catch {
        // unknown nodes in the stored header: fall back to empty below
      }
    }
    if (!loaded) {
      editor.update(
        () => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        },
        { discrete: true, tag: SLOT_SYNC_TAG }
      );
    }
  }

  /** Coalesces DOM-driven copy refreshes to one per frame */
  private scheduleCloneRefresh(slotEditor: SlotEditor): void {
    if (this.disposed || slotEditor.refreshRafId !== null) return;
    slotEditor.refreshRafId = this.win.requestAnimationFrame(() => {
      slotEditor.refreshRafId = null;
      if (!this.disposed) {
        slotEditor.clone = null;
        this.layout.refreshSlots(slotEditor.kind);
      }
    });
  }

  /** `userEdit` tells the user's edits apart from loading content or showing page numbers */
  private onNestedUpdate(slotEditor: SlotEditor, userEdit: boolean): void {
    if (userEdit) slotEditor.dirty = true;
    slotEditor.clone = null;
    slotEditor.empty = slotEditor.editor.read("latest", $isSlotEmpty);
    this.layout.refreshSlots(slotEditor.kind);
    if (userEdit && this.active && this.active.slotEditor === slotEditor) this.scheduleWriteBack();
  }

  private cloneFor(slotEditor: SlotEditor): HTMLElement {
    if (slotEditor.clone === null) {
      const clone = slotEditor.root.cloneNode(true) as HTMLElement;
      clone.classList.remove(LIVE_CONTENT_CLASS);
      for (const attribute of CLONE_ATTRIBUTES_TO_STRIP) clone.removeAttribute(attribute);
      delete clone.dataset.pageSlotEditor;
      clone.setAttribute("aria-hidden", "true");
      this.options.renderClone?.(clone, slotEditor.root);
      slotEditor.clone = clone;
    }
    return slotEditor.clone.cloneNode(true) as HTMLElement;
  }

  private measureHeights(): void {
    if (this.disposed || this.pageSetup === null) return;
    const heights: SlotHeights = { footer: {}, header: {} };
    for (const slotEditor of this.editors.values()) {
      if (!this.pageSetup[slotEditor.kind].enabled) continue;
      heights[slotEditor.kind][slotEditor.variant] = this.measureHeight(slotEditor.root);
    }
    this.layout.setSlotHeights(heights);
  }

  /**
   * Fractional height in the host's own CSS px: `offsetHeight` rounds, and a
   * band a fraction taller than the geometry assumes would end past a printed
   * page boundary
   */
  private measureHeight(element: HTMLElement): number {
    const zoom = parseFloat(this.layout.host.style.getPropertyValue("--page-zoom")) || 1;
    return element.getBoundingClientRect().height / zoom;
  }
}
