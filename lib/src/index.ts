/**
 * Volt.js - A lightweight reactive framework for declarative UIs
 *
 * @packageDocumentation
 */

export type {
  AsyncEffectFunction,
  AsyncEffectOptions,
  ChargedRoot,
  ChargeResult,
  ComputedSignal,
  GlobalHookName,
  PluginContext,
  PluginHandler,
  Signal,
} from "$types/volt";
export { asyncEffect } from "@volt/core/asyncEffect";
export { mount } from "@volt/core/binder";
export { charge } from "@volt/core/charge";
export {
  clearAllGlobalHooks,
  clearGlobalHooks,
  getElementBindings,
  isElementMounted,
  registerElementHook,
  registerGlobalHook,
  unregisterGlobalHook,
} from "@volt/core/lifecycle";
export { clearPlugins, getRegisteredPlugins, hasPlugin, registerPlugin, unregisterPlugin } from "@volt/core/plugin";
export { computed, effect, signal } from "@volt/core/signal";
export { persistPlugin, registerStorageAdapter, scrollPlugin, urlPlugin } from "@volt/plugins/index";
