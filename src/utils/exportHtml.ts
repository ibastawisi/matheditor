"use client"
import { EditorDocument } from "@/types";
import theme from '@/editor/theme.css?inline';
import stickyStyles from '@/editor/nodes/StickyNode/StickyNode.css?inline';
import { generateHtml } from "@/editor/utils/generateHtml";

export const exportHtml = async (document: EditorDocument) => {
  const body = await generateHtml(document.data);
  const head = `
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="title" content="${document.name}" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
      <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
      <style>
        html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;box-sizing:border-box;-webkit-text-size-adjust:100%;}
        *,*::before,*::after{box-sizing:inherit;}
        body{font-family:"Roboto","Helvetica","Arial",sans-serif;font-weight:400;font-size:1rem;line-height:1.5;letter-spacing:0.00938em;max-width:1200px;margin:2rem auto;padding:0 1.5rem;white-space:pre-wrap;word-break:break-word;}
        img,svg{max-width:100%;background-color:white;}
        .ML__mathlive{padding:4px;}
        @font-face{font-family:Virgil;src:url(https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw-assets/Virgil.woff2);}
        @font-face{font-family:Cascadia;src:url(https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw-assets/Cascadia.woff2);}
        ${theme}${stickyStyles}
      </style>
    </head>
    `;
  return `<html>${head}<body>${body}</body></html>`;
};

export default exportHtml;