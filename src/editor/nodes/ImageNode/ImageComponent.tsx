"use client"
/* eslint-disable @next/next/no-img-element */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $isRangeSelection,
  $setSelection,
  GridSelection,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  NodeKey,
  NodeSelection,
  RangeSelection,
} from 'lexical';

import './index.css';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';

import ImageResizer from './ImageResizer';
import { $isImageNode } from '.';
import Typography from '@mui/material/Typography';

const NestedEditor = lazy(() => import('../../NestedEditor'));

function LazyImage({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
  draggable,
}: {
  altText: string;
  className: string | null;
  height: number;
  imageRef: { current: null | HTMLImageElement };
  src: string;
  width: number;
  draggable: boolean
}): JSX.Element {
  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={imageRef}
      width={width || undefined}
      height={height || undefined}
      draggable={draggable}
    />
  );
}

export default function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  showCaption,
  caption,
}: {
  altText: string;
  height: number;
  nodeKey: NodeKey;
  src: string;
  width: number;
  showCaption: boolean;
  caption: LexicalEditor;
}): JSX.Element {
  const imageRef = useRef<null | HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);

  const onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();
      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        if (showCaption) {
          // Move focus into nested editor
          $setSelection(null);
          event.preventDefault();
          caption.focus();
          return true;
        }
      }
      return false;
    },
    [caption, isSelected, showCaption],
  );

  const onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (
        activeEditorRef.current === caption
      ) {
        $setSelection(null);
        editor.update(() => {
          setSelected(true);
          const parentRootElement = editor.getRootElement();
          if (parentRootElement !== null) {
            parentRootElement.focus();
          }
        });
        return true;
      }
      return false;
    },
    [caption, editor, setSelected],
  );

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.selectPrevious();
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey, setSelected],
  );

  useEffect(() => {
    isSelected && onLoad();
  }, [isSelected, imageRef]);

  useEffect(() => {
    let isMounted = true;
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read(() => $getSelection()));
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;

          if (isResizing) {
            return true;
          }
          if (event.target === imageRef.current) {
            if (event.shiftKey) {
              setSelected(!isSelected);
            } else {
              clearSelection();
              setSelected(true);
            }
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            // TODO This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        onEscape,
        COMMAND_PRIORITY_LOW,
      ),

    );
    return () => {
      isMounted = false;
      unregister();
    };
  }, [
    clearSelection,
    editor,
    isResizing,
    isSelected,
    nodeKey,
    onDelete,
    onEnter,
    onEscape,
    setSelected,
  ]);

  const onResizeEnd = (
    nextWidth: number,
    nextHeight: number,
  ) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!$isImageNode(node)) return;
      node.setWidthAndHeight(nextWidth, nextHeight);
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const onLoad = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        const rootElement = editor.getRootElement();
        rootElement?.focus();
        const nativeSelection = window.getSelection();
        nativeSelection?.removeAllRanges();
        const element = imageRef.current;
        element?.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  const onChange = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setCaption(caption);
      }
    });
  }

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = $isNodeSelection(selection) && (isSelected || isResizing);

  return (
    <>
      <ImageResizer
        editor={editor}
        imageRef={imageRef}
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        showResizers={isFocused}
      >
        <LazyImage
          className={isFocused ? `focused ${$isNodeSelection(selection) ? 'draggable' : ''}` : null}
          src={src}
          altText={altText}
          imageRef={imageRef}
          width={width}
          height={height}
          draggable={draggable}
        />
      </ImageResizer>
      {showCaption && (
        <figcaption>
          <Suspense fallback={null}>
            <NestedEditor initialEditor={caption} onChange={onChange}
              placeholder={<Typography color="text.secondary" className="nested-placeholder">Write a caption</Typography>}
            />
          </Suspense>
        </figcaption>
      )}
    </>
  );
}
