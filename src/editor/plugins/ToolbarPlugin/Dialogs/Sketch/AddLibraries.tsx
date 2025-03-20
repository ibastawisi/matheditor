import { useHandleLibrary } from "@excalidraw/excalidraw";
import { ImportedDataState } from "@excalidraw/excalidraw/data/types";
import { ExcalidrawImperativeAPI, LibraryItems_anyVersion } from "@excalidraw/excalidraw/types";

export const getLibraryItemsFromStorage = () => {
  try {
    const libraryItems: ImportedDataState["libraryItems"] = JSON.parse(
      localStorage.getItem("excalidraw-library") as string,
    );

    return libraryItems || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const AddLibraries = ({ excalidrawAPI }: { excalidrawAPI: ExcalidrawImperativeAPI }) => {
  const getLibraryItems = async () => {
    const items = getLibraryItemsFromStorage();
    if (items.length) return items;
    const LogicGates = await import("./libs/logic.json");
    const CircuitComponents = await import("./libs/circuits.json");
    const libraryItems = [...LogicGates.library, ...CircuitComponents.libraryItems] as any as LibraryItems_anyVersion;
    return libraryItems;
  }
  useHandleLibrary({ excalidrawAPI, getInitialLibraryItems: getLibraryItems });
  return null;
};

export default AddLibraries;