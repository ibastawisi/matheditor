import type { InitialEditorStateType, NodeKey } from "lexical";
import { $getNodeByKey } from "lexical";
import { createHeadlessEditor } from "@/editor/utils/createHeadlessEditor";
import { $isImageNode, ImageNode } from "@/editor/extensions/image/nodes";
import { prefetchInlineSvg } from "@/editor/extensions/image/utils";
import { getSignedUrlMapFromEditor } from "@/editor/extensions/services";
import { defaultServices } from "@/editor/extensions/services/constants";
import type { Services } from "@/editor/extensions/services/types";
import { $getPageSlotContent } from "@/editor/extensions/pages/states";
import { forEachImageSource, isStoredImageSrc } from "@/shared/storage";

export const addSignedUrls = async (
  initialEditorState: InitialEditorStateType,
  services: {
    getImageSignedUrl: Services["getImageSignedUrl"];
  } = defaultServices
) => {
  try {
    if (!initialEditorState) return null;
    const editor = createHeadlessEditor(initialEditorState);
    const editorState = editor.getEditorState();
    const signedUrlMap = getSignedUrlMapFromEditor(editor);
    const [storedImageNodes, slotSources] = editor.read(() => {
      const nodeMap = editorState._nodeMap;
      const keys = [...nodeMap.keys()];
      const nodes = keys.map((key: NodeKey) => $getNodeByKey(key));
      const imageNodes = nodes
        .filter($isImageNode)
        .filter((node: ImageNode) => node.getSrc().startsWith("/images/"));
      const extraSources = new Set<string>();
      for (const kind of ["header", "footer"] as const) {
        forEachImageSource($getPageSlotContent(kind), (src) => {
          if (isStoredImageSrc(src)) extraSources.add(src);
        });
      }
      return [imageNodes, [...extraSources]] as const;
    });
    await Promise.all([
      ...storedImageNodes.map(async (node: ImageNode) => {
        const [signedUrl, src] = editor.read(() => [node.getSignedUrl(), node.getSrc()]);
        if (signedUrl) {
          if (src.endsWith(".svg")) await prefetchInlineSvg(src, signedUrl);
          return;
        }
        const fileName = src.split("/").pop()!;
        const { data, error } = await services.getImageSignedUrl(fileName);
        if (error) throw error;
        if (data) {
          if (src.endsWith(".svg")) {
            await prefetchInlineSvg(src, data.signedUrl);
          }
          editor.update(
            () => {
              node.setSignedUrl(data.signedUrl);
            },
            { discrete: true }
          );
        }
      }),
      ...slotSources.map(async (src) => {
        const cached = signedUrlMap.get(src);
        if (cached) {
          if (src.endsWith(".svg")) await prefetchInlineSvg(src, cached);
          return;
        }
        const fileName = src.split("/").pop()!;
        const { data, error } = await services.getImageSignedUrl(fileName);
        if (error) throw error;
        if (data) {
          signedUrlMap.set(src, data.signedUrl);
          if (src.endsWith(".svg")) await prefetchInlineSvg(src, data.signedUrl);
        }
      }),
    ]);
    return editor.getEditorState();
  } catch (error) {
    console.error("Error adding signed urls:", error);
    return null;
  }
};
