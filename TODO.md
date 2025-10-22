# Navigation & History API Routing

## Overview

Implementation of v0.5.0 milestone

## Core Navigation Plugin

- [ ] Create `lib/src/plugins/navigate.ts`
    - [ ] Link (`<a>`) interception with History API
    - [ ] Form action interception for SPA navigation
    - [ ] Back/forward button support via `popstate`
    - [ ] View Transition API integration
    - [ ] Modifiers: `.prevent`, `.replace`, `.prefetch`
- [ ] Register directive in binder or as plugin

## Enhanced URL Plugin

- [x] Extend `lib/src/plugins/url.ts`
    - [x] Add `history:signal` mode
    - [x] Preserve full path + search params
    - [x] Base path configuration option

## Route Utilities

- [x] Create `lib/src/core/router.ts`
    - [x] Path pattern matching (`/blog/:slug`)
    - [x] Extract dynamic route parameters
    - [x] Programmatic navigation (`navigateTo()`, `redirect()`)
    - [x] Route matching utilities

## Scroll & Focus Management

- [ ] Extend scroll plugin with history-based persistence
- [ ] Scroll restoration on back/forward navigation
- [ ] Focus management for accessibility
- [ ] Store scroll positions in history state

## Resource Preloading

- [ ] Hover/idle preloading for navigate links
- [ ] Viewport-based prefetching with IntersectionObserver
- [ ] Integration with HTTP request system

## Testing

- [x] Create `lib/test/plugins/navigate.test.ts`
- [x] Extend `lib/test/plugins/url.test.ts` with history mode
- [ ] Create `lib/test/integration/routing.test.ts`
    - [ ] pushState navigation tests
    - [ ] Deep link tests
    - [ ] Server-rendered bootstrap tests
    - [ ] Scroll restoration tests
    - [ ] Dynamic route params tests

## Documentation

- [ ] Update `docs/usage/routing.md`
    - [ ] History API examples
    - [ ] Hash vs history comparison table
    - [ ] Route parameters documentation
    - [ ] View Transition integration examples
- [ ] Add JSDoc comments to all new APIs

## Integration & Exports

- [ ] Export new utilities from `lib/src/index.ts`
- [ ] Register navigate plugin/directive
- [ ] Verify bundle size < 15KB gzipped
    - Current: TBD

## Notes

- Maintain declarative-first philosophy
- Follow existing plugin patterns (persist, scroll, url)
- All features must work without JavaScript for progressive enhancement
