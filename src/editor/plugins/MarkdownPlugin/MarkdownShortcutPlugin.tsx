"use client"
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { registerMarkdownShortcuts } from '.';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import createMarkdownTransformers from './MarkdownTransformers';

export default function MarkdownPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const transformers = createMarkdownTransformers(editor);

  useEffect(() => {
    return registerMarkdownShortcuts(editor, transformers);
  }, [editor, transformers]);

  return null;
}
