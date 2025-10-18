import { computed, effect, signal } from "@volt/core/signal";
import { describe, expect, it, vi } from "vitest";

describe("signal", () => {
  it("creates a signal with an initial value", () => {
    const count = signal(0);
    expect(count.get()).toBe(0);
  });

  it("updates the value with set", () => {
    const count = signal(0);
    count.set(5);
    expect(count.get()).toBe(5);
  });

  it("notifies subscribers when value changes", () => {
    const count = signal(0);
    const subscriber = vi.fn();

    count.subscribe(subscriber);
    count.set(10);

    expect(subscriber).toHaveBeenCalledWith(10);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("does not notify subscribers when value is the same", () => {
    const count = signal(0);
    const subscriber = vi.fn();

    count.subscribe(subscriber);
    count.set(0);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("supports multiple subscribers", () => {
    const count = signal(0);
    const subscriber1 = vi.fn();
    const subscriber2 = vi.fn();

    count.subscribe(subscriber1);
    count.subscribe(subscriber2);
    count.set(5);

    expect(subscriber1).toHaveBeenCalledWith(5);
    expect(subscriber2).toHaveBeenCalledWith(5);
  });

  it("allows unsubscribing", () => {
    const count = signal(0);
    const subscriber = vi.fn();

    const unsubscribe = count.subscribe(subscriber);
    unsubscribe();
    count.set(10);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("notifies immediately on each update", () => {
    const count = signal(0);
    const subscriber = vi.fn();

    count.subscribe(subscriber);

    count.set(1);
    count.set(2);
    count.set(3);

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(subscriber).toHaveBeenNthCalledWith(1, 1);
    expect(subscriber).toHaveBeenNthCalledWith(2, 2);
    expect(subscriber).toHaveBeenNthCalledWith(3, 3);
  });

  it("handles object values", () => {
    const object = signal({ count: 0 });
    const subscriber = vi.fn();

    object.subscribe(subscriber);

    const newValue = { count: 1 };
    object.set(newValue);

    expect(object.get()).toBe(newValue);
  });

  it("handles array values", () => {
    const array = signal([1, 2, 3]);
    const subscriber = vi.fn();

    array.subscribe(subscriber);

    const newValue = [4, 5, 6];
    array.set(newValue);

    expect(array.get()).toEqual([4, 5, 6]);
  });

  it("allows updating to null or undefined", () => {
    const value = signal<string | null | undefined>("test");

    value.set(null);
    expect(value.get()).toBe(null);

    value.set(undefined);
    expect(value.get()).toBe(undefined);
  });

  it("handles rapid subscribe/unsubscribe", () => {
    const count = signal(0);
    const subscriber = vi.fn();

    const unsub = count.subscribe(subscriber);
    unsub();
    count.subscribe(subscriber);

    count.set(5);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(5);
  });
});

describe("computed", () => {
  it("computes initial value", () => {
    const count = signal(5);
    const doubled = computed(() => count.get() * 2, [count]);

    expect(doubled.get()).toBe(10);
  });

  it("recomputes when dependency changes", () => {
    const count = signal(5);
    const doubled = computed(() => count.get() * 2, [count]);

    expect(doubled.get()).toBe(10);

    count.set(10);
    expect(doubled.get()).toBe(20);

    count.set(0);
    expect(doubled.get()).toBe(0);
  });

  it("notifies subscribers when value changes", () => {
    const count = signal(5);
    const doubled = computed(() => count.get() * 2, [count]);
    const subscriber = vi.fn();

    doubled.subscribe(subscriber);

    count.set(10);
    expect(subscriber).toHaveBeenCalledWith(20);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("does not notify when computed value is the same", () => {
    const count = signal(5);
    const isPositive = computed(() => count.get() > 0, [count]);
    const subscriber = vi.fn();

    isPositive.subscribe(subscriber);

    count.set(10);
    expect(subscriber).not.toHaveBeenCalled();

    count.set(-1);
    expect(subscriber).toHaveBeenCalledWith(false);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("supports multiple dependencies", () => {
    const a = signal(2);
    const b = signal(3);
    const sum = computed(() => a.get() + b.get(), [a, b]);

    expect(sum.get()).toBe(5);

    a.set(5);
    expect(sum.get()).toBe(8);

    b.set(10);
    expect(sum.get()).toBe(15);
  });

  it("can depend on other computed signals", () => {
    const count = signal(2);
    const doubled = computed(() => count.get() * 2, [count]);
    const quadrupled = computed(() => doubled.get() * 2, [doubled]);

    expect(quadrupled.get()).toBe(8);

    count.set(5);
    expect(doubled.get()).toBe(10);
    expect(quadrupled.get()).toBe(20);
  });

  it("allows unsubscribing", () => {
    const count = signal(5);
    const doubled = computed(() => count.get() * 2, [count]);
    const subscriber = vi.fn();

    const unsubscribe = doubled.subscribe(subscriber);
    unsubscribe();

    count.set(10);
    expect(subscriber).not.toHaveBeenCalled();
  });
});

describe("effect", () => {
  it("runs immediately on creation", () => {
    const count = signal(0);
    const effectFunction = vi.fn();

    effect(effectFunction, [count]);
    expect(effectFunction).toHaveBeenCalledTimes(1);
  });

  it("runs when dependency changes", () => {
    const count = signal(0);
    const effectFunction = vi.fn();

    effect(effectFunction, [count]);

    count.set(1);
    count.set(2);

    expect(effectFunction).toHaveBeenCalledTimes(3);
  });

  it("can be cleaned up", () => {
    const count = signal(0);
    const effectFunction = vi.fn();

    const cleanup = effect(effectFunction, [count]);

    expect(effectFunction).toHaveBeenCalledTimes(1);

    cleanup();

    count.set(1);
    expect(effectFunction).toHaveBeenCalledTimes(1);
  });

  it("runs cleanup function from previous effect", () => {
    const count = signal(0);
    const innerCleanup = vi.fn();
    const effectFunction = vi.fn(() => innerCleanup);

    effect(effectFunction, [count]);

    expect(innerCleanup).not.toHaveBeenCalled();

    count.set(1);
    expect(innerCleanup).toHaveBeenCalledTimes(1);

    count.set(2);
    expect(innerCleanup).toHaveBeenCalledTimes(2);
  });

  it("runs final cleanup when effect is disposed", () => {
    const count = signal(0);
    const innerCleanup = vi.fn();
    const effectFunction = vi.fn(() => innerCleanup);

    const cleanup = effect(effectFunction, [count]);

    count.set(1);
    expect(innerCleanup).toHaveBeenCalledTimes(1);

    cleanup();
    expect(innerCleanup).toHaveBeenCalledTimes(2);
  });

  it("supports multiple dependencies", () => {
    const a = signal(1);
    const b = signal(2);
    const effectFunction = vi.fn();

    effect(effectFunction, [a, b]);

    expect(effectFunction).toHaveBeenCalledTimes(1);

    a.set(5);
    expect(effectFunction).toHaveBeenCalledTimes(2);

    b.set(10);
    expect(effectFunction).toHaveBeenCalledTimes(3);
  });

  it("can depend on computed signals", () => {
    const count = signal(2);
    const doubled = computed(() => count.get() * 2, [count]);
    const effectFunction = vi.fn();

    effect(effectFunction, [doubled]);

    expect(effectFunction).toHaveBeenCalledTimes(1);

    count.set(5);
    expect(effectFunction).toHaveBeenCalledTimes(2);
  });
});
