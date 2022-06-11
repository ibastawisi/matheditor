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
import MathBlock from './MathBlock';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { actions } from '../slices';
import Box from '@mui/material/Box';
import { EditorDocument } from '../slices/app';
import Compressor from 'compressorjs';
import AlignmentTuneTool from 'editorjs-text-alignment-blocktune';
import equal from "fast-deep-equal";
import MathInline from './MathInline';
import { renderMathFieldsInScripts } from '../helpers';

declare global {
  interface Window { editor: EditorJS; }
}

const EDITTOR_HOLDER_ID = 'editorjs';

const Editor: React.FC<{ document: EditorDocument }> = ({ document }) => {
  const ejInstance = useRef<EditorJS | null>();
  const dispatch = useDispatch<AppDispatch>();

  const config = useSelector((state: RootState) => state.app.config);

  useEffect(() => {
    if (!ejInstance.current) {
      initEditor();
    }
    return () => {
      ejInstance.current?.destroy();
      ejInstance.current = null;
    }
  }, [config]);

  const initEditor = () => {
    const editor = new EditorJS({
      holder: EDITTOR_HOLDER_ID,
      logLevel: 'ERROR' as LogLevels.ERROR,
      data: document.data,
      onReady: () => {
        ejInstance.current = editor;
        window.editor = editor;
        new DragDrop(editor);
        renderMathFieldsInScripts();
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
          config: {
            defaultLevel: config.header.level,
          }
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
          class: MathBlock as any,
          shortcut: 'CMD+3',
          tunes: ['allignment'],
          config: {
            mode: config.math.mode,
          }
        },
        "inline math": {
          class: MathInline,
          shortcut: 'CMD+4',
        },
        alert: {
          class: Alert,
          tunes: ['allignment'],
          inlineToolbar: true,
        },
        delimiter: Delimiter,
        list: {
          class: List,
          inlineToolbar: true,
        },
        table: {
          class: Table,
          inlineToolbar: true,
        },
        code: CodeTool,
        inlineCode: {
          class: InlineCode,
          shortcut: 'CMD+SHIFT+C',
        },
        underline: Underline,
        allignment: {
          class:AlignmentTuneTool,
          config:{
            blocks: {
              header: config.header.alignment,
              paragraph: config.paragraph.alignment,
              math: config.math.alignment,
            }
          },
        }
      },
    });
  };

  return <Box className="editor-wrapper" id={EDITTOR_HOLDER_ID} />
}

export default Editor;
