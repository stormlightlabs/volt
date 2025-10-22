import { mount } from "$core/binder";
import {
  clearStates,
  parseHttpConfig,
  request,
  serializeForm,
  serializeFormToJSON,
  setErrorState,
  setLoadingState,
  swap,
} from "$core/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("http", () => {
  describe("swap", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement("div");
      container.innerHTML = "<div id=\"target\">Original</div>";
      document.body.append(container);
    });

    it("swaps innerHTML by default", () => {
      const target = container.querySelector("#target")!;
      swap(target, "<span>New</span>");
      expect(target.innerHTML).toBe("<span>New</span>");
    });

    it("swaps innerHTML explicitly", () => {
      const target = container.querySelector("#target")!;
      swap(target, "<strong>Bold</strong>", "innerHTML");
      expect(target.innerHTML).toBe("<strong>Bold</strong>");
    });

    it("swaps outerHTML", () => {
      const target = container.querySelector("#target")!;
      swap(target, "<section id=\"new\">Replaced</section>", "outerHTML");
      expect(container.querySelector("#target")).toBeNull();
      expect(container.querySelector("#new")?.textContent).toBe("Replaced");
    });

    it("inserts beforebegin", () => {
      const target = container.querySelector("#target")!;
      swap(target, "<span id=\"before\">Before</span>", "beforebegin");
      expect(container.querySelector("#before")?.nextElementSibling?.id).toBe("target");
    });

    it("inserts afterbegin", () => {
      const target = container.querySelector("#target")!;
      swap(target, "<span id=\"first\">First</span>", "afterbegin");
      expect(target.firstElementChild?.id).toBe("first");
    });

    it("inserts beforeend", () => {
      const target = container.querySelector("#target")!;
      swap(target, "<span id=\"last\">Last</span>", "beforeend");
      expect(target.lastElementChild?.id).toBe("last");
    });

    it("inserts afterend", () => {
      const target = container.querySelector("#target")!;
      swap(target, "<span id=\"after\">After</span>", "afterend");
      expect(container.querySelector("#target")?.nextElementSibling?.id).toBe("after");
    });

    it("deletes the target element", () => {
      const target = container.querySelector("#target")!;
      swap(target, "", "delete");
      expect(container.querySelector("#target")).toBeNull();
    });

    it("does nothing with none strategy", () => {
      const target = container.querySelector("#target")!;
      const originalHTML = target.innerHTML;
      swap(target, "<span>Should not appear</span>", "none");
      expect(target.innerHTML).toBe(originalHTML);
    });

    describe("state preservation", () => {
      it("preserves focus when swapping innerHTML", () => {
        container.innerHTML = `
          <div id="target">
            <input id="input1" type="text" />
            <input id="input2" type="text" />
          </div>
        `;
        const target = container.querySelector("#target")!;
        const input2 = container.querySelector("#input2") as HTMLInputElement;
        input2.focus();

        expect(document.activeElement).toBe(input2);

        swap(
          target,
          `
          <input id="input1" type="text" />
          <input id="input2" type="text" />
        `,
          "innerHTML",
        );

        const newInput2 = container.querySelector("#input2") as HTMLInputElement;
        expect(document.activeElement).toBe(newInput2);
      });

      it("preserves input values when swapping innerHTML", () => {
        container.innerHTML = `
          <div id="target">
            <input id="name" type="text" value="initial" />
            <textarea id="bio">initial bio</textarea>
            <input id="agree" type="checkbox" checked />
          </div>
        `;
        const target = container.querySelector("#target")!;
        const nameInput = container.querySelector("#name") as HTMLInputElement;
        const bioInput = container.querySelector("#bio") as HTMLTextAreaElement;

        nameInput.value = "John Doe";
        bioInput.value = "Software developer";

        swap(
          target,
          `
          <input id="name" type="text" value="different" />
          <textarea id="bio">different bio</textarea>
          <input id="agree" type="checkbox" />
        `,
          "innerHTML",
        );

        const newNameInput = container.querySelector("#name") as HTMLInputElement;
        const newBioInput = container.querySelector("#bio") as HTMLTextAreaElement;
        const newAgreeInput = container.querySelector("#agree") as HTMLInputElement;

        expect(newNameInput.value).toBe("John Doe");
        expect(newBioInput.value).toBe("Software developer");
        expect(newAgreeInput.checked).toBe(true);
      });

      it("preserves scroll position when swapping innerHTML", () => {
        container.innerHTML = `
          <div id="target" style="height: 100px; overflow-y: scroll;">
            <div style="height: 500px;">
              <p>Scrollable content</p>
            </div>
          </div>
        `;
        const target = container.querySelector("#target")!;
        target.scrollTop = 50;

        swap(
          target,
          `
          <div style="height: 500px;">
            <p>New scrollable content</p>
          </div>
        `,
          "innerHTML",
        );

        expect(target.scrollTop).toBe(50);
      });

      it("preserves nested element scroll positions", () => {
        container.innerHTML = `
          <div id="target">
            <div id="nested" style="height: 100px; overflow-y: scroll;">
              <div style="height: 300px;">Content</div>
            </div>
          </div>
        `;
        const target = container.querySelector("#target")!;
        const nested = container.querySelector("#nested")!;
        nested.scrollTop = 75;

        swap(
          target,
          `
          <div id="nested" style="height: 100px; overflow-y: scroll;">
            <div style="height: 300px;">New content</div>
          </div>
        `,
          "innerHTML",
        );

        const newNested = container.querySelector("#nested")!;
        expect(newNested.scrollTop).toBe(75);
      });

      it("preserves state when swapping outerHTML", () => {
        container.innerHTML = `
          <div id="target">
            <input id="field" type="text" value="initial" />
          </div>
        `;
        const target = container.querySelector("#target")!;
        const field = container.querySelector("#field") as HTMLInputElement;
        field.value = "updated";
        field.focus();

        swap(
          target,
          `
          <div id="target">
            <input id="field" type="text" value="different" />
          </div>
        `,
          "outerHTML",
        );

        const newField = container.querySelector("#field") as HTMLInputElement;
        expect(newField.value).toBe("updated");
        expect(document.activeElement).toBe(newField);
      });

      it("does not attempt state preservation for insert strategies", () => {
        container.innerHTML = `
          <div id="target">
            <input id="existing" type="text" />
          </div>
        `;
        const target = container.querySelector("#target")!;
        const existing = container.querySelector("#existing") as HTMLInputElement;
        existing.value = "test";
        existing.focus();

        swap(target, "<input id=\"new\" type=\"text\" />", "beforeend");

        expect(existing.value).toBe("test");
        expect(document.activeElement).toBe(existing);
      });
    });
  });

  describe("serializeForm", () => {
    it("serializes form to FormData", () => {
      const form = document.createElement("form");
      form.innerHTML = `
        <input name="username" value="john" />
        <input name="email" value="john@example.com" />
        <input type="checkbox" name="subscribe" checked />
      `;

      const formData = serializeForm(form);

      expect(formData.get("username")).toBe("john");
      expect(formData.get("email")).toBe("john@example.com");
      expect(formData.get("subscribe")).toBe("on");
    });

    it("handles multiple values with same name", () => {
      const form = document.createElement("form");
      form.innerHTML = `
        <input type="checkbox" name="tags" value="tag1" checked />
        <input type="checkbox" name="tags" value="tag2" checked />
      `;

      const formData = serializeForm(form);
      expect(formData.getAll("tags")).toEqual(["tag1", "tag2"]);
    });
  });

  describe("serializeFormToJSON", () => {
    it("serializes form to JSON object", () => {
      const form = document.createElement("form");
      form.innerHTML = `
        <input name="username" value="jane" />
        <input name="age" value="25" />
      `;

      const json = serializeFormToJSON(form);

      expect(json).toEqual({ username: "jane", age: "25" });
    });

    it("handles multiple values as array", () => {
      const form = document.createElement("form");
      form.innerHTML = `
        <input name="color" value="red" />
        <input name="color" value="blue" />
      `;

      const json = serializeFormToJSON(form);

      expect(json.color).toEqual(["red", "blue"]);
    });
  });

  describe("parseHttpConfig", () => {
    it("parses default configuration", () => {
      const element = document.createElement("button");
      const config = parseHttpConfig(element, {});

      expect(config.trigger).toBe("click");
      expect(config.target).toBe(element);
      expect(config.swap).toBe("innerHTML");
      expect(config.headers).toEqual({});
    });

    it("parses trigger from dataset", () => {
      const element = document.createElement("div");
      element.dataset.voltTrigger = "mouseover";
      const config = parseHttpConfig(element, {});

      expect(config.trigger).toBe("mouseover");
    });

    it("parses target selector from dataset", () => {
      const element = document.createElement("div");
      element.dataset.voltTarget = "'#result'";
      const config = parseHttpConfig(element, {});

      expect(config.target).toBe("#result");
    });

    it("parses swap strategy from dataset", () => {
      const element = document.createElement("div");
      element.dataset.voltSwap = "outerHTML";
      const config = parseHttpConfig(element, {});

      expect(config.swap).toBe("outerHTML");
    });

    it("parses headers from dataset", () => {
      const element = document.createElement("div");
      element.dataset.voltHeaders = "headers";
      const config = parseHttpConfig(element, { headers: { Authorization: "Bearer token" } });

      expect(config.headers).toEqual({ Authorization: "Bearer token" });
    });

    it("uses submit trigger for forms", () => {
      const element = document.createElement("form");
      const config = parseHttpConfig(element, {});

      expect(config.trigger).toBe("submit");
    });
  });

  describe("state management", () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement("div");
    });

    it("sets loading state", () => {
      setLoadingState(element);
      expect(element.dataset.voltLoading).toBe("true");
    });

    it("sets error state", () => {
      setErrorState(element, "Network error");
      expect(element.dataset.voltError).toBe("Network error");
    });

    it("clears states", () => {
      element.dataset.voltLoading = "true";
      element.dataset.voltError = "Some error";

      clearStates(element);

      expect(Object.hasOwn(element.dataset, "voltLoading")).toBe(false);
      expect(Object.hasOwn(element.dataset, "voltError")).toBe(false);
    });

    it("dispatches volt:loading event", () => {
      const handler = vi.fn();
      element.addEventListener("volt:loading", handler);

      setLoadingState(element);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
      expect(handler.mock.calls[0][0].detail).toEqual({ element });
    });

    it("dispatches volt:error event", () => {
      const handler = vi.fn();
      element.addEventListener("volt:error", handler);

      setErrorState(element, "Test error");

      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
      expect(handler.mock.calls[0][0].detail).toEqual({ element, message: "Test error" });
    });

    it("dispatches volt:success event", () => {
      const handler = vi.fn();
      element.addEventListener("volt:success", handler);

      clearStates(element);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
      expect(handler.mock.calls[0][0].detail).toEqual({ element });
    });

    it("events bubble up the DOM", () => {
      const parent = document.createElement("div");
      parent.append(element);

      const loadingHandler = vi.fn();
      const errorHandler = vi.fn();
      const successHandler = vi.fn();

      parent.addEventListener("volt:loading", loadingHandler);
      parent.addEventListener("volt:error", errorHandler);
      parent.addEventListener("volt:success", successHandler);

      setLoadingState(element);
      setErrorState(element, "Bubbled error");
      clearStates(element);

      expect(loadingHandler).toHaveBeenCalledOnce();
      expect(errorHandler).toHaveBeenCalledOnce();
      expect(successHandler).toHaveBeenCalledOnce();
    });
  });

  describe("request", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("makes a GET request", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve("<div>Response</div>"),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const response = await request({ method: "GET", url: "/api/data" });

      expect(mockFetch).toHaveBeenCalledWith("/api/data", { method: "GET", headers: {}, body: undefined });
      expect(response.ok).toBe(true);
      expect(response.html).toBe("<div>Response</div>");
    });

    it("makes a POST request with body", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: true,
            status: 201,
            statusText: "Created",
            headers: new Headers({ "content-type": "application/json" }),
            json: () => Promise.resolve({ id: 123 }),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const formData = new FormData();
      formData.append("name", "Test");

      const response = await request({ method: "POST", url: "/api/create", body: formData });

      expect(mockFetch).toHaveBeenCalledWith("/api/create", { method: "POST", headers: {}, body: formData });
      expect(response.ok).toBe(true);
      expect(response.json).toEqual({ id: 123 });
    });

    it("parses HTML response", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
            text: () => Promise.resolve("<p>HTML content</p>"),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const response = await request({ method: "GET", url: "/page" });

      expect(response.html).toBe("<p>HTML content</p>");
      expect(response.json).toBeUndefined();
    });

    it("parses JSON response", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "application/json" }),
            json: () => Promise.resolve({ success: true }),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const response = await request({ method: "GET", url: "/api/status" });

      expect(response.json).toEqual({ success: true });
      expect(response.html).toBeUndefined();
    });

    it("throws error for network failure", async () => {
      const mockFetch = vi.fn(() => Promise.reject(new Error("Network error")));
      vi.stubGlobal("fetch", mockFetch);

      await expect(request({ method: "GET", url: "/api/fail" })).rejects.toThrow("HTTP request failed: Network error");
    });
  });

  describe("HTTP method bindings", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("binds data-volt-get and makes GET request on click", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve("<div>Loaded</div>"),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/data'";
      document.body.append(button);

      mount(button, {});

      button.click();

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/data", expect.objectContaining({ method: "GET" }));
      });
    });

    it("binds data-volt-post and serializes form on submit", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: true,
            status: 201,
            statusText: "Created",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve("<div>Created</div>"),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const form = document.createElement("form");
      form.dataset.voltPost = "'/api/submit'";
      form.innerHTML = "<input name=\"test\" value=\"value\" />";
      document.body.append(form);

      mount(form, {});

      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/submit",
          expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
        );
      });
    });

    it("updates target element with response", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve("<span>New content</span>"),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const container = document.createElement("div");
      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/data'";
      container.append(button);
      document.body.append(container);

      mount(button, {});

      button.click();

      await vi.waitFor(() => {
        expect(button.innerHTML).toBe("<span>New content</span>");
      });
    });

    it("sets loading state during request", async () => {
      let resolveRequest: ((value: Response) => void) | undefined;
      const mockFetch = vi.fn(() =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        })
      );
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/slow'";
      document.body.append(button);

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        expect(button.dataset.voltLoading).toBe("true");
      });

      resolveRequest?.(
        {
          ok: true,
          status: 200,
          statusText: "OK",
          headers: new Headers({ "content-type": "text/html" }),
          text: () => Promise.resolve("<div>Done</div>"),
        } as Response,
      );

      await vi.waitFor(() => {
        expect(Object.hasOwn(button.dataset, "voltLoading")).toBe(false);
      });
    });

    it("sets error state on request failure", async () => {
      const mockFetch = vi.fn(() => Promise.reject(new Error("Server error")));
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/fail'";
      document.body.append(button);

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        expect(button.dataset.voltError).toContain("Server error");
      });
    });
  });

  describe("retry logic", () => {
    it("retries network errors immediately", async () => {
      let callCount = 0;
      const mockFetch = vi.fn(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error("HTTP request failed: fetch failed"));
        }
        return Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve("<div>Success</div>"),
          } as Response,
        );
      });
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/data'";
      button.dataset.voltRetry = "3";
      button.dataset.voltTarget = "'#result'";

      const result = document.createElement("div");
      result.id = "result";
      document.body.append(button, result);

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        expect(result.innerHTML).toBe("<div>Success</div>");
      }, { timeout: 2000 });

      expect(callCount).toBe(3);
    });

    it("retries 5xx errors with exponential backoff", async () => {
      let callCount = 0;
      const mockFetch = vi.fn(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve(
            {
              ok: false,
              status: 500,
              statusText: "Internal Server Error",
              headers: new Headers({ "content-type": "text/html" }),
              text: () => Promise.resolve(""),
            } as Response,
          );
        }
        return Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve("<div>Success</div>"),
          } as Response,
        );
      });
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/data'";
      button.dataset.voltRetry = "3";
      button.dataset.voltRetryDelay = "100";
      button.dataset.voltTarget = "'#result'";

      const result = document.createElement("div");
      result.id = "result";
      document.body.append(button, result);

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        expect(result.innerHTML).toBe("<div>Success</div>");
      }, { timeout: 5000 });

      expect(callCount).toBe(3);
    });

    it("does not retry 4xx errors", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: false,
            status: 404,
            statusText: "Not Found",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve(""),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/missing'";
      button.dataset.voltRetry = "3";
      button.dataset.voltTarget = "'#result'";

      const result = document.createElement("div");
      result.id = "result";
      document.body.append(button, result);

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        const errorAttr = result.dataset.voltError;
        expect(errorAttr).toBeTruthy();
        expect(errorAttr).toContain("404");
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("respects max retry attempts", async () => {
      const mockFetch = vi.fn(() => Promise.reject(new Error("HTTP request failed: network error")));
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/data'";
      button.dataset.voltRetry = "2";
      button.dataset.voltTarget = "'#result'";

      const result = document.createElement("div");
      result.id = "result";
      document.body.append(button, result);

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        expect(result.dataset.voltError).toBeTruthy();
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("sets retry attempt attribute and dispatches retry event", async () => {
      let callCount = 0;
      const mockFetch = vi.fn(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error("HTTP request failed: network error"));
        }
        return Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve("<div>Success</div>"),
          } as Response,
        );
      });
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/data'";
      button.dataset.voltRetry = "3";
      button.dataset.voltTarget = "'#result'";

      const result = document.createElement("div");
      result.id = "result";

      let retryEventFired = false;
      let retryAttempt = 0;

      result.addEventListener(
        "volt:retry",
        ((event: CustomEvent) => {
          retryEventFired = true;
          retryAttempt = event.detail.attempt;
        }) as EventListener,
      );

      document.body.append(button, result);

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        expect(result.innerHTML).toBe("<div>Success</div>");
      }, { timeout: 2000 });

      expect(retryEventFired).toBe(true);
      expect(retryAttempt).toBe(1);
    });
  });

  describe("loading indicators", () => {
    it("shows and hides indicator with display style", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve("<div>Success</div>"),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/data'";
      button.dataset.voltIndicator = "#spinner";
      button.dataset.voltTarget = "'#result'";

      const spinner = document.createElement("div");
      spinner.id = "spinner";
      spinner.style.display = "none";

      const result = document.createElement("div");
      result.id = "result";

      document.body.append(button, spinner, result);

      expect(spinner.style.display).toBe("none");

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        expect(spinner.style.display).toBe("");
      });

      await vi.waitFor(() => {
        expect(result.innerHTML).toBe("<div>Success</div>");
        expect(spinner.style.display).toBe("none");
      }, { timeout: 1000 });
    });

    it("shows and hides indicator with CSS class", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve("<div>Success</div>"),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/data'";
      button.dataset.voltIndicator = "#spinner";
      button.dataset.voltTarget = "'#result'";

      const spinner = document.createElement("div");
      spinner.id = "spinner";
      spinner.classList.add("hidden");

      const result = document.createElement("div");
      result.id = "result";

      document.body.append(button, spinner, result);

      expect(spinner.classList.contains("hidden")).toBe(true);

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        expect(spinner.classList.contains("hidden")).toBe(false);
      });

      await vi.waitFor(() => {
        expect(result.innerHTML).toBe("<div>Success</div>");
        expect(spinner.classList.contains("hidden")).toBe(true);
      }, { timeout: 1000 });
    });

    it("hides indicator on error", async () => {
      const mockFetch = vi.fn(() => Promise.reject(new Error("Server error")));
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/fail'";
      button.dataset.voltIndicator = "#spinner";

      const spinner = document.createElement("div");
      spinner.id = "spinner";
      spinner.style.display = "none";

      document.body.append(button, spinner);

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        expect(spinner.style.display).toBe("");
      });

      await vi.waitFor(() => {
        expect(button.dataset.voltError).toBeTruthy();
        expect(spinner.style.display).toBe("none");
      }, { timeout: 1000 });
    });

    it("handles multiple indicators", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "text/html" }),
            text: () => Promise.resolve("<div>Success</div>"),
          } as Response,
        )
      );
      vi.stubGlobal("fetch", mockFetch);

      const button = document.createElement("button");
      button.dataset.voltGet = "'/api/data'";
      button.dataset.voltIndicator = ".spinner";
      button.dataset.voltTarget = "'#result'";

      const spinner1 = document.createElement("div");
      spinner1.classList.add("spinner", "hidden");

      const spinner2 = document.createElement("div");
      spinner2.classList.add("spinner", "hidden");

      const result = document.createElement("div");
      result.id = "result";

      document.body.append(button, spinner1, spinner2, result);

      mount(button, {});
      button.click();

      await vi.waitFor(() => {
        expect(spinner1.classList.contains("hidden")).toBe(false);
        expect(spinner2.classList.contains("hidden")).toBe(false);
      });

      await vi.waitFor(() => {
        expect(result.innerHTML).toBe("<div>Success</div>");
        expect(spinner1.classList.contains("hidden")).toBe(true);
        expect(spinner2.classList.contains("hidden")).toBe(true);
      }, { timeout: 1000 });
    });
  });
});
