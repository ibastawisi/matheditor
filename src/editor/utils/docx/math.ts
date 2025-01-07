import { MathNode } from "@/editor/nodes/MathNode";
import { Math, MathComponent, MathRun, MathFraction, MathSubScript, MathSuperScript, MathSubSuperScript, MathRadical, MathLimitUpper, MathLimitLower, MathSum, MathIntegral, BookmarkEnd, BookmarkStart, bookmarkUniqueNumericIdGen } from "docx";
import { convertLatexToMathMl } from "mathlive";
import { mml2omml } from "mathml2omml";
import { DOMParser } from "linkedom";

export function $convertMathNode(node: MathNode) {
  const value = node.getValue();
  const mathml = convertLatexToMathMl(value);
  const ommlString = mml2omml(`<math xmlns="http://www.w3.org/1998/Math/MathML">${mathml}</math>`);
  const parser = new DOMParser();
  const doc = parser.parseFromString(ommlString, 'text/xml');
  const mathElement = doc.getElementsByTagName('m:oMath')[0];
  const children = convertChildren(mathElement.children);
  const mathRun = new Math({ children });
  const id = node.getId();
  if (!id) return mathRun;
  const linkId = bookmarkUniqueNumericIdGen()();
  return [new BookmarkStart(id, linkId), mathRun, new BookmarkEnd(linkId)];
}

function convertChildren(children: HTMLCollection): MathComponent[] {
  const items = [...children].map(item => {
    return convertItem(item)
  });

  const components = items.filter(item => !!item) as MathComponent[];
  return components;
}

function convertItem(item: Element) {
  const tagName = item.tagName.toLowerCase();

  if (tagName === 'm:f') {
    return buildFraction(item);
  }

  if (tagName === 'm:r') {
    return buildMathRun(item);
  }

  if (tagName === 'm:ssub') {
    return buildSubScript(item);
  }

  if (tagName === 'm:ssup') {
    return buildSuperScript(item);
  }

  if (tagName === 'm:ssubsup') {
    return buildSubSuperScript(item);
  }

  if (tagName === 'm:rad') {
    return buildRadical(item);
  }

  if (tagName === 'm:limupp') {
    return buildLimitUpp(item);
  }

  if (tagName === 'm:limlow') {
    return buildLimitLow(item);
  }

  if (tagName === 'm:nary') {
    return buildNary(item);
  }

  return new MathRun('口');
}

function buildFraction(item: Element) {
  const numerator = item.getElementsByTagName('m:num')[0];
  const denominator = item.getElementsByTagName('m:den')[0];

  return new MathFraction({
    numerator: convertChildren(numerator.children),
    denominator: convertChildren(denominator.children),
  });
}

function buildMathRun(item: Element) {
  const text = item.getElementsByTagName('m:t')[0];
  return new MathRun(text.textContent || '');
}

function buildSubScript(item: Element) {
  const e = item.getElementsByTagName('m:e')[0];
  const sub = item.getElementsByTagName('m:sub')[0];

  return new MathSubScript({
    children: convertChildren(e.children),
    subScript: convertChildren(sub.children),
  });
}

function buildSuperScript(item: Element) {
  const e = item.getElementsByTagName('m:e')[0];
  const sup = item.getElementsByTagName('m:sup')[0];

  return new MathSuperScript({
    children: convertChildren(e.children),
    superScript: convertChildren(sup.children),
  });
}

function buildSubSuperScript(item: Element) {
  const e = item.getElementsByTagName('m:e')[0];
  const sub = item.getElementsByTagName('m:sub')[0];
  const sup = item.getElementsByTagName('m:sup')[0];

  return new MathSubSuperScript({
    children: convertChildren(e.children),
    superScript: convertChildren(sup.children),
    subScript: convertChildren(sub.children),
  });
}

function buildRadical(item: Element): MathComponent {
  const e = item.getElementsByTagName('m:e')[0];
  const deg = item.getElementsByTagName('m:deg')[0];
  const degree = deg.children[0] ? convertItem(deg.children[0]) : undefined;

  return new MathRadical({
    children: convertChildren(e.children),
    degree: degree ? [degree] : undefined,
  });
}

function buildLimitUpp(item: Element): MathComponent {
  const e = item.getElementsByTagName('m:e')[0];
  const lim = item.getElementsByTagName('m:lim')[0];

  return new MathLimitUpper({
    children: convertChildren(e.children),
    limit: convertChildren(lim.children),
  });
}

function buildLimitLow(item: Element): MathComponent {
  const e = item.getElementsByTagName('m:e')[0];
  const lim = item.getElementsByTagName('m:lim')[0];

  return new MathLimitLower({
    children: convertChildren(e.children),
    limit: convertChildren(lim.children),
  });
}

function buildNary(item: Element) {
  const char = item.getElementsByTagName('m:chr')[0];
  const charVal = char.getAttribute('m:val');

  const e = item.getElementsByTagName('m:e')[0];
  const sub = item.getElementsByTagName('m:sub')[0];
  const sup = item.getElementsByTagName('m:sup')[0];

  if (charVal === '∑') {
    return new MathSum({
      children: convertChildren(e.children),
      superScript: convertChildren(sup.children),
      subScript: convertChildren(sub.children),
    });
  }

  if (charVal === '∫') {
    return new MathIntegral({
      children: convertChildren(e.children),
      superScript: convertChildren(sup.children),
      subScript: convertChildren(sub.children),
    });
  }
}