/**
 * Volt.js - A lightweight reactive framework for declarative UIs
 *
 * @packageDocumentation
 */

export type { ChargedRoot, ChargeResult, ComputedSignal, PluginContext, PluginHandler, Signal } from "$types/volt";
export { mount } from "@volt/core/binder";
export { charge } from "@volt/core/charge";
export { clearPlugins, getRegisteredPlugins, hasPlugin, registerPlugin, unregisterPlugin } from "@volt/core/plugin";
export { computed, effect, signal } from "@volt/core/signal";
export { persistPlugin, registerStorageAdapter, scrollPlugin, urlPlugin } from "@volt/plugins/index";
