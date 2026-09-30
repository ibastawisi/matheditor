import { createState } from "lexical";

export const imageSrcState = createState("src", {
  parse: (v) => (typeof v === "string" ? v : ""),
});

export const imageAltTextState = createState("altText", {
  parse: (v) => (typeof v === "string" ? v : "Image"),
});

const parseDimension = (v: unknown) => {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
};

export const imageWidthState = createState("width", {
  parse: parseDimension,
});

export const imageHeightState = createState("height", {
  parse: parseDimension,
});

/** `left` | `right` | `none` */
export const imageFloatState = createState("float", {
  parse: (v): "left" | "right" | "none" => (v === "left" || v === "right" ? v : "none"),
});

/** Dark-mode filter: `auto` applies the theme's darkModeFilter class, `none` disables it */
export const imageFilterState = createState("filter", {
  parse: (v): "auto" | "none" => (v === "auto" ? "auto" : "none"),
});

export const imageShowCaptionState = createState("showCaption", {
  parse: (v) => (typeof v === "boolean" ? v : v === "true"),
});
