"use client"
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import * as React from 'react';

import createMarkdownTransformers from './MarkdownTransformers';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export default function MarkdownPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  if (!editor) return null;
  const TRANSFORMERS = createMarkdownTransformers(editor);
  return <MarkdownShortcutPlugin transformers={TRANSFORMERS} />;
}
