import { SerializedEditorState, SerializedElementNode, SerializedLexicalNode, SerializedTextNode } from "lexical";

function addMissingNodeProps(nodes: SerializedLexicalNode[]) {
  return nodes.map((node) => {
    const { type } = node;
    switch (type) {
      case "text":
        const textNode = { ...node, style: (node as SerializedTextNode).style || "" } as SerializedTextNode;
        return textNode;
      default:
        const ElementNode = { ...node, children: (isSerializedElementNode(node) && addMissingNodeProps(node.children)) || [] } as SerializedLexicalNode;
        return ElementNode;
    }
  });
}

export function validateData(data: SerializedEditorState) {
  const newData = {
    ...data,
    root: {
      ...data.root,
      children: addMissingNodeProps(data.root.children)
    }
  };
  return newData;
}

export function isSerializedElementNode(
  node: SerializedLexicalNode | null | undefined,
): node is SerializedElementNode {
  return Object.prototype.hasOwnProperty.call(node, "children");
}
