/* eslint-disable react-hooks/exhaustive-deps */
import { default as React, useEffect, useRef } from 'react';
import EditorJS, { LogLevels } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
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
import Compressor from 'compressorjs';
import AlignmentTuneTool from 'editorjs-text-alignment-blocktune';
import equal from "fast-deep-equal";

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
        const isChanged = !equal(document.data.blocks, content.blocks);
        isChanged && dispatch(actions.app.saveDocument(content));
      },
      tools: {
        header: {
          class: Header,
          inlineToolbar: true,
          tunes: ['allignment'],
        },
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
          tunes: ['allignment'],
        },
        Marker: {
          class: Marker,
          shortcut: 'CMD+H',
        },
        image: {
          class: ImageTool,
          inlineToolbar: true,
          config: {
            uploader: {
              uploadByFile(file: File) {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => { resolve({ success: 1, file: { url: reader.result as string, } }); };
                  new Compressor(file, {
                    quality: 0.2,
                    mimeType: 'image/jpeg',
                    success: (result) => {
                      reader.readAsDataURL(result);
                    },
                  });
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
          shortcut: 'CMD+3',
          tunes: ['allignment'],
        },
        alert: {
          class: Alert,
          tunes: ['allignment'],
        },
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
        allignment: {
          class:AlignmentTuneTool,
          config:{
            default: "left",
            blocks: {
              header: 'center',
            }
          },
        }
      },
    });
  };

  return <Box className="editor-wrapper" id={EDITTOR_HOLDER_ID} />
}

export default Editor;

