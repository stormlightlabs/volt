import { getCDNUrls } from "$utils/download.js";
import { describe, expect, it } from "vitest";

describe("download utilities", () => {
  describe("getCDNUrls", () => {
    it("should return latest URLs when no version specified", () => {
      const urls = getCDNUrls();

      expect(urls.js).toBe("https://cdn.jsdelivr.net/npm/voltx.js@latest/dist/voltx.min.js");
      expect(urls.css).toBe("https://cdn.jsdelivr.net/npm/voltx.js@latest/dist/voltx.min.css");
    });

    it("should return latest URLs when 'latest' is specified", () => {
      const urls = getCDNUrls("latest");

      expect(urls.js).toBe("https://cdn.jsdelivr.net/npm/voltx.js@latest/dist/voltx.min.js");
      expect(urls.css).toBe("https://cdn.jsdelivr.net/npm/voltx.js@latest/dist/voltx.min.css");
    });

    it("should return versioned URLs when version is specified", () => {
      const urls = getCDNUrls("1.0.0");

      expect(urls.js).toBe("https://cdn.jsdelivr.net/npm/voltx.js@1.0.0/dist/voltx.min.js");
      expect(urls.css).toBe("https://cdn.jsdelivr.net/npm/voltx.js@1.0.0/dist/voltx.min.css");
    });
  });
});
