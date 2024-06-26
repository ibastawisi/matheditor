"use client"
import { DOMAttributes } from "react";
import { $createRangeSelection, $getSelection, $isNodeSelection, $isRangeSelection, $setSelection, BaseSelection, COMMAND_PRIORITY_EDITOR, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_UP_COMMAND, NodeKey, RangeSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import type { MathfieldElement, MathfieldElementAttributes } from "mathlive";
import './index.css';
import { $isMathNode } from ".";
import { customizeMathVirtualKeyboard } from "./mathVirtualKeyboard";
import { IS_MOBILE } from "@/editor/shared/environment";

type CustomElement<T> = Partial<T & DOMAttributes<T>>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ["math-field"]: CustomElement<MathfieldElementAttributes>;
    }
  }
}

if (typeof window !== 'undefined') {
  window.MathfieldElement.soundsDirectory = null;
  window.MathfieldElement.computeEngine = null;
  customizeMathVirtualKeyboard();
}

export type MathComponentProps = { initialValue: string; nodeKey: NodeKey; mathfieldRef: React.RefObject<MathfieldElement>; };

export default function MathComponent({ initialValue, nodeKey, mathfieldRef: ref }: MathComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<BaseSelection | null>(null);
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
      }),

      // workaround for arrow up and arrow down key events
      editor.registerCommand<KeyboardEvent>(KEY_ARROW_UP_COMMAND, (event => {
        const rootElement = editor.getRootElement();
        if (!rootElement) return false;
        const mathfields = rootElement.querySelectorAll<MathfieldElement>('math-field');
        mathfields.forEach(mathfield => {
          const keyboardSink = mathfield.shadowRoot?.querySelector('[part="keyboard-sink"]');
          keyboardSink?.removeAttribute('contenteditable');
          setTimeout(() => {
            keyboardSink?.setAttribute('contenteditable', 'true');
          }, 0);
        });
        return false;
      }), COMMAND_PRIORITY_EDITOR),
      editor.registerCommand<KeyboardEvent>(KEY_ARROW_DOWN_COMMAND, (event => {
        const rootElement = editor.getRootElement();
        if (!rootElement) return false;
        const mathfields = rootElement.querySelectorAll<MathfieldElement>('math-field');
        mathfields.forEach(mathfield => {
          const keyboardSink = mathfield.shadowRoot?.querySelector('[part="keyboard-sink"]');
          keyboardSink?.removeAttribute('contenteditable');
          setTimeout(() => {
            keyboardSink?.setAttribute('contenteditable', 'true');
          }, 0);
        });
        return false;
      }), COMMAND_PRIORITY_EDITOR),

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
        if (!mathNode) return;
        const anchor = lastRangeSelection?.anchor;
        if (!anchor) return;
        const anchorNode = anchor.getNode();
        const anchorOffset = anchor.offset;
        const isParentAnchor = anchorNode === mathNode.getParent();
        const indexWithinParent = mathNode.getIndexWithinParent();
        const isBefore = isParentAnchor ? anchorOffset - indexWithinParent === 0 : anchorNode.isBefore(mathNode);
        mathfield.focus();
        mathfield.executeCommand(isBefore ? 'moveToMathfieldStart' : 'moveToMathfieldEnd');
      });
    }
  }, [isSelected]);

  useEffect(() => {
    const mathfield = ref.current;
    if (!mathfield) return;

    mathfield.smartMode = true;
    mathfield.mathModeSpace = "\\,";

    mathfield.keybindings = [
      ...mathfield.keybindings,
      { key: '[Return]', ifMode: 'math', command: 'addRowAfter' },
      { key: '[Enter]', ifMode: 'math', command: 'addRowAfter' },
    ];
    // focus newly created mathfield
    if (isSelected && $isNodeSelection(selection) && !mathfield.hasFocus()) {
      setTimeout(() => { mathfield.focus(); }, 0);
    }

    mathfield.addEventListener("input", event => {
      const value = mathfield.getValue();
      editor.update(() => {
        if (value === initialValue) return;
        const node = $getNodeByKey(nodeKey);
        if (!$isMathNode(node)) return;
        node.setValue(value);
      });
    }, false);

    mathfield.addEventListener("focus", () => {
      const mathVirtualKeyboard = window.mathVirtualKeyboard;
      mathVirtualKeyboard.show({ animate: true });
      const container = mathVirtualKeyboard.container;
      if (!container) return;
      container.ontransitionend = () => mathfield.executeCommand("scrollIntoView");
    });

    mathfield.addEventListener("click", event => {
      clearSelection();
      setSelected(true);
      mathfield.focus();
      if (mathfield.selectionIsCollapsed) mathfield.position = mathfield.getOffsetFromPoint(event.clientX, event.clientY);
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
          node && node.remove();
        }
      });
    });

    mathfield.addEventListener("contextmenu", event => {
      if (IS_MOBILE) event.preventDefault();
    }, { capture: true });

  }, []);

  return <math-field ref={ref}>
    <style>
      {`@media (hover: none) and (pointer: coarse) {
          :host(:not(:focus)) .ML__container {
            pointer-events: none;
          }
        }`}
    </style>
  </math-field>;
}
