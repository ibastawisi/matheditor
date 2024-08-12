"use client"
import { NodeKey, LexicalEditor, } from 'lexical';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { lazy, Suspense } from 'react';
import { editorConfig } from './config';
import { IconButton } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';
import './StickyNode.css';

const NestedEditor = lazy(() => import('@/editor/NestedEditor'));

export default function StickyComponent({ nodeKey, stickyEditor, children }: { nodeKey: NodeKey, stickyEditor: LexicalEditor, children?: React.ReactNode }) {
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);

  return (
    <div className="sticky-note-container" draggable={isSelected}>
      <div className='sticky-tools'>
        <IconButton className='drag-btn' sx={{ displayPrint: 'none', mr: "auto" }} color='inherit' size='small' aria-label="Drag sticky note" title="Drag"
          onMouseDown={() => setSelected(true)} onMouseUp={() => setSelected(false)}>
          <DragIndicator fontSize='inherit' />
        </IconButton>
      </div>
      <Suspense fallback={children}>
        <NestedEditor initialEditor={stickyEditor} initialNodes={editorConfig.nodes} />
      </Suspense>
    </div >
  );
}
