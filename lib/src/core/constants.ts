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

/**
 * Dangerous globals that should be blocked from expressions
 *
 * NOTE: The scope proxy's has trap returns true for ALL properties to prevent the 'with' statement from falling back to outer scope, giving us complete control
 */
export const DANGEROUS_GLOBALS = [
  "window",
  "self",
  "global",
  "globalThis",
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
