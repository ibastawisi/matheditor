import {
  $create,
  $createParagraphNode,
  $getSiblingCaret,
  $getState,
  $getStateChange,
  $isElementNode,
  $rewindSiblingCaret,
  $setState,
  buildImportMap,
  createState,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  isHTMLElement,
  LexicalEditor,
  LexicalNode,
  RangeSelection,
  StateConfigValue,
  StateValueOrUpdater,
} from "lexical";

const openState = createState("open", {
  parse: (v) => (typeof v === "boolean" ? v : v === "true"),
});

const editableState = createState("editable", {
  parse: (v) => (typeof v === "boolean" ? v : v !== "false"),
});

export function $convertDetailsElement(domNode: HTMLElement): DOMConversionOutput | null {
  const open = domNode.dataset.open !== undefined ? openState.parse(domNode.dataset.open) : domNode.hasAttribute("open");
  const editable = editableState.parse(domNode.dataset.editable);
  const node = $createDetailsContainerNode(open, editable);
  return {
    node,
  };
}

export class DetailsContainerNode extends ElementNode {
  $config() {
    return this.config("details-container", {
      extends: ElementNode,
      importDOM: buildImportMap({
        details: () => ({
          conversion: $convertDetailsElement,
          priority: 1,
        }),
        div: (domNode: HTMLElement) => {
          if (domNode.dataset.type !== "details-container") {
            return null;
          }
          return {
            conversion: $convertDetailsElement,
            priority: 1,
          };
        },
      }),
      stateConfigs: [
        { flat: true, stateConfig: openState },
        { flat: true, stateConfig: editableState },
      ],
    });
  }

  isShadowRoot(): boolean {
    return true;
  }

  collapseAtStart(): boolean {
    // Unwrap the DetailsContainerNode by replacing it with the children
    // of its children (DetailsSummaryNode, DetailsContentNode)
    const nodesToInsert: LexicalNode[] = [];
    for (const child of this.getChildren()) {
      if ($isElementNode(child)) {
        nodesToInsert.push(...child.getChildren());
      }
    }
    const caret = $rewindSiblingCaret($getSiblingCaret(this, "previous"));
    caret.splice(1, nodesToInsert);
    // Merge the first child of the DetailsSummaryNode with the
    // previous sibling of the DetailsContainerNode
    const [firstChild] = nodesToInsert;
    if (firstChild) {
      firstChild.selectStart().deleteCharacter(true);
    }
    return true;
  }

  createDOM(): HTMLElement {
    // details is not well supported in Chrome #5582 and Firefox #8348
    const dom = document.createElement("div");
    dom.classList.add("details__container");
    if (this.getOpen()) dom.setAttribute("open", "");
    if (this.getEditable() === false) dom.setAttribute("contenteditable", "false");
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    const openStateChange = $getStateChange(this, prevNode, openState);
    if (openStateChange) {
      const [open] = openStateChange;
      const contentDom = dom.children[1];
      if (!isHTMLElement(contentDom)) {
        throw new Error("Expected contentDom to be an HTMLElement");
      }
      if (open) {
        dom.setAttribute("open", "");
        contentDom.hidden = false;
      } else {
        dom.removeAttribute("open");
        contentDom.setAttribute("hidden", "until-found");
      }
    }
    const editableStateChange = $getStateChange(this, prevNode, editableState);
    if (editableStateChange) {
      const [editable] = editableStateChange;
      if (editable) {
        dom.removeAttribute("contenteditable");
      } else {
        dom.setAttribute("contenteditable", "false");
      }
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("details");
    element.classList.add("details__container");
    if (this.getOpen()) element.setAttribute("open", "");
    if (this.getEditable() === false) element.setAttribute("contenteditable", "false");
    element.dataset.type = this.getType();
    element.dataset.open = this.getOpen().toString();
    element.dataset.editable = this.getEditable().toString();
    return { element };
  }

  getOpen(): StateConfigValue<typeof openState> {
    return $getState(this, openState);
  }

  setOpen(valueOrUpdater: StateValueOrUpdater<typeof openState>): this {
    return $setState(this, openState, valueOrUpdater);
  }

  toggleOpen(): this {
    return $setState(this, openState, (open) => !open);
  }

  getEditable(): StateConfigValue<typeof editableState> {
    return $getState(this, editableState);
  }

  setEditable(valueOrUpdater: StateValueOrUpdater<typeof editableState>): this {
    return $setState(this, editableState, valueOrUpdater);
  }
}

export function $createDetailsContainerNode(open: boolean, editable: boolean = true): DetailsContainerNode {
  return $create(DetailsContainerNode).setOpen(open).setEditable(editable);
}

export function $isDetailsContainerNode(node: LexicalNode | null | undefined): node is DetailsContainerNode {
  return node instanceof DetailsContainerNode;
}

export function $convertDetailsContentElement(): DOMConversionOutput | null {
  const node = $createDetailsContentNode();
  return {
    node,
  };
}

export class DetailsContentNode extends ElementNode {
  $config() {
    return this.config("details-content", {
      extends: ElementNode,
      importDOM: buildImportMap({
        div: (domNode: HTMLElement) => {
          if (domNode.dataset.type !== "details-content" && !domNode.hasAttribute("data-lexical-Details-content")) {
            return null;
          }
          return {
            conversion: $convertDetailsContentElement,
            priority: 2,
          };
        },
      }),
    });
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("div");
    dom.classList.add("details__content");
    const containerNode = this.getParent();
    if ($isDetailsContainerNode(containerNode) && !containerNode.getOpen()) {
      dom.setAttribute("hidden", "until-found");
    }
    dom.addEventListener("beforematch", () => {
      editor.update(() => {
        const containerNode = this.getParentOrThrow().getLatest();
        if (!$isDetailsContainerNode(containerNode)) {
          throw new Error("Expected parent node to be a DetailsContainerNode");
        }
        if (!containerNode.getOpen()) {
          containerNode.toggleOpen();
        }
      });
    });
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.classList.add("details__content");
    element.dataset.type = this.getType();
    element.setAttribute("data-lexical-Details-content", "true");
    return { element };
  }

  isShadowRoot(): boolean {
    return true;
  }
}

export function $createDetailsContentNode(): DetailsContentNode {
  return $create(DetailsContentNode);
}

export function $isDetailsContentNode(node: LexicalNode | null | undefined): node is DetailsContentNode {
  return node instanceof DetailsContentNode;
}

export function $convertSummaryElement(domNode: HTMLElement): DOMConversionOutput | null {
  const editable = editableState.parse(domNode.dataset.editable);
  const node = $createDetailsSummaryNode(editable);
  return {
    node,
  };
}

export class DetailsSummaryNode extends ElementNode {
  $config() {
    return this.config("details-summary", {
      $transform(node: DetailsSummaryNode) {
        if (node.isEmpty()) {
          node.remove();
        }
      },
      extends: ElementNode,
      importDOM: buildImportMap({
        summary: () => ({
          conversion: $convertSummaryElement,
          priority: 1,
        }),
      }),
      stateConfigs: [{ flat: true, stateConfig: editableState }],
    });
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("summary");
    dom.classList.add("details__summary");
    dom.addEventListener("click", () => {
      editor.update(() => {
        const detailsContainer = this.getLatest().getParentOrThrow();
        if (!$isDetailsContainerNode(detailsContainer)) {
          throw new Error("Expected parent node to be a DetailsContainerNode");
        }
        detailsContainer.toggleOpen();
      });
    });
    if (this.getEditable() === false) {
      dom.setAttribute("contenteditable", "false");
    }
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    const editableStateChange = $getStateChange(this, prevNode, editableState);
    if (editableStateChange) {
      const [editable] = editableStateChange;
      if (editable) {
        dom.removeAttribute("contenteditable");
      } else {
        dom.setAttribute("contenteditable", "false");
      }
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("summary");
    element.classList.add("details__summary");
    if (this.getEditable() === false) element.setAttribute("contenteditable", "false");
    element.dataset.type = this.getType();
    element.dataset.editable = this.getEditable().toString();
    return { element };
  }

  collapseAtStart(_selection: RangeSelection): boolean {
    this.getParentOrThrow().insertBefore(this);
    return true;
  }

  insertNewAfter(_: RangeSelection, restoreSelection = true): ElementNode {
    const containerNode = this.getParentOrThrow();

    if (!$isDetailsContainerNode(containerNode)) {
      throw new Error("DetailsSummaryNode expects to be child of DetailsContainerNode");
    }

    if (containerNode.getOpen()) {
      const contentNode = this.getNextSibling();
      if (!$isDetailsContentNode(contentNode)) {
        throw new Error("DetailsSummaryNode expects to have DetailsContentNode sibling");
      }

      const firstChild = contentNode.getFirstChild();
      if ($isElementNode(firstChild)) {
        return firstChild;
      } else {
        const paragraph = $createParagraphNode();
        contentNode.append(paragraph);
        return paragraph;
      }
    } else {
      const paragraph = $createParagraphNode();
      containerNode.insertAfter(paragraph, restoreSelection);
      return paragraph;
    }
  }

  getEditable(): StateConfigValue<typeof editableState> {
    return $getState(this, editableState);
  }

  setEditable(valueOrUpdater: StateValueOrUpdater<typeof editableState>): this {
    return $setState(this, editableState, valueOrUpdater);
  }
}

export function $createDetailsSummaryNode(editable: boolean = true): DetailsSummaryNode {
  return $create(DetailsSummaryNode).setEditable(editable);
}

export function $isDetailsSummaryNode(node: LexicalNode | null | undefined): node is DetailsSummaryNode {
  return node instanceof DetailsSummaryNode;
}
