import { C as CustomElement, c as customElement } from "./index-BIKkFTAO.js";
import { p as patchNotesJson } from "./patch-notes-D-E4OysA.js";
const name = "wiki-patch-note-detail";
const template = '<template>\n    <wiki-content if.bind="page"\n                  title.bind="page.title"\n                  content.bind="page.content">\n    </wiki-content>\n    <div if.bind="!page" class="container mx-auto mt-5 max-w-5xl p-5 text-center">\n        <p class="text-lg base-text">Patch notes not found.</p>\n        <a href="/patch-notes" class="link-text underline">Back to Patch Notes</a>\n    </div>\n</template>\n';
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
var _WikiPatchNoteDetail_decorators, _init;
_WikiPatchNoteDetail_decorators = [customElement(__au2ViewDef)];
class WikiPatchNoteDetail {
  page = null;
  loading(params) {
    const slug = params.version;
    this.page = patchNotesJson.notes.find((n) => n.slug === slug) || null;
  }
}
_init = __decoratorStart();
WikiPatchNoteDetail = __decorateElement(_init, 0, "WikiPatchNoteDetail", _WikiPatchNoteDetail_decorators, WikiPatchNoteDetail);
__runInitializers(_init, 1, WikiPatchNoteDetail);
export {
  WikiPatchNoteDetail
};
