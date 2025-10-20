import { mount } from "$core/binder";
import { signal } from "$core/signal";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("event modifiers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe(".prevent modifier", () => {
    it("calls preventDefault on the event", () => {
      const form = document.createElement("form");
      form.dataset.voltOnSubmit = "handleSubmit";
      form.dataset.voltOnSubmitPrevent = "";

      const handleSubmit = vi.fn();
      mount(form, { handleSubmit });

      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
      expect(handleSubmit).toHaveBeenCalled();
    });

    it("works with inline expressions", () => {
      const button = document.createElement("button");
      button.dataset.voltOnClickPrevent = "count.set(count.get() + 1)";

      const count = signal(0);
      mount(button, { count });

      const clickEvent = new MouseEvent("click", { cancelable: true });
      button.dispatchEvent(clickEvent);

      expect(clickEvent.defaultPrevented).toBe(true);
      expect(count.get()).toBe(1);
    });
  });

  describe(".stop modifier", () => {
    it("calls stopPropagation on the event", () => {
      const div = document.createElement("div");
      const button = document.createElement("button");
      button.dataset.voltOnClickStop = "handleClick";
      div.append(button);

      const handleClick = vi.fn();
      const handleDivClick = vi.fn();

      mount(button, { handleClick });
      div.addEventListener("click", handleDivClick);

      button.click();

      expect(handleClick).toHaveBeenCalled();
      expect(handleDivClick).not.toHaveBeenCalled();
    });
  });

  describe(".self modifier", () => {
    it("only triggers when event.target is the bound element", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      div.dataset.voltOnClickSelf = "handleClick";
      div.append(span);

      const handleClick = vi.fn();
      mount(div, { handleClick });

      span.click();
      expect(handleClick).not.toHaveBeenCalled();

      div.click();
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe(".once modifier", () => {
    it("only triggers the handler once", () => {
      const button = document.createElement("button");
      button.dataset.voltOnClickOnce = "handleClick";

      const handleClick = vi.fn();
      mount(button, { handleClick });

      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);

      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe(".passive modifier", () => {
    it("adds passive event listener", () => {
      const div = document.createElement("div");
      div.dataset.voltOnScrollPassive = "handleScroll";

      const handleScroll = vi.fn();
      const addEventListenerSpy = vi.spyOn(div, "addEventListener");

      mount(div, { handleScroll });

      expect(addEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });
    });
  });

  describe(".window modifier", () => {
    it("attaches listener to window", () => {
      const button = document.createElement("button");
      button.dataset.voltOnResizeWindow = "handleResize";

      const handleResize = vi.fn();
      const cleanup = mount(button, { handleResize });

      globalThis.dispatchEvent(new Event("resize"));
      expect(handleResize).toHaveBeenCalled();

      cleanup();
    });

    it("still provides $el context", () => {
      const button = document.createElement("button");
      button.id = "test-button";
      button.dataset.voltOnClickWindow = "elementId.set($el.id)";

      const elementId = signal("");
      const cleanup = mount(button, { elementId });

      globalThis.dispatchEvent(new MouseEvent("click"));
      expect(elementId.get()).toBe("test-button");

      cleanup();
    });
  });

  describe(".document modifier", () => {
    it("attaches listener to document", () => {
      const button = document.createElement("button");
      button.dataset.voltOnClickDocument = "handleClick";

      const handleClick = vi.fn();
      const cleanup = mount(button, { handleClick });

      document.dispatchEvent(new MouseEvent("click"));
      expect(handleClick).toHaveBeenCalled();

      cleanup();
    });

    it("still provides $el context", () => {
      const button = document.createElement("button");
      button.id = "doc-button";
      button.dataset.voltOnKeydownDocument = "elementId.set($el.id)";

      const elementId = signal("");
      const cleanup = mount(button, { elementId });

      document.dispatchEvent(new KeyboardEvent("keydown"));
      expect(elementId.get()).toBe("doc-button");

      cleanup();
    });
  });

  describe(".debounce modifier", () => {
    it("debounces handler with default delay (300ms)", () => {
      const input = document.createElement("input");
      input.dataset.voltOnInputDebounce = "handleInput";

      const handleInput = vi.fn();
      mount(input, { handleInput });

      input.dispatchEvent(new Event("input"));
      expect(handleInput).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(handleInput).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(handleInput).toHaveBeenCalledTimes(1);
    });

    it("supports custom debounce delay", () => {
      const input = document.createElement("input");
      input.dataset.voltOnInputDebounce500 = "handleInput";

      const handleInput = vi.fn();
      mount(input, { handleInput });

      input.dispatchEvent(new Event("input"));
      vi.advanceTimersByTime(499);
      expect(handleInput).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(handleInput).toHaveBeenCalledTimes(1);
    });

    it("resets timer on subsequent events", () => {
      const input = document.createElement("input");
      input.dataset.voltOnInputDebounce100 = "handleInput";

      const handleInput = vi.fn();
      mount(input, { handleInput });

      input.dispatchEvent(new Event("input"));
      vi.advanceTimersByTime(50);

      input.dispatchEvent(new Event("input"));
      vi.advanceTimersByTime(50);
      expect(handleInput).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(handleInput).toHaveBeenCalledTimes(1);
    });

    it("cancels pending debounced calls on cleanup", () => {
      const input = document.createElement("input");
      input.dataset.voltOnInputDebounce100 = "handleInput";

      const handleInput = vi.fn();
      const cleanup = mount(input, { handleInput });

      input.dispatchEvent(new Event("input"));
      vi.advanceTimersByTime(50);

      cleanup();

      vi.advanceTimersByTime(100);
      expect(handleInput).not.toHaveBeenCalled();
    });
  });

  describe(".throttle modifier", () => {
    it("throttles handler with default delay (300ms)", () => {
      const button = document.createElement("button");
      button.dataset.voltOnClickThrottle = "handleClick";

      const handleClick = vi.fn();
      mount(button, { handleClick });

      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);

      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(300);
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it("supports custom throttle delay", () => {
      const button = document.createElement("button");
      button.dataset.voltOnClickThrottle100 = "handleClick";

      const handleClick = vi.fn();
      mount(button, { handleClick });

      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);

      button.click();
      vi.advanceTimersByTime(100);
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it("executes immediately on first call", () => {
      const button = document.createElement("button");
      button.dataset.voltOnClickThrottle100 = "handleClick";

      const handleClick = vi.fn();
      mount(button, { handleClick });

      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("cancels pending throttled calls on cleanup", () => {
      const button = document.createElement("button");
      button.dataset.voltOnClickThrottle100 = "handleClick";

      const handleClick = vi.fn();
      const cleanup = mount(button, { handleClick });

      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);

      button.click();
      cleanup();

      vi.advanceTimersByTime(100);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("modifier combinations", () => {
    it("combines .prevent and .stop", () => {
      const form = document.createElement("form");
      const button = document.createElement("button");
      button.type = "submit";
      button.dataset.voltOnClickPreventStop = "handleClick";
      form.append(button);

      const handleClick = vi.fn();
      const handleFormSubmit = vi.fn();

      mount(button, { handleClick });
      form.addEventListener("click", handleFormSubmit);

      const clickEvent = new MouseEvent("click", { cancelable: true, bubbles: true });
      button.dispatchEvent(clickEvent);

      expect(clickEvent.defaultPrevented).toBe(true);
      expect(handleClick).toHaveBeenCalled();
      expect(handleFormSubmit).not.toHaveBeenCalled();
    });

    it("combines .self and .prevent", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      div.dataset.voltOnClickSelfPrevent = "handleClick";
      div.append(span);

      const handleClick = vi.fn();
      mount(div, { handleClick });

      const spanEvent = new MouseEvent("click", { cancelable: true, bubbles: true });
      span.dispatchEvent(spanEvent);
      expect(handleClick).not.toHaveBeenCalled();
      expect(spanEvent.defaultPrevented).toBe(false);

      const divEvent = new MouseEvent("click", { cancelable: true });
      div.dispatchEvent(divEvent);
      expect(handleClick).toHaveBeenCalled();
      expect(divEvent.defaultPrevented).toBe(true);
    });

    it("combines .debounce with .prevent", () => {
      const form = document.createElement("form");
      form.dataset.voltOnSubmitDebounce100Prevent = "handleSubmit";

      const handleSubmit = vi.fn();
      mount(form, { handleSubmit });

      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
      expect(handleSubmit).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanup", () => {
    it("removes event listeners on unmount", () => {
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

    it("removes window event listeners on unmount", () => {
      const button = document.createElement("button");
      button.dataset.voltOnResizeWindow = "handleResize";

      const handleResize = vi.fn();
      const cleanup = mount(button, { handleResize });

      globalThis.dispatchEvent(new Event("resize"));
      expect(handleResize).toHaveBeenCalledTimes(1);

      cleanup();

      globalThis.dispatchEvent(new Event("resize"));
      expect(handleResize).toHaveBeenCalledTimes(1);
    });

    it("removes document event listeners on unmount", () => {
      const button = document.createElement("button");
      button.dataset.voltOnClickDocument = "handleClick";

      const handleClick = vi.fn();
      const cleanup = mount(button, { handleClick });

      document.dispatchEvent(new MouseEvent("click"));
      expect(handleClick).toHaveBeenCalledTimes(1);

      cleanup();

      document.dispatchEvent(new MouseEvent("click"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
