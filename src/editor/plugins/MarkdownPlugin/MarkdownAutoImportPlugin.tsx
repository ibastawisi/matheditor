"use client"
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createTextNode, $isRootOrShadowRoot, $isTextNode, TextNode } from 'lexical';
import { useEffect } from 'react';
import { TRANSFORMERS } from './MarkdownTransformers';
import { ElementTransformer, TextFormatTransformer, TextMatchTransformer } from '.';
import { $isCodeNode } from '@/editor/nodes/CodeNode';


function runElementTransformers(
  anchorNode: TextNode,
  elementTransformers: ReadonlyArray<ElementTransformer>,
): boolean {
  const parentNode = anchorNode.getParent();
  if (parentNode === null) {
    return false;
  }
  const grandParentNode = parentNode.getParent();

  if (
    !$isRootOrShadowRoot(grandParentNode) ||
    parentNode.getFirstChild() !== anchorNode
  ) {
    return false;
  }

  const textContent = anchorNode.getTextContent();

  for (const { regExp, replace } of elementTransformers) {
    const match = textContent.match(regExp);
    if (match === null) continue;

    const nextSiblings = anchorNode.getNextSiblings();
    const [leadingNode, remainderNode] = anchorNode.splitText(match[0].length);
    leadingNode.remove();
    const siblings = remainderNode
      ? [remainderNode, ...nextSiblings]
      : nextSiblings;
    replace(parentNode, siblings, match, true);
    return true;
  }

  return false;
}

function runTextMatchTransformers(
  anchorNode: TextNode,
  textMatchTransformers: ReadonlyArray<TextMatchTransformer>,
): boolean {
  if (!anchorNode.getParent()) return false;
  if (!$isTextNode(anchorNode)) return false;
  let textContent = anchorNode.getTextContent();
  for (const transformer of textMatchTransformers) {
    const match = textContent.match(transformer.regExp);
    if (match === null) continue;

    const startIndex = match.index || 0;
    const endIndex = startIndex + match[0].length;
    if (!match.slice(1).map(Boolean).includes(true)) continue;
    let replaceNode;

    if (startIndex === 0) {
      [replaceNode] = anchorNode.splitText(endIndex);
    } else {
      [, replaceNode] = anchorNode.splitText(startIndex, endIndex);
    }

    transformer.replace(replaceNode, match);
    return true;
  }

  return false;
}

function $runTextFormatTransformers(
  anchorNode: TextNode,
  textFormatTransformers: ReadonlyArray<TextFormatTransformer>
): boolean {
  if (!anchorNode.getParent()) return false;
  if (!$isTextNode(anchorNode)) return false;
  for (const matcher of textFormatTransformers) {
    const tag = matcher.tag.replaceAll('*', '\\*');
    const regex = new RegExp(`${tag}([^${tag}]+?)${tag}`, 'g');
    const textContent = anchorNode.getTextContent();
    const matches = textContent.matchAll(regex);
    for (const match of matches) {
      const startIndex = match.index || 0;
      if (textContent[startIndex - 1] === matcher.tag[0]) continue;
      const endIndex = startIndex + match[0].length;
      let targetNode;
      if (startIndex === 0) {
        [targetNode] = anchorNode.splitText(endIndex);
      } else {
        [, targetNode] = anchorNode.splitText(startIndex, endIndex);
      }
      if (!targetNode) continue;
      targetNode.setTextContent(match[1]);
      for (const format of matcher.format) {
        if (!targetNode.hasFormat(format)) {
          targetNode.toggleFormat(format);
        }
      }
      targetNode.selectEnd();
    }
  }

  return false;
}

export default function MarkdownAutoImportPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const elementTransformers = TRANSFORMERS.filter(
    (transformer): transformer is ElementTransformer =>
      transformer.type === 'element',
  );
  const textMatchTransformers = TRANSFORMERS.filter(
    (transformer): transformer is TextMatchTransformer =>
      transformer.type === 'text-match',
  );
  const textFormatTransformers = TRANSFORMERS.filter(
    (transformer): transformer is TextFormatTransformer =>
      transformer.type === 'text-format',
  );

  const $transform = (
    anchorNode: TextNode,
  ) => {
    runElementTransformers(
      anchorNode,
      elementTransformers
    )
    runTextMatchTransformers(
      anchorNode,
      textMatchTransformers
    )
    $runTextFormatTransformers(
      anchorNode,
      textFormatTransformers,
    );

    const parentNode = anchorNode.getParent();
    if (!parentNode) return;
    let previousSibling = parentNode.getPreviousSibling();
    if ($isCodeNode(previousSibling)) {
      const nextSibling = parentNode.getNextSibling();
      const isClosing = nextSibling?.getTextContent() === '```';
      const textContent = parentNode.getTextContent() + (isClosing ? '' : '\n');
      const textNode = $createTextNode(textContent);
      previousSibling.append(textNode);
      parentNode.remove();
    }
  };

  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(TextNode, $transform);
    return () => {
      removeTransform();
    };
  }, [editor]);

  return null;

}
