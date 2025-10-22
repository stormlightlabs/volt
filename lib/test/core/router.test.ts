import {
  buildPath,
  clearRouteCache,
  compileRoute,
  extractParams,
  isMatch,
  matchRoute,
  matchRoutes,
  normalizePath,
  parseUrl,
} from "$core/router";
import { beforeEach, describe, expect, it } from "vitest";

describe("router utilities", () => {
  beforeEach(() => {
    clearRouteCache();
  });

  describe("compileRoute", () => {
    it("compiles a simple pattern with single parameter", () => {
      const compiled = compileRoute("/blog/:slug");
      expect(compiled.pattern).toBe("/blog/:slug");
      expect(compiled.keys).toHaveLength(1);
      expect(compiled.keys[0]).toEqual({ name: "slug", optional: false, wildcard: false });
    });

    it("compiles a pattern with multiple parameters", () => {
      const compiled = compileRoute("/users/:userId/posts/:postId");
      expect(compiled.keys).toHaveLength(2);
      expect(compiled.keys[0]).toEqual({ name: "userId", optional: false, wildcard: false });
      expect(compiled.keys[1]).toEqual({ name: "postId", optional: false, wildcard: false });
    });

    it("compiles a pattern with optional parameter", () => {
      const compiled = compileRoute("/blog/:slug?");
      expect(compiled.keys).toHaveLength(1);
      expect(compiled.keys[0]).toEqual({ name: "slug", optional: true, wildcard: false });
    });

    it("compiles a pattern with wildcard parameter", () => {
      const compiled = compileRoute("/files/*path");
      expect(compiled.keys).toHaveLength(1);
      expect(compiled.keys[0]).toEqual({ name: "path", optional: false, wildcard: true });
    });

    it("caches compiled routes", () => {
      const first = compileRoute("/blog/:slug");
      const second = compileRoute("/blog/:slug");
      expect(first).toBe(second);
    });

    it("creates valid regex for pattern matching", () => {
      const compiled = compileRoute("/blog/:slug");
      expect(compiled.regex.test("/blog/hello-world")).toBe(true);
      expect(compiled.regex.test("/about")).toBe(false);
    });
  });

  describe("matchRoute", () => {
    it("matches a simple route with one parameter", () => {
      const match = matchRoute("/blog/:slug", "/blog/hello-world");
      expect(match).toEqual({ path: "/blog/hello-world", params: { slug: "hello-world" }, pattern: "/blog/:slug" });
    });

    it("returns undefined for non-matching routes", () => {
      const match = matchRoute("/blog/:slug", "/about");
      expect(match).toBeUndefined();
    });

    it("matches routes with multiple parameters", () => {
      const match = matchRoute("/users/:userId/posts/:postId", "/users/42/posts/123");
      expect(match).toBeDefined();
      expect(match!.params).toEqual({ userId: "42", postId: "123" });
    });

    it("matches optional parameters when present", () => {
      const match = matchRoute("/blog/:category/:slug?", "/blog/tech/hello");
      expect(match).toBeDefined();
      expect(match!.params).toEqual({ category: "tech", slug: "hello" });
    });

    it("matches optional parameters when absent", () => {
      const match = matchRoute("/blog/:category/:slug?", "/blog/tech");
      expect(match).toBeDefined();
      expect(match!.params).toEqual({ category: "tech" });
    });

    it("matches wildcard parameters", () => {
      const match = matchRoute("/files/*path", "/files/docs/guide/intro.md");
      expect(match).toBeDefined();
      expect(match!.params).toEqual({ path: "docs/guide/intro.md" });
    });

    it("decodes URI components in parameters", () => {
      const match = matchRoute("/blog/:slug", "/blog/hello%20world");
      expect(match).toBeDefined();
      expect(match!.params.slug).toBe("hello world");
    });

    it("handles static routes without parameters", () => {
      const match = matchRoute("/about", "/about");
      expect(match).toEqual({ path: "/about", params: {}, pattern: "/about" });
    });

    it("does not match partial paths", () => {
      const match = matchRoute("/blog/:slug", "/blog/hello/extra");
      expect(match).toBeUndefined();
    });

    it("handles routes with special characters", () => {
      const match = matchRoute("/api/v1/users/:id", "/api/v1/users/42");
      expect(match).toBeDefined();
      expect(match!.params).toEqual({ id: "42" });
    });
  });

  describe("matchRoutes", () => {
    it("returns first matching route", () => {
      const patterns = ["/about", "/blog/:slug", "/users/:id"];
      const match = matchRoutes(patterns, "/blog/hello-world");
      expect(match).toBeDefined();
      expect(match!.pattern).toBe("/blog/:slug");
      expect(match!.params).toEqual({ slug: "hello-world" });
    });

    it("tries patterns in order", () => {
      const patterns = ["/blog/:slug", "/blog/featured"];
      const match = matchRoutes(patterns, "/blog/featured");
      expect(match).toBeDefined();
      expect(match!.pattern).toBe("/blog/:slug");
      expect(match!.params).toEqual({ slug: "featured" });
    });

    it("returns undefined when no routes match", () => {
      const patterns = ["/about", "/blog/:slug"];
      const match = matchRoutes(patterns, "/products");
      expect(match).toBeUndefined();
    });

    it("handles empty pattern array", () => {
      const match = matchRoutes([], "/any-path");
      expect(match).toBeUndefined();
    });
  });

  describe("extractParams", () => {
    it("extracts parameters from matching route", () => {
      const params = extractParams("/blog/:slug", "/blog/hello-world");
      expect(params).toEqual({ slug: "hello-world" });
    });

    it("returns empty object for non-matching route", () => {
      const params = extractParams("/blog/:slug", "/about");
      expect(params).toEqual({});
    });

    it("extracts multiple parameters", () => {
      const params = extractParams("/users/:userId/posts/:postId", "/users/42/posts/123");
      expect(params).toEqual({ userId: "42", postId: "123" });
    });

    it("handles optional parameters", () => {
      const params1 = extractParams("/blog/:category/:slug?", "/blog/tech/hello");
      expect(params1).toEqual({ category: "tech", slug: "hello" });

      const params2 = extractParams("/blog/:category/:slug?", "/blog/tech");
      expect(params2).toEqual({ category: "tech" });
    });

    it("extracts wildcard parameters", () => {
      const params = extractParams("/files/*path", "/files/docs/guide.md");
      expect(params).toEqual({ path: "docs/guide.md" });
    });
  });

  describe("buildPath", () => {
    it("builds path from pattern with single parameter", () => {
      const path = buildPath("/blog/:slug", { slug: "hello-world" });
      expect(path).toBe("/blog/hello-world");
    });

    it("builds path from pattern with multiple parameters", () => {
      const path = buildPath("/users/:userId/posts/:postId", { userId: "42", postId: "123" });
      expect(path).toBe("/users/42/posts/123");
    });

    it("URL-encodes parameter values", () => {
      const path = buildPath("/blog/:slug", { slug: "hello world" });
      expect(path).toBe("/blog/hello%20world");
    });

    it("handles optional parameters when provided", () => {
      const path = buildPath("/blog/:category/:slug?", { category: "tech", slug: "hello" });
      expect(path).toBe("/blog/tech/hello");
    });

    it("removes optional parameters when not provided", () => {
      const path = buildPath("/blog/:category/:slug?", { category: "tech" });
      expect(path).toBe("/blog/tech/");
    });

    it("builds path with wildcard parameters", () => {
      const path = buildPath("/files/*path", { path: "docs/guide.md" });
      expect(path).toBe("/files/docs/guide.md");
    });

    it("handles special characters in parameters", () => {
      const path = buildPath("/search/:query", { query: "hello+world" });
      expect(path).toBe("/search/hello%2Bworld");
    });

    it("leaves unmatched placeholders as-is", () => {
      const path = buildPath("/users/:userId/posts/:postId", { userId: "42" });
      expect(path).toContain(":postId");
    });
  });

  describe("isMatch", () => {
    it("returns true for matching routes", () => {
      expect(isMatch("/blog/:slug", "/blog/hello-world")).toBe(true);
    });

    it("returns false for non-matching routes", () => {
      expect(isMatch("/blog/:slug", "/about")).toBe(false);
    });

    it("works with complex patterns", () => {
      expect(isMatch("/users/:userId/posts/:postId", "/users/42/posts/123")).toBe(true);
      expect(isMatch("/users/:userId/posts/:postId", "/users/42")).toBe(false);
    });

    it("handles optional parameters", () => {
      expect(isMatch("/blog/:category/:slug?", "/blog/tech/hello")).toBe(true);
      expect(isMatch("/blog/:category/:slug?", "/blog/tech")).toBe(true);
    });

    it("handles wildcards", () => {
      expect(isMatch("/files/*path", "/files/docs/guide/intro.md")).toBe(true);
    });
  });

  describe("normalizePath", () => {
    it("ensures leading slash", () => {
      expect(normalizePath("about")).toBe("/about");
      expect(normalizePath("blog/hello")).toBe("/blog/hello");
    });

    it("removes trailing slash", () => {
      expect(normalizePath("/blog/")).toBe("/blog");
      expect(normalizePath("/about/us/")).toBe("/about/us");
    });

    it("preserves root path", () => {
      expect(normalizePath("/")).toBe("/");
    });

    it("handles already normalized paths", () => {
      expect(normalizePath("/blog")).toBe("/blog");
    });

    it("handles empty string", () => {
      expect(normalizePath("")).toBe("/");
    });

    it("normalizes complex paths", () => {
      expect(normalizePath("users/42/posts/")).toBe("/users/42/posts");
    });
  });

  describe("parseUrl", () => {
    it("parses path from simple URL", () => {
      const parsed = parseUrl("/blog");
      expect(parsed.path).toBe("/blog");
      expect(parsed.searchParams.toString()).toBe("");
    });

    it("parses path and search params", () => {
      const parsed = parseUrl("/blog?page=2&sort=date");
      expect(parsed.path).toBe("/blog");
      expect(parsed.searchParams.get("page")).toBe("2");
      expect(parsed.searchParams.get("sort")).toBe("date");
    });

    it("handles absolute URLs", () => {
      const parsed = parseUrl("https://example.com/blog?page=2");
      expect(parsed.path).toBe("/blog");
      expect(parsed.searchParams.get("page")).toBe("2");
    });

    it("handles URLs without search params", () => {
      const parsed = parseUrl("/users/42/posts/123");
      expect(parsed.path).toBe("/users/42/posts/123");
      expect(parsed.searchParams.toString()).toBe("");
    });

    it("handles root path", () => {
      const parsed = parseUrl("/");
      expect(parsed.path).toBe("/");
    });

    it("handles URL with hash", () => {
      const parsed = parseUrl("/blog?page=2#comments");
      expect(parsed.path).toBe("/blog");
      expect(parsed.searchParams.get("page")).toBe("2");
    });

    it("handles malformed URLs gracefully", () => {
      const parsed = parseUrl("not-a-url?with=params");
      expect(parsed.path).toBe("/not-a-url");
      expect(parsed.searchParams.get("with")).toBe("params");
    });

    it("handles URL with multiple query params", () => {
      const parsed = parseUrl("/search?q=test&category=tech&sort=date");
      expect(parsed.searchParams.get("q")).toBe("test");
      expect(parsed.searchParams.get("category")).toBe("tech");
      expect(parsed.searchParams.get("sort")).toBe("date");
    });
  });

  describe("clearRouteCache", () => {
    it("clears the compilation cache", () => {
      const first = compileRoute("/blog/:slug");
      clearRouteCache();
      const second = compileRoute("/blog/:slug");

      expect(first).not.toBe(second);
      expect(first.pattern).toBe(second.pattern);
      expect(first.keys).toEqual(second.keys);
    });
  });

  describe("complex routing scenarios", () => {
    it("handles nested optional parameters", () => {
      const match = matchRoute("/blog/:category?/:slug?", "/blog");
      expect(match?.params).toEqual({});
    });

    it("handles routes with dots in path", () => {
      const match = matchRoute("/files/:filename", "/files/document.pdf");
      expect(match?.params).toEqual({ filename: "document.pdf" });
    });

    it("handles routes with hyphens and underscores", () => {
      const match = matchRoute("/api/:resource_type", "/api/user-profile");
      expect(match?.params).toEqual({ resource_type: "user-profile" });
    });

    it("matches exact routes before parameterized routes", () => {
      const patterns = ["/blog/featured", "/blog/:slug"];
      const match1 = matchRoutes(patterns, "/blog/featured");
      expect(match1?.pattern).toBe("/blog/featured");

      const match2 = matchRoutes(patterns, "/blog/other");
      expect(match2?.pattern).toBe("/blog/:slug");
    });

    it("handles building paths with missing optional params", () => {
      const path = buildPath("/blog/:year?/:month?/:slug", { slug: "hello" });
      expect(path).not.toContain(":year");
      expect(path).not.toContain(":month");
    });

    it("handles URL encoding in both directions", () => {
      const encoded = buildPath("/search/:query", { query: "hello world" });
      expect(encoded).toBe("/search/hello%20world");

      const match = matchRoute("/search/:query", encoded);
      expect(match?.params.query).toBe("hello world");
    });
  });

  describe("edge cases", () => {
    it("handles empty pattern", () => {
      const match = matchRoute("", "/any-path");
      expect(match).toBeUndefined();
    });

    it("handles pattern with only slashes", () => {
      const match = matchRoute("///", "/");
      expect(match).toBeUndefined();
    });

    it("handles path with trailing query string", () => {
      const match = matchRoute("/blog/:slug", "/blog/hello?extra=param");
      expect(match).toBeUndefined();
    });

    it("handles numeric parameter values", () => {
      const match = matchRoute("/users/:id", "/users/12345");
      expect(match?.params.id).toBe("12345");
      expect(typeof match?.params.id).toBe("string");
    });

    it("preserves parameter order", () => {
      const params = extractParams("/a/:first/b/:second/c/:third", "/a/1/b/2/c/3");
      expect(Object.keys(params)).toEqual(["first", "second", "third"]);
    });
  });
});
