/**
 * VoltX.js - A lightweight reactive framework for declarative UIs
 *
 * @packageDocumentation
 */

export { asyncEffect } from "$core/async-effect";
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
export { isReactive, reactive, toRaw } from "$core/reactive";
export { computed, effect, signal } from "$core/signal";
export { deserializeScope, hydrate, isHydrated, isServerRendered, serializeScope } from "$core/ssr";
export { persistPlugin, registerStorageAdapter } from "$plugins/persist";
export { scrollPlugin } from "$plugins/scroll";
export { urlPlugin } from "$plugins/url";
export type {
  AsyncEffectFunction,
  AsyncEffectOptions,
  ChargedRoot,
  ChargeResult,
  ComputedSignal,
  GlobalHookName,
  HydrateOptions,
  HydrateResult,
  IsReactive,
  ParsedHttpConfig,
  PluginContext,
  PluginHandler,
  ReactiveArray,
  RetryConfig,
  SerializedScope,
  Signal,
  UnwrapReactive,
} from "$types/volt";
