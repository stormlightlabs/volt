import { mount } from "$core/binder";
import { extractDeps } from "$core/shared";
import { signal } from "$core/signal";
import { describe, expect, it } from "vitest";

describe("data-volt-if binding", () => {
  it("shows element when condition is truthy", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="show" data-volt-text="message">Hidden</p>
      </div>
    `;

    const show = signal(true);
    const message = "Visible!";

    mount(container, { show, message });

    const paragraph = container.querySelector("p");
    expect(paragraph).toBeTruthy();
    expect(paragraph?.textContent).toBe("Visible!");
  });

  it("hides element when condition is falsy", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="show">Should not appear</p>
      </div>
    `;

    const show = signal(false);
    mount(container, { show });

    const paragraph = container.querySelector("p");
    expect(paragraph).toBeNull();
  });

  it("toggles element visibility when signal changes", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <span data-volt-if="visible">Toggle Me</span>
      </div>
    `;

    const visible = signal(false);
    mount(container, { visible });

    expect(container.querySelector("span")).toBeNull();

    visible.set(true);
    expect(container.querySelector("span")).toBeTruthy();
    expect(container.querySelector("span")?.textContent).toBe("Toggle Me");

    visible.set(false);
    expect(container.querySelector("span")).toBeNull();

    visible.set(true);
    expect(container.querySelector("span")).toBeTruthy();
  });

  it("works with static truthy values", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="alwaysTrue">Always visible</p>
      </div>
    `;

    mount(container, { alwaysTrue: true });

    const paragraph = container.querySelector("p");
    expect(paragraph).toBeTruthy();
    expect(paragraph?.textContent).toBe("Always visible");
  });

  it("works with static falsy values", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="alwaysFalse">Never visible</p>
      </div>
    `;

    mount(container, { alwaysFalse: false });

    expect(container.querySelector("p")).toBeNull();
  });

  it("preserves element bindings when re-rendering", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <div data-volt-if="show">
          <span data-volt-text="message">Default</span>
        </div>
      </div>
    `;

    const show = signal(true);
    const message = signal("First");

    mount(container, { show, message });

    expect(container.querySelector("span")?.textContent).toBe("First");

    message.set("Second");
    expect(container.querySelector("span")?.textContent).toBe("Second");

    show.set(false);
    expect(container.querySelector("div[data-volt-if]")).toBeNull();

    message.set("Third");
    show.set(true);

    expect(container.querySelector("span")?.textContent).toBe("Third");
  });

  it("handles nested bindings correctly", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <div data-volt-if="showOuter">
          <p>Outer</p>
          <div data-volt-if="showInner">
            <p>Inner</p>
          </div>
        </div>
      </div>
    `;

    const showOuter = signal(true);
    const showInner = signal(true);

    mount(container, { showOuter, showInner });

    expect(container.textContent?.trim()).toContain("Outer");
    expect(container.textContent?.trim()).toContain("Inner");

    showInner.set(false);
    expect(container.textContent?.trim()).toContain("Outer");
    expect(container.textContent?.trim()).not.toContain("Inner");

    showOuter.set(false);
    expect(container.textContent?.trim()).not.toContain("Outer");
    expect(container.textContent?.trim()).not.toContain("Inner");

    showOuter.set(true);
    expect(container.textContent?.trim()).toContain("Outer");
    expect(container.textContent?.trim()).not.toContain("Inner");

    showInner.set(true);
    expect(container.textContent?.trim()).toContain("Outer");
    expect(container.textContent?.trim()).toContain("Inner");
  });

  it("properly cleans up when unmounting", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="show" data-volt-text="message">Hidden</p>
      </div>
    `;

    const show = signal(true);
    const message = signal("Hello");

    const cleanup = mount(container, { show, message });

    expect(container.querySelector("p")?.textContent).toBe("Hello");

    const elementBeforeCleanup = container.querySelector("p");

    cleanup();

    message.set("Changed");
    expect(elementBeforeCleanup?.textContent).toBe("Hello");

    show.set(false);
    expect(container.querySelector("p")).toBe(elementBeforeCleanup);
  });

  it("handles event handlers correctly", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <button data-volt-if="show" data-volt-on-click="handleClick">Click Me</button>
      </div>
    `;

    let clicked = false;
    const handleClick = () => {
      clicked = true;
    };
    const show = signal(true);

    mount(container, { show, handleClick });

    const button = container.querySelector("button");
    expect(button).toBeTruthy();

    button?.click();
    expect(clicked).toBe(true);

    show.set(false);
    expect(container.querySelector("button")).toBeNull();

    clicked = false;
    show.set(true);
    container.querySelector("button")?.click();
    expect(clicked).toBe(true);
  });

  it("works with property paths", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="user.isActive">User is active</p>
      </div>
    `;

    const user = { isActive: signal(true) };
    mount(container, { user });

    expect(container.querySelector("p")).toBeTruthy();

    user.isActive.set(false);
    expect(container.querySelector("p")).toBeNull();

    user.isActive.set(true);
    expect(container.querySelector("p")).toBeTruthy();
  });

  it("evaluates truthy and falsy values correctly", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p id="zero" data-volt-if="zero">0</p>
        <p id="empty" data-volt-if="empty">Empty</p>
        <p id="one" data-volt-if="one">1</p>
        <p id="string" data-volt-if="string">String</p>
      </div>
    `;

    mount(container, { zero: signal(0), empty: signal(""), one: signal(1), string: signal("text") });

    expect(container.querySelector("#zero")).toBeNull();
    expect(container.querySelector("#empty")).toBeNull();
    expect(container.querySelector("#one")).toBeTruthy();
    expect(container.querySelector("#string")).toBeTruthy();
  });

  it("reacts to complex expressions with multiple signal dependencies", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div>
        <p data-volt-if="value.length > 0 && !isValid">Error message</p>
      </div>
    `;

    const value = signal("");
    const isValid = signal(true);
    const scope = { value, isValid };
    const deps = extractDeps("value.length > 0 && !isValid", scope);
    expect(deps.length).toBe(2);
    expect(deps).toContain(value);
    expect(deps).toContain(isValid);

    mount(container, scope);
    expect(container.querySelector("p")).toBeNull();

    value.set("test");
    expect(container.querySelector("p")).toBeNull();

    isValid.set(false);
    expect(container.querySelector("p")).toBeTruthy();
    expect(container.querySelector("p")?.textContent).toBe("Error message");

    value.set("");
    expect(container.querySelector("p")).toBeNull();

    value.set("test");
    expect(container.querySelector("p")).toBeTruthy();

    isValid.set(true);
    expect(container.querySelector("p")).toBeNull();
  });
});
