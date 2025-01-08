import { CodeHighlightNode, CodeNode } from "@/editor";
import { IRunOptions, Paragraph, TextRun } from "docx";

export function $convertCodeNode(node: CodeNode) {
  return new Paragraph({
    shading: {
      type: 'solid',
      color: '#f0f2f5',
    },
    border: {
      top: { space: 10, style: 'none' },
      bottom: { space: 10, style: 'none' },
      left: { space: 10, style: 'none' },
      right: { space: 10, style: 'none' },
    },
    indent: { left: 10 * 15, right: 10 * 15 },

  })
}

const colorMap: Record<string, string> = {
  comment: "#708090",
  prolog: "#708090",
  doctype: "#708090",
  cdata: "#708090",
  punctuation: "#999999",
  property: "#990055",
  tag: "#990055",
  boolean: "#990055",
  number: "#990055",
  constant: "#990055",
  symbol: "#990055",
  deleted: "#990055",
  selector: "#669900",
  "attr-name": "#669900",
  string: "#669900",
  char: "#669900",
  builtin: "#669900",
  inserted: "#669900",
  operator: "#9a6e3a",
  entity: "#9a6e3a",
  url: "#9a6e3a",
  atrule: "#0077aa",
  "attr-value": "#0077aa",
  keyword: "#0077aa",
  function: "#DD4A68",
  "class-name": "#DD4A68",
  regex: "#ee9900",
  important: "#ee9900",
  variable: "#ee9900",
};

export function $convertCodeHighlightNode(node: CodeHighlightNode) {
  const highlightType = node.getHighlightType();
  const options: IRunOptions = {
    text: node.getTextContent(),
    font: 'Consolas',
    size: 10 * 2,
    color: colorMap[highlightType as string],
  };


  return new TextRun(options);
}