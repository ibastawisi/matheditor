import "./index.css";
import {
  $createParagraphNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isRootNode,
  COMMAND_PRIORITY_EDITOR,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  defineExtension,
  LexicalEditor,
} from "lexical";
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils";
import { DecoratorTextExtension } from "@lexical/extension";
import { IS_MOBILE } from "@/shared/environment";
import { INSERT_MATH_COMMAND, type InsertMathCommandPayload } from "./commands";
import { $createMathNode, MathNode } from "./nodes";
import { customizeMathVirtualKeyboard } from "./keyboard";

let mathLiveGlobalsSetup = false;

const setupMathLiveGlobals = () => {
  if (mathLiveGlobalsSetup || typeof window === "undefined" || !window.MathfieldElement) return;
  window.MathfieldElement.soundsDirectory = null;
  window.MathfieldElement.computeEngine = null;
  try {
    customizeMathVirtualKeyboard();
  } catch (error) {
    console.error(error);
  }
  mathLiveGlobalsSetup = true;
};

// workaround for arrow up and arrow down key events inside math-field shadow roots
const resetKeyboardSinks = (editor: LexicalEditor) => {
  const rootElement = editor.getRootElement();
  if (!rootElement) return false;
  const mathfields = rootElement.querySelectorAll("math-field");
  mathfields.forEach((mathfield) => {
    const keyboardSink = mathfield.shadowRoot?.querySelector('[part="keyboard-sink"]');
    keyboardSink?.removeAttribute("contenteditable");
    setTimeout(() => {
      keyboardSink?.setAttribute("contenteditable", "true");
    }, 0);
  });
  return false;
};

const registerBackNavigationGuard = () => {
  const navigation = (window as any).navigation;
  if (!navigation || !IS_MOBILE) return;

  const preventBackNavigation = (event: any) => {
    if (event.navigationType !== "traverse") return;
    const mathVirtualKeyboard = window.mathVirtualKeyboard;
    if (!mathVirtualKeyboard?.visible) return;
    event.preventDefault();
    mathVirtualKeyboard.hide();
  };

  navigation.addEventListener("navigate", preventBackNavigation);
  return () => {
    navigation.removeEventListener("navigate", preventBackNavigation);
    const mathVirtualKeyboard = window.mathVirtualKeyboard;
    if (!mathVirtualKeyboard?.visible) return;
    mathVirtualKeyboard.hide();
  };
};

export const MathExtension = defineExtension({
  name: "math",
  nodes: () => [MathNode],
  dependencies: [DecoratorTextExtension],
  register: (editor) => {
    return mergeRegister(
      editor.registerRootListener((rootElement) => {
        if (!rootElement) return;
        setupMathLiveGlobals();
        return registerBackNavigationGuard();
      }),
      editor.registerCommand<InsertMathCommandPayload>(
        INSERT_MATH_COMMAND,
        (payload) => {
          const { value } = payload;
          const selection = $getSelection();
          const style = $isRangeSelection(selection) ? selection.style : "";
          const mathNode = $createMathNode(value, style);
          $insertNodes([mathNode]);
          if ($isRootNode(mathNode.getParentOrThrow())) {
            $wrapNodeInElement(mathNode, $createParagraphNode);
          }
          mathNode.select();
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, () => resetKeyboardSinks(editor), COMMAND_PRIORITY_EDITOR),
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, () => resetKeyboardSinks(editor), COMMAND_PRIORITY_EDITOR)
    );
  },
});
