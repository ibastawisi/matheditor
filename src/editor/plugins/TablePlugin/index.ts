/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  registerTablePlugin,
  registerTableSelectionObserver,
} from './LexicalTablePluginHelpers';
import { useEffect } from 'react';

/**
 * A plugin to enable all of the features of Lexical's TableNode.
 *
 * @param props - See type for documentation
 * @returns An element to render in your LexicalComposer
 */
export function TablePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => registerTablePlugin(editor), [editor]);

  useEffect(() => registerTableSelectionObserver(editor, true), [editor],);

  return null;
}