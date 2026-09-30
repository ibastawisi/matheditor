import { $findMatchingParent, $insertNodeToNearestRoot, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  DELETE_CHARACTER_COMMAND,
  defineExtension,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
} from "lexical";

import {
  $createDetailsContainerNode,
  $isDetailsContainerNode,
  DetailsContainerNode,
  $createDetailsContentNode,
  $isDetailsContentNode,
  DetailsContentNode,
  $createDetailsSummaryNode,
  $isDetailsSummaryNode,
  DetailsSummaryNode,
} from "./nodes";
import { INSERT_DETAILS_COMMAND } from "./commands";

const $onEscapeUp = () => {
  const selection = $getSelection();
  if ($isRangeSelection(selection) && selection.isCollapsed() && selection.anchor.offset === 0) {
    const container = $findMatchingParent(selection.anchor.getNode(), $isDetailsContainerNode);

    if ($isDetailsContainerNode(container)) {
      const parent = container.getParent();
      if (
        parent !== null &&
        parent.getFirstChild() === container &&
        selection.anchor.key === container.getFirstDescendant()?.getKey()
      ) {
        container.insertBefore($createParagraphNode());
      }
    }
  }

  return false;
};

const $onEscapeDown = () => {
  const selection = $getSelection();
  if ($isRangeSelection(selection) && selection.isCollapsed()) {
    const container = $findMatchingParent(selection.anchor.getNode(), $isDetailsContainerNode);

    if ($isDetailsContainerNode(container)) {
      const parent = container.getParent();
      if (parent !== null && parent.getLastChild() === container) {
        const summaryParagraph = container.getFirstDescendant();
        const contentParagraph = container.getLastDescendant();

        if (
          (contentParagraph !== null &&
            selection.anchor.key === contentParagraph.getKey() &&
            selection.anchor.offset === contentParagraph.getTextContentSize()) ||
          (summaryParagraph !== null &&
            selection.anchor.key === summaryParagraph.getKey() &&
            selection.anchor.offset === summaryParagraph.getTextContentSize())
        ) {
          container.insertAfter($createParagraphNode());
        }
      }
    }
  }

  return false;
};

export const DetailsExtension = defineExtension({
  name: "details",
  nodes: [DetailsContainerNode, DetailsSummaryNode, DetailsContentNode],
  register: (editor) =>
    mergeRegister(
      // Structure enforcing transformers for each node type. In case nesting structure is not
      // "Container > Summary + Content" it'll unwrap nodes and convert it back
      // to regular content.
      editor.registerNodeTransform(DetailsContentNode, (node) => {
        const parent = node.getParent();
        if (!$isDetailsContainerNode(parent)) {
          const children = node.getChildren();
          for (const child of children) {
            node.insertBefore(child);
          }
          node.remove();
        }
      }),

      editor.registerNodeTransform(DetailsSummaryNode, (node) => {
        const parent = node.getParent();
        if (!$isDetailsContainerNode(parent)) {
          node.replace($createParagraphNode().append(...node.getChildren()));
          return;
        }
      }),

      editor.registerNodeTransform(DetailsContainerNode, (node) => {
        const children = node.getChildren();
        if (
          children.length !== 2 ||
          !$isDetailsSummaryNode(children[0]) ||
          !$isDetailsContentNode(children[1])
        ) {
          for (const child of children) {
            node.insertBefore(child);
          }
          node.remove();
        }
      }),

      // This handles the case when container is collapsed and we delete its previous sibling
      // into it, it would cause collapsed content deleted (since it's display: none, and selection
      // swallows it when deletes single char). Instead we expand container, which is although
      // not perfect, but avoids bigger problem
      editor.registerCommand(
        DELETE_CHARACTER_COMMAND,
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed() || selection.anchor.offset !== 0) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const topLevelElement = anchorNode.getTopLevelElement();
          if (topLevelElement === null) {
            return false;
          }

          const container = topLevelElement.getPreviousSibling();
          if (!$isDetailsContainerNode(container) || container.getOpen()) {
            return false;
          }

          container.setOpen(true);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),

      // When details is the last child pressing down/right arrow will insert paragraph
      // below it to allow adding more content. It's similar what $insertBlockNode
      // (mainly for decorators), except it'll always be possible to continue adding
      // new content even if trailing paragraph is accidentally deleted
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, $onEscapeDown, COMMAND_PRIORITY_LOW),

      editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, $onEscapeDown, COMMAND_PRIORITY_LOW),

      // When details is the first child pressing up/left arrow will insert paragraph
      // above it to allow adding more content. It's similar what $insertBlockNode
      // (mainly for decorators), except it'll always be possible to continue adding
      // new content even if leading paragraph is accidentally deleted
      editor.registerCommand(KEY_ARROW_UP_COMMAND, $onEscapeUp, COMMAND_PRIORITY_LOW),

      editor.registerCommand(KEY_ARROW_LEFT_COMMAND, $onEscapeUp, COMMAND_PRIORITY_LOW),

      // Enter goes from Summary to Content rather than a new line inside Summary
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const summaryNode = $findMatchingParent(selection.anchor.getNode(), (node) =>
              $isDetailsSummaryNode(node)
            );

            if ($isDetailsSummaryNode(summaryNode)) {
              const container = summaryNode.getParent();
              if (container && $isDetailsContainerNode(container)) {
                if (!container.getOpen()) {
                  container.toggleOpen();
                }
                summaryNode.getNextSibling()?.selectEnd();
                return true;
              }
            }
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_DETAILS_COMMAND,
        () => {
          editor.update(() => {
            const summary = $createDetailsSummaryNode();
            const paragraph = $createParagraphNode();
            $insertNodeToNearestRoot(
              $createDetailsContainerNode(true).append(
                summary.append(paragraph),
                $createDetailsContentNode().append($createParagraphNode())
              )
            );
            paragraph.select();
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    ),
});
