import { MathfieldElement } from "mathlive";

export function createMathFieldFromScript(script: HTMLScriptElement, autofocus: boolean = false): MathfieldElement {
  const mathfield = new MathfieldElement();
  mathfield.virtualKeyboardMode = "onfocus";
  mathfield.virtualKeyboardTheme = "material";
  // eslint-disable-next-line no-useless-escape
  mathfield.mathModeSpace = "\\,"
  mathfield.value = script.textContent as string;
  mathfield.smartMode = true;
  mathfield.keypressSound = "none";
  mathfield.plonkSound = "none";
  mathfield.oninput = () => {
    script.textContent = mathfield.value;
    if (script.textContent.length === 0) {
      setTimeout(() => {
        mathfield.remove();
        script.parentElement!.focus();
        script.remove();
      }, 0);
    }
  }

  mathfield.style.display = "inline-flex";
  autofocus && mathfield.addEventListener('mount', mathfield.focus);

  script.before(mathfield);
  
  const paragraph = script.parentElement!;
  paragraph.oninput = () => {
    if (!paragraph.contains(script)) {
      mathfield.remove();
    }
  }
  return mathfield;
}

export function renderMathFieldsInScripts() {
  const scripts = document.querySelectorAll<HTMLScriptElement>('script[type="math/tex"]');
  scripts.forEach((script) => {
    createMathFieldFromScript(script);
  })
}


// Credit to Liam (Stack Overflow)
// https://stackoverflow.com/a/41034697/3480193
class Cursor {
  static getCurrentCursorPosition(parentElement: HTMLElement) {
    var selection = window.getSelection(),
      charCount = -1,
      node;

    if (selection?.focusNode) {
      if (Cursor._isChildOf(selection?.focusNode, parentElement)) {
        node = selection?.focusNode;
        charCount = selection?.focusOffset;

        while (node) {
          if (node === parentElement) {
            break;
          }

          if (node.previousSibling) {
            node = node.previousSibling;
            charCount += node!.textContent!.length;
          } else {
            node = node.parentNode;
            if (node === null) {
              break;
            }
          }
        }
      }
    }

    return charCount;
  }

  static setCurrentCursorPosition(chars: number, element: HTMLElement) {
    if (chars >= 0) {
      var selection = window.getSelection();

      let range = Cursor._createRange(element, { count: chars });

      if (range) {
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }

  static _createRange(node: Node, chars: { count: any; }, range?: Range): Range {
    if (!range) {
      range = document.createRange()
      range.selectNode(node);
      range.setStart(node, 0);
    }

    if (chars.count === 0) {
      range.setEnd(node, chars.count);
    } else if (node && chars.count > 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent!.length < chars.count) {
          chars.count -= node.textContent!.length;
        } else {
          range.setEnd(node, chars.count);
          chars.count = 0;
        }
      } else {
        for (var lp = 0; lp < node.childNodes.length; lp++) {
          range = Cursor._createRange(node.childNodes[lp], chars, range);

          if (chars.count === 0) {
            break;
          }
        }
      }
    }

    return range;
  }

  static _isChildOf(node: Node|null, parentElement: HTMLElement) {
    while (node !== null) {
      if (node === parentElement) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }
}