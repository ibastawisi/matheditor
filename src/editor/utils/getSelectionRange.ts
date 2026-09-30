declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

export function getDOMRangeFromDragEvent(event: DragEvent): Range {
  if (document.caretPositionFromPoint) {
    const caretPosition = document.caretPositionFromPoint(event.clientX, event.clientY);
    if (caretPosition) {
      const range = document.createRange();
      range.setStart(caretPosition.offsetNode, caretPosition.offset);
      range.collapse(true);
      return range;
    }
  }

  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (range) return range;
  }

  const domSelection = window.getSelection();
  if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset ?? 0);
    return domSelection.getRangeAt(0);
  }

  throw new Error("Cannot get the selection when dragging");
}
