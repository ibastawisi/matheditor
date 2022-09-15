/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './PrettierButton.css';

import { $isCodeNode } from '@lexical/code';
import { $getNearestNodeFromDOMNode, LexicalEditor } from 'lexical';
import { Options } from 'prettier';
import * as babelParser from 'prettier/parser-babel';
import * as htmlParser from 'prettier/parser-html';
import * as markdownParser from 'prettier/parser-markdown';
import * as cssParser from 'prettier/parser-postcss';
import { format } from 'prettier/standalone';
import { useState } from 'react';
import SvgIcon from '@mui/material/SvgIcon';
import IconButton from '@mui/material/IconButton';
const PrettierIcon = () => <SvgIcon viewBox='0 0 256 256' fontSize='small'>
  <rect fill="#56B3B4" x="182.857143" y="48.7619048" width="24.3809524" height="12.1904762" rx="5" />
  <rect fill="#EA5E5E" x="0" y="243.809524" width="73.1428571" height="12.1904762" rx="5" />
  <rect fill="#BF85BF" x="146.285714" y="146.285714" width="48.7619048" height="12.1904762" rx="5" />
  <rect fill="#EA5E5E" x="73.1428571" y="146.285714" width="60.952381" height="12.1904762" rx="5" />
  <rect fill="#56B3B4" x="0" y="146.285714" width="60.952381" height="12.1904762" rx="5" />
  <rect fill="#BF85BF" x="0" y="195.047619" width="73.1428571" height="12.1904762" rx="5" />
  <rect fill="#BF85BF" x="0" y="97.5238095" width="73.1428571" height="12.1904762" rx="5" />
  <rect fill="#F7BA3E" x="60.952381" y="24.3809524" width="134.095238" height="12.1904762" rx="5" />
  <rect fill="#EA5E5E" x="0" y="24.3809524" width="48.7619048" height="12.1904762" rx="5" />
  <rect fill="#F7BA3E" x="48.7619048" y="219.428571" width="24.3809524" height="12.1904762" rx="5" />
  <rect fill="#56B3B4" x="48.7619048" y="73.1428571" width="24.3809524" height="12.1904762" rx="5" />
  <rect fill="#56B3B4" x="0" y="219.428571" width="36.5714286" height="12.1904762" rx="5" />
  <rect fill="#F7BA3E" x="0" y="73.1428571" width="36.5714286" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="158.47619" y="219.428571" width="24.3809524" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="85.3333333" y="219.428571" width="60.952381" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="195.047619" y="219.428571" width="60.952381" height="12.1904762" rx="5" />
  <rect fill="#56B3B4" x="97.5238095" y="121.904762" width="109.714286" height="12.1904762" rx="5" />
  <rect fill="#F7BA3E" x="36.5714286" y="121.904762" width="48.7619048" height="12.1904762" rx="5" />
  <rect fill="#EA5E5E" x="0" y="121.904762" width="24.3809524" height="12.1904762" rx="5" />
  <rect fill="#BF85BF" x="109.714286" y="48.7619048" width="60.952381" height="12.1904762" rx="5" />
  <rect fill="#56B3B4" x="0" y="48.7619048" width="97.5238095" height="12.1904762" rx="5" />
  <rect fill="#F7BA3E" x="36.5714286" y="170.666667" width="121.904762" height="12.1904762" rx="5" />
  <rect fill="#BF85BF" x="0" y="170.666667" width="24.3809524" height="12.1904762" rx="5" />
  <rect fill="#EA5E5E" x="146.285714" y="73.1428571" width="73.1428571" height="12.1904762" rx="5" />
  <rect fill="#F7BA3E" x="146.285714" y="97.5238095" width="73.1428571" height="12.1904762" rx="5" />
  <rect fill="#56B3B4" x="0" y="0" width="158.47619" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="170.666667" y="0" width="85.3333333" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="170.666667" y="170.666667" width="36.5714286" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="219.428571" y="170.666667" width="36.5714286" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="207.238095" y="146.285714" width="48.7619048" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="207.238095" y="24.3809524" width="48.7619048" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="219.428571" y="121.904762" width="36.5714286" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="219.428571" y="48.7619048" width="36.5714286" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="231.619048" y="73.1428571" width="24.3809524" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="231.619048" y="97.5238095" width="24.3809524" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="134.095238" y="195.047619" width="121.904762" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="85.3333333" y="195.047619" width="36.5714286" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="182.857143" y="243.809524" width="73.1428571" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="85.3333333" y="243.809524" width="85.3333333" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="85.3333333" y="73.1428571" width="48.7619048" height="12.1904762" rx="5" />
  <rect fill="#D0D4D8" opacity="0.5" x="85.3333333" y="97.5238095" width="48.7619048" height="12.1904762" rx="5" />
</SvgIcon>;

interface Props {
  lang: string;
  editor: LexicalEditor;
  getCodeDOMNode: () => HTMLElement | null;
}

const PRETTIER_OPTIONS_BY_LANG: Record<string, Options> = {
  css: {
    parser: 'css',
    plugins: [cssParser],
  },
  html: {
    parser: 'html',
    plugins: [htmlParser],
  },
  js: {
    parser: 'babel',
    plugins: [babelParser],
  },
  markdown: {
    parser: 'markdown',
    plugins: [markdownParser],
  },
};

const LANG_CAN_BE_PRETTIER = Object.keys(PRETTIER_OPTIONS_BY_LANG);

export function canBePrettier(lang: string): boolean {
  return LANG_CAN_BE_PRETTIER.includes(lang);
}

function getPrettierOptions(lang: string): Options {
  const options = PRETTIER_OPTIONS_BY_LANG[lang];
  if (!options) {
    throw new Error(
      `CodeActionMenuPlugin: Prettier does not support this language: ${lang}`,
    );
  }

  return options;
}

export function PrettierButton({ lang, editor, getCodeDOMNode }: Props) {
  const [syntaxError, setSyntaxError] = useState<string>('');
  const [tipsVisible, setTipsVisible] = useState<boolean>(false);

  async function handleClick(): Promise<void> {
    const codeDOMNode = getCodeDOMNode();

    if (!codeDOMNode) {
      return;
    }

    editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);

      if ($isCodeNode(codeNode)) {
        const content = codeNode.getTextContent();
        const options = getPrettierOptions(lang);

        let parsed = '';

        try {
          parsed = format(content, options);
        } catch (error: unknown) {
          if (error instanceof Error) {
            setSyntaxError(error.message);
            setTipsVisible(true);
          } else {
            console.error('Unexpected error: ', error);
          }
        }
        if (parsed !== '') {
          const selection = codeNode.select(0);
          selection.insertText(parsed);
          setSyntaxError('');
          setTipsVisible(false);
        }
      }
    });
  }

  function handleMouseEnter() {
    if (syntaxError !== '') {
      setTipsVisible(true);
    }
  }

  function handleMouseLeave() {
    if (syntaxError !== '') {
      setTipsVisible(false);
    }
  }

  return (
    <div className="prettier-wrapper">
      <IconButton size="small" onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} aria-label="prettier">
        <PrettierIcon />
      </IconButton>
      {tipsVisible ? (
        <pre className="code-error-tips">{syntaxError}</pre>
      ) : null}
    </div>
  );
}
