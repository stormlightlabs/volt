import { describe, expect, it, vi } from "vitest";
import { signal } from "../../src/core/signal";

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
