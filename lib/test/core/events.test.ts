import { mount } from "@volt/core/binder";
import { signal } from "@volt/core/signal";
import { describe, expect, it, vi } from "vitest";

describe("event bindings", () => {
  it("binds click events", () => {
    const button = document.createElement("button");
    button.dataset.voltOnClick = "handleClick";

    const handleClick = vi.fn();
    mount(button, { handleClick });

    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("provides $event to the handler", () => {
    const button = document.createElement("button");
    button.dataset.voltOnClick = "handleClick";

    const handleClick = vi.fn();
    mount(button, { handleClick });

    button.click();

    expect(handleClick).toHaveBeenCalledWith(expect.any(Event));
  });

  it("provides $el in the scope", () => {
    const button = document.createElement("button");
    button.dataset.voltOnClick = "clicked";

    const clicked = signal(false);
    button.dataset.voltOnClick = "setClicked";

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
    input.dataset.voltOnInput = "handleInput";

    const handleInput = vi.fn();
    mount(input, { handleInput });

    input.value = "test";
    input.dispatchEvent(new Event("input"));

    expect(handleInput).toHaveBeenCalledTimes(1);
  });

  it("cleans up event listeners on unmount", () => {
    const button = document.createElement("button");
    button.dataset.voltOnClick = "handleClick";

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
    button.dataset.voltOnClick = "handleClick";
    button.dataset.voltOnMouseover = "handleMouseover";

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
    button.dataset.voltOnClick = "increment";

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
    form.dataset.voltOnSubmit = "handleSubmit";

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
    input.dataset.voltOnChange = "handleChange";

    const handleChange = vi.fn();
    mount(input, { handleChange });

    input.dispatchEvent(new Event("change"));

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("can access element properties via $el", () => {
    const input = document.createElement("input");
    input.value = "initial";
    input.dataset.voltOnInput = "updateValue";

    const value = signal("");
    const updateValue = vi.fn(() => {
      value.set((input as HTMLInputElement).value);
    });

    mount(input, { updateValue, value });

    input.value = "changed";
    input.dispatchEvent(new Event("input"));

    expect(value.get()).toBe("changed");
  });

  describe("$el edge cases", () => {
    it("$el is available in inline expressions", () => {
      const button = document.createElement("button");
      button.id = "test-button";
      button.dataset.voltOnClick = "elementId.set($el.id)";

      const elementId = signal("");
      mount(button, { elementId });

      button.click();

      expect(elementId.get()).toBe("test-button");
    });

    it("can access element properties via $el in expressions", () => {
      const input = document.createElement("input");
      input.value = "initial";
      input.dataset.voltOnInput = "value.set($el.value)";

      const value = signal("");
      mount(input, { value });

      input.value = "changed";
      input.dispatchEvent(new Event("input"));

      expect(value.get()).toBe("changed");
    });

    it("$el persists across multiple event triggers", () => {
      const button = document.createElement("button");
      button.id = "btn";
      button.dataset.voltOnClick = "ids.set([...ids.get(), $el.id])";

      const ids = signal([] as string[]);
      mount(button, { ids });

      button.click();
      button.click();

      expect(ids.get()).toEqual(["btn", "btn"]);
    });
  });

  describe("$event edge cases", () => {
    it("can access event type via $event", () => {
      const input = document.createElement("input");
      input.dataset.voltOnInput = "eventType.set($event.type)";

      const eventType = signal("");
      mount(input, { eventType });

      input.dispatchEvent(new Event("input"));

      expect(eventType.get()).toBe("input");
    });

    it("$event.preventDefault works in expressions", () => {
      const form = document.createElement("form");
      form.dataset.voltOnSubmit = "handleSubmit";

      const handleSubmit = (event: Event) => {
        event.preventDefault();
      };

      mount(form, { handleSubmit });

      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
    });

    it("can access event properties in expressions", () => {
      const button = document.createElement("button");
      button.dataset.voltOnClick = "wasShiftKey.set($event.shiftKey)";

      const wasShiftKey = signal(false);
      mount(button, { wasShiftKey });

      const mouseEvent = new MouseEvent("click", { shiftKey: true });
      button.dispatchEvent(mouseEvent);

      expect(wasShiftKey.get()).toBe(true);
    });
  });

  describe("$el and $event interaction", () => {
    it("both $el and $event are available together", () => {
      const input = document.createElement("input");
      input.id = "test-input";
      input.dataset.voltOnInput = "data.set({ id: $el.id, type: $event.type })";

      const data = signal({} as { id: string; type: string });
      mount(input, { data });

      input.dispatchEvent(new Event("input"));

      expect(data.get()).toEqual({ id: "test-input", type: "input" });
    });
  });
});
