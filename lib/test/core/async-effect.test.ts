import { asyncEffect } from "$core/async-effect";
import { signal } from "$core/signal";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("asyncEffect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("basic async execution", () => {
    it("executes async effect immediately", async () => {
      const spy = vi.fn();
      const dependency = signal(0);

      asyncEffect(async () => {
        spy();
      }, [dependency]);

      await vi.runAllTimersAsync();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("executes when dependency changes", async () => {
      const spy = vi.fn();
      const dependency = signal(0);

      asyncEffect(async () => {
        spy(dependency.get());
      }, [dependency]);

      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledWith(0);

      dependency.set(1);
      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledWith(1);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("supports multiple dependencies", async () => {
      const spy = vi.fn();
      const dep1 = signal(1);
      const dep2 = signal(2);

      asyncEffect(async () => {
        spy(dep1.get(), dep2.get());
      }, [dep1, dep2]);

      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledWith(1, 2);

      dep1.set(10);
      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledWith(10, 2);

      dep2.set(20);
      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledWith(10, 20);

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it("handles cleanup functions", async () => {
      const cleanupSpy = vi.fn();
      const dependency = signal(0);

      asyncEffect(async () => {
        return () => {
          cleanupSpy();
        };
      }, [dependency]);

      await vi.runAllTimersAsync();

      dependency.set(1);
      await vi.runAllTimersAsync();

      expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });

    it("calls cleanup on unmount", async () => {
      const cleanupSpy = vi.fn();
      const dependency = signal(0);

      const unsubscribe = asyncEffect(async () => {
        return () => {
          cleanupSpy();
        };
      }, [dependency]);

      await vi.runAllTimersAsync();

      unsubscribe();
      await vi.runAllTimersAsync();

      expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("abort controller integration", () => {
    it("provides AbortSignal when abortable option is true", async () => {
      let receivedSignal: AbortSignal | undefined;
      const dependency = signal(0);

      asyncEffect(
        async (signal) => {
          receivedSignal = signal;
        },
        [dependency],
        { abortable: true },
      );

      await vi.runAllTimersAsync();

      expect(receivedSignal).toBeInstanceOf(AbortSignal);
      expect(receivedSignal?.aborted).toBe(false);
    });

    it("aborts previous effect when dependency changes", async () => {
      const signals: AbortSignal[] = [];
      const dependency = signal(0);

      asyncEffect(
        async (signal) => {
          if (signal) {
            signals.push(signal);
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        },
        [dependency],
        { abortable: true },
      );

      await vi.advanceTimersByTimeAsync(50);

      dependency.set(1);
      await vi.advanceTimersByTimeAsync(50);

      expect(signals).toHaveLength(2);
      expect(signals[0].aborted).toBe(true);
      expect(signals[1].aborted).toBe(false);
    });

    it("aborts on cleanup", async () => {
      let abortSignal: AbortSignal | undefined;
      const dependency = signal(0);

      const cleanup = asyncEffect(
        async (signal) => {
          abortSignal = signal;
        },
        [dependency],
        { abortable: true },
      );

      await vi.runAllTimersAsync();

      cleanup();

      expect(abortSignal?.aborted).toBe(true);
    });

    it("does not provide signal when abortable is false", async () => {
      const signals: (AbortSignal | undefined)[] = [];
      const dependency = signal(0);

      asyncEffect(
        async (signal) => {
          signals.push(signal);
        },
        [dependency],
        { abortable: false },
      );

      await vi.runAllTimersAsync();

      expect(signals).toHaveLength(1);
      expect(signals[0]).toBeUndefined();
    });
  });

  describe("race protection", () => {
    it("discards results from stale executions via execution ID check", async () => {
      const results: number[] = [];
      const dependency = signal(0);
      let currentExecutionId = 0;

      asyncEffect(async () => {
        const executionId = ++currentExecutionId;
        const value = dependency.get();
        const delay = value === 0 ? 100 : 10;
        await new Promise((resolve) => setTimeout(resolve, delay));

        if (executionId === currentExecutionId) {
          results.push(value);
        }
      }, [dependency]);

      await vi.advanceTimersByTimeAsync(50);

      dependency.set(1);

      await vi.runAllTimersAsync();

      expect(results.at(-1)).toBe(1);
    });

    it("tracks execution order with race conditions", async () => {
      const startTimes: number[] = [];
      const completionTimes: number[] = [];
      const dependency = signal(0);

      asyncEffect(async () => {
        const value = dependency.get();
        startTimes.push(value);
        await new Promise((resolve) => setTimeout(resolve, 50));
        completionTimes.push(value);
      }, [dependency]);

      await vi.advanceTimersByTimeAsync(10);
      dependency.set(1);

      await vi.advanceTimersByTimeAsync(10);
      dependency.set(2);

      await vi.runAllTimersAsync();

      expect(startTimes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("debounce", () => {
    it("delays execution until debounce period passes", async () => {
      const spy = vi.fn();
      const dependency = signal(0);

      asyncEffect(
        async () => {
          spy(dependency.get());
        },
        [dependency],
        { debounce: 300 },
      );

      expect(spy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(200);
      expect(spy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(100);
      expect(spy).toHaveBeenCalledWith(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("resets debounce timer on each dependency change", async () => {
      const spy = vi.fn();
      const dependency = signal(0);

      asyncEffect(
        async () => {
          spy(dependency.get());
        },
        [dependency],
        { debounce: 300 },
      );

      await vi.advanceTimersByTimeAsync(200);
      dependency.set(1);

      await vi.advanceTimersByTimeAsync(200);
      dependency.set(2);

      await vi.advanceTimersByTimeAsync(200);
      expect(spy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(100);
      expect(spy).toHaveBeenCalledWith(2);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("executes only once after multiple rapid changes", async () => {
      const spy = vi.fn();
      const dependency = signal(0);

      asyncEffect(
        async () => {
          spy(dependency.get());
        },
        [dependency],
        { debounce: 100 },
      );

      for (let i = 1; i <= 5; i++) {
        dependency.set(i);
        await vi.advanceTimersByTimeAsync(50);
      }

      await vi.runAllTimersAsync();

      expect(spy).toHaveBeenCalledWith(5);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttle", () => {
    it("limits execution frequency", async () => {
      const spy = vi.fn();
      const dependency = signal(0);

      asyncEffect(
        async () => {
          spy(dependency.get());
        },
        [dependency],
        { throttle: 200 },
      );

      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledTimes(1);

      dependency.set(1);
      await vi.advanceTimersByTimeAsync(100);
      expect(spy).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(100);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("executes immediately on first trigger", async () => {
      const spy = vi.fn();
      const dependency = signal(0);

      asyncEffect(
        async () => {
          spy(dependency.get());
        },
        [dependency],
        { throttle: 1000 },
      );

      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledWith(0);
    });

    it("queues one execution during throttle period", async () => {
      const spy = vi.fn();
      const dependency = signal(0);

      asyncEffect(
        async () => {
          spy(dependency.get());
        },
        [dependency],
        { throttle: 300 },
      );

      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledTimes(1);

      dependency.set(1);
      dependency.set(2);
      dependency.set(3);

      await vi.advanceTimersByTimeAsync(300);

      expect(spy).toHaveBeenCalledWith(3);
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("catches and logs errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const dependency = signal(0);

      asyncEffect(async () => {
        throw new Error("Test error");
      }, [dependency]);

      await vi.runAllTimersAsync();

      expect(consoleErrorSpy).toHaveBeenCalledWith("Caused by:", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it("calls onError handler", async () => {
      const errorHandler = vi.fn();
      const dependency = signal(0);

      asyncEffect(
        async () => {
          throw new Error("Test error");
        },
        [dependency],
        { onError: errorHandler },
      );

      await vi.runAllTimersAsync();

      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error), expect.any(Function));
    });

    it("retries on error when retries option is set", async () => {
      let attempts = 0;
      const dependency = signal(0);

      asyncEffect(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("Retry test");
          }
        },
        [dependency],
        { retries: 3 },
      );

      await vi.runAllTimersAsync();

      expect(attempts).toBe(3);
    });

    it("respects retry delay", async () => {
      let attempts = 0;
      const dependency = signal(0);

      asyncEffect(
        async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error("Retry test");
          }
        },
        [dependency],
        { retries: 2, retryDelay: 500 },
      );

      await vi.advanceTimersByTimeAsync(100);
      expect(attempts).toBe(1);

      await vi.advanceTimersByTimeAsync(500);
      expect(attempts).toBe(2);
    });

    it("allows manual retry via onError callback", async () => {
      let attempts = 0;
      const dependency = signal(0);

      asyncEffect(
        async () => {
          attempts++;
          if (attempts <= 2) {
            throw new Error("Retry test");
          }
        },
        [dependency],
        {
          retries: 1,
          onError: (_error, retry) => {
            if (attempts === 2) {
              retry();
            }
          },
        },
      );

      await vi.runAllTimersAsync();

      expect(attempts).toBe(3);
    });

    it("does not retry aborted operations", async () => {
      let attempts = 0;
      const dependency = signal(0);

      asyncEffect(
        async (signal) => {
          attempts++;
          signal?.addEventListener("abort", () => {
            throw new Error("Aborted");
          });
          await new Promise((resolve) => setTimeout(resolve, 100));
          signal?.dispatchEvent(new Event("abort"));
        },
        [dependency],
        { abortable: true, retries: 3 },
      );

      await vi.advanceTimersByTimeAsync(50);
      dependency.set(1);
      await vi.runAllTimersAsync();

      expect(attempts).toBe(2);
    });
  });

  describe("cleanup behavior", () => {
    it("cleans up debounce timers on unmount", async () => {
      const spy = vi.fn();
      const dependency = signal(0);

      const cleanup = asyncEffect(
        async () => {
          spy();
        },
        [dependency],
        { debounce: 1000 },
      );

      await vi.advanceTimersByTimeAsync(500);
      cleanup();
      await vi.runAllTimersAsync();

      expect(spy).not.toHaveBeenCalled();
    });

    it("cleans up throttle timers on unmount", async () => {
      const spy = vi.fn();
      const dependency = signal(0);

      const cleanup = asyncEffect(
        async () => {
          spy();
        },
        [dependency],
        { throttle: 1000 },
      );

      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledTimes(1);

      dependency.set(1);
      await vi.advanceTimersByTimeAsync(500);
      cleanup();
      await vi.runAllTimersAsync();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("unsubscribes from all dependencies on cleanup", async () => {
      const spy = vi.fn();
      const dep1 = signal(0);
      const dep2 = signal(0);

      const cleanup = asyncEffect(async () => {
        spy();
      }, [dep1, dep2]);

      await vi.runAllTimersAsync();
      expect(spy).toHaveBeenCalledTimes(1);

      cleanup();

      dep1.set(1);
      dep2.set(1);
      await vi.runAllTimersAsync();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("cleanup prevents new executions", async () => {
      const executionCount = vi.fn();
      const dependency = signal(0);

      const cleanup = asyncEffect(async () => {
        executionCount();
      }, [dependency]);

      await vi.runAllTimersAsync();
      const countAfterFirstRun = executionCount.mock.calls.length;

      cleanup();

      dependency.set(1);
      await vi.runAllTimersAsync();

      expect(executionCount).toHaveBeenCalledTimes(countAfterFirstRun);
    });
  });

  describe("complex scenarios", () => {
    it("combines debounce with abort", async () => {
      const spy = vi.fn();
      const signals: AbortSignal[] = [];
      const dependency = signal(0);

      asyncEffect(
        async (signal) => {
          if (signal) {
            signals.push(signal);
          }
          spy(dependency.get());
        },
        [dependency],
        { debounce: 200, abortable: true },
      );

      dependency.set(1);
      await vi.advanceTimersByTimeAsync(100);

      dependency.set(2);
      await vi.advanceTimersByTimeAsync(200);

      expect(spy).toHaveBeenCalledWith(2);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("combines throttle with error handling", async () => {
      let attempts = 0;
      const dependency = signal(0);

      asyncEffect(
        async () => {
          attempts++;
          if (attempts === 1) {
            throw new Error("First attempt fails");
          }
        },
        [dependency],
        { throttle: 100, retries: 1 },
      );

      await vi.runAllTimersAsync();

      expect(attempts).toBe(2);
    });

    it("handles rapid changes with all features enabled", async () => {
      const results: number[] = [];
      const dependency = signal(0);

      asyncEffect(
        async (signal) => {
          const value = dependency.get();
          await new Promise((resolve) => setTimeout(resolve, 50));
          if (!signal?.aborted) {
            results.push(value);
          }
        },
        [dependency],
        { debounce: 100, abortable: true, retries: 1 },
      );

      for (let i = 1; i <= 5; i++) {
        dependency.set(i);
        await vi.advanceTimersByTimeAsync(50);
      }

      await vi.runAllTimersAsync();

      expect(results).toEqual([5]);
    });
  });
});
