import { ServicesExtension } from "@/editor/extensions/services";
import { useExtensionSignalValue } from "@lexical/react/useExtensionSignalValue";

export const useServices = () => {
  return useExtensionSignalValue(ServicesExtension, "services");
};
