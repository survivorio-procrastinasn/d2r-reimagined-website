import { C as CustomElement, c as customElement } from "./index-BIKkFTAO.js";
import { b as buildsJson } from "./builds-DhJhovkS.js";
const name = "wiki-builds";
const template = '<template>\n    <div class="container mx-auto mt-5 max-w-5xl p-5">\n        <h1 class="text-2xl unique-text text-center mb-6">Community Builds</h1>\n        <div repeat.for="cls of classes" class="mb-6">\n            <h2 class="text-xl unique-text mb-3">${cls.label}</h2>\n            <div if.bind="cls.builds.length === 0" class="base-text ml-4">No builds yet.</div>\n            <ul if.bind="cls.builds.length > 0" class="list-disc list-inside ml-4">\n                <li repeat.for="build of cls.builds" class="mb-1">\n                    <a href="/builds/${cls.slug}/${build.slug}" class="link-text text-lg">\n                        ${build.title || build.slug}\n                    </a>\n                </li>\n            </ul>\n        </div>\n    </div>\n</template>\n';
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
var _WikiBuilds_decorators, _init;
const classOrder = ["amazon", "assassin", "barbarian", "druid", "necromancer", "paladin", "sorceress"];
_WikiBuilds_decorators = [customElement(__au2ViewDef)];
class WikiBuilds {
  classes = classOrder.map((cls) => ({
    slug: cls,
    label: cls.charAt(0).toUpperCase() + cls.slice(1),
    builds: buildsJson[cls]?.builds || []
  }));
}
_init = __decoratorStart();
WikiBuilds = __decorateElement(_init, 0, "WikiBuilds", _WikiBuilds_decorators, WikiBuilds);
__runInitializers(_init, 1, WikiBuilds);
export {
  WikiBuilds
};
