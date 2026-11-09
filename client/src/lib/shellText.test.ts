import { describe, expect, it } from "vitest";
import { shellText } from "@/lib/shellText";

const OPEN = { desktop: "double-click to open", phone: "tap to open" };

describe("shellText", () => {
  it("uses the desktop wording on the desktop", () => {
    expect(shellText("desktop", OPEN)).toBe("double-click to open");
  });

  it("uses the desktop wording while the mode is unknown, so prerendered HTML matches", () => {
    expect(shellText(null, OPEN)).toBe("double-click to open");
  });

  it("uses the phone wording in both phone modes", () => {
    expect(shellText("phone", OPEN)).toBe("tap to open");
    expect(shellText("lite", OPEN)).toBe("tap to open");
  });
});
