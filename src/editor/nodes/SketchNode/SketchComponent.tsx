import { LexicalEditor, NodeKey } from 'lexical';
import { useEffect, useState } from 'react';
import { NonDeleted, ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import ImageComponent from '../ImageNode/ImageComponent';
import Virgil from "@excalidraw/excalidraw/dist/excalidraw-assets/Virgil.woff2";
import Cascadia from "@excalidraw/excalidraw/dist/excalidraw-assets/Cascadia.woff2";

export const encodeFonts = Promise.all([
  fetch(Virgil).then(res => res.arrayBuffer()).then(buffer => {
    new FontFace("Virgil", buffer).load().then(font => document.fonts.add(font));
    return arrayBufferToBase64Font(buffer)
  }),
  fetch(Cascadia).then(res => res.arrayBuffer()).then(async buffer => {
    new FontFace("Cascadia", buffer).load().then(font => document.fonts.add(font));
    return arrayBufferToBase64Font(buffer)
  })
]);

const arrayBufferToBase64Font = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return `data:font/woff2;base64,${btoa(binary)}`;
}

export default function SketchComponent({
  nodeKey, width, height, src, value, resizable, showCaption, caption
}: {
  width: 'inherit' | number;
  height: 'inherit' | number;
  src: string;
  nodeKey: NodeKey;
  resizable: boolean;
  value?: NonDeleted<ExcalidrawElement>[];
  showCaption: boolean;
  caption: LexicalEditor;
}): JSX.Element {

  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    async function embedFonts() {
      const [virgil, cascadia] = await encodeFonts;
      const fonts = `@font-face { font-family: 'Virgil'; src: url('${virgil}') format('woff2');} @font-face { font-family: 'Cascadia'; src: url('${cascadia}') format('woff2'); }`;
      const encoded = src.substring(src.indexOf(',') + 1);
      const decoded = decodeURIComponent(encoded);
      const serialized = decoded.replace(/<style.*?>[\s\S]*<\/style>/, `<style class="style-fonts">${fonts}</style>`);

      setSource(`data:image/svg+xml,${encodeURIComponent(serialized)}`);
    };
    embedFonts();
  }, [src]);

  return (
    <ImageComponent nodeKey={nodeKey} width={width} height={height} src={source || src} altText="" resizable={resizable} showCaption={showCaption} caption={caption} />
  );
}
