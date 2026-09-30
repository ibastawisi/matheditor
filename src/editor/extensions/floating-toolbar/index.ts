"use client"
import { createElement } from "react";
import { ReactExtension } from "@lexical/react/ReactExtension";
import { configExtension, defineExtension } from "lexical";
import { FloatingToolbar } from "./toolbar";

export const FloatingToolbarExtension = defineExtension({
  name: "floating-toolbar",
  dependencies: [
    configExtension(ReactExtension, {
      decorators: [createElement(FloatingToolbar)],
    }),
  ],
});
