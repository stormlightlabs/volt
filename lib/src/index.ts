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
export { getScopeMetadata } from "$core/scope-metadata";
export { computed, effect, signal } from "$core/signal";
export { deserializeScope, hydrate, isHydrated, isServerRendered, serializeScope } from "$core/ssr";
export { getStore, registerStore } from "$core/store";
export { persistPlugin, registerStorageAdapter } from "$plugins/persist";
export { scrollPlugin } from "$plugins/scroll";
export { urlPlugin } from "$plugins/url";
export type {
  ArcFunction,
  AsyncEffectFunction,
  AsyncEffectOptions,
  ChargedRoot,
  ChargeResult,
  ComputedSignal,
  GlobalHookName,
  GlobalStore,
  HydrateOptions,
  HydrateResult,
  IsReactive,
  ParsedHttpConfig,
  PinRegistry,
  PluginContext,
  PluginHandler,
  ProbeFunction,
  PulseFunction,
  ReactiveArray,
  RetryConfig,
  ScopeMetadata,
  SerializedScope,
  Signal,
  UidFunction,
  UnwrapReactive,
} from "$types/volt";
