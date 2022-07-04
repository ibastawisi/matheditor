function mapEditorBlocksToLexicalNodes(blocks: any[]): any {
  const editorState: any = {
    root: {
      type: "root",
      children: [],
    }
  };

  blocks.forEach(block => {
    const { type, data } = block;
    switch (type) {
      case "paragraph":
        const paragraph = {
          type: 'paragraph',
          children: getChildNodes(data.text),
        };
        editorState.root.children.push(paragraph);
        break;
      case "header":
        editorState.root.children.push({
          type: 'heading',
          format: data.format,
          tag: "h" + data.level,
          children: getChildNodes(data.text),
        });
        break;
      case "math":
        editorState.root.children.push({
          type: 'paragraph',
          children: [
            {
              type: 'math',
              value: data.value,
            }
          ]
        });
        break;
      case "delimiter":
        editorState.root.children.push({
          "type": "horizontalrule",
        });
        break;
      case "image":
        editorState.root.children.push({
          type: 'paragraph',
          children: [
            {
              type: 'image',
              src: data.file.url,
              width: 0,
              height: 0,
              showCaption: false,
              caption: {
                editorState: {
                  root: {
                    children: [],
                    type: "root",
                  }
                }
              },
            }
          ]
        });
        break;
      case "list":
        const list = {
          type: 'list',
          tag: data.style === "ordered" ? "ol" : "ul",
          listType: data.style === "ordered" ? "number" : "bullet",
          start: 1,
          children: data.items.map((item: string, index: number) => ({
            children: getChildNodes(item),
            indent: 0,
            type: "listitem",
            value: index + 1
          })),
        };
        editorState.root.children.push(list);
        break;

        default:
        editorState.root.children.push({
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: getChildNodes(data.text || data.message || ""),
              mode: "normal",
            }
          ]
        });
        break;
    }
  });
  return editorState;
}

function getChildNodes(data: string) {
  const children = [] as any[];
  // replace all "&nbsp;" with spaces
  let text = data.replace(/&nbsp;/g, " ");

  const mathScripts = text.match(/<script[^>]*type="math\/tex"[^>]*>[^<]*<\/script>/g);

  mathScripts?.forEach(script => {
    const index = text.indexOf(script);
    const textBefore = text.substring(0, index);
    const textNode = {
      type: "text",
      text: textBefore,
      mode: "normal",
    };
    const scriptText = script.substring(script.indexOf(">") + 1, script.lastIndexOf("<"));
    const mathNode = {
      type: "math",
      value: scriptText,
    };
    text = text.substring(index + script.length);
    children.push(textNode);
    children.push(mathNode);
  });

  children.push(
    {
      type: 'text',
      text: text,
      mode: "normal",
    }
  );

  return children;
}

export function migrateData(data: any): any {
  if (data.blocks) {
    data = mapEditorBlocksToLexicalNodes(data.blocks);
  }
  return data;
}