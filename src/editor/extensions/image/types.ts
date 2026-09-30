export type ImageFloat = "left" | "right" | "none";
export type ImageFilter = "auto" | "none";

export type ImagePayload = {
  src: string;
  width: number;
  height: number;
  altText?: string;
  float?: ImageFloat;
  filter?: ImageFilter;
  id?: string;
  showCaption?: boolean;
};
