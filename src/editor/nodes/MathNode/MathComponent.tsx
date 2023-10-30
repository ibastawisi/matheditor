"use client"
import { DOMAttributes } from "react";
import { $createRangeSelection, $getSelection, $isNodeSelection, $isRangeSelection, $setSelection, GridSelection, NodeKey, NodeSelection, RangeSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import type { MathfieldElement, MathfieldElementAttributes } from "mathlive";
import { convertLatexToMarkup } from "mathlive";
import { $isMathNode } from '.';
import './index.css';

type CustomElement<T> = Partial<T & DOMAttributes<T>>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ["math-field"]: CustomElement<MathfieldElementAttributes>;
    }
  }
}

window.MathfieldElement.soundsDirectory = null;
window.MathfieldElement.computeEngine = null;

export type MathComponentProps = { initialValue: string; nodeKey: NodeKey; mathfieldRef: React.RefObject<MathfieldElement>; };
export { MathfieldElement, convertLatexToMarkup };

export default function MathComponent({ initialValue, nodeKey, mathfieldRef: ref }: MathComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<RangeSelection | NodeSelection | GridSelection | null>(null);
  const [lastRangeSelection, setLastRangeSelection] = useState<RangeSelection | null>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;
    if (initialValue !== mathfield.getValue()) {
      mathfield.setValue(initialValue, { silenceNotifications: true });
    }
  }, [initialValue]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        const newSelection = editorState.read(() => $getSelection());
        setSelection(newSelection);
        if ($isRangeSelection(newSelection)) {
          setLastRangeSelection(newSelection);
        }
      })
    );
  }, []);

  useLayoutEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;
    // highlight when range selected
    const active = isSelected && $isRangeSelection(selection);
    mathfield.classList.toggle("selection-active", active);
  }, [ref, isSelected, selection]);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;
    // reselect when selection is lost and mathfield is focused
    if (!selection && document.activeElement === mathfield) setSelected(true);
    // focus when node selected
    if (isSelected && !mathfield.hasFocus()) {
      if (!$isNodeSelection(selection)) return;
      editor.getEditorState().read(() => {
        const mathNode = $getNodeByKey(nodeKey);
        if (!$isMathNode(mathNode)) return;
        const anchor = lastRangeSelection?.anchor;
        if (!anchor) return;
        const anchorNode = anchor.getNode();
        const anchorOffset = anchor.offset;
        const isParentAnchor = anchorNode === mathNode.getParent();
        const indexWithinParent = mathNode.getIndexWithinParent();
        const isBefore = isParentAnchor ? anchorOffset - indexWithinParent === 0 : anchorNode.isBefore(mathNode);
        focus(mathfield);
        mathfield.executeCommand(isBefore ? 'moveToMathfieldStart' : 'moveToMathfieldEnd');
      });
    }
  }, [isSelected]);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;

    mathfield.smartMode = true;
    mathfield.mathModeSpace = "\\,";

    // focus newly created mathfield
    if (isSelected && !mathfield.hasFocus()) {
      focus(mathfield);
    }

    mathfield.addEventListener("input", e => {
      const event = e as InputEvent;
      const value = mathfield.getValue();
      editor.update(() => {
        if (value === initialValue) return;
        const node = $getNodeByKey(nodeKey);
        if (!$isMathNode(node)) return;
        node.setValue(value);
      });
      if (event.inputType === "insertLineBreak") {
        event.stopPropagation();
        if (value.trim().length === 0) return;
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if (!$isMathNode(node)) return;
          mathfield.blur();
          node.selectNext(0, 0);
        });
      }
    }, false);

    mathfield.addEventListener("change", e => {
      editor.update(() => {
        const value = mathfield.getValue();
        if (value.trim().length) return;
        const node = $getNodeByKey(nodeKey);
        if (!$isMathNode(node)) return;
        node.remove(true);
        const parentRootElement = editor.getRootElement();
        if (parentRootElement !== null) {
          parentRootElement.focus();
        }
      });
    }, false);

    mathfield.addEventListener("click", event => {
      clearSelection();
      setSelected(true);
      focus(mathfield);
      if (mathfield.selectionIsCollapsed) mathfield.setCaretPoint(event.clientX, event.clientY);
    });

    mathfield.addEventListener("keydown", event => {
      event.stopPropagation();
    });

    mathfield.addEventListener("move-out", event => {
      const direction = event.detail.direction;
      var range = document.createRange();
      var selection = window.getSelection();
      const span = mathfield.parentElement!;

      switch (direction) {
        case "backward":
        case "upward":
          range.setStartBefore(span);
          break;
        case "forward":
        case "downward":
          range.setStartAfter(span);
          break;
      }

      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);

      editor.update(() => {
        const rangeSelection = $createRangeSelection();
        rangeSelection.applyDOMRange(range);
        $setSelection(rangeSelection);
        if (mathfield.value.trim().length === 0) {
          const node = $getNodeByKey(nodeKey);
          $isMathNode(node) && node.remove();
        }
      });
    });

  }, []);

  const focus = useCallback((mathfield: MathfieldElement) => {
    mathfield.focus();
    const mathVirtualKeyboard = window.mathVirtualKeyboard;
    mathVirtualKeyboard.show({ animate: true });
    const container = mathVirtualKeyboard.container;
    if (!container) return;
    container.addEventListener('transitionend', () => mathfield.executeCommand("scrollIntoView"), { once: true });
  }, []);

  return <math-field ref={ref} />;
}
