export const BOOLEAN_ATTRS = [
  "disabled",
  "checked",
  "selected",
  "readonly",
  "required",
  "multiple",
  "autofocus",
  "autoplay",
  "controls",
  "loop",
  "muted",
];

export const DANGEROUS_PROPERTIES = ["__proto__", "prototype", "constructor"];

export const DANGEROUS_GLOBALS = [
  "Function",
  "eval",
  "globalThis",
  "window",
  "global",
  "process",
  "require",
  "import",
  "module",
  "exports",
];

export const SAFE_GLOBALS = [
  "Array",
  "Object",
  "String",
  "Number",
  "Boolean",
  "Date",
  "Math",
  "JSON",
  "RegExp",
  "Map",
  "Set",
  "Promise",
];
