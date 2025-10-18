import { mount } from "@volt/core/binder";
import { signal } from "@volt/core/signal";
import { describe, expect, it } from "vitest";

describe("data-volt-model binding", () => {
  describe("text inputs", () => {
    it("binds signal to text input value", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input type="text" data-volt-model="name" />`;

      const name = signal("Alice");
      mount(container, { name });

      const input = container.querySelector("input")!;
      expect(input.value).toBe("Alice");
    });

    it("updates input when signal changes", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input type="text" data-volt-model="message" />`;

      const message = signal("Hello");
      mount(container, { message });

      const input = container.querySelector("input")!;
      expect(input.value).toBe("Hello");

      message.set("World");
      expect(input.value).toBe("World");
    });

    it("updates signal when input changes", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input type="text" data-volt-model="text" />`;

      const text = signal("initial");
      mount(container, { text });

      const input = container.querySelector("input")!;
      input.value = "changed";
      input.dispatchEvent(new Event("input"));

      expect(text.get()).toBe("changed");
    });

    it("handles bidirectional updates", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <input data-volt-model="value" />
        <span data-volt-text="value"></span>
      `;

      const value = signal("test");
      mount(container, { value });

      const input = container.querySelector("input")!;
      const span = container.querySelector("span")!;

      expect(input.value).toBe("test");
      expect(span.textContent).toBe("test");

      input.value = "updated";
      input.dispatchEvent(new Event("input"));

      expect(value.get()).toBe("updated");
      expect(span.textContent).toBe("updated");
    });
  });

  describe("number inputs", () => {
    it("binds signal to number input", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input type="number" data-volt-model="count" />`;

      const count = signal(42);
      mount(container, { count });

      const input = container.querySelector("input")!;
      expect(input.value).toBe("42");
    });

    it("updates signal with numeric value", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input type="number" data-volt-model="quantity" />`;

      const quantity = signal(0);
      mount(container, { quantity });

      const input = container.querySelector("input")!;
      input.value = "10";
      input.dispatchEvent(new Event("input"));

      expect(quantity.get()).toBe(10);
      expect(typeof quantity.get()).toBe("number");
    });
  });

  describe("checkbox inputs", () => {
    it("binds signal to checkbox checked state", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input type="checkbox" data-volt-model="agreed" />`;

      const agreed = signal(true);
      mount(container, { agreed });

      const checkbox = container.querySelector("input")!;
      expect(checkbox.checked).toBe(true);
    });

    it("updates checkbox when signal changes", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input type="checkbox" data-volt-model="enabled" />`;

      const enabled = signal(false);
      mount(container, { enabled });

      const checkbox = container.querySelector("input")!;
      expect(checkbox.checked).toBe(false);

      enabled.set(true);
      expect(checkbox.checked).toBe(true);
    });

    it("updates signal when checkbox is clicked", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input type="checkbox" data-volt-model="checked" />`;

      const checked = signal(false);
      mount(container, { checked });

      const checkbox = container.querySelector("input")!;
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change"));

      expect(checked.get()).toBe(true);
    });
  });

  describe("radio buttons", () => {
    it("binds signal to radio button selection", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <input type="radio" name="choice" value="a" data-volt-model="selected" />
        <input type="radio" name="choice" value="b" data-volt-model="selected" />
      `;

      const selected = signal("b");
      mount(container, { selected });

      const radios = container.querySelectorAll("input");
      expect(radios[0].checked).toBe(false);
      expect(radios[1].checked).toBe(true);
    });

    it("updates signal when radio is selected", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <input type="radio" name="option" value="x" data-volt-model="choice" />
        <input type="radio" name="option" value="y" data-volt-model="choice" />
      `;

      const choice = signal("x");
      mount(container, { choice });

      const radios = container.querySelectorAll("input");
      radios[1].checked = true;
      radios[1].dispatchEvent(new Event("change"));

      expect(choice.get()).toBe("y");
    });
  });

  describe("select elements", () => {
    it("binds signal to select value", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <select data-volt-model="color">
          <option value="red">Red</option>
          <option value="blue">Blue</option>
        </select>
      `;

      const color = signal("blue");
      mount(container, { color });

      const select = container.querySelector("select")!;
      expect(select.value).toBe("blue");
    });

    it("updates select when signal changes", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <select data-volt-model="size">
          <option value="s">Small</option>
          <option value="m">Medium</option>
          <option value="l">Large</option>
        </select>
      `;

      const size = signal("s");
      mount(container, { size });

      const select = container.querySelector("select")!;
      expect(select.value).toBe("s");

      size.set("l");
      expect(select.value).toBe("l");
    });

    it("updates signal when selection changes", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <select data-volt-model="fruit">
          <option value="apple">Apple</option>
          <option value="banana">Banana</option>
        </select>
      `;

      const fruit = signal("apple");
      mount(container, { fruit });

      const select = container.querySelector("select")!;
      select.value = "banana";
      select.dispatchEvent(new Event("input"));

      expect(fruit.get()).toBe("banana");
    });
  });

  describe("textarea elements", () => {
    it("binds signal to textarea value", () => {
      const container = document.createElement("div");
      container.innerHTML = `<textarea data-volt-model="content"></textarea>`;

      const content = signal("Hello World");
      mount(container, { content });

      const textarea = container.querySelector("textarea")!;
      expect(textarea.value).toBe("Hello World");
    });

    it("updates textarea when signal changes", () => {
      const container = document.createElement("div");
      container.innerHTML = `<textarea data-volt-model="notes"></textarea>`;

      const notes = signal("Initial");
      mount(container, { notes });

      const textarea = container.querySelector("textarea")!;
      expect(textarea.value).toBe("Initial");

      notes.set("Updated");
      expect(textarea.value).toBe("Updated");
    });

    it("updates signal when textarea changes", () => {
      const container = document.createElement("div");
      container.innerHTML = `<textarea data-volt-model="message"></textarea>`;

      const message = signal("");
      mount(container, { message });

      const textarea = container.querySelector("textarea")!;
      textarea.value = "New content";
      textarea.dispatchEvent(new Event("input"));

      expect(message.get()).toBe("New content");
    });
  });
});

describe("data-volt-bind:attr binding", () => {
  describe("boolean attributes", () => {
    it("binds disabled attribute", () => {
      const container = document.createElement("div");
      container.innerHTML = `<button data-volt-bind:disabled="isDisabled">Click</button>`;

      const isDisabled = signal(true);
      mount(container, { isDisabled });

      const button = container.querySelector("button")!;
      expect(button.hasAttribute("disabled")).toBe(true);

      isDisabled.set(false);
      expect(button.hasAttribute("disabled")).toBe(false);
    });

    it("binds readonly attribute", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input data-volt-bind:readonly="locked" />`;

      const locked = signal(false);
      mount(container, { locked });

      const input = container.querySelector("input")!;
      expect(input.hasAttribute("readonly")).toBe(false);

      locked.set(true);
      expect(input.hasAttribute("readonly")).toBe(true);
    });

    it("binds checked attribute", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input type="checkbox" data-volt-bind:checked="isChecked" />`;

      const isChecked = signal(true);
      mount(container, { isChecked });

      const input = container.querySelector("input")!;
      expect(input.hasAttribute("checked")).toBe(true);
    });

    it("binds required attribute", () => {
      const container = document.createElement("div");
      container.innerHTML = `<input data-volt-bind:required="mandatory" />`;

      const mandatory = signal(true);
      mount(container, { mandatory });

      const input = container.querySelector("input")!;
      expect(input.hasAttribute("required")).toBe(true);
    });
  });

  describe("string attributes", () => {
    it("binds href attribute", () => {
      const container = document.createElement("div");
      container.innerHTML = `<a data-volt-bind:href="url">Link</a>`;

      const url = signal("https://example.com");
      mount(container, { url });

      const link = container.querySelector("a")!;
      expect(link.getAttribute("href")).toBe("https://example.com");

      url.set("https://volt.js.org");
      expect(link.getAttribute("href")).toBe("https://volt.js.org");
    });

    it("binds src attribute", () => {
      const container = document.createElement("div");
      container.innerHTML = `<img data-volt-bind:src="image" />`;

      const image = signal("/placeholder.png");
      mount(container, { image });

      const img = container.querySelector("img")!;
      expect(img.getAttribute("src")).toBe("/placeholder.png");
    });

    it("binds title attribute", () => {
      const container = document.createElement("div");
      container.innerHTML = `<span data-volt-bind:title="tooltip">Hover me</span>`;

      const tooltip = signal("Help text");
      mount(container, { tooltip });

      const span = container.querySelector("span")!;
      expect(span.getAttribute("title")).toBe("Help text");
    });

    it("binds aria-label attribute", () => {
      const container = document.createElement("div");
      container.innerHTML = `<button data-volt-bind:aria-label="label">Icon</button>`;

      const label = signal("Close");
      mount(container, { label });

      const button = container.querySelector("button")!;
      expect(button.getAttribute("aria-label")).toBe("Close");
    });
  });

  describe("dynamic values", () => {
    it("updates attribute when expression changes", () => {
      const container = document.createElement("div");
      container.innerHTML = `<a data-volt-bind:href="baseUrl">Link</a>`;

      const baseUrl = signal("/page1");
      mount(container, { baseUrl });

      const link = container.querySelector("a")!;
      expect(link.getAttribute("href")).toBe("/page1");

      baseUrl.set("/page2");
      expect(link.getAttribute("href")).toBe("/page2");
    });

    it("removes attribute when value is null/undefined/false", () => {
      const container = document.createElement("div");
      container.innerHTML = `<div data-volt-bind:data-value="value">Content</div>`;

      const value = signal("present");
      mount(container, { value });

      const div = container.children[0] as HTMLElement;
      expect(div.dataset.value).toBe("present");

      // @ts-expect-error incorrect type is intentional
      value.set(null);
      expect(Object.hasOwn(div.dataset, "value")).toBe(false);
    });

    it("handles expressions", () => {
      const container = document.createElement("div");
      container.innerHTML = `<button data-volt-bind:disabled="count > 5">Submit</button>`;

      const count = signal(3);
      mount(container, { count });

      const button = container.querySelector("button")!;
      expect(button.hasAttribute("disabled")).toBe(false);

      count.set(10);
      expect(button.hasAttribute("disabled")).toBe(true);
    });
  });
});

describe("data-volt-else binding", () => {
  it("shows else branch when if condition is false", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="show">If content</p>
        <p data-volt-else>Else content</p>
      </div>
    `;

    const show = signal(false);
    mount(container, { show });

    expect(container.textContent).toContain("Else content");
    expect(container.textContent).not.toContain("If content");
  });

  it("shows if branch when condition is true", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="show">If content</p>
        <p data-volt-else>Else content</p>
      </div>
    `;

    const show = signal(true);
    mount(container, { show });

    expect(container.textContent).toContain("If content");
    expect(container.textContent).not.toContain("Else content");
  });

  it("toggles between if and else branches", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <span data-volt-if="visible">Visible</span>
        <span data-volt-else>Hidden</span>
      </div>
    `;

    const visible = signal(true);
    mount(container, { visible });

    expect(container.textContent).toContain("Visible");
    expect(container.textContent).not.toContain("Hidden");

    visible.set(false);
    expect(container.textContent).not.toContain("Visible");
    expect(container.textContent).toContain("Hidden");

    visible.set(true);
    expect(container.textContent).toContain("Visible");
    expect(container.textContent).not.toContain("Hidden");
  });

  it("supports bindings in else branch", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="show" data-volt-text="ifMessage"></p>
        <p data-volt-else data-volt-text="elseMessage"></p>
      </div>
    `;

    const show = signal(false);
    const ifMessage = signal("If text");
    const elseMessage = signal("Else text");

    mount(container, { show, ifMessage, elseMessage });

    expect(container.querySelector("p")?.textContent).toBe("Else text");

    show.set(true);
    expect(container.querySelector("p")?.textContent).toBe("If text");
  });

  it("maintains separate state for each branch", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <div data-volt-if="mode">
          <span data-volt-text="ifValue"></span>
        </div>
        <div data-volt-else>
          <span data-volt-text="elseValue"></span>
        </div>
      </div>
    `;

    const mode = signal(true);
    const ifValue = signal("If");
    const elseValue = signal("Else");

    mount(container, { mode, ifValue, elseValue });

    expect(container.querySelector("span")?.textContent).toBe("If");

    mode.set(false);
    expect(container.querySelector("span")?.textContent).toBe("Else");

    ifValue.set("Changed If");
    mode.set(true);
    expect(container.querySelector("span")?.textContent).toBe("Changed If");
  });

  it("handles else without bindings", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="condition">Condition true</p>
        <p data-volt-else>No condition</p>
      </div>
    `;

    const condition = signal(false);
    mount(container, { condition });

    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0].textContent).toBe("No condition");
  });

  it("properly cleans up when switching branches", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <div data-volt-if="branch">
          <span data-volt-text="message">If</span>
        </div>
        <div data-volt-else>
          <span data-volt-text="message">Else</span>
        </div>
      </div>
    `;

    const branch = signal(true);
    const message = signal("Test");

    const cleanup = mount(container, { branch, message });

    expect(container.querySelector("span")?.textContent).toBe("Test");

    message.set("Updated");
    expect(container.querySelector("span")?.textContent).toBe("Updated");

    branch.set(false);
    expect(container.querySelector("span")?.textContent).toBe("Updated");

    cleanup();

    message.set("After cleanup");
    expect(container.querySelector("span")?.textContent).toBe("Updated");
  });
});
