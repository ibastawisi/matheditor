import {
  $create,
  $createRangeSelection,
  $createTextNode,
  $getState,
  $getStateChange,
  $setState,
  BaseSelection,
  buildImportMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementDOMSlot,
  ElementNode,
  isHTMLElement,
  LexicalEditor,
  LexicalNode,
  LexicalParseJSON,
  RangeSelection,
  SerializedElementNode,
  StateConfigValue,
  StateValueOrUpdater,
} from "lexical";
import { addClassNamesToElement, removeClassNamesFromElement } from "@lexical/utils";

import type { ImagePayload } from "./types";
import {
  imageAltTextState,
  imageFilterState,
  imageFloatState,
  imageHeightState,
  imageShowCaptionState,
  imageSrcState,
  imageWidthState,
} from "./states";
import { idState } from "@/editor/extensions/shared/states";
import { $appendLegacyCaption, getLegacyStyle } from "@/editor/extensions/legacy/utils";

export const IMAGE_STATE_CONFIGS = [
  { flat: true, stateConfig: imageSrcState },
  { flat: true, stateConfig: imageAltTextState },
  { flat: true, stateConfig: imageWidthState },
  { flat: true, stateConfig: imageHeightState },
  { flat: true, stateConfig: imageFloatState },
  { flat: true, stateConfig: imageFilterState },
  { flat: true, stateConfig: idState },
  { flat: true, stateConfig: imageShowCaptionState },
] as const;

export function $parseImagePayloadFromDOM(domNode: HTMLElement): ImagePayload {
  const img = domNode instanceof HTMLImageElement ? domNode : domNode.querySelector("img");
  const dataset = domNode.dataset;
  return {
    id: idState.parse(dataset.id ?? domNode.id),
    src: imageSrcState.parse(dataset.src ?? img?.getAttribute("src")),
    width: imageWidthState.parse(dataset.width ?? img?.getAttribute("width")),
    height: imageHeightState.parse(dataset.height ?? img?.getAttribute("height")),
    altText: imageAltTextState.parse(dataset.altText ?? img?.alt),
    showCaption: imageShowCaptionState.parse(dataset.showCaption ?? false),
    float: imageFloatState.parse(dataset.float),
    filter: imageFilterState.parse(dataset.filter),
  };
}

/**
 * Empty inline elements are removed by the rich text normalization, which would
 * delete the whole image when its caption is cleared, so the alt text is restored instead.
 */
function $ensureImageCaption(node: ImageNode) {
  if (node.isEmpty()) {
    node.append($createTextNode(node.getAltText() || "Image"));
  }
}

function floatElement(dom: HTMLElement, config: EditorConfig, float: string) {
  const floatTheme = config.theme.float;
  if (!floatTheme) return;
  for (const format of ["left", "right"] as const) {
    const className = floatTheme[format];
    if (!className) continue;
    if (format === float) addClassNamesToElement(dom, className);
    else removeClassNamesFromElement(dom, className);
  }
}

export class ImageNode extends ElementNode {
  $config() {
    return this.config("image", {
      extends: ElementNode,
      $transform: $ensureImageCaption,
      importDOM: buildImportMap({
        figure: (domNode: HTMLElement) => {
          if (domNode.dataset.type !== "image") {
            return null;
          }
          return {
            conversion: (domNode: HTMLElement): DOMConversionOutput => ({
              node: $createImageNode($parseImagePayloadFromDOM(domNode)),
            }),
            priority: 1,
          };
        },
        img: (domNode: HTMLElement) => {
          if (domNode.parentElement?.tagName === "FIGURE") {
            return null;
          }
          return {
            conversion: (domNode: HTMLImageElement): DOMConversionOutput | null => {
              if (domNode.src.startsWith("file:///")) return null;
              const payload = $parseImagePayloadFromDOM(domNode);
              const node = $createImageNode({ ...payload, showCaption: false });
              return { node };
            },
            priority: 0,
          };
        },
      }),
      stateConfigs: IMAGE_STATE_CONFIGS,
    });
  }

  updateFromJSON(serializedNode: LexicalParseJSON<SerializedElementNode>): this {
    const node = super.updateFromJSON(serializedNode);
    // images used to be decorators, with a nested caption editor and a css style string instead of children
    const isLegacy = !("children" in serializedNode);
    if (!isLegacy) return node;
    if (!("altText" in serializedNode)) node.setAltText(node.getDefaultAltText());
    const legacyStyle = getLegacyStyle(serializedNode) ?? {};
    node.setFloat(imageFloatState.parse(legacyStyle.float));
    node.setFilter(imageFilterState.parse(legacyStyle.filter ?? node.getDefaultFilter()));
    if ("caption" in serializedNode) {
      $appendLegacyCaption(node, serializedNode.caption);
    }
    return node;
  }

  /** The filter applied to legacy nodes that did not specify one */
  getDefaultFilter(): StateConfigValue<typeof imageFilterState> {
    return "none";
  }

  /** The alt text applied to legacy nodes that did not specify one */
  getDefaultAltText(): string {
    return "Image";
  }

  /** Creates the element that renders the image, sub classes override it to render other media */
  createMediaElement(editor: LexicalEditor): HTMLElement | SVGSVGElement {
    const isEditable = editor.isEditable();
    const img = document.createElement("img");
    img.src = this.getSrc();
    img.alt = this.getAltText();
    const width = this.getWidth();
    const height = this.getHeight();
    if (width) img.width = width;
    if (height) img.height = height;
    if (width && height) img.style.aspectRatio = `${width} / ${height}`;
    img.draggable = isEditable;
    return img;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const figure = document.createElement("figure");
    const className = editor._config.theme.image;
    if (className) figure.className = className;
    floatElement(figure, editor._config, this.getFloat());
    if (this.getFilter() === "auto") {
      addClassNamesToElement(figure, editor._config.theme.darkModeFilter);
    }
    const id = this.getId();
    if (id) figure.id = id;
    figure.dataset.type = this.getType();
    figure.dataset.altText = this.getAltText();
    figure.dataset.width = this.getWidth().toString();
    figure.dataset.height = this.getHeight().toString();
    figure.dataset.float = this.getFloat();
    figure.dataset.filter = this.getFilter();
    figure.dataset.showCaption = this.getShowCaption().toString();
    figure.appendChild(this.createMediaElement(editor));
    const showCaption = this.getShowCaption();
    if (showCaption) figure.appendChild(document.createElement("figcaption"));

    return {
      element: figure,
      after: (element) => {
        if (!isHTMLElement(element)) return element;
        const media = element.firstElementChild;
        const figcaption = element.querySelector(":scope > figcaption");
        const children = Array.from(element.childNodes).filter(
          (child) => child !== media && child !== figcaption
        );
        if (figcaption) figcaption.append(...children);
        else children.forEach((child) => child.remove());
        return element;
      },
    };
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const isEditable = editor.isEditable();
    const figure = document.createElement("figure");
    const className = config.theme.image;
    if (className) figure.className = className;
    floatElement(figure, config, this.getFloat());
    if (this.getFilter() === "auto") {
      addClassNamesToElement(figure, config.theme.darkModeFilter);
    }
    const id = this.getId();
    if (id) figure.id = id;
    if (isEditable) figure.contentEditable = "false";

    const media = this.createMediaElement(editor);
    media.setAttribute("data-image-media", "true");
    media.style.setProperty("anchor-name", `--node-anchor-${this.getKey()}`);
    if (isEditable) {
      figure.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (target !== figure && !media.contains(target)) return;
        editor.update(() => {
          this.selectEnd();
        });
      });
    }
    figure.appendChild(media);

    const figcaption = document.createElement("figcaption");
    figcaption.hidden = !this.getShowCaption();
    if (isEditable) figcaption.contentEditable = "true";
    figure.appendChild(figcaption);

    return figure;
  }

  getDOMSlot(element: HTMLElement): ElementDOMSlot<HTMLElement> {
    return super.getDOMSlot(element).withElement(element.querySelector(":scope > figcaption")!);
  }

  /** Whether a change between the two versions requires the media element to be recreated */
  shouldRecreateMedia(prevNode: this): boolean {
    return (
      $getStateChange(this, prevNode, imageSrcState) !== null ||
      $getStateChange(this, prevNode, imageAltTextState) !== null ||
      $getStateChange(this, prevNode, imageWidthState) !== null ||
      $getStateChange(this, prevNode, imageHeightState) !== null
    );
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    if ($getStateChange(this, prevNode, imageFloatState)) {
      floatElement(dom, config, this.getFloat());
    }
    const filterChange = $getStateChange(this, prevNode, imageFilterState);
    if (filterChange) {
      if (filterChange[0] === "auto") addClassNamesToElement(dom, config.theme.darkModeFilter);
      else removeClassNamesFromElement(dom, config.theme.darkModeFilter);
    }
    const idChange = $getStateChange(this, prevNode, idState);
    if (idChange) {
      if (idChange[0]) dom.id = idChange[0];
      else dom.removeAttribute("id");
    }
    if (this.shouldRecreateMedia(prevNode)) {
      return true;
    }
    const figcaption = dom.querySelector(":scope > figcaption");
    if (isHTMLElement(figcaption) && $getStateChange(this, prevNode, imageShowCaptionState)) {
      figcaption.hidden = !this.getShowCaption();
    }
    return false;
  }

  getSrc(): StateConfigValue<typeof imageSrcState> {
    return $getState(this, imageSrcState);
  }

  setSrc(valueOrUpdater: StateValueOrUpdater<typeof imageSrcState>): this {
    return $setState(this, imageSrcState, valueOrUpdater);
  }

  getAltText(): StateConfigValue<typeof imageAltTextState> {
    return $getState(this, imageAltTextState);
  }

  setAltText(valueOrUpdater: StateValueOrUpdater<typeof imageAltTextState>): this {
    return $setState(this, imageAltTextState, valueOrUpdater);
  }

  getWidth(): StateConfigValue<typeof imageWidthState> {
    return $getState(this, imageWidthState);
  }

  setWidth(valueOrUpdater: StateValueOrUpdater<typeof imageWidthState>): this {
    return $setState(this, imageWidthState, valueOrUpdater);
  }

  getHeight(): StateConfigValue<typeof imageHeightState> {
    return $getState(this, imageHeightState);
  }

  setHeight(valueOrUpdater: StateValueOrUpdater<typeof imageHeightState>): this {
    return $setState(this, imageHeightState, valueOrUpdater);
  }

  setWidthAndHeight(width: number, height: number): this {
    return this.setWidth(width).setHeight(height);
  }

  getId(): StateConfigValue<typeof idState> {
    return $getState(this, idState);
  }

  setId(valueOrUpdater: StateValueOrUpdater<typeof idState>): this {
    return $setState(this, idState, valueOrUpdater);
  }

  getFloat(): StateConfigValue<typeof imageFloatState> {
    return $getState(this, imageFloatState);
  }

  setFloat(valueOrUpdater: StateValueOrUpdater<typeof imageFloatState>): this {
    return $setState(this, imageFloatState, valueOrUpdater);
  }

  getFilter(): StateConfigValue<typeof imageFilterState> {
    return $getState(this, imageFilterState);
  }

  setFilter(valueOrUpdater: StateValueOrUpdater<typeof imageFilterState>): this {
    return $setState(this, imageFilterState, valueOrUpdater);
  }

  getShowCaption(): StateConfigValue<typeof imageShowCaptionState> {
    return $getState(this, imageShowCaptionState);
  }

  setShowCaption(valueOrUpdater: StateValueOrUpdater<typeof imageShowCaptionState>): this {
    return $setState(this, imageShowCaptionState, valueOrUpdater);
  }

  update(payload: Partial<ImagePayload>): this {
    const writable = this.getWritable();
    if (payload.src !== undefined) writable.setSrc(payload.src);
    if (payload.altText !== undefined) writable.setAltText(payload.altText);
    if (payload.width !== undefined) writable.setWidth(payload.width);
    if (payload.height !== undefined) writable.setHeight(payload.height);
    if (payload.float !== undefined) writable.setFloat(payload.float);
    if (payload.filter !== undefined) writable.setFilter(payload.filter);
    if (payload.id !== undefined) writable.setId(payload.id);
    if (payload.showCaption !== undefined) writable.setShowCaption(payload.showCaption);
    return writable;
  }

  canInsertTextBefore(): boolean {
    return isCaptionSelected();
  }

  canInsertTextAfter(): boolean {
    return isCaptionSelected();
  }

  isShadowRoot(): boolean {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  getRangeSelectionWithinParent(): RangeSelection {
    const parent = this.getParentOrThrow<ElementNode>();
    const parentKey = parent.getKey();
    const indexWithinParent = this.getIndexWithinParent();
    const rangeSelection = $createRangeSelection();
    rangeSelection.anchor.set(parentKey, indexWithinParent, "element");
    rangeSelection.focus.set(parentKey, indexWithinParent + 1, "element");
    return rangeSelection;
  }

  isSelected(selection?: null | BaseSelection): boolean {
    const isSelected = super.isSelected(selection);
    if (isSelected) return true;
    if (!selection) return false;
    return selection.getNodes().every((n) => this.is(n.getParent()));
  }
}

function isCaptionSelected() {
  if (typeof window === "undefined") return false;
  const nativeSelection = window.getSelection();
  const anchorNode = nativeSelection?.anchorNode;
  if (!anchorNode) return false;
  return anchorNode.nodeType === Node.TEXT_NODE || anchorNode.nodeName === "FIGCAPTION";
}

export function $createImageNode({
  src,
  width,
  height,
  altText = "Image",
  float = "none",
  filter = "none",
  id = "",
  showCaption = false,
}: ImagePayload): ImageNode {
  return $create(ImageNode)
    .setSrc(src)
    .setAltText(altText)
    .setWidth(width)
    .setHeight(height)
    .setFloat(float)
    .setFilter(filter)
    .setId(id)
    .setShowCaption(showCaption);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
