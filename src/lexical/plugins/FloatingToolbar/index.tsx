/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isCodeHighlightNode } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isAtNodeEnd } from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';
import Paper from '@mui/material/Paper';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  ElementNode,
  LexicalEditor,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  TextNode,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import TextFormatToggles from '../ToolbarPlugin/Tools/TextFormatToggles';

function setPopupPosition(
  editor: HTMLElement,
  rect: ClientRect,
  rootElementRect: ClientRect,
): void {
  let top = rect.top + rect.height + 4 + window.pageYOffset;
  let left = rect.left + rect.width + window.pageXOffset;

  editor.style.opacity = '1';
  editor.style.top = `${top}px`;
  editor.style.left = `${left}px`;

  const editorRect = editor.getBoundingClientRect();

  if (left + editorRect.width > rootElementRect.width) {
    editor.style.left = left - editorRect.width > 0 ? `${left - editorRect.width}px`: '24px';
  }
}

function FloatingToolbar({
  editor,
}: {
  editor: LexicalEditor;
}) {
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());

  const updateFloatingToolbar = useCallback(() => {
    const selection = $getSelection();

    const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
    const nativeSelection = window.getSelection();

    if (popupCharStylesEditorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const domRange = nativeSelection.getRangeAt(0);
      const rootElementRect = rootElement.getBoundingClientRect();
      let rect;

      if (nativeSelection.anchorNode === rootElement) {
        let inner = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild as HTMLElement;
        }
        rect = inner.getBoundingClientRect();
      } else {
        rect = domRange.getBoundingClientRect();
      }

      setPopupPosition(popupCharStylesEditorElem, rect, rootElementRect);
    }
  }, [editor]);

  useEffect(() => {
    const onResize = () => {
      editor.getEditorState().read(() => {
        updateFloatingToolbar();
      });
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [editor, updateFloatingToolbar]);

  useEffect(() => {
    setIsEditable(editor.isEditable());
    editor.getEditorState().read(() => {
      updateFloatingToolbar();
    });
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateFloatingToolbar();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateFloatingToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updateFloatingToolbar]);

  if (!isEditable) return null;

  return (
    <Paper ref={popupCharStylesEditorRef} sx={{ position: "absolute", displayPrint: "none" }}>
      <TextFormatToggles editor={editor} />
    </Paper>
  );
}

function getSelectedNode(selection: RangeSelection): TextNode | ElementNode {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

function useFloatingToolbar(
  editor: LexicalEditor,
): JSX.Element | null {
  const [isText, setIsText] = useState(false);

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const node = getSelectedNode(selection);

      if (
        !$isCodeHighlightNode(selection.anchor.getNode()) &&
        selection.getTextContent() !== ''
      ) {
        setIsText($isTextNode(node));
      } else {
        setIsText(false);
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup);
    return () => {
      document.removeEventListener('selectionchange', updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      updatePopup();
    });
  }, [editor, updatePopup]);

  if (!isText) {
    return null;
  }

  return createPortal(<FloatingToolbar editor={editor} />, document.body);
}

export default function FloatingToolbarPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingToolbar(editor);
}