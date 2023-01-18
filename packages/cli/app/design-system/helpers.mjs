// src/assert.ts
function isObject(value) {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

// src/condition.ts
var isBaseCondition = (v) => v === "base";
function filterBaseConditions(c) {
  return c.slice().filter((v) => !isBaseCondition(v));
}

// src/css-important.ts
function isImportant(value) {
  return typeof value === "string" ? /!(important)?$/.test(value) : false;
}
function withoutImportant(value) {
  return typeof value === "string" ? value.replace(/!(important)?$/, "").trim() : value;
}
function withoutSpace(str) {
  return typeof str === "string" ? str.replaceAll(" ", "_") : str;
}

// src/hash.ts
function toHash(str) {
  let value = 5381;
  let len = str.length;
  while (len--)
    value = value * 33 ^ str.charCodeAt(len);
  return (value >>> 0).toString(36);
}

// src/walk-object.ts
function walkObject(target, predicate, options = {}) {
  const { stop, getKey } = options;
  function inner(value, path = []) {
    if (isObject(value) || Array.isArray(value)) {
      const result = {};
      for (const [prop, child] of Object.entries(value)) {
        const key = getKey?.(prop) ?? prop;
        const childPath = [...path, key];
        if (stop?.(value, childPath)) {
          return predicate(value, path);
        }
        result[key] = inner(child, childPath);
      }
      return result;
    }
    return predicate(value, path);
  }
  return inner(target);
}
function mapObject(obj, fn) {
  if (!isObject(obj))
    return fn(obj);
  return walkObject(obj, (value) => fn(value));
}

// src/normalize-style-object.ts
function toResponsiveObject(values, breakpoints) {
  return values.reduce((acc, current, index) => {
    const key = breakpoints[index];
    if (current != null) {
      acc[key] = current;
    }
    return acc;
  }, {});
}
function normalizeStyleObject(styles, context) {
  const { utility, conditions } = context;
  const { hasShorthand, resolveShorthand } = utility;
  return walkObject(
    styles,
    (value) => {
      return Array.isArray(value) ? toResponsiveObject(value, conditions.breakpoints.keys) : value;
    },
    {
      stop: (value) => Array.isArray(value),
      getKey: (prop) => {
        return hasShorthand ? resolveShorthand(prop) : prop;
      }
    }
  );
}

// src/classname.ts
var fallbackCondition = {
  shift: (v) => v,
  finalize: (v) => v,
  breakpoints: { keys: [] }
};
var sanitize = (value) => typeof value === "string" ? value.replaceAll(/[\n\s]+/g, " ") : value;
function createCss(context) {
  const { utility, hash, conditions: conds = fallbackCondition } = context;
  return (styleObject = {}) => {
    const normalizedObject = normalizeStyleObject(styleObject, context);
    const classNames = /* @__PURE__ */ new Set();
    walkObject(normalizedObject, (value, paths) => {
      const important = isImportant(value);
      if (value == null)
        return;
      const [prop, ...allConditions] = conds.shift(paths);
      const conditions = filterBaseConditions(allConditions);
      const transformed = utility.transform(prop, withoutImportant(sanitize(value)));
      let transformedClassName = transformed.className;
      if (important) {
        transformedClassName = `${transformedClassName}!`;
      }
      const baseArray = [...conds.finalize(conditions), transformedClassName];
      const className = hash ? toHash(baseArray.join(":")) : baseArray.join(":");
      classNames.add(className);
    });
    return Array.from(classNames).join(" ");
  };
}

// src/compact.ts
function compact(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([_, value2]) => value2 !== void 0));
}

// src/merge.ts
function deepMerge(...sources) {
  const allSources = sources.filter(isObject);
  if (allSources.length === 1) {
    return allSources[0];
  }
  const result = {};
  for (const source of allSources) {
    for (const [key, value] of Object.entries(source)) {
      if (isObject(value)) {
        result[key] = deepMerge(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}
export {
  compact,
  createCss,
  deepMerge,
  filterBaseConditions,
  isBaseCondition,
  isObject,
  mapObject,
  toHash,
  walkObject,
  withoutSpace
};
