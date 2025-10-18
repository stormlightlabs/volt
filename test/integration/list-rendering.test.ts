import { describe, expect, it } from "vitest";
import { computed, mount, signal } from "../../src/index";

describe("integration: list rendering", () => {
  it("creates a reactive todo list", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <input id="new-todo" type="text" />
        <button id="add-btn" data-x-on-click="addTodo">Add</button>

        <ul id="todo-list">
          <li data-x-for="todo in todos">
            <input type="checkbox" data-x-on-click="toggleTodo" />
            <span data-x-text="todo.text"></span>
            <button data-x-on-click="deleteTodo">Delete</button>
          </li>
        </ul>

        <div data-x-text="remaining">0</div>
      </div>
    `;

    type Todo = { id: number; text: string; completed: boolean };
    let nextId = 1;

    const todos = signal<Todo[]>([{ id: nextId++, text: "Learn Volt.js", completed: false }, {
      id: nextId++,
      text: "Build an app",
      completed: false,
    }]);

    const remaining = computed(() => {
      return todos.get().filter((t) => !t.completed).length;
    }, [todos]);

    const addTodo = () => {
      const input = container.querySelector("#new-todo") as HTMLInputElement;
      if (input.value.trim()) {
        todos.set([...todos.get(), { id: nextId++, text: input.value, completed: false }]);
        input.value = "";
      }
    };

    const toggleTodo = (event: Event) => {
      const checkbox = event.target as HTMLInputElement;
      const li = checkbox.closest("li");
      const index = [...(li?.parentElement?.children || [])].indexOf(li!);

      const updated = todos.get().map((todo, i) => (i === index ? { ...todo, completed: checkbox.checked } : todo));

      todos.set(updated);
    };

    const deleteTodo = (event: Event) => {
      const button = event.target as HTMLButtonElement;
      const li = button.closest("li");
      const index = [...(li?.parentElement?.children || [])].indexOf(li!);

      todos.set(todos.get().filter((_, i) => i !== index));
    };

    mount(container, { todos, remaining, addTodo, toggleTodo, deleteTodo });

    const listItems = container.querySelectorAll("#todo-list li");
    expect(listItems.length).toBe(2);
    expect(listItems[0]?.querySelector("span")?.textContent).toBe("Learn Volt.js");
    expect(listItems[1]?.querySelector("span")?.textContent).toBe("Build an app");

    const remainingDiv = container.querySelector("div[data-x-text='remaining']");
    expect(remainingDiv?.textContent).toBe("2");

    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    (checkboxes[0] as HTMLInputElement).checked = true;
    checkboxes[0]?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(remainingDiv?.textContent).toBe("1");

    const deleteButtons = container.querySelectorAll("button[data-x-on-click='deleteTodo']");
    deleteButtons[1]?.dispatchEvent(new Event("click", { bubbles: true }));

    const updatedListItems = container.querySelectorAll("#todo-list li");
    expect(updatedListItems.length).toBe(1);
    expect(updatedListItems[0]?.querySelector("span")?.textContent).toBe("Learn Volt.js");
  });

  it("renders filtered lists with computed signals", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <div id="all-items">
          <h3>All Items</h3>
          <div data-x-for="item in allItems" data-x-text="item.name"></div>
        </div>

        <div id="active-items">
          <h3>Active Items</h3>
          <div data-x-for="item in activeItems" data-x-text="item.name"></div>
        </div>
      </div>
    `;

    const items = signal([{ name: "Item 1", active: true }, { name: "Item 2", active: false }, {
      name: "Item 3",
      active: true,
    }]);

    const activeItems = computed(() => items.get().filter((item) => item.active), [items]);

    mount(container, { allItems: items, activeItems });

    const allItemDivs = container.querySelectorAll("#all-items > div[data-x-for]");
    const activeItemDivs = container.querySelectorAll("#active-items > div[data-x-for]");

    expect(allItemDivs.length).toBe(0);
    expect(activeItemDivs.length).toBe(0);

    const renderedAll = container.querySelectorAll("#all-items div[data-x-text]");
    const renderedActive = container.querySelectorAll("#active-items div[data-x-text]");

    expect(renderedAll.length).toBe(3);
    expect(renderedActive.length).toBe(2);
    expect(renderedActive[0]?.textContent).toBe("Item 1");
    expect(renderedActive[1]?.textContent).toBe("Item 3");

    items.set([{ name: "Item 1", active: false }, { name: "Item 2", active: true }, { name: "Item 3", active: true }]);

    const updatedActive = container.querySelectorAll("#active-items div[data-x-text]");
    expect(updatedActive.length).toBe(2);
    expect(updatedActive[0]?.textContent).toBe("Item 2");
    expect(updatedActive[1]?.textContent).toBe("Item 3");
  });

  it("handles complex nested data structures", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <div data-x-for="category in categories">
          <h2 data-x-text="category.name"></h2>
          <ul>
            <li data-x-for="product in category.products">
              <span data-x-text="product.name"></span>: $<span data-x-text="product.price"></span>
            </li>
          </ul>
        </div>
      </div>
    `;

    const categories = signal([{
      name: "Electronics",
      products: [{ name: "Laptop", price: 999 }, { name: "Phone", price: 699 }],
    }, { name: "Books", products: [{ name: "JavaScript Guide", price: 29 }, { name: "CSS Mastery", price: 35 }] }]);

    mount(container, { categories });

    const categoryDivs = container.querySelectorAll("div > div > h2");
    expect(categoryDivs.length).toBe(2);
    expect(categoryDivs[0]?.textContent).toBe("Electronics");
    expect(categoryDivs[1]?.textContent).toBe("Books");

    const categoryDivElements = container.querySelectorAll("div > div > div");
    expect(categoryDivElements.length).toBe(2);

    const electronicsProducts = categoryDivElements[0]?.querySelectorAll("ul li");
    expect(electronicsProducts?.length).toBe(2);
    expect(electronicsProducts?.[0]?.textContent).toContain("Laptop");
    expect(electronicsProducts?.[0]?.textContent).toContain("999");

    const booksProducts = categoryDivElements[1]?.querySelectorAll("ul li");
    expect(booksProducts?.length).toBe(2);
    expect(booksProducts?.[1]?.textContent).toContain("CSS Mastery");
    expect(booksProducts?.[1]?.textContent).toContain("35");
  });
});
