import { describe, expect, it } from "vitest";
import { isAppInfo, toDesktopPlatform } from "./app-info";

describe("app info contract", () => {
  it("accepts the exact app info shape", () => {
    expect(
      isAppInfo({
        name: "GameEditor",
        version: "0.1.0",
        platform: "win32",
        packaged: false,
      }),
    ).toBe(true);
  });

  it("rejects widened or malformed responses", () => {
    expect(
      isAppInfo({
        name: "GameEditor",
        version: "0.1.0",
        platform: "win32",
        packaged: false,
        secret: "unexpected",
      }),
    ).toBe(false);
    expect(isAppInfo({ name: "GameEditor" })).toBe(false);
  });

  it("normalizes non-desktop platforms without widening the contract", () => {
    expect(toDesktopPlatform("linux")).toBe("linux");
    expect(toDesktopPlatform("freebsd")).toBe("other");
  });
});
