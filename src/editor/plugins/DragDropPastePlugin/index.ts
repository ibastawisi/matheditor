"use client"
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { isMimeType, mediaFileReader } from '@lexical/utils';
import { COMMAND_PRIORITY_LOW } from 'lexical';
import { useEffect } from 'react';

import { INSERT_IMAGE_COMMAND } from '../ImagePlugin';
import Compressor from 'compressorjs';

const ACCEPTABLE_IMAGE_TYPES = [
  'image/',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/webp',
];

export default function DragDropPaste(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x),
          );
          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              new Compressor(file, {
                quality: 0.6,
                success(result) {
                  const reader = new FileReader();
                  reader.readAsDataURL(result);
                  reader.onloadend = () => {
                    const base64data = reader.result;
                    if (typeof base64data !== 'string') {
                      return;
                    }
                    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                      src: base64data,
                      altText: file.name.replace(/\.[^/.]+$/, ""),
                    });
                  };
                },
                error(err) {
                  console.log(err.message);
                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    src: result,
                    altText: file.name.replace(/\.[^/.]+$/, ""),
                  });
                }
              });
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);
  return null;
}