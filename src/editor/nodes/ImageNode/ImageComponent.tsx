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
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  NodeKey,
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
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';

import ImageResizer from './ImageResizer';
import ImageCaption from './ImageCaption';
import { $isImageNode } from '.';

export default function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  showCaption,
  caption,
  element = 'img',
  children,
}: {
  altText: string;
  height: number;
  nodeKey: NodeKey;
  src: string;
  width: number;
  showCaption: boolean;
  caption: LexicalEditor;
  element?: "img" | "iframe" | "svg";
  children?: React.ReactNode;
}) {
  const imageRef = useRef<HTMLImageElement | HTMLIFrameElement | SVGSVGElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();

  const $onEnter = useCallback(
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

  const $onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.currentTarget === caption._rootElement) {
        caption.update(() => { $setSelection(null); });
        setSelected(true);
        return true;
      }
      return false;
    },
    [caption, editor, setSelected],
  );

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.selectPrevious();
          node.remove();
          return true;
        }
      }
      return false;
    },
    [isSelected, nodeKey],
  );

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;

      if (isResizing) {
        return true;
      }
      if (imageRef.current && imageRef.current.contains(event.target as Node)) {
        caption.update(() => {
          $setSelection(null);
        });
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
    [isResizing, isSelected, setSelected, clearSelection, caption],
  );

  useEffect(() => {
    const unregister = mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
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
        $onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        $onEscape,
        COMMAND_PRIORITY_LOW,
      ),
    );

    return () => {
      unregister();
    };
  }, [
    clearSelection,
    editor,
    isResizing,
    isSelected,
    nodeKey,
    $onDelete,
    $onEnter,
    $onEscape,
    onClick,
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
        const scrollTop = Math.round(document.documentElement.scrollTop);
        const rootElement = editor.getRootElement();
        rootElement?.focus();
        document.documentElement.scrollTop = scrollTop;
        const nativeSelection = window.getSelection();
        nativeSelection?.removeAllRanges();
        const element = imageRef.current;
        element?.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  const [draggable, setDraggable] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    isSelected && onLoad();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const isDraggable = isSelected && $isNodeSelection(selection) && !isResizing;
      const isFocused = $isNodeSelection(selection) && (isSelected || isResizing);
      setDraggable(isDraggable);
      setFocused(isFocused);
    })
  }, [isSelected]);

  useEffect(() => {
    if (!imageRef.current) return;
    if (element === 'svg') {
      const isBase64 = src.startsWith('data:image/svg+xml;base64');
      const decoded = isBase64 ? atob(src.split(',')[1]) : decodeURIComponent(src.split(',')[1]);
      const string = decoded.replace(/<!-- payload-start -->\s*(.+?)\s*<!-- payload-end -->/, "");
      const svg = new DOMParser().parseFromString(string, 'image/svg+xml').documentElement;
      const styles = svg.querySelectorAll('style');
      styles.forEach(style => { style.remove(); });
      const viewBox = svg.getAttribute('viewBox');
      const svgWidth = svg.getAttribute('width');
      const svgHeight = svg.getAttribute('height');
      imageRef.current.setAttribute('viewBox', viewBox ? viewBox : `0 0 ${svgWidth} ${svgHeight}`);
      if (!width && svgWidth) imageRef.current.setAttribute('width', svgWidth);
      if (!height && svgHeight) imageRef.current.setAttribute('height', svgHeight);
      imageRef.current.innerHTML = svg.innerHTML;
    }
  }, [imageRef, src]);


  return (
    <>
      <ImageResizer
        editor={editor}
        imageRef={imageRef}
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        showResizers={focused}
      >
        {element === 'svg' && (
          <svg
            ref={imageRef as React.Ref<SVGSVGElement>}
            width={width || undefined}
            height={height || undefined}
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
          />
        )}
        {element === 'iframe' && (
          <iframe
            ref={imageRef as React.Ref<HTMLIFrameElement>}
            width={width}
            height={height}
            src={src}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen={true}
            title={altText}
          />
        )}
        <img
          className={focused ? `draggable` : undefined}
          src={src}
          alt={altText}
          draggable={draggable}
          ref={element === 'img' ? imageRef as React.Ref<HTMLImageElement> : undefined}
          width={width || undefined}
          height={height || undefined}
          style={element === 'img' ?
            { aspectRatio: (width / height) || undefined } :
            { aspectRatio: (width / height) || undefined, position: 'absolute', opacity: 0, pointerEvents: focused ? 'auto' : 'none' }
          }
        />
      </ImageResizer>
      {showCaption && <ImageCaption editor={caption} nodeKey={nodeKey}>{children}</ImageCaption>}
    </>
  );
}
