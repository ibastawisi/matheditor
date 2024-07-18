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
import { lazy, Suspense, useEffect, useRef } from 'react';
import { editorConfig } from './config';
import { IconButton } from '@mui/material';
import { Delete, FormatPaint, DragIndicator } from '@mui/icons-material';
import { $isStickyNode } from '.';

const NestedEditor = lazy(() => import('@/editor/NestedEditor'));

export default function StickyComponent({ nodeKey, color, stickyEditor, children }: { nodeKey: NodeKey, color: string, stickyEditor: LexicalEditor, children?: React.ReactNode }) {
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
      if (!$isStickyNode(node)) return;
      node.toggleColor();
    });
  };

  const onChange = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!$isStickyNode(node)) return;
      node.setEditor(stickyEditor);
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
        <Suspense fallback={children}>
          <NestedEditor initialEditor={stickyEditor} initialNodes={editorConfig.nodes} onChange={onChange} />
        </Suspense>
      </div>
    </div >
  );
}
