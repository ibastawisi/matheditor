"use client"
import {
  NodeKey,
  LexicalEditor,
  $getSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  COMMAND_PRIORITY_LOW,
} from 'lexical';


import './StickyNode.css';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
} from 'lexical';
import { useEffect, useRef, useState, lazy } from 'react';

import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import IconButton from '@mui/material/IconButton';

const NestedEditor = lazy(() => import('../../NestedEditor'));

export default function StickyComponent({ nodeKey, color, stickyEditor }: { stickyEditor: LexicalEditor; color: 'pink' | 'yellow'; nodeKey: NodeKey; }): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isDraggable, setDraggable] = useState(false);

  const stickyContainerRef = useRef<null | HTMLDivElement>(null);


  useEffect(() => {
    mergeRegister(
      stickyEditor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const selection = $getSelection();
          if (selection) {
            clearSelection();
            setSelected(true);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [
    clearSelection,
    stickyEditor,
    isSelected,
    nodeKey,
    setSelected,
  ]);

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
    <div ref={stickyContainerRef} className={"sticky-note-container" + (isSelected ? " selected" : "")} draggable={isDraggable} {...{ theme: 'light' }}>
      <div className='sticky-tools'>
        <IconButton sx={{ displayPrint: 'none' }} onClick={handleDelete} aria-label="Delete sticky note" title="Delete" color='inherit' size='small'>
          <DeleteIcon fontSize='inherit' />
        </IconButton>
        <IconButton sx={{ displayPrint: 'none' }} color='inherit' size='small' aria-label="Change sticky note color" title="Color" onClick={handleColorChange}>
          <FormatPaintIcon fontSize='inherit' />
        </IconButton>
        {isSelected && <IconButton className='drag-btn' sx={{ displayPrint: 'none', mr: "auto" }} color='inherit' size='small' aria-label="Drag sticky note" title="Drag"
          onMouseDown={() => setDraggable(true)} onMouseUp={() => setDraggable(false)}>
          <DragIndicatorIcon fontSize='inherit' />
        </IconButton>
        }
      </div>
      <div className={`sticky-note ${color}`}>
        <NestedEditor initialEditor={stickyEditor} onChange={onChange} />
      </div>
    </div >
  );
}
