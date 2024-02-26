/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LexicalCommand, LexicalEditor, RangeSelection } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';

import { INSERT_MATH_COMMAND } from '../MathPlugin';
import { $isMathNode } from '@/editor/nodes/MathNode';
import { createPortal } from 'react-dom';
import { Alert } from '@mui/material';

export const SPEECH_TO_TEXT_COMMAND: LexicalCommand<boolean> = createCommand(
  'SPEECH_TO_TEXT_COMMAND',
);

const VOICE_COMMANDS: Readonly<
  Record<
    string,
    (arg0: { editor: LexicalEditor; selection: RangeSelection }) => void
  >
> = {
  '\n': ({ selection }) => {
    selection.insertParagraph();
  },
  redo: ({ editor }) => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  },
  undo: ({ editor }) => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  },
  'insert math': ({ editor }) => {
    editor.dispatchCommand(INSERT_MATH_COMMAND, { value: '' });
  }
};

export const SUPPORT_SPEECH_RECOGNITION: boolean =
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

function SpeechToTextPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = useRef<typeof SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isEnabled && recognition.current === null) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.addEventListener(
        'result',
        (event: typeof SpeechRecognition) => {
          const resultItem = event.results.item(event.resultIndex);
          const { transcript } = resultItem.item(0);
          if (timer.current) clearTimeout(timer.current);
          if (transcript) {
            setTranscript(transcript);
            timer.current = setTimeout(() => {
              if (timer.current) clearTimeout(timer.current);
              setTranscript(null);
            }, 1000);
          }

          if (!resultItem.isFinal) {
            return;
          }

          editor.update(() => {
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
              const command = VOICE_COMMANDS[transcript.toLowerCase().trim()];

              if (command) {
                command({
                  editor,
                  selection,
                });
              } else if (transcript.match(/\s*\n\s*/)) {
                selection.insertParagraph();
              } else {
                selection.insertText(transcript);
              }
            } else if ($isNodeSelection(selection)) {
              const node = selection.getNodes()[0];
              if ($isMathNode(node)) {
                const mathfield = node.getMathfield();
                if (mathfield) {
                  mathfield.executeCommand(['insert', transcript, {
                    feedback: true,
                    format: 'text',
                    mode: 'text',
                  }]);
                }
              }
            }
          });
        },
      );
      recognition.current.addEventListener('end', () => {
        editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, false);
      });
    }

    if (recognition.current) {
      if (isEnabled) {
        recognition.current.start();
      } else {
        recognition.current.stop();
      }
    }

    return () => {
      if (recognition.current !== null) {
        recognition.current.stop();
      }
    };
  }, [editor, isEnabled]);

  useEffect(() => {
    return editor.registerCommand(
      SPEECH_TO_TEXT_COMMAND,
      (_isEnabled: boolean) => {
        setIsEnabled(_isEnabled);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  if (!isEnabled || !transcript) return null;
  return <TranscriptAlert transcript={transcript} />;

}

const TranscriptAlert = ({ transcript }: { transcript: string }) => {
  return createPortal(
    <Alert severity="success" icon={false} sx={{
      position: 'fixed',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      maxWidth: 400,
      width: 'calc(100% - 32px)',
      textAlign: 'center',
    }}>
      {transcript}
    </Alert>
    , document.body);
};

export default SUPPORT_SPEECH_RECOGNITION ? SpeechToTextPlugin : () => null;