"use client"
import { createElement } from "react";
import { ReactExtension } from "@lexical/react/ReactExtension";
import { configExtension, defineExtension } from "lexical";
import { ComponentPickerMenu } from "./menu";

export const ComponentPickerExtension = defineExtension({
  name: "component-picker",
  dependencies: [
    configExtension(ReactExtension, {
      decorators: [createElement(ComponentPickerMenu)],
    }),
  ],
});
