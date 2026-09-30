import {
  $create,
  buildImportMap,
  DOMConversionOutput,
  LexicalEditor,
  LexicalNode,
} from "lexical";

import { $parseImagePayloadFromDOM, IMAGE_STATE_CONFIGS, ImageNode } from "@/editor/extensions/image/nodes";
import type { ImagePayload } from "@/editor/extensions/image/types";
import { idState } from "@/editor/extensions/shared/states";

export type IFramePayload = ImagePayload;

const YOUTUBE_REGEX = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

export function getEmbedUrl(src: string) {
  const matchYoutube = YOUTUBE_REGEX.exec(src);
  const videoId = matchYoutube?.[2].length === 11 ? matchYoutube[2] : null;
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : src;
}

function $convertIFrameElement(domNode: HTMLIFrameElement): DOMConversionOutput | null {
  const src = domNode.getAttribute("data-lexical-iFrame") ?? domNode.getAttribute("src");
  if (!src) return null;
  const node = $createIFrameNode({
    src,
    width: +(domNode.getAttribute("width") || "560"),
    height: +(domNode.getAttribute("height") || "315"),
    altText: domNode.title,
    id: idState.parse(domNode.id),
  });
  return { node };
}

export class IFrameNode extends ImageNode {
  $config() {
    return this.config("iframe", {
      extends: ImageNode,
      importDOM: buildImportMap({
        figure: (domNode: HTMLElement) => {
          if (domNode.dataset.type !== "iframe") {
            return null;
          }
          return {
            conversion: (domNode: HTMLElement): DOMConversionOutput => ({
              node: $createIFrameNode($parseImagePayloadFromDOM(domNode)),
            }),
            priority: 2,
          };
        },
        iframe: (domNode: HTMLElement) => {
          if (domNode.parentElement?.tagName === "FIGURE") {
            return null;
          }
          if (!domNode.hasAttribute("data-lexical-iFrame")) {
            return null;
          }
          return {
            conversion: $convertIFrameElement,
            priority: 1,
          };
        },
      }),
      stateConfigs: IMAGE_STATE_CONFIGS,
    });
  }

  createMediaElement(editor: LexicalEditor) {
    const iframe = document.createElement("iframe");
    const src = this.getSrc();
    const width = this.getWidth();
    const height = this.getHeight();
    iframe.setAttribute("data-lexical-iFrame", src);
    if (width) iframe.setAttribute("width", width.toString());
    if (height) iframe.setAttribute("height", height.toString());
    iframe.setAttribute("src", getEmbedUrl(src));
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    );
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("title", this.getAltText());
    if (editor.isEditable()) iframe.style.pointerEvents = "none";
    return iframe;
  }

  getDefaultAltText() {
    return "iframe";
  }

  getTextContent(): string {
    return this.getSrc();
  }
}

export function $createIFrameNode(payload: IFramePayload): IFrameNode {
  const {
    src,
    altText = "iframe",
    width,
    height,
    float = "none",
    filter = "none",
    id = "",
    showCaption = false,
  } = payload;
  return $create(IFrameNode)
    .setSrc(src)
    .setAltText(altText)
    .setWidth(width)
    .setHeight(height)
    .setFloat(float)
    .setFilter(filter)
    .setId(id)
    .setShowCaption(showCaption);
}

export function $isIFrameNode(node: LexicalNode | null | undefined): node is IFrameNode {
  return node instanceof IFrameNode;
}
