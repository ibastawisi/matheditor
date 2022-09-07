/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  SerializedEditorState,
  LexicalEditor,
  $createNodeSelection,
} from 'lexical';

import './StickyNode.css';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer';
import {
  $getNodeByKey,
  $setSelection,
  createEditor,
  DecoratorNode,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';

import { useSharedHistoryContext } from '../../context/SharedHistoryContext';
import StickyEditorTheme from './StickyEditorTheme';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import TextFormatFloatingToolbarPlugin from '../../plugins/TextFormatFloatingToolbarPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '../../plugins/MarkdownTransforms';

function StickyComponent({
  nodeKey,
  color,
  data,
}: {
  data?: SerializedEditorState;
  color: 'pink' | 'yellow';
  nodeKey: NodeKey;
}): JSX.Element {
  const [rootEditor] = useLexicalComposerContext();
  const [isEditable, setisEditable] = useState(() => rootEditor.isEditable());

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

  const { historyState } = useSharedHistoryContext();

  const handleChange = () => {
    rootEditor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isStickyNode(node)) {
        const data = stickyEditor.current.getEditorState().toJSON();
        node.setData(data);
      }
    });
  }

  return (
    <div ref={stickyContainerRef} className="sticky-note-container">
      <div className={`sticky-note ${color}`} {...{ theme: 'light' }}>
        {isEditable && (<>
          <IconButton sx={{ displayPrint: 'none' }} onClick={handleDelete} className="delete" aria-label="Delete sticky note" title="Delete" color='inherit' size='small'>
            <DeleteIcon fontSize='inherit' />
          </IconButton>
          <IconButton sx={{ displayPrint: 'none' }} className="color" color='inherit' size='small' aria-label="Change sticky note color" title="Color" onClick={handleColorChange}>
            <FormatPaintIcon fontSize='inherit' />
          </IconButton>
        </>)}
        <LexicalNestedComposer initialEditor={stickyEditor.current}>
          <HistoryPlugin externalHistoryState={historyState} />
          <OnChangePlugin ignoreInitialChange ignoreSelectionChange onChange={handleChange} />
          <RichTextPlugin contentEditable={<ContentEditable className="StickyNode__contentEditable" />} placeholder="" />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <TextFormatFloatingToolbarPlugin />
        </LexicalNestedComposer>
      </div>
    </div >
  );
}

type StickyNoteColor = 'pink' | 'yellow';

export type SerializedStickyNode = Spread<
  {
    color: StickyNoteColor;
    data?: SerializedEditorState;
    type: 'sticky';
    version: 1;
  },
  SerializedLexicalNode
>;

export class StickyNode extends DecoratorNode<JSX.Element> {
  __color: StickyNoteColor;
  __data?: SerializedEditorState;

  static getType(): string {
    return 'sticky';
  }

  static clone(node: StickyNode): StickyNode {
    return new StickyNode(
      node.__color,
      node.__data,
      node.__key,
    );
  }
  static importJSON(serializedNode: SerializedStickyNode): StickyNode {
    return new StickyNode(
      serializedNode.color,
      serializedNode.data,
    );
  }

  constructor(
    color: 'pink' | 'yellow',
    data?: SerializedEditorState,
    key?: NodeKey,
  ) {
    super(key);
    this.__data = data;
    this.__color = color;
  }

  exportJSON(): SerializedStickyNode {
    return {
      data: this.__data,
      color: this.__color,
      type: 'sticky',
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.style.float = 'right';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  setData(data: SerializedEditorState): void {
    const writable = this.getWritable();
    writable.__data = data;
  }

  toggleColor(): void {
    const writable = this.getWritable();
    writable.__color = writable.__color === 'pink' ? 'yellow' : 'pink';
  }

  select() {
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return <StickyComponent
      color={this.__color}
      nodeKey={this.getKey()}
      data={this.__data}
    />
  }

  isIsolated(): true {
    return true;
  }
}

export function $isStickyNode(
  node: LexicalNode | null | undefined,
): node is StickyNode {
  return node instanceof StickyNode;
}

export function $createStickyNode(): StickyNode {
  return new StickyNode('yellow');
}
