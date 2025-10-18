# TodoMVC

Complete TodoMVC implementation using Volt.js and Volt CSS (classless framework).

## Features

- Add/edit/delete todos
- Mark complete/incomplete
- Filter by All/Active/Completed
- Toggle all at once
- Clear completed
- Persistent reactive state

## Running

1. Build the project: `pnpm build` from root
2. Open `index.html` in a browser

## Implementation

### State Management

Two base signals control all state:

```js
const todos = signal([...]);
const filter = signal('all');
```

Computed signals derive UI state:

```js
const filteredTodos = computed(() => {
  if (filter.get() === 'active') return todos.get().filter(t => !t.completed);
  if (filter.get() === 'completed') return todos.get().filter(t => t.completed);
  return todos.get();
}, [todos, filter]);

const activeCount = computed(() =>
  todos.get().filter(t => !t.completed).length,
  [todos]
);
```

### List Rendering

`data-x-for` renders todos reactively:

```html
<li data-x-for="(todo, index) in filteredTodos" data-x-class="getTodoClass(todo)">
  <input type="checkbox" data-x-on-click="toggleTodo($event, index)">
  <label data-x-text="todo.text"></label>
</li>
```

### Event Handling

All interactions use declarative bindings:

- `data-x-on-click` for buttons and checkboxes
- `data-x-on-keyup` for Enter/Escape in inputs
- `data-x-on-dblclick` for editing mode
- `data-x-on-blur` to save edits

### Index Mapping

Because the UI displays filtered todos but operations need the full array, handlers map filtered indices to actual positions:

```js
const deleteTodo = (indexInFiltered) => {
  const filteredList = filteredTodos.get();
  const todoToFind = filteredList[indexInFiltered];
  const actualIndex = todos.get().findIndex(t => t.id === todoToFind.id);
  todos.set(todos.get().filter((_, i) => i !== actualIndex));
};
```

### Styling

Uses only Volt CSS. Semantic HTML elements are styled automatically with no custom classes needed.
