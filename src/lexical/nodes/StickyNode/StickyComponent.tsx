import {
  NodeKey,
  SerializedEditorState,
  LexicalEditor,
  EditorState,
  $getSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';


import './StickyNode.css';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer';
import {
  $getNodeByKey,
  createEditor,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';
import isEqual from 'fast-deep-equal';

import StickyEditorTheme from './StickyEditorTheme';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import IconButton from '@mui/material/IconButton';
import { EditorPlugins } from '../../index';
import { $isStickyNode } from '.';

export default function StickyComponent({ nodeKey, color, data, }: { data?: SerializedEditorState; color: 'pink' | 'yellow'; nodeKey: NodeKey; }): JSX.Element {
  const [rootEditor] = useLexicalComposerContext();
  const [isEditable, setisEditable] = useState(() => rootEditor.isEditable());
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  const initialState = data ? rootEditor.parseEditorState(JSON.stringify(data)) : undefined;

  const stickyEditor = useRef<LexicalEditor>(createEditor({ editorState: initialState, theme: StickyEditorTheme }));
  const stickyContainerRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const editable = rootEditor.isEditable();
    setisEditable(editable);
    const editor = stickyEditor.current;
    editor.setEditable(editable);
    if (editor && data) {
      const oldState = editor.getEditorState().toJSON();
      if (JSON.stringify(oldState) === JSON.stringify(data)) return;
      const newState = editor.parseEditorState(
        JSON.stringify(data),
      );
      editor.setEditorState(newState);
    }
  }, [stickyEditor, rootEditor, data]);

  useEffect(() => {
    mergeRegister(
      stickyEditor.current.registerCommand(
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
    rootEditor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isStickyNode(node)) {
        node.remove();
      }
    });
  };

  const handleColorChange = () => {
    rootEditor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isStickyNode(node)) {
        node.toggleColor();
      }
    });
  };

  const onChange = (editorState: EditorState) => {
    const newData = editorState.toJSON();
    if (isEqual(data, newData)) return;
    rootEditor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isStickyNode(node)) {
        node.setData(newData);
      }
    });
  }

  return (
    <div ref={stickyContainerRef} className={"sticky-note-container" + (isSelected ? " draggable" : "")} draggable={isSelected} {...{ theme: 'light' }}>
      {isEditable && (<div className='sticky-tools'>
        <IconButton sx={{ displayPrint: 'none' }} onClick={handleDelete} aria-label="Delete sticky note" title="Delete" color='inherit' size='small'>
          <DeleteIcon fontSize='inherit' />
        </IconButton>
        <IconButton sx={{ displayPrint: 'none' }} color='inherit' size='small' aria-label="Change sticky note color" title="Color" onClick={handleColorChange}>
          <FormatPaintIcon fontSize='inherit' />
        </IconButton>
        {isSelected && <IconButton className='drag-btn' sx={{ displayPrint: 'none', mr: "auto" }} color='inherit' size='small' aria-label="Drag sticky note" title="Drag">
          <DragIndicatorIcon fontSize='inherit' />
        </IconButton>
        }
      </div>)}
      <div className={`sticky-note ${color}`}>
        <LexicalNestedComposer initialEditor={stickyEditor.current}>
          <EditorPlugins contentEditable={<ContentEditable className="StickyNode__contentEditable" />} onChange={onChange} />
        </LexicalNestedComposer>
      </div>
    </div >
  );
}
