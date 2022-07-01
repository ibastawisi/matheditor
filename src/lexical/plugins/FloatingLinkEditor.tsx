import {
  GridSelection,
  LexicalEditor,
  NodeSelection,
  RangeSelection
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection, COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSelectedNode, positionEditorElement } from './toolbar/ToolbarPlugin';

export function FloatingLinkEditor({ editor }: { editor: LexicalEditor; }): JSX.Element {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [isEditMode, setEditMode] = useState(false);
  const [lastSelection, setLastSelection] = useState<
    RangeSelection | GridSelection | NodeSelection | null
  >(null);

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl('');
      }
    }
    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (editorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)) {
      const domRange = nativeSelection.getRangeAt(0);
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

      positionEditorElement(editorElem, rect, rootElement);
      setLastSelection(selection);
    } else if (!activeElement || activeElement.className !== 'link-input') {
      if (rootElement !== null) {
        positionEditorElement(editorElem, null, rootElement);
      }
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl('');
    }

    return true;
  }, [editor]);

  useEffect(() => {
    const onResize = () => {
      editor.getEditorState().read(() => {
        updateLinkEditor();
      });
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditMode]);

  return (
    <div ref={editorRef} className="link-editor">
      {isEditMode ? (
        <input
          ref={inputRef}
          className="link-input"
          value={linkUrl}
          onChange={(event) => {
            setLinkUrl(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (lastSelection !== null) {
                if (linkUrl !== '') {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
                }
                setEditMode(false);
              }
            } else if (event.key === 'Escape') {
              event.preventDefault();
              setEditMode(false);
            }
          }} />
      ) : (
        <>
          <div className="link-input">
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              {linkUrl}
            </a>
            <div
              className="link-edit"
              role="button"
              tabIndex={0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setEditMode(true);
              }} />
          </div>
        </>
      )}
    </div>
  );
}
