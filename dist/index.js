var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/flat/index.js
var require_flat = __commonJS({
  "node_modules/flat/index.js"(exports, module) {
    module.exports = flatten2;
    flatten2.flatten = flatten2;
    flatten2.unflatten = unflatten;
    function isBuffer(obj) {
      return obj && obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
    }
    function keyIdentity(key) {
      return key;
    }
    function flatten2(target, opts) {
      opts = opts || {};
      const delimiter = opts.delimiter || ".";
      const maxDepth = opts.maxDepth;
      const transformKey = opts.transformKey || keyIdentity;
      const output = {};
      function step(object, prev, currentDepth) {
        currentDepth = currentDepth || 1;
        Object.keys(object).forEach(function(key) {
          const value = object[key];
          const isarray = opts.safe && Array.isArray(value);
          const type = Object.prototype.toString.call(value);
          const isbuffer = isBuffer(value);
          const isobject = type === "[object Object]" || type === "[object Array]";
          const newKey = prev ? prev + delimiter + transformKey(key) : transformKey(key);
          if (!isarray && !isbuffer && isobject && Object.keys(value).length && (!opts.maxDepth || currentDepth < maxDepth)) {
            return step(value, newKey, currentDepth + 1);
          }
          output[newKey] = value;
        });
      }
      step(target);
      return output;
    }
    function unflatten(target, opts) {
      opts = opts || {};
      const delimiter = opts.delimiter || ".";
      const overwrite = opts.overwrite || false;
      const transformKey = opts.transformKey || keyIdentity;
      const result = {};
      const isbuffer = isBuffer(target);
      if (isbuffer || Object.prototype.toString.call(target) !== "[object Object]") {
        return target;
      }
      function getkey(key) {
        const parsedKey = Number(key);
        return isNaN(parsedKey) || key.indexOf(".") !== -1 || opts.object ? key : parsedKey;
      }
      function addKeys(keyPrefix, recipient, target2) {
        return Object.keys(target2).reduce(function(result2, key) {
          result2[keyPrefix + delimiter + key] = target2[key];
          return result2;
        }, recipient);
      }
      function isEmpty(val) {
        const type = Object.prototype.toString.call(val);
        const isArray = type === "[object Array]";
        const isObject = type === "[object Object]";
        if (!val) {
          return true;
        } else if (isArray) {
          return !val.length;
        } else if (isObject) {
          return !Object.keys(val).length;
        }
      }
      target = Object.keys(target).reduce(function(result2, key) {
        const type = Object.prototype.toString.call(target[key]);
        const isObject = type === "[object Object]" || type === "[object Array]";
        if (!isObject || isEmpty(target[key])) {
          result2[key] = target[key];
          return result2;
        } else {
          return addKeys(
            key,
            result2,
            flatten2(target[key], opts)
          );
        }
      }, {});
      Object.keys(target).forEach(function(key) {
        const split = key.split(delimiter).map(transformKey);
        let key1 = getkey(split.shift());
        let key2 = getkey(split[0]);
        let recipient = result;
        while (key2 !== void 0) {
          if (key1 === "__proto__") {
            return;
          }
          const type = Object.prototype.toString.call(recipient[key1]);
          const isobject = type === "[object Object]" || type === "[object Array]";
          if (!overwrite && !isobject && typeof recipient[key1] !== "undefined") {
            return;
          }
          if (overwrite && !isobject || !overwrite && recipient[key1] == null) {
            recipient[key1] = typeof key2 === "number" && !opts.object ? [] : {};
          }
          recipient = recipient[key1];
          if (split.length > 0) {
            key1 = getkey(split.shift());
            key2 = getkey(split[0]);
          }
        }
        recipient[key1] = unflatten(target[key], opts);
      });
      return result;
    }
  }
});

// node_modules/just-safe-set/index.mjs
var objectSafeSet = set;
function set(obj, propsArg, value) {
  var props, lastProp;
  if (Array.isArray(propsArg)) {
    props = propsArg.slice(0);
  }
  if (typeof propsArg == "string") {
    props = propsArg.split(".");
  }
  if (typeof propsArg == "symbol") {
    props = [propsArg];
  }
  if (!Array.isArray(props)) {
    throw new Error("props arg must be an array, a string or a symbol");
  }
  lastProp = props.pop();
  if (!lastProp) {
    return false;
  }
  prototypeCheck(lastProp);
  var thisProp;
  while (thisProp = props.shift()) {
    prototypeCheck(thisProp);
    if (typeof obj[thisProp] == "undefined") {
      obj[thisProp] = {};
    }
    obj = obj[thisProp];
    if (!obj || typeof obj != "object") {
      return false;
    }
  }
  obj[lastProp] = value;
  return true;
}
function prototypeCheck(prop) {
  if (prop == "__proto__" || prop == "constructor" || prop == "prototype") {
    throw new Error("setting of prototype values not supported");
  }
}

// src/index.ts
var import_flat = __toESM(require_flat(), 1);
async function getLanguages(args) {
  const [pathBeforeLanguage, pathAfterLanguage] = args.pluginConfig.pathPattern.split("{language}");
  const pathAfterLanguageIsDirectory = pathAfterLanguage.startsWith("/");
  const paths = await args.$fs.readdir(pathBeforeLanguage);
  const languages = [];
  for (const language of paths) {
    if (typeof language === "string" && language.endsWith(".json")) {
      languages.push(language.replace(".json", ""));
    }
  }
  return languages;
}
async function readResources(args) {
  const result = [];
  for (const language of args.config.languages) {
    const resourcePath = args.pluginConfig.pathPattern.replace(
      "{language}",
      language
    );
    const json = JSON.parse(await args.$fs.readFile(resourcePath, "utf-8"));
    const flatJson = (0, import_flat.default)(json);
    result.push(parseResource(flatJson, language));
  }
  return result;
}
async function writeResources(args) {
  for (const resource of args.resources) {
    const resourcePath = args.pluginConfig.pathPattern.replace(
      "{language}",
      resource.languageTag.name
    );
    await args.$fs.writeFile(resourcePath, serializeResource(resource));
  }
}
function parseResource(flatJson, language) {
  return {
    type: "Resource",
    languageTag: {
      type: "LanguageTag",
      name: language
    },
    body: Object.entries(flatJson).map(
      ([id, value]) => parseMessage(id, value)
    )
  };
}
function parseMessage(id, value) {
  return {
    type: "Message",
    id: {
      type: "Identifier",
      name: id
    },
    pattern: { type: "Pattern", elements: [{ type: "Text", value }] }
  };
}
function serializeResource(resource) {
  const obj = {};
  resource.body.forEach((message) => {
    const [key, value] = serializeMessage(message);
    objectSafeSet(obj, key, value);
  });
  return JSON.stringify(obj, null, 2);
}
function serializeMessage(message) {
  return [message.id.name, message.pattern.elements[0].value];
}
export {
  getLanguages,
  readResources,
  writeResources
};
