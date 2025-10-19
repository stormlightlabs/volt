/**
 * Plugin system for extending Volt.js with custom bindings
 */

import type { Optional } from "$types/helpers";
import type { PluginHandler } from "$types/volt";

const pluginRegistry = new Map<string, PluginHandler>();

/**
 * Register a custom plugin with a given name.
 * Plugins extend Volt.js with custom data-volt-* attribute bindings.
 *
 * @param name - Plugin name (will be used as data-volt-{name})
 * @param handler - Plugin handler function
 *
 * @example
 * registerPlugin('tooltip', (context, value) => {
 *   const tooltip = document.createElement('div');
 *   tooltip.className = 'tooltip';
 *   tooltip.textContent = value;
 *   context.element.addEventListener('mouseenter', () => {
 *     document.body.appendChild(tooltip);
 *   });
 *   context.element.addEventListener('mouseleave', () => {
 *     tooltip.remove();
 *   });
 *   context.addCleanup(() => tooltip.remove());
 * });
 */
export function registerPlugin(name: string, handler: PluginHandler): void {
  if (pluginRegistry.has(name)) {
    console.warn(`Plugin "${name}" is already registered. Overwriting.`);
  }
  pluginRegistry.set(name, handler);
}

/**
 * Get a plugin handler by name.
 *
 * @param name - Plugin name
 * @returns Plugin handler function or undefined
 */
export function getPlugin(name: string): Optional<PluginHandler> {
  return pluginRegistry.get(name);
}

/**
 * Check if a plugin is registered.
 *
 * @param name - Plugin name
 * @returns true if the plugin is registered
 */
export function hasPlugin(name: string): boolean {
  return pluginRegistry.has(name);
}

/**
 * Unregister a plugin by name.
 *
 * @param name - Plugin name
 * @returns true if the plugin was unregistered, false if it wasn't registered
 */
export function unregisterPlugin(name: string): boolean {
  return pluginRegistry.delete(name);
}

/**
 * Get all registered plugin names.
 *
 * @returns Array of registered plugin names
 */
export function getRegisteredPlugins(): string[] {
  return [...pluginRegistry.keys()];
}

/**
 * Clear all registered plugins.
 */
export function clearPlugins(): void {
  pluginRegistry.clear();
}
