import { mount, signal } from "@volt";
import { describe, expect, it } from "vitest";

describe("integration: mount", () => {
  it("creates a reactive counter", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-text="count">0</p>
        <p data-volt-class="countClass">Classes</p>
      </div>
    `;

    const count = signal(0);
    const countClass = signal({ positive: false, zero: true });

    mount(container, { count, countClass });

    const textElement = container.querySelector("p:first-child");
    const classElement = container.querySelector("p:last-child");

    expect(textElement?.textContent).toBe("0");
    expect(classElement?.classList.contains("zero")).toBe(true);
    expect(classElement?.classList.contains("positive")).toBe(false);

    count.set(5);
    countClass.set({ positive: true, zero: false });

    expect(textElement?.textContent).toBe("5");
    expect(classElement?.classList.contains("zero")).toBe(false);
    expect(classElement?.classList.contains("positive")).toBe(true);
  });

  it("handles complex nested structures", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div data-volt-text="title">Title</div>
      <ul>
        <li data-volt-text="items.first">First</li>
        <li data-volt-text="items.second">Second</li>
      </ul>
      <footer data-volt-html="footer">Footer</footer>
    `;

    const title = signal("My App");
    const items = { first: "Item 1", second: "Item 2" };
    const footer = signal("<strong>© 2025</strong>");

    mount(container, { title, items, footer });

    expect(container.querySelector("[data-volt-text='title']")?.textContent).toBe("My App");
    expect(container.querySelector("li:first-child")?.textContent).toBe("Item 1");
    expect(container.querySelector("li:last-child")?.textContent).toBe("Item 2");
    expect(container.querySelector("footer")?.innerHTML).toBe("<strong>© 2025</strong>");

    title.set("Updated App");
    footer.set("<em>New Footer</em>");

    expect(container.querySelector("[data-volt-text='title']")?.textContent).toBe("Updated App");
    expect(container.querySelector("footer")?.innerHTML).toBe("<em>New Footer</em>");
  });

  it("properly cleans up all bindings", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div data-volt-text="a">A</div>
      <div data-volt-text="b">B</div>
      <div data-volt-text="c">C</div>
    `;

    const a = signal("A");
    const b = signal("B");
    const c = signal("C");

    const cleanup = mount(container, { a, b, c });

    const divs = [...container.querySelectorAll("div")];
    expect(divs[0]?.textContent).toBe("A");
    expect(divs[1]?.textContent).toBe("B");
    expect(divs[2]?.textContent).toBe("C");

    a.set("A1");
    b.set("B1");
    c.set("C1");

    expect(divs[0]?.textContent).toBe("A1");
    expect(divs[1]?.textContent).toBe("B1");
    expect(divs[2]?.textContent).toBe("C1");

    cleanup();

    a.set("A2");
    b.set("B2");
    c.set("C2");

    expect(divs[0]?.textContent).toBe("A1");
    expect(divs[1]?.textContent).toBe("B1");
    expect(divs[2]?.textContent).toBe("C1");
  });

  it("supports mixed static and reactive values", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <h1 data-volt-text="staticTitle">Title</h1>
      <p data-volt-text="dynamicContent">Content</p>
      <span data-volt-class="'always-visible'">Visible</span>
    `;

    const staticTitle = "Welcome";
    const dynamicContent = signal("Loading...");

    mount(container, { staticTitle, dynamicContent });

    expect(container.querySelector("h1")?.textContent).toBe("Welcome");
    expect(container.querySelector("p")?.textContent).toBe("Loading...");
    expect(container.querySelector("span")?.classList.contains("always-visible")).toBe(true);

    dynamicContent.set("Content loaded!");
    expect(container.querySelector("p")?.textContent).toBe("Content loaded!");
  });
});
