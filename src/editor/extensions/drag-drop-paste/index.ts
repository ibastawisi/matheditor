import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW, defineExtension } from "lexical";

import { INSERT_IMAGE_COMMAND } from "@/editor/extensions/image/commands";
import { getImageDimensions } from "@/editor/extensions/image/utils";
import { ANNOUNCE_COMMAND } from "@/editor/commands";

const ACCEPTABLE_IMAGE_TYPES = ["image/", "image/heic", "image/heif", "image/gif", "image/webp"];

export const DragDropPasteExtension = defineExtension({
  name: "drag-drop-paste",
  register: (editor) => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(files, ACCEPTABLE_IMAGE_TYPES);
          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              const dimensions = await getImageDimensions(result);
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                src: result,
                altText: file.name.replace(/\.[^/.]+$/, ""),
                showCaption: true,
                ...dimensions,
              });
            } else {
              editor.dispatchCommand(ANNOUNCE_COMMAND, {
                message: { title: "Uploading image failed", subtitle: "Unsupported file type" },
              });
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  },
});
