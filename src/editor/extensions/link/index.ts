import { configExtension, defineExtension } from "@lexical/extension";
import {
  AutoLinkExtension,
  createLinkMatcherWithRegExp,
  LinkExtension as LexicalLinkExtension,
} from "@lexical/link";

const isLookbehindSupported = (() => {
  try {
    new RegExp("(?<=x)");
    return true;
  } catch {
    return false;
  }
})();

const URL_REGEX = isLookbehindSupported
  ? /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/
  : /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

export const MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text.startsWith("http") ? text : `https://${text}`;
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`;
  }),
];

export const LinkExtension = defineExtension({
  name: "link",
  dependencies: [
    LexicalLinkExtension,
    configExtension(AutoLinkExtension, { matchers: MATCHERS }),
  ],
});
