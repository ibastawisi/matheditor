/* eslint-disable react-hooks/exhaustive-deps */
import { default as React, useEffect, useRef } from 'react';
import EditorJS, { LogLevels, OutputData } from '@editorjs/editorjs';
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
import useLocalStorage from './hooks/useLocalStorage';
import { useSelector } from 'react-redux';
import { RootState } from './store';

declare global {
  interface Window { editor: EditorJS; }
}

const EDITTOR_HOLDER_ID = 'editorjs';
const newDocumentData = () => ({ time:  new Date().getTime(), blocks: [{ type: "header", data: { text: "Untitled Document", level: 2 } }] });

const Editor: React.FC = () => {
  const document = useSelector((state: RootState) => state.app.document);
  const [editorData, setEditorData] = useLocalStorage<OutputData>(document.id, newDocumentData());
  const ejInstance = useRef<EditorJS | null>();

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
      data: editorData,
      onReady: () => {
        ejInstance.current = editor;
        window.editor = editor;
        new DragDrop(editor);
      },
      onChange: async () => {
        let content = await editor.saver.save();
        setEditorData(content);
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
                  reader.onload = () => { resolve({ success: 1, file: { url: reader.result as string, } });};
                  reader.readAsDataURL(file);
                });
              },
              uploadByUrl(url: string) {
                return new Promise((resolve, reject) => { resolve({ success: 1, file: { url } });});
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
    <React.Fragment>
      <div id={EDITTOR_HOLDER_ID}> </div>
    </React.Fragment>
  );
}

export default Editor;

