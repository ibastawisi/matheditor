"use client"
import { DOMAttributes, useRef } from "react";
import { $createRangeSelection, $getSelection, $isNodeSelection, $isRangeSelection, $setSelection, BaseSelection, NodeKey, RangeSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { useEffect, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import type { MathfieldElement, MathfieldElementAttributes, MoveOutEvent } from "mathlive";
import './index.css';
import { $isMathNode } from ".";
import { customizeMathVirtualKeyboard } from "./mathVirtualKeyboard";
import { IS_MOBILE } from "@/shared/environment";

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

export type MathComponentProps = { initialValue: string; nodeKey: NodeKey; };

export default function MathComponent({ initialValue, nodeKey }: MathComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const lastRangeSelection = useRef<RangeSelection | null>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  useEffect(() => {
    const mathfield = editor.getElementByKey(nodeKey)?.querySelector("math-field") as MathfieldElement | null;
    if (!mathfield) return;
    if (initialValue !== mathfield.getValue()) {
      mathfield.setValue(initialValue, { silenceNotifications: true });
    }
  }, [initialValue]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        const newSelection = editorState.read(() => $getSelection());
        if ($isRangeSelection(newSelection)) {
          lastRangeSelection.current = newSelection;
        }
      }),
    );
  }, []);

  useEffect(() => {
    const mathfield = editor.getElementByKey(nodeKey)?.querySelector("math-field") as MathfieldElement | null;
    if (!mathfield) return;
    // reselect when selection is lost and mathfield is focused
    const selection = editor.getEditorState().read($getSelection);
    if (!selection && document.activeElement === mathfield) setSelected(true);
    // focus when node selected
    if (isSelected && !mathfield.hasFocus()) {
      editor.getEditorState().read(() => {
        if (!$isNodeSelection(selection)) return;
        const mathNode = $getNodeByKey(nodeKey);
        if (!mathNode) return;
        const anchor = lastRangeSelection.current?.anchor;
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
    const mathfield = editor.getElementByKey(nodeKey)?.querySelector("math-field") as MathfieldElement | null;
    if (!mathfield) return;

    mathfield.smartMode = true;
    mathfield.mathModeSpace = "\\,";

    mathfield.keybindings = [
      ...mathfield.keybindings,
      { key: '[Return]', ifMode: 'math', command: 'addRowAfter' },
      { key: '[Enter]', ifMode: 'math', command: 'addRowAfter' },
    ];
    // @ts-expect-error
    mathfield.registers.arraystretch = 1.5;
    // focus newly created mathfield
    if (isSelected && !mathfield.hasFocus()) {
      const selection = editor.getEditorState().read($getSelection);
      if (!$isNodeSelection(selection)) return;
      setTimeout(() => { mathfield.focus(); }, 0);
    }

    function onInput(event: Event) {
      const mathfield = event.target as MathfieldElement;
      const value = mathfield.getValue();
      editor.update(() => {
        if (value === initialValue) return;
        const node = $getNodeByKey(nodeKey);
        if (!$isMathNode(node)) return;
        node.setValue(value);
      });
    }

    function onFocus(event: FocusEvent) {
      const mathfield = event.target as MathfieldElement;
      clearSelection();
      setSelected(true);
      const mathVirtualKeyboard = window.mathVirtualKeyboard;
      mathVirtualKeyboard.show({ animate: true });
      const element = (mathVirtualKeyboard as any).element as HTMLElement;
      if (!element) return;
      element.ontransitionend = () => mathfield.executeCommand("scrollIntoView");
    };

    const onBlur = (event: FocusEvent) => {
      if (!event.isTrusted) return;
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      if (relatedTarget?.tagName === "MATH-FIELD") return;
      if (relatedTarget?.closest(".editor-toolbar")) return;
      const mathVirtualKeyboard = window.mathVirtualKeyboard;
      mathVirtualKeyboard.hide();
    }

    function onKeydown(event: KeyboardEvent) {
      event.stopPropagation();
    }

    function onMoveout(event: CustomEvent<MoveOutEvent>) {
      const mathfield = event.target as MathfieldElement;
      const direction = event.detail.direction;
      const range = document.createRange();
      const selection = window.getSelection();
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
    }

    function onContextmenu(event: MouseEvent) {
      if (IS_MOBILE) event.preventDefault();
    }

    mathfield.addEventListener("input", onInput);
    mathfield.addEventListener("focus", onFocus);
    mathfield.addEventListener("blur", onBlur, true);
    mathfield.addEventListener("keydown", onKeydown);
    mathfield.addEventListener("move-out", onMoveout);
    mathfield.addEventListener("contextmenu", onContextmenu, { capture: true });

    return () => {
      mathfield.removeEventListener("input", onInput);
      mathfield.removeEventListener("focus", onFocus);
      mathfield.removeEventListener("blur", onBlur, true);
      mathfield.removeEventListener("keydown", onKeydown);
      mathfield.removeEventListener("move-out", onMoveout);
      mathfield.removeEventListener("contextmenu", onContextmenu, { capture: true });
    };
  }, [editor]);

  return <math-field key={nodeKey}>
    <style>
      {`
        :host .ML__container {
          pointer-events: inherit; 
          padding: 0;
        }
        :host(:not(:focus)) .ML__contains-caret,
        :host(:not(:focus)) .ML__contains-caret * {
          color: inherit;
        }
        :host .ML__latex, :host .ML__text { font-family: inherit; }
      `}
    </style>
  </math-field>;
}
