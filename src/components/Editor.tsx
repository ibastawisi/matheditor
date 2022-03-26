/* eslint-disable react-hooks/exhaustive-deps */
import { default as React, useEffect, useRef } from 'react';
import EditorJS, { LogLevels } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from 'editorjs-paragraph-with-alignment';
import ImageTool from '@editorjs/image';
import Alert from 'editorjs-alert';
import Delimiter from '@editorjs/delimiter';
import Table from '@editorjs/table';
import CodeTool from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';
import Marker from '@editorjs/marker';
import Underline from '@editorjs/underline';
import List from '@editorjs/list';
import DragDrop from 'editorjs-drag-drop';
import MathTool from './MathTool';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { actions } from '../slices';
import Box from '@mui/material/Box';
import { EditorDocument } from '../slices/app';

declare global {
  interface Window { editor: EditorJS; }
}

const EDITTOR_HOLDER_ID = 'editorjs';

const Editor: React.FC<{ document: EditorDocument }> = ({ document }) => {
  const ejInstance = useRef<EditorJS | null>();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!ejInstance.current) {
      initEditor();
    }
    return () => {
      ejInstance.current?.destroy();
      ejInstance.current = null;
    }
  }, []);

  const initEditor = () => {
    const editor = new EditorJS({
      holder: EDITTOR_HOLDER_ID,
      logLevel: 'ERROR' as LogLevels.ERROR,
      data: document.data,
      onReady: () => {
        ejInstance.current = editor;
        window.editor = editor;
        new DragDrop(editor);
      },
      onChange: async () => {
        let content = await editor.saver.save();
        const isChanged = JSON.stringify(content.blocks) !== JSON.stringify(document.data.blocks);
        isChanged && dispatch(actions.app.saveDocument(content));
      },
      tools: {
        header: Header,
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
        },
        Marker: {
          class: Marker,
          shortcut: 'CMD+SHIFT+H',
        },
        image: {
          class: ImageTool,
          config: {
            uploader: {
              uploadByFile(file: File) {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => { resolve({ success: 1, file: { url: reader.result as string, } }); };
                  reader.readAsDataURL(file);
                });
              },
              uploadByUrl(url: string) {
                return new Promise((resolve, reject) => { resolve({ success: 1, file: { url } }); });
              }
            },
          }
        },
        math: {
          class: MathTool as any,
          shortcut: 'CMD+SHIFT+3',
        },
        alert: Alert,
        delimiter: Delimiter,
        list: {
          class: List,
          inlineToolbar: true,
        },
        table: Table,
        code: CodeTool,
        inlineCode: {
          class: InlineCode,
          shortcut: 'CMD+SHIFT+C',
        },
        underline: Underline,
      },
    });
  };

  return (
    <Box className="editor-wrapper">
      <div id={EDITTOR_HOLDER_ID}> </div>
    </Box>
  );
}

export default Editor;

