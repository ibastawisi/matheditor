/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $isRangeSelection,
  GridSelection,
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
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import ImageResizer from './ImageResizer';

const imageCache = new Set();

function useSuspenseImage(src: string) {
  if (!imageCache.has(src)) {
    throw new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageCache.add(src);
        resolve(null);
      };
    });
  }
}

function LazyImage({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
  onLoad,
}: {
  altText: string;
  className: string | null;
  height: 'inherit' | number;
  imageRef: { current: null | HTMLImageElement };
  src: string;
  width: 'inherit' | number;
  onLoad: () => void;
}): JSX.Element {
  useSuspenseImage(src);
  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={imageRef}
      style={{
        height,
        width,
      }}
      draggable="false"
      onLoad={onLoad}
    />
  );
}

export default function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  resizable,
}: {
  altText: string;
  height: 'inherit' | number;
  nodeKey: NodeKey;
  resizable: boolean;
  src: string;
  width: 'inherit' | number;
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

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if (node) {
          node.selectPrevious();
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey, setSelected],
  );

  useEffect(() => {
    onLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setSelected,
  ]);

  const onResizeEnd = (
    nextWidth: 'inherit' | number,
    nextHeight: 'inherit' | number,
  ) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!node) return;
      node.setWidthAndHeight(nextWidth, nextHeight);
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const onLoad = () => {
    if (isSelected) {
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
  }

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = $isNodeSelection(selection) && (isSelected || isResizing);

  return (
    <Suspense fallback={null}>
      <>
        <div draggable={draggable}>
          <LazyImage
            className={
              isFocused
                ? `focused ${$isNodeSelection(selection) ? 'draggable' : ''}`
                : null
            }
            src={src}
            altText={altText}
            imageRef={imageRef}
            onLoad={onLoad}
            width={width}
            height={height}
          />
        </div>
        {resizable && $isNodeSelection(selection) && isFocused && (
          <ImageResizer
            editor={editor}
            imageRef={imageRef}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
          />
        )}
      </>
    </Suspense>
  );
}
