# Better Demo Implementation TODO

This document tracks the implementation of the Better Demo deliverables from ROADMAP.md.

## Existing Issues

- [ ] **FIXME** (lib/src/demo/sections/plugins.ts:68): Sidenotes need stylesheet constraints
- [ ] **FIXME** (lib/src/demo/sections/interactivity.ts:46): Dialog footer structure needs correction

## Phase 1: Foundation (First 4 Deliverables)

### 1. Convert to Declarative Mode

- [ ] Rewrite lib/index.html to use charge() approach
- [ ] Add data-volt-state for inline state declaration
- [ ] Add data-volt-computed for derived values
- [ ] Minimize JavaScript in lib/src/main.ts (just charge() + plugin registration)
- [ ] Convert all demo sections to use declarative attributes
- [ ] Remove programmatic mount() calls from demo code
- [ ] Add global store via `<script type="application/json" data-volt-store>` if needed
- [ ] Update demo/index.ts to export reusable utilities only

### 2. Implement Multi-Page Routing

- [ ] Register navigate plugin in main.ts
- [ ] Initialize navigation listener with initNavigationListener()
- [ ] Create route-based content structure
- [ ] Add navigation menu with data-volt-navigate links
- [ ] Implement content swapping mechanism (conditional rendering or HTTP actions)
- [ ] Ensure browser back/forward buttons work correctly
- [ ] Add View Transition API integration for smooth page transitions

### 3. Add Tooltip CSS Feature

- [ ] Design tooltip data attribute API (data-vx-tooltip, data-placement)
- [ ] Add tooltip CSS to lib/src/styles/components.css
- [ ] Support placements: top, right, bottom, left
- [ ] Implement tooltip positioning logic
- [ ] Add hover/focus interactions
- [ ] Ensure accessibility (aria-describedby)
- [ ] Test tooltips across different viewport sizes

### 4. Create Home Page

- [ ] Design home page layout
- [ ] Add framework overview section
- [ ] Create feature highlights grid/list
    - Bundle size < 15KB
    - No virtual DOM
    - Signal-based reactivity
    - Zero dependencies
    - Declarative-first approach
- [ ] Add quick navigation to demo pages
- [ ] Include getting started code snippet
- [ ] Add links to documentation and GitHub
- [ ] Ensure home page uses Volt CSS classless styling

## Phase 2: Core Feature Pages

### 5. Page: Getting Started

- [ ] Installation instructions (npm, JSR, CDN)
- [ ] First example with charge()
- [ ] Declarative vs programmatic comparison
- [ ] Basic signal usage example
- [ ] Link to full documentation

### 6. Page: Reactivity

- [ ] Migrate existing reactivity section
- [ ] Signals demo (get/set/subscribe)
- [ ] Computed values demo
- [ ] Effects demo
- [ ] Conditional rendering (data-volt-if/else)
- [ ] List rendering (data-volt-for)
- [ ] Class bindings (data-volt-class)
- [ ] Two-way binding (data-volt-model)

### 7. Page: HTTP

- [ ] Demonstrate all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- [ ] Show swap strategies (innerHTML, outerHTML, beforebegin, afterbegin, beforeend, afterend, delete, none)
- [ ] Loading indicators with data-volt-indicator
- [ ] Error handling patterns
- [ ] Retry logic demonstration
- [ ] Form serialization for POST/PUT/PATCH
- [ ] Target selector usage

### 8. Page: State

- [ ] Global store demonstration
- [ ] Scope helpers overview
    - $store - access global state
    - $scope - current scope reference
    - $pulse - microtask scheduling
    - $uid - deterministic IDs
    - $probe - element refs
    - $pins - custom helpers
    - $arc - custom event dispatch
- [ ] Cross-component communication patterns
- [ ] Store registration and updates

## Phase 3: Plugin & Advanced Pages

### 9. Page: Persistence

- [ ] Migrate existing persist plugin demo
- [ ] localStorage persistence demo
- [ ] sessionStorage persistence demo
- [ ] IndexedDB persistence demo
- [ ] URL sync with url plugin
- [ ] Demonstrate storage modifiers (.local, .session, .ifmissing)
- [ ] Cross-tab synchronization example

### 10. Page: Animations

- [ ] Migrate existing animations section
- [ ] Surge plugin demos (fade, slide, scale, blur)
- [ ] Custom timing (duration, delay)
- [ ] Different enter/leave transitions
- [ ] Shift plugin demos (bounce, shake, pulse, flash, spin)
- [ ] Custom animation settings
- [ ] Combined effects (surge + shift)
- [ ] View Transition API integration

### 11. Page: Forms

- [ ] Migrate existing forms section
- [ ] Complete form example with all input types
- [ ] Two-way binding demonstration
- [ ] Validation patterns
- [ ] Event modifiers (.prevent, .stop, etc.)
- [ ] Multi-step form example
- [ ] Form submission handling

## Phase 4: Reference & Patterns

### 12. Page: CSS

- [ ] Migrate existing typography section
- [ ] Expand with additional Volt CSS features
- [ ] Typography showcase (headings, paragraphs, lists)
- [ ] Tufte-style sidenotes
- [ ] Tables with zebra striping
- [ ] Code blocks and inline code
- [ ] Blockquotes and citations
- [ ] Semantic HTML elements
- [ ] Layout examples
- [ ] Responsive behavior

### 13. Page: Patterns

- [ ] Tabs component pattern
- [ ] Accordion component pattern
- [ ] Modal dialog pattern (expand existing)
- [ ] Autocomplete/search pattern
- [ ] Dropdown menu pattern
- [ ] Toast/notification pattern
- [ ] Pagination pattern
- [ ] Infinite scroll pattern

## Phase 5: Polish & Documentation

### 14. View-Source Friendly Code

- [ ] Ensure all HTML is readable and well-commented
- [ ] Add explanatory comments to complex bindings
- [ ] Include inline documentation where helpful
- [ ] Make examples copy-paste ready

### 15. Copy-Paste Ready Patterns

- [ ] Extract reusable patterns into clearly marked sections
- [ ] Provide minimal examples for each feature
- [ ] Include both inline and external script examples
- [ ] Document common pitfalls and solutions

## File Structure

```sh
lib/
  index.html              # Main entry with routing and global state
  src/
    main.ts              # Minimal bootstrap (charge + navigate init)
    demo/
      index.ts           # Removed or minimal utilities only
      sections/          # Keep or convert to HTML partials
      utils.ts           # DOM utilities (may still be useful)
    pages/               # New directory for page templates
      home.html
      getting-started.html
      reactivity.html
      http.html
      state.html
      persistence.html
      animations.html
      forms.html
      css.html
      patterns.html
    styles/
      components.css     # Add tooltip styles here
      ...
```


