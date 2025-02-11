import { MathNode } from "@/editor/nodes/MathNode";
import { BookmarkEnd, BookmarkStart, bookmarkUniqueNumericIdGen, ImportedXmlComponent } from "docx";
import { convertLatexToMathMl } from "mathlive";
import { mml2omml } from "./mathml2omml";

export function $convertMathNode(node: MathNode) {
  try {
    const value = node.getValue();
    const mathml = convertLatexToMathMl(value);
    const ommlString: any = mml2omml(`<math xmlns="http://www.w3.org/1998/Math/MathML">${mathml}</math>`);
    const xmlComponent: any = ImportedXmlComponent.fromXmlString(ommlString);
    const mathRun = xmlComponent.root[0];
    const id = node.getId();
    if (!id) return mathRun;
    const linkId = bookmarkUniqueNumericIdGen()();
    return [new BookmarkStart(id, linkId), mathRun, new BookmarkEnd(linkId)];
  } catch (e) {
    return null;
  }
}