# Better Demo Implementation TODO

## Existing Issues

- [x] **FIXME** (lib/src/demo/sections/plugins.ts:68): Sidenotes need stylesheet constraints - RESOLVED
- [x] **FIXME** (lib/src/demo/sections/interactivity.ts:46): Dialog footer structure needs correction - RESOLVED

## Phase 1: Foundation (First 4 Deliverables)

### 1. Convert to Declarative Mode

**Approach:** Use DOM utilities (lib/src/demo/utils.ts) to programmatically build HTML markup that uses declarative VoltX attributes (data-volt-state, data-volt-computed, data-volt-*), then mount with charge() instead of programmatic mount() + signals.

- [x] Add window.$helpers for DOM operations (openDialog, closeDialog, scrollTo, etc.)
- [x] Update buildDemoStructure() to add data-volt attribute to root element
- [x] Add data-volt-state with all initial state as JSON on root element
- [x] Add data-volt-computed attributes for derived values (doubled, activeTodos, completedTodos)
- [x] Convert all sections to produce markup with declarative bindings:
    - [x] Interactivity section - use $helpers.openDialog(), button expressions
    - [x] Reactivity section - reference state directly in expressions (count.get(), etc.)
    - [x] Forms section - use $helpers.handleFormSubmit(), data-volt-model on inputs
    - [x] Plugins section - declarative persist/scroll/url attributes (already mostly done)
    - [x] Animations section - declarative surge/shift attributes (already done)
    - [x] Typography section - no changes needed (static content)
- [x] Remove demoScope export (replaced by declarative state on element)
- [x] Update setupDemo() to use charge() instead of mount()
- [x] Update lib/src/main.ts to just call setupDemo() (no other code)

### 2. Implement Multi-Page Routing

- [x] Register navigate plugin in main.ts
- [x] Initialize navigation listener with initNavigationListener()
- [x] Create route-based content structure (added currentPage signal)
- [x] Add navigation menu with declarative page switching
- [x] Implement content swapping mechanism (conditional rendering with data-volt-if)
- [x] Ensure browser back/forward buttons work correctly (initNavigationListener)
- [x] Add View Transition API integration (built into navigate plugin)

### 3. Add Tooltip CSS Feature

- [x] Design tooltip data attribute API (data-vx-tooltip, data-placement)
- [x] Add tooltip CSS to lib/src/styles/components.css
- [x] Support placements: top, right, bottom, left
- [x] Implement tooltip positioning logic (CSS-only with pseudo-elements)
- [x] Add hover/focus interactions
- [x] Ensure accessibility (uses native attributes)
- [x] Test tooltips across different viewport sizes (responsive: hidden on mobile)
- [x] Add tooltip examples to home page

### 4. Create Home Page

- [x] Design home page layout
- [x] Add framework overview section
- [x] Create feature highlights grid/list
    - Bundle size < 15KB
    - No virtual DOM
    - Signal-based reactivity
    - Zero dependencies
    - Declarative-first approach
- [x] Add quick navigation to demo pages
- [x] Include getting started code snippet
- [x] Add links to documentation and GitHub
- [x] Ensure home page uses Volt CSS classless styling

## PHASE 1 COMPLETE ✓

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

### 14. Framework Capabilities Showcase

**Note:** Showcase framework capabilities as features are completed from ROADMAP.md

- [ ] Add bundle size widget/badge highlighting <15KB achievement (from Bundle Size Optimization milestone)
- [ ] Demonstrate CSP-safe mode when available (from CSP Compatibility milestone)
- [ ] Showcase DOM morphing features (from DOM Morphing & Streaming milestone)
- [ ] Demonstrate SSE streaming (from DOM Morphing & Streaming milestone)
- [ ] Show scope inheritance patterns (from Scope Inheritance & State Management milestone)
- [ ] Display reactive polling examples (from Background Requests & Reactive Polling milestone)

### 15. View-Source Friendly Code

- [ ] Ensure all HTML is readable and well-commented
- [ ] Add explanatory comments to complex bindings
- [ ] Include inline documentation where helpful
- [ ] Make examples copy-paste ready

### 16. Copy-Paste Ready Patterns

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

## Example Ideas

Many of these are ideas, not planned to be implemented

### Components

- Modal Dialog - Conditional rendering, focus trapping, backdrop, keyboard escape
- Tabs & Accordion - Conditional rendering, active state management, keyboard navigation
- Form Validation - Model binding, computed validation, conditional messages, error states

### Client-Side (SPA/Static)

- ✓ Counter - Basic signals, computed, event handling
- ✓ TodoMVC - List rendering, persistence, filtering, CRUD operations
- Search with Autocomplete - Async effects, debouncing, API integration, keyboard navigation
- Calculator - Event handling, computed expressions, button grid, operation state
- Image Gallery - For loops, filtering, lightbox, category selection

- Multi-Step Wizard - Form state across steps, validation per step, progress tracking, navigation
- Note-Taking App - Rich CRUD, categories/tags, search/filter, localStorage persistence, markdown preview
- Expense Tracker - Date handling, categories, computed totals/charts, filtering by date range, CSV export
- Kanban Board - Drag-and-drop (via events), column management, task editing, state persistence
- Timer/Stopwatch - Async effects, intervals, lap times, pause/resume, localStorage for history

- Real-time Chat - SSE for messages, typing indicators, user presence, message history
- Live Dashboard - SSE for metrics, charts updating in real-time, WebSocket fallback
- Collaborative Editor - Operational transforms, SSE for changes, conflict resolution, cursor positions
- Infinite Scroll Feed - Polling for new items, intersection observer, virtualized rendering
- Admin Panel/CMS - CRUD operations, data tables, filters, pagination, bulk actions

### Server-Side Rendered (SSR)

These will live in an example repo.

- Authentication Flows - Login, signup, password reset, email verification (Go, Python, Rust, Node)
- File Upload with Progress - Chunked uploads, progress bars, validation (Go, Python, Rust, Node)
- Search with Server-Side Filtering - Debounced search, paginated results (Go, Python, Rust, Node)

### Desktop Apps

- Note Editor - Local file system, syntax highlighting, multi-tab, settings persistence
- System Monitor - CPU/memory graphs, process list, real-time updates
- Database Client - Table browser, query editor, result grid, export
- Media Player - File browser, playlists, controls, metadata display
