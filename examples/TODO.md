# Example TODO

Planned examples to demonstrate Volt.js features & show Volt.css

All examples use declarative mode by default (data-volt-state, charge()). This ensures users can build functional apps without writing JavaScript.

## Example Set

### Counter

Basic reactivity demonstration showing core primitives.

- **Features**: data-volt-state, data-volt-computed, data-volt-text, data-volt-on-click, data-volt-class
- **Shows**: Inline state declaration, computed values, event handlers that modify signals, conditional classes
- **Structure**: Single index.html file with inline state

### Form Validation

Real-world form handling with reactive validation.

- **Features**: data-volt-state, data-volt-model, data-volt-if/else, data-volt-computed for validation, data-volt-bind:disabled
- **Shows**: Two-way form binding, computed validation rules, conditional error messages, reactive button states
- **Structure**: Single index.html with validation logic in computed expressions

### Persistent Settings

Settings panel that survives page refresh.

- **Features**: data-volt-state, data-volt-model, persist plugin with localStorage
- **Shows**: Plugin usage, state persistence across page loads, settings form
- **Structure**: Single index.html demonstrating data-volt-persist

### HTTP Todo List

Full-featured todo app with server persistence and hypermedia.

- **Features**: data-volt-get/patch/post/delete, data-volt-swap, data-volt-indicator, data-volt-retry, data-volt-for
- **Shows**: Hypermedia approach, server communication, DOM swapping, loading states, error handling, smart retry, list rendering
- **Structure**: index.html + minimal bootstrap script to fetch initial todos

Made with a Go server with filesystem-based JSON persistence

**Implementation**:

- main.go with model, view & controller files
- Filesystem-based storage (todos.json)
- REST endpoints:
    - GET /todos - List all todos (returns HTML fragment)
    - POST /todos - Create new todo (returns HTML fragment)
    - PATCH /todos/:id - Update todo (partial - complete, edit text)
    - DELETE /todos/:id - Delete todo (returns empty or success fragment)
- Returns HTML fragments for Volt's DOM swapping
- REST API for demonstration

**Storage Format**:

```json
[
  {"id": "1", "text": "Example todo", "completed": false}
]
```
