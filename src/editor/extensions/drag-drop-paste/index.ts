import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW, defineExtension } from "lexical";

import { INSERT_IMAGE_COMMAND } from "@/editor/extensions/image/commands";
import { getImageDimensions } from "@/editor/extensions/image/utils";
import { getServicesFromEditor, ServicesExtension } from "@/editor/extensions/services";
import { ANNOUNCE_COMMAND } from "@/editor/commands";

const ACCEPTABLE_IMAGE_TYPES = ["image/", "image/heic", "image/heif", "image/gif", "image/webp"];

export const DragDropPasteExtension = defineExtension({
  name: "drag-drop-paste",
  dependencies: [ServicesExtension],
  register: (editor) => {
    const uploadImageFile = async (file: File) => {
      const { uploadImage, getImageSignedUrl } = getServicesFromEditor(editor);
      if (!uploadImage || !getImageSignedUrl) return null;
      const { data, error } = await uploadImage(file);
      if (error || !data) {
        throw new Error(`Uploading ${file.name} failed`);
      }
      const { data: signedUrlData, error: signedUrlError } = await getImageSignedUrl(data.path);
      if (signedUrlError || !signedUrlData) {
        throw new Error("Failed to get image signed URL");
      }
      return {
        src: `/images/${data.path}`,
        signedUrl: signedUrlData.signedUrl,
      };
    };

    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(files, ACCEPTABLE_IMAGE_TYPES);
          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              const dimensions = await getImageDimensions(result);
              const altText = file.name.replace(/\.[^/.]+$/, "");
              try {
                const payload = await uploadImageFile(file);
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                  ...(payload ?? { src: result }),
                  altText,
                  showCaption: true,
                  ...dimensions,
                });
              } catch {
                editor.dispatchCommand(ANNOUNCE_COMMAND, {
                  type: "error",
                  message: { title: "Uploading image failed", subtitle: "Please try again later" },
                });
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                  src: result,
                  altText,
                  showCaption: true,
                  ...dimensions,
                });
              }
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
