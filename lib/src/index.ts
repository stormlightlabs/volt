/**
 * Volt.js - A lightweight reactive framework for declarative UIs
 *
 * @packageDocumentation
 */

export { asyncEffect } from "$core/asyncEffect";
export { mount } from "$core/binder";
export { charge } from "$core/charge";
export { parseHttpConfig, request, serializeForm, serializeFormToJSON, swap } from "$core/http";
export {
  clearAllGlobalHooks,
  clearGlobalHooks,
  getElementBindings,
  isElementMounted,
  registerElementHook,
  registerGlobalHook,
  unregisterGlobalHook,
} from "$core/lifecycle";
export { clearPlugins, getRegisteredPlugins, hasPlugin, registerPlugin, unregisterPlugin } from "$core/plugin";
export { computed, effect, signal } from "$core/signal";
export { deserializeScope, hydrate, isHydrated, isServerRendered, serializeScope } from "$core/ssr";
export { persistPlugin, registerStorageAdapter, scrollPlugin, urlPlugin } from "$plugins";
export type {
  AsyncEffectFunction,
  AsyncEffectOptions,
  ChargedRoot,
  ChargeResult,
  ComputedSignal,
  GlobalHookName,
  HydrateOptions,
  HydrateResult,
  ParsedHttpConfig,
  PluginContext,
  PluginHandler,
  RetryConfig,
  SerializedScope,
  Signal,
} from "$types/volt";
