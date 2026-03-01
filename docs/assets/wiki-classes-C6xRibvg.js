import { C as CustomElement, c as customElement } from "./index-BIKkFTAO.js";
const name = "wiki-classes";
const template = '<template>\n    <div class="container mx-auto mt-5 max-w-5xl p-5">\n        <h1 class="text-2xl unique-text text-center mb-6">Class Changes</h1>\n        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">\n            <a repeat.for="cls of classLinks"\n               href="/classes/${cls.slug}"\n               class="block text-center p-4 bg-gray-800 border border-gray-600 rounded-lg link-text text-lg hover:bg-gray-700">\n                ${cls.label}\n            </a>\n        </div>\n        <wiki-content if.bind="classChanges"\n                      title=""\n                      content.bind="classChanges.content">\n        </wiki-content>\n    </div>\n</template>\n';
const dependencies = [];
const bindables = {};
let _e;
function register(container) {
  if (!_e) {
    _e = CustomElement.define({ name, template, dependencies, bindables });
  }
  container.register(_e);
}
const __au2ViewDef = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bindables,
  default: template,
  dependencies,
  name,
  register,
  template
}, Symbol.toStringTag, { value: "Module" }));
const title = "Class Changes";
const content = '<p>These pages are a work in progress - you can always find class changes contained in past patch notes.</p>\n<p>&nbsp;</p>\n<p>THESE ARE NOT UPDATED FOR 3.0 YET</p>\n<h2>Classes</h2>\n<h6><a href="https://wiki.d2r-reimagined.com/en/Amazon">AMAZON</a></h6>\n<h6><a href="https://wiki.d2r-reimagined.com/en/Assassin">ASSASSIN</a></h6>\n<h6><a href="https://wiki.d2r-reimagined.com/en/Barbarian">BARBARIAN</a></h6>\n<h6><a href="https://wiki.d2r-reimagined.com/en/Druid">DRUID</a></h6>\n<h6><a href="https://wiki.d2r-reimagined.com/en/Necromancer">NECROMANCER</a></h6>\n<h6><a href="https://wiki.d2r-reimagined.com/en/Paladin">PALADIN</a></h6>\n<h6><a href="https://wiki.d2r-reimagined.com/en/Sorceress">SORCERESS</a></h6>\n';
const classChangesJson = {
  title,
  content
};
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name2, symbol) => (symbol = Symbol[name2]) ? symbol : Symbol.for("Symbol." + name2);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name2, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name: name2, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) fns[i].call(self);
  return value;
};
var __decorateElement = (array, flags, name2, decorators, target, extra) => {
  var it, done, ctx, k = flags & 7, p = false;
  var j = 0;
  var extraInitializers = array[j] || (array[j] = []);
  var desc = k && (target = target.prototype, k < 5 && (k > 3 || !p) && __getOwnPropDesc(target, name2));
  __name(target, name2);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name2, done = {}, array[3], extraInitializers);
    it = (0, decorators[i])(target, ctx), done._ = 1;
    __expectFn(it) && (target = it);
  }
  return __decoratorMetadata(array, target), desc && __defProp(target, name2, desc), p ? k ^ 4 ? extra : desc : target;
};
var _WikiClasses_decorators, _init;
const classLinks = [
  { slug: "amazon", label: "Amazon" },
  { slug: "assassin", label: "Assassin" },
  { slug: "barbarian", label: "Barbarian" },
  { slug: "druid", label: "Druid" },
  { slug: "necromancer", label: "Necromancer" },
  { slug: "paladin", label: "Paladin" },
  { slug: "sorceress", label: "Sorceress" }
];
_WikiClasses_decorators = [customElement(__au2ViewDef)];
class WikiClasses {
  classChanges = classChangesJson;
  classLinks = classLinks;
}
_init = __decoratorStart();
WikiClasses = __decorateElement(_init, 0, "WikiClasses", _WikiClasses_decorators, WikiClasses);
__runInitializers(_init, 1, WikiClasses);
export {
  WikiClasses
};
