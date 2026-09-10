import { describe, expect, it } from "vitest";
import { applyAction, evaluateCondition } from "./runtime";

describe("interactive runtime DSL", () => {
  it("evaluates supported conditions without executing code", () => {
    expect(evaluateCondition("credits >= 10", { credits: 12 })).toEqual({ allowed: true });
    expect(evaluateCondition("hasKey === true", { hasKey: false })).toEqual({ allowed: false });
    expect(evaluateCondition("globalThis.process.exit()", {})).toMatchObject({ allowed: false });
  });

  it("applies only supported variable actions", () => {
    expect(applyAction("variables.credits += 10", { credits: 4 })).toEqual({ variables: { credits: 14 } });
    expect(applyAction("variables.hasKey = true", { hasKey: false })).toEqual({ variables: { hasKey: true } });
    expect(applyAction("variables.credits = alert(1)", { credits: 4 })).toMatchObject({ variables: { credits: 4 }, error: expect.any(String) });
  });
});
