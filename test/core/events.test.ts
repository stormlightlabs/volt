import { describe, expect, it, vi } from "vitest";
import { mount } from "../../src/core/binder";
import { signal } from "../../src/core/signal";

describe("event bindings", () => {
  it("binds click events", () => {
    const button = document.createElement("button");
    button.dataset.xOnClick = "handleClick";

    const handleClick = vi.fn();
    mount(button, { handleClick });

    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("provides $event to the handler", () => {
    const button = document.createElement("button");
    button.dataset.xOnClick = "handleClick";

    const handleClick = vi.fn();
    mount(button, { handleClick });

    button.click();

    expect(handleClick).toHaveBeenCalledWith(expect.any(Event));
  });

  it("provides $el in the scope", () => {
    const button = document.createElement("button");
    button.dataset.xOnClick = "clicked";

    const clicked = signal(false);
    button.dataset.xOnClick = "setClicked";

    const setClicked = vi.fn(() => {
      clicked.set(true);
    });

    mount(button, { setClicked, clicked });

    button.click();

    expect(clicked.get()).toBe(true);
    expect(setClicked).toHaveBeenCalled();
  });

  it("handles input events", () => {
    const input = document.createElement("input");
    input.dataset.xOnInput = "handleInput";

    const handleInput = vi.fn();
    mount(input, { handleInput });

    input.value = "test";
    input.dispatchEvent(new Event("input"));

    expect(handleInput).toHaveBeenCalledTimes(1);
  });

  it("cleans up event listeners on unmount", () => {
    const button = document.createElement("button");
    button.dataset.xOnClick = "handleClick";

    const handleClick = vi.fn();
    const cleanup = mount(button, { handleClick });

    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);

    cleanup();

    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("supports multiple event bindings on the same element", () => {
    const button = document.createElement("button");
    button.dataset.xOnClick = "handleClick";
    button.dataset.xOnMouseover = "handleMouseover";

    const handleClick = vi.fn();
    const handleMouseover = vi.fn();

    mount(button, { handleClick, handleMouseover });

    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleMouseover).not.toHaveBeenCalled();

    button.dispatchEvent(new MouseEvent("mouseover"));
    expect(handleMouseover).toHaveBeenCalledTimes(1);
  });

  it("can update signals in event handlers", () => {
    const button = document.createElement("button");
    button.dataset.xOnClick = "increment";

    const count = signal(0);
    const increment = () => {
      count.set(count.get() + 1);
    };

    mount(button, { increment, count });

    expect(count.get()).toBe(0);

    button.click();
    expect(count.get()).toBe(1);

    button.click();
    expect(count.get()).toBe(2);
  });

  it("handles submit events", () => {
    const form = document.createElement("form");
    form.dataset.xOnSubmit = "handleSubmit";

    const handleSubmit = vi.fn((event) => {
      event.preventDefault();
    });

    mount(form, { handleSubmit });

    const submitEvent = new Event("submit", { cancelable: true });
    form.dispatchEvent(submitEvent);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(submitEvent.defaultPrevented).toBe(true);
  });

  it("handles change events on inputs", () => {
    const input = document.createElement("input");
    input.dataset.xOnChange = "handleChange";

    const handleChange = vi.fn();
    mount(input, { handleChange });

    input.dispatchEvent(new Event("change"));

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("can access element properties via $el", () => {
    const input = document.createElement("input");
    input.value = "initial";
    input.dataset.xOnInput = "updateValue";

    const value = signal("");
    const updateValue = vi.fn(() => {
      value.set((input as HTMLInputElement).value);
    });

    mount(input, { updateValue, value });

    input.value = "changed";
    input.dispatchEvent(new Event("input"));

    expect(value.get()).toBe("changed");
  });
});
