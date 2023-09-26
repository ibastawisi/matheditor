"use client"
import {
  NodeKey,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  $getNodeByKey,
  $setSelection,
} from 'lexical';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import './StickyNode.css';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useState } from 'react';
import { editorConfig } from './config';
import dynamic from 'next/dynamic';
import { IconButton } from '@mui/material';
import { Delete, FormatPaint, DragIndicator } from '@mui/icons-material';
const NestedEditor = dynamic(() => import('@/editor/NestedEditor'), { ssr: false });

export default function StickyComponent({ nodeKey, color, stickyEditor }: { stickyEditor: LexicalEditor; color: 'pink' | 'yellow'; nodeKey: NodeKey; }): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);

  const stickyContainerRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          if (activeEditor !== stickyEditor) clearSelection();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [
    isSelected
  ]);

  const clearSelection = () => {
    stickyEditor.update(() => { $setSelection(null); });
  }

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  const handleColorChange = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.toggleColor();
      }
    });
  };

  const onChange = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.setEditor(stickyEditor);
      }
    });
  }

  return (
    <div ref={stickyContainerRef} className="sticky-note-container" draggable={isSelected} {...{ theme: 'light' }}>
      <div className='sticky-tools'>
        <IconButton sx={{ displayPrint: 'none' }} onClick={handleDelete} aria-label="Delete sticky note" title="Delete" color='inherit' size='small'>
          <Delete fontSize='inherit' />
        </IconButton>
        <IconButton sx={{ displayPrint: 'none' }} color='inherit' size='small' aria-label="Change sticky note color" title="Color" onClick={handleColorChange}>
          <FormatPaint fontSize='inherit' />
        </IconButton>
        <IconButton className='drag-btn' sx={{ displayPrint: 'none', mr: "auto" }} color='inherit' size='small' aria-label="Drag sticky note" title="Drag"
          onMouseDown={() => setSelected(true)} onMouseUp={() => setSelected(false)}>
          <DragIndicator fontSize='inherit' />
        </IconButton>
      </div>
      <div className={`sticky-note ${color}`}>
        <NestedEditor initialEditor={stickyEditor} initialNodes={editorConfig.nodes} onChange={onChange} />
      </div>
    </div >
  );
}
