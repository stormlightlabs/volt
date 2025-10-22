/**
 * Route utilities for pattern matching and parameter extraction
 *
 * Provides utilities for dynamic route matching with support for:
 * - Named parameters: /blog/:slug
 * - Wildcard parameters: /files/*path
 * - Optional parameters: /blog/:slug?
 * - Multiple parameters: /users/:userId/posts/:postId
 */

import type { Optional } from "$types/helpers";

/**
 * Route match result containing extracted parameters
 */
export type RouteMatch = { path: string; params: Record<string, string>; pattern: string };

/**
 * Compiled route pattern for efficient matching
 */
type CompiledRoute = {
  pattern: string;
  regex: RegExp;
  keys: Array<{ name: string; optional: boolean; wildcard: boolean }>;
};

const routeCache = new Map<string, CompiledRoute>();

/**
 * Compile a route pattern into a regex for efficient matching
 *
 * Supported patterns:
 * - /blog/:slug - Named parameter
 * - /blog/:slug? - Optional parameter
 * - /files/*path - Wildcard (matches rest of path)
 * - /users/:userId/posts/:postId - Multiple parameters
 *
 * @param pattern - Route pattern to compile
 * @returns Compiled route with regex and parameter keys
 *
 * @example
 * ```typescript
 * const route = compileRoute('/blog/:slug');
 * const match = route.regex.exec('/blog/hello-world');
 * // match[1] === 'hello-world'
 * ```
 */
export function compileRoute(pattern: string): CompiledRoute {
  if (routeCache.has(pattern)) {
    return routeCache.get(pattern)!;
  }

  const keys: Array<{ name: string; optional: boolean; wildcard: boolean }> = [];

  // Build regex pattern by processing each part
  let regexPattern = "";
  let i = 0;

  while (i < pattern.length) {
    // Check for parameter :name or :name?
    if (pattern[i] === ":") {
      const paramMatch = pattern.slice(i).match(/^:(\w+)(\?)?/);
      if (paramMatch) {
        const [fullMatch, name, optional] = paramMatch;
        keys.push({ name, optional: Boolean(optional), wildcard: false });

        if (optional) {
          // For optional params, include the preceding / in the optional group
          // Remove trailing / from regexPattern if present
          if (regexPattern.endsWith("/")) {
            regexPattern = regexPattern.slice(0, -1);
          }
          regexPattern += "(?:/([^/?]+))?";
        } else {
          // Required params: just the capture group (/ already processed)
          regexPattern += "([^/?]+)";
        }

        i += fullMatch.length;
        continue;
      }
    }

    // Check for wildcard *name
    if (pattern[i] === "*") {
      const wildcardMatch = pattern.slice(i).match(/^\*(\w+)/);
      if (wildcardMatch) {
        const [fullMatch, name] = wildcardMatch;
        keys.push({ name, optional: false, wildcard: true });
        regexPattern += "(.*)";
        i += fullMatch.length;
        continue;
      }
    }

    // Escape special regex characters for literal matching
    const char = pattern[i];
    if (".+?^${}()|[]\\".includes(char)) {
      regexPattern += `\\${char}`;
    } else {
      regexPattern += char;
    }
    i++;
  }

  // Create regex with anchors
  const regex = new RegExp(`^${regexPattern}$`);

  const compiled: CompiledRoute = { pattern, regex, keys };
  routeCache.set(pattern, compiled);

  return compiled;
}

/**
 * Match a path against a route pattern and extract parameters
 *
 * @param pattern - Route pattern (e.g., '/blog/:slug')
 * @param path - Path to match (e.g., '/blog/hello-world')
 * @returns RouteMatch with extracted params, or undefined if no match
 *
 * @example
 * ```typescript
 * const match = matchRoute('/blog/:slug', '/blog/hello-world');
 * // { path: '/blog/hello-world', params: { slug: 'hello-world' }, pattern: '/blog/:slug' }
 *
 * const noMatch = matchRoute('/blog/:slug', '/about');
 * // undefined
 * ```
 */
export function matchRoute(pattern: string, path: string): Optional<RouteMatch> {
  const compiled = compileRoute(pattern);
  const match = compiled.regex.exec(path);

  if (!match) {
    return undefined;
  }

  const params: Record<string, string> = {};

  for (const [index, key] of compiled.keys.entries()) {
    const value = match[index + 1];
    if (value !== undefined) {
      params[key.name] = decodeURIComponent(value);
    }
  }

  return { path, params, pattern };
}

/**
 * Match a path against multiple route patterns and return the first match
 *
 * @param patterns - Array of route patterns to try
 * @param path - Path to match
 * @returns First matching RouteMatch, or undefined if no match
 *
 * @example
 * ```typescript
 * const routes = ['/blog/:slug', '/users/:id', '/about'];
 * const match = matchRoutes(routes, '/users/123');
 * // { path: '/users/123', params: { id: '123' }, pattern: '/users/:id' }
 * ```
 */
export function matchRoutes(patterns: string[], path: string): Optional<RouteMatch> {
  for (const pattern of patterns) {
    const match = matchRoute(pattern, path);
    if (match) {
      return match;
    }
  }
  return undefined;
}

/**
 * Extract parameters from a path using a route pattern
 *
 * @param pattern - Route pattern with parameters
 * @param path - Path to extract from
 * @returns Object with extracted parameters, or empty object if no match
 *
 * @example
 * ```typescript
 * const params = extractParams('/blog/:slug', '/blog/hello-world');
 * // { slug: 'hello-world' }
 *
 * const params2 = extractParams('/users/:userId/posts/:postId', '/users/42/posts/123');
 * // { userId: '42', postId: '123' }
 * ```
 */
export function extractParams(pattern: string, path: string): Record<string, string> {
  const match = matchRoute(pattern, path);
  return match ? match.params : {};
}

/**
 * Build a path from a pattern by replacing parameters
 *
 * @param pattern - Route pattern with parameters
 * @param params - Parameters to insert
 * @returns Built path with parameters replaced
 *
 * @example
 * ```typescript
 * const path = buildPath('/blog/:slug', { slug: 'hello-world' });
 * // '/blog/hello-world'
 *
 * const path2 = buildPath('/users/:userId/posts/:postId', { userId: '42', postId: '123' });
 * // '/users/42/posts/123'
 * ```
 */
export function buildPath(pattern: string, params: Record<string, string>): string {
  let path = pattern;

  // Replace named parameters
  for (const [key, value] of Object.entries(params)) {
    const encoded = encodeURIComponent(value);
    path = path.replace(`:${key}?`, encoded).replace(`:${key}`, encoded);
  }

  // Remove optional parameters that weren't provided
  path = path.replaceAll(/:(\w+)\?/g, "");

  // Replace wildcards
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`*${key}`, value);
  }

  return path;
}

/**
 * Check if a path matches a route pattern
 *
 * @param pattern - Route pattern
 * @param path - Path to check
 * @returns true if path matches pattern
 *
 * @example
 * ```typescript
 * isMatch('/blog/:slug', '/blog/hello-world'); // true
 * isMatch('/blog/:slug', '/about'); // false
 * ```
 */
export function isMatch(pattern: string, path: string): boolean {
  return matchRoute(pattern, path) !== undefined;
}

/**
 * Normalize a path by removing trailing slashes and ensuring leading slash
 *
 * @param path - Path to normalize
 * @returns Normalized path
 *
 * @example
 * ```typescript
 * normalizePath('/blog/'); // '/blog'
 * normalizePath('about'); // '/about'
 * normalizePath('/'); // '/'
 * ```
 */
export function normalizePath(path: string): string {
  // Ensure leading slash
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  // Remove trailing slash (except for root)
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  return path;
}

/**
 * Parse a URL into path and search params
 *
 * @param url - URL to parse (can be relative or absolute)
 * @returns Object with path and searchParams
 *
 * @example
 * ```typescript
 * parseUrl('/blog?page=2&sort=date');
 * // { path: '/blog', searchParams: URLSearchParams { 'page' => '2', 'sort' => 'date' } }
 * ```
 */
export function parseUrl(url: string): { path: string; searchParams: URLSearchParams } {
  try {
    const urlObj = new URL(url, globalThis.location.origin);
    return { path: urlObj.pathname, searchParams: urlObj.searchParams };
  } catch {
    // If URL parsing fails, treat as relative path
    const [path, search] = url.split("?");
    return { path: path || "/", searchParams: new URLSearchParams(search || "") };
  }
}

/**
 * Clear the route compilation cache
 * Useful for testing or when patterns change dynamically
 */
export function clearRouteCache(): void {
  routeCache.clear();
}
