/**
 * Volt.js - A lightweight reactive framework for declarative UIs
 *
 * @packageDocumentation
 */

export { mount } from "./core/binder";
export { clearPlugins, getRegisteredPlugins, hasPlugin, registerPlugin, unregisterPlugin } from "./core/plugin";
export { computed, effect, signal } from "./core/signal";
export type { ComputedSignal, PluginContext, PluginHandler, Signal } from "./types/volt";
