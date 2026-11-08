import { describe, expect, it } from "vitest";
import { conduitFillSchema, type ConduitFillFormInput } from "./schema";

function validForm(): ConduitFillFormInput {
  return {
    conductors: [{ insulationType: "THHN", sizeLabel: "100", quantity: 3 }],
    conduitType: "EMT",
    nipple: false,
  };
}

describe("conduitFillSchema nipple", () => {
  it("takes a nipple or a run", () => {
    expect(conduitFillSchema.safeParse(validForm()).success).toBe(true);

    const nipple = conduitFillSchema.safeParse({ ...validForm(), nipple: true });
    expect(nipple.success).toBe(true);
    if (nipple.success) expect(nipple.data.nipple).toBe(true);
  });

  it("rejects a nipple that is not a boolean", () => {
    const result = conduitFillSchema.safeParse({ ...validForm(), nipple: "yes" as unknown as boolean });

    expect(result.success).toBe(false);
  });

  it("still wants a conduit type and a conductor", () => {
    expect(conduitFillSchema.safeParse({ ...validForm(), conduitType: "" }).success).toBe(false);
    expect(conduitFillSchema.safeParse({ ...validForm(), conductors: [] }).success).toBe(false);
  });
});
