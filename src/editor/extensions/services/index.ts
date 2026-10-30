import {
  defineExtension,
  getExtensionDependencyFromEditor,
  namedSignals,
} from "@lexical/extension";
import { defaultServices } from "./constants";
import { LexicalEditor } from "lexical";

const signedUrlMap = new Map<string, string | undefined>();

export const ServicesExtension = defineExtension({
  name: "services",
  config: {
    services: defaultServices,
  },
  build: (_editor, config) => {
    return {
      ...namedSignals(config),
      signedUrlMap,
    };
  },
});

export const getServicesFromEditor = (editor: LexicalEditor) => {
  return getExtensionDependencyFromEditor(editor, ServicesExtension).output.services.value;
};

export const getSignedUrlMapFromEditor = (editor?: LexicalEditor) => {
  if (!editor) return signedUrlMap;
  return getExtensionDependencyFromEditor(editor, ServicesExtension).output.signedUrlMap;
};
