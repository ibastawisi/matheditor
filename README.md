# Math Editor

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/IBastawisi/math-editor/blob/master/LICENSE)
[![demo](https://img.shields.io/badge/live-demo-blue)](https://matheditor.ml/playground)

A rich text editor for scientific content, with Markdown helpers, Mathlive, Geogebra and Excalidraw Extensions.
The project aims to make writing publication-quality documents easy and accessible.

## Features

- Rich Text: Text formatting, Copy + Paste Preformatted text, Code syntax highlighting, Insert Images, Tables and Sticky notes.
- Math: Integrates with [Mathlive](https://cortexjs.io/mathlive) for writing LaTeX with a Virtual Keyboard.
- Graph: Integrates with [Geogebra](https://www.geogebra.org) for graphing functions and shapes.
- Sketch: Integrates with [Excalidraw](https://excalidraw.com/) for hand-drawn like sketches.
- Live collaboration: Authors, coauthors and collaborators edit cloud documents together in real time, with each other's cursors, powered by [Yjs](https://yjs.dev).

## Getting Started

```
git clone https://github.com/IBastawisi/matheditor.git
cd matheditor
pnpm install
pnpm dev
```

`pnpm dev` starts Postgres and the other services with Docker Compose, including the live editing server in `collab/`. Copy `.env.example` to `.env`; `COLLAB_URL` and `COLLAB_SECRET` there must match the `collab` service. Without them, documents are edited on each device only.