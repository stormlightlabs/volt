import { mount } from "@volt/core/binder";
import { signal } from "@volt/core/signal";
import { describe, expect, it } from "vitest";

describe("data-x-for binding", () => {
  it("renders a list from array signal", () => {
    const container = document.createElement("div");
    container.innerHTML = `<ul><li data-x-for="item in items" data-x-text="item"></li></ul>`;

    const items = signal(["apple", "banana", "cherry"]);
    mount(container, { items });

    const ul = container.querySelector("ul")!;
    const listItems = ul.querySelectorAll("li");

    expect(listItems.length).toBe(3);
    expect(listItems[0]?.textContent).toBe("apple");
    expect(listItems[1]?.textContent).toBe("banana");
    expect(listItems[2]?.textContent).toBe("cherry");
  });

  it("updates list when signal changes", () => {
    const container = document.createElement("div");
    container.innerHTML = `<ul><li data-x-for="item in items" data-x-text="item"></li></ul>`;

    const items = signal(["one", "two"]);
    mount(container, { items });

    const ul = container.querySelector("ul")!;
    let listItems = ul.querySelectorAll("li");

    expect(listItems.length).toBe(2);
    expect(listItems[0]?.textContent).toBe("one");
    expect(listItems[1]?.textContent).toBe("two");

    items.set(["one", "two", "three", "four"]);
    listItems = ul.querySelectorAll("li");

    expect(listItems.length).toBe(4);
    expect(listItems[2]?.textContent).toBe("three");
    expect(listItems[3]?.textContent).toBe("four");

    items.set(["solo"]);
    listItems = ul.querySelectorAll("li");

    expect(listItems.length).toBe(1);
    expect(listItems[0]?.textContent).toBe("solo");
  });

  it("renders list with object properties", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <ul>
        <li data-x-for="user in users">
          <span data-x-text="user.name"></span>
        </li>
      </ul>
    `;

    const users = signal([{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }]);

    mount(container, { users });

    const spans = container.querySelectorAll("span");
    expect(spans.length).toBe(2);
    expect(spans[0]?.textContent).toBe("Alice");
    expect(spans[1]?.textContent).toBe("Bob");
  });

  it("supports index access with (item, index) syntax", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <ul>
        <li data-x-for="(item, i) in items">
          <span data-x-text="i"></span>: <span data-x-text="item"></span>
        </li>
      </ul>
    `;

    const items = signal(["first", "second", "third"]);
    mount(container, { items });

    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(3);

    const firstItem = listItems[0]?.querySelectorAll("span");
    expect(firstItem?.[0]?.textContent).toBe("0");
    expect(firstItem?.[1]?.textContent).toBe("first");

    const secondItem = listItems[1]?.querySelectorAll("span");
    expect(secondItem?.[0]?.textContent).toBe("1");
    expect(secondItem?.[1]?.textContent).toBe("second");
  });

  it("handles empty arrays", () => {
    const container = document.createElement("div");
    container.innerHTML = `<ul><li data-x-for="item in items" data-x-text="item"></li></ul>`;

    const items = signal<string[]>([]);
    mount(container, { items });

    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(0);

    items.set(["now", "there", "are", "items"]);
    const updatedItems = container.querySelectorAll("li");
    expect(updatedItems.length).toBe(4);
  });

  it("handles static arrays (non-signal)", () => {
    const container = document.createElement("div");
    container.innerHTML = `<ul><li data-x-for="item in items" data-x-text="item"></li></ul>`;

    mount(container, { items: ["static", "array"] });

    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(2);
    expect(listItems[0]?.textContent).toBe("static");
    expect(listItems[1]?.textContent).toBe("array");
  });

  it("supports event handlers in list items", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <ul>
        <li data-x-for="item in items">
          <button data-x-on-click="handleClick" data-x-text="item.text"></button>
        </li>
      </ul>
    `;

    let clickedItem = "";
    const handleClick = (event: Event) => {
      const button = event.target as HTMLButtonElement;
      clickedItem = button.textContent || "";
    };

    const items = signal([{ text: "Click Me" }, { text: "Or Me" }]);
    mount(container, { items, handleClick });

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(2);

    buttons[0]?.click();
    expect(clickedItem).toBe("Click Me");

    buttons[1]?.click();
    expect(clickedItem).toBe("Or Me");
  });

  it("supports nested loops", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div data-x-for="group in groups">
        <ul>
          <li data-x-for="item in group.items" data-x-text="item"></li>
        </ul>
      </div>
    `;

    const groups = signal([{ items: ["a", "b"] }, { items: ["c", "d", "e"] }]);

    mount(container, { groups });

    const divs = container.querySelectorAll("div");
    expect(divs.length).toBe(2);

    const firstGroupItems = divs[0]?.querySelectorAll("li");
    expect(firstGroupItems?.length).toBe(2);
    expect(firstGroupItems?.[0]?.textContent).toBe("a");

    const secondGroupItems = divs[1]?.querySelectorAll("li");
    expect(secondGroupItems?.length).toBe(3);
    expect(secondGroupItems?.[2]?.textContent).toBe("e");
  });

  it("properly cleans up when unmounting", () => {
    const container = document.createElement("div");
    container.innerHTML = `<ul><li data-x-for="item in items" data-x-text="item.value"></li></ul>`;

    const items = signal([{ value: signal("A") }, { value: signal("B") }]);
    const cleanup = mount(container, { items });

    expect(container.querySelectorAll("li").length).toBe(2);

    const listItemsBefore = container.querySelectorAll("li");
    const textBefore = [listItemsBefore[0]?.textContent, listItemsBefore[1]?.textContent];

    cleanup();

    const itemA = items.get()[0];
    const itemB = items.get()[1];

    itemA.value.set("Changed A");
    itemB.value.set("Changed B");

    const listItems = container.querySelectorAll("li");
    expect(listItems[0]?.textContent).toBe(textBefore[0]);
    expect(listItems[1]?.textContent).toBe(textBefore[1]);
  });

  it("handles non-array values gracefully", () => {
    const container = document.createElement("div");
    container.innerHTML = `<ul><li data-x-for="item in notAnArray" data-x-text="item"></li></ul>`;

    mount(container, { notAnArray: "not an array" });

    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(0);
  });

  it("supports reactive properties within list items", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <ul>
        <li data-x-for="todo in todos">
          <span data-x-text="todo.title"></span>
          <span data-x-class="todo.completed">Done</span>
        </li>
      </ul>
    `;

    const todos = signal([{ title: signal("Buy milk"), completed: signal({ done: false }) }, {
      title: signal("Walk dog"),
      completed: signal({ done: true }),
    }]);

    mount(container, { todos });

    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(2);

    const firstTodo = listItems[0];
    const firstTitle = firstTodo?.querySelector("span:first-child");
    const firstStatus = firstTodo?.querySelector("span:last-child");

    expect(firstTitle?.textContent).toBe("Buy milk");
    expect(firstStatus?.classList.contains("done")).toBe(false);

    todos.get()[0].title.set("Buy eggs");
    todos.get()[0].completed.set({ done: true });

    expect(firstTitle?.textContent).toBe("Buy eggs");
    expect(firstStatus?.classList.contains("done")).toBe(true);
  });
});
