import { describe, expect, it } from "vitest";
import {
  branchIndexOfNode,
  buildNetwork,
  describeSprinklerNode,
  countSprinklers,
  junctionId,
  pipeRuns,
  riserNodeIds,
  riserNodeLabel,
  sprinklerNodeId,
  type BranchValues,
  type NetworkValues,
  type PipeRunValues,
} from "./network";

function pipe(overrides: Partial<PipeRunValues> = {}): PipeRunValues {
  return {
    pipeMaterial: "BI",
    schedule: "SCH40",
    nominalSize: "1",
    cFactor: 120,
    pipeLengthFt: 10,
    elevationChangeFt: 0,
    fittings: [],
    ...overrides,
  };
}

let keyCounter = 0;

function branch(
  sprinklerCount: number,
  crossMain: Partial<PipeRunValues> = {},
  ids: { key?: string; identicalToKey?: string } = {},
): BranchValues {
  keyCounter += 1;
  return {
    key: ids.key ?? `k${keyCounter}`,
    identicalToKey: ids.identicalToKey ?? "",
    sprinklers: Array.from({ length: sprinklerCount }, () => ({ kFactor: 5.6, pipe: pipe() })),
    crossMain: pipe({ nominalSize: "3", ...crossMain }),
  };
}

function network(branches: BranchValues[], riserRuns = 0): NetworkValues {
  return { branches, riser: Array.from({ length: riserRuns }, () => pipe({ nominalSize: "4" })) };
}

describe("node naming", () => {
  it("names junctions A, B, C ... and carries on past Z", () => {
    expect([0, 1, 2, 25].map(junctionId)).toEqual(["A", "B", "C", "Z"]);
    expect([26, 27, 51, 52].map(junctionId)).toEqual(["AA", "AB", "AZ", "BA"]);
  });

  it("names sprinklers by branch and position, counting from one", () => {
    expect(sprinklerNodeId(0, 0)).toBe("BL1-S1");
    expect(sprinklerNodeId(2, 3)).toBe("BL3-S4");
  });

  it("makes the top of the riser the supply connection when there are no riser runs", () => {
    expect(riserNodeIds(0)).toEqual(["TOR"]);
  });

  it("names riser points top to bottom, ending at BOR", () => {
    expect(riserNodeIds(1)).toEqual(["TOR", "BOR"]);
    expect(riserNodeIds(2)).toEqual(["TOR", "R2", "BOR"]);
    expect(riserNodeIds(4)).toEqual(["TOR", "R2", "R3", "R4", "BOR"]);
  });

  it("labels riser points in words, never as a raw id", () => {
    expect(riserNodeLabel("TOR", 0)).toBe("Supply connection (top of riser)");
    expect(riserNodeLabel("TOR", 2)).toBe("Top of riser");
    expect(riserNodeLabel("BOR", 2)).toBe("Bottom of riser (supply connection)");
    expect(riserNodeLabel("R2", 3)).toBe("Riser, after run 1");
  });
});

describe("buildNetwork", () => {
  it("connects one sprinkler through its pipe to the branch junction, then to the riser top", () => {
    const built = buildNetwork(network([branch(1)]));

    expect(built.sprinklers).toEqual([{ nodeId: "BL1-S1", kFactor: 5.6 }]);
    expect(built.segments.map((s) => `${s.fromNodeId}->${s.toNodeId}`)).toEqual([
      "BL1-S1->A", // the sprinkler's own pipe
      "A->TOR", // the cross main, with no riser behind it
    ]);
  });

  it("chains the sprinklers on a branch, each pipe running to the next", () => {
    const built = buildNetwork(network([branch(4)]));

    expect(built.segments.map((s) => `${s.fromNodeId}->${s.toNodeId}`)).toEqual([
      "BL1-S1->BL1-S2",
      "BL1-S2->BL1-S3",
      "BL1-S3->BL1-S4",
      "BL1-S4->A",
      "A->TOR",
    ]);
  });

  it("builds the workbook's shape: three branches of four, a riser of two runs", () => {
    const built = buildNetwork(network([branch(4), branch(4), branch(4)], 2));
    const edges = built.segments.map((s) => `${s.fromNodeId}->${s.toNodeId}`);

    expect(built.sprinklers).toHaveLength(12);
    expect(built.segments).toHaveLength(12 + 3 + 2);
    // Each branch ends at its own junction, and the cross main walks A -> B -> C -> top of riser.
    expect(edges).toContain("BL1-S4->A");
    expect(edges).toContain("BL2-S4->B");
    expect(edges).toContain("BL3-S4->C");
    expect(edges).toContain("A->B");
    expect(edges).toContain("B->C");
    expect(edges).toContain("C->TOR");
    expect(edges).toContain("TOR->R2");
    expect(edges).toContain("R2->BOR");
  });

  it("takes every pipe's own size, length and elevation, so distances can all differ", () => {
    const built = buildNetwork(
      network([
        branch(1, { pipeLengthFt: 10 }),
        branch(1, { pipeLengthFt: 12 }),
        branch(1, { pipeLengthFt: 100, elevationChangeFt: 20 }),
      ]),
    );
    const crossMains = built.segments.filter((s) => /^[A-C]->/.test(`${s.fromNodeId}->`) && s.nominalSize === "3");

    expect(crossMains.map((s) => s.pipeLengthFt)).toEqual([10, 12, 100]);
    expect(crossMains[2].elevationChangeFt).toBe(20);
  });

  it("sends a blank schedule and an empty fittings list as null, as the API documents", () => {
    const built = buildNetwork(
      network([
        {
          key: "k",
          identicalToKey: "",
          sprinklers: [{ kFactor: 5.6, pipe: pipe({ schedule: "  ", fittings: [] }) }],
          crossMain: pipe(),
        },
      ]),
    );

    expect(built.segments[0].schedule).toBeNull();
    expect(built.segments[0].fittings).toBeNull();
  });

  it("carries fittings through, with a blank type sent as null", () => {
    const built = buildNetwork(
      network([
        {
          key: "k",
          identicalToKey: "",
          sprinklers: [
            {
              kFactor: 5.6,
              pipe: pipe({
                fittings: [
                  { fittingType: "ELBOW_90_STANDARD", quantity: 2 },
                  { fittingType: "", quantity: 1, explicitEquivalentLengthFt: 5 },
                ],
              }),
            },
          ],
          crossMain: pipe(),
        },
      ]),
    );

    expect(built.segments[0].fittings).toEqual([
      { fittingType: "ELBOW_90_STANDARD", quantity: 2, explicitEquivalentLengthFt: null },
      { fittingType: null, quantity: 1, explicitEquivalentLengthFt: 5 },
    ]);
  });

  describe("for any shape, the result is a tree the API will accept", () => {
    const shapes: [string, NetworkValues][] = [
      ["one sprinkler, no riser", network([branch(1)])],
      ["one branch of five", network([branch(5)], 1)],
      ["two uneven branches", network([branch(2), branch(5)], 2)],
      ["many single-sprinkler branches", network(Array.from({ length: 30 }, () => branch(1)), 3)],
      ["three of four with a long riser", network([branch(4), branch(4), branch(4)], 5)],
    ];

    it.each(shapes)("%s", (_name, shape) => {
      const built = buildNetwork(shape);
      const known = new Set(built.nodeIds);

      // Node ids are unique, so no two nodes can be confused.
      expect(known.size).toBe(built.nodeIds.length);

      // Every segment joins two nodes that exist, and none loops back on itself.
      for (const segment of built.segments) {
        expect(known.has(segment.fromNodeId)).toBe(true);
        expect(known.has(segment.toNodeId)).toBe(true);
        expect(segment.fromNodeId).not.toBe(segment.toNodeId);
      }

      // No node has two ways out: the network is a tree, never a loop or a split.
      const from = built.segments.map((s) => s.fromNodeId);
      expect(new Set(from).size).toBe(from.length);

      // Exactly one node has nothing leaving it, and it is the last riser point: the supply.
      const sinks = built.nodeIds.filter((id) => !from.includes(id));
      expect(sinks).toEqual([riserNodeIds(shape.riser.length).at(-1)]);

      // Every sprinkler sits on a node that exists.
      for (const sprinkler of built.sprinklers) expect(known.has(sprinkler.nodeId)).toBe(true);
    });
  });
});

describe("pipeRuns and countSprinklers", () => {
  it("lists every pipe with the form path it lives at, in build order", () => {
    const runs = pipeRuns(network([branch(2), branch(1)], 1));

    expect(runs.map((r) => r.path)).toEqual([
      "network.branches.0.sprinklers.0.pipe",
      "network.branches.0.sprinklers.1.pipe",
      "network.branches.0.crossMain",
      "network.branches.1.sprinklers.0.pipe",
      "network.branches.1.crossMain",
      "network.riser.0",
    ]);
  });

  it("agrees with buildNetwork on how many pipes there are", () => {
    const shape = network([branch(3), branch(4)], 2);
    expect(pipeRuns(shape)).toHaveLength(buildNetwork(shape).segments.length);
  });

  it("counts the sprinklers across all branches", () => {
    expect(countSprinklers(network([branch(4), branch(4), branch(3)]))).toBe(11);
  });
});

describe("identical branches", () => {
  /** Three branches: the first listed in full, the others declared identical to it. */
  function workbookShape(): NetworkValues {
    return network(
      [
        branch(4, {}, { key: "bl1" }),
        branch(0, { nominalSize: "3" }, { key: "bl2", identicalToKey: "bl1" }),
        branch(0, { nominalSize: "3", pipeLengthFt: 100 }, { key: "bl3", identicalToKey: "bl1" }),
      ],
      2,
    );
  }

  it("lists only the reference branch's sprinklers and pipes, and declares the copies", () => {
    const built = buildNetwork(workbookShape());

    expect(built.sprinklers.map((s) => s.nodeId)).toEqual(["BL1-S1", "BL1-S2", "BL1-S3", "BL1-S4"]);
    expect(built.identicalBranches).toEqual([
      { joinNodeId: "B", referenceNodeId: "BL1-S4" },
      { joinNodeId: "C", referenceNodeId: "BL1-S4" },
    ]);
    expect(built.segments.map((s) => `${s.fromNodeId}->${s.toNodeId}`)).toEqual([
      "BL1-S1->BL1-S2",
      "BL1-S2->BL1-S3",
      "BL1-S3->BL1-S4",
      "BL1-S4->A",
      "A->B", // branch 1's cross main, which arrives at branch 2's junction
      "B->C", // branch 2 is identical, but its own cross main is still listed
      "C->TOR",
      "TOR->R2",
      "R2->BOR",
    ]);
  });

  it("gives each copy its own cross main, so each can sit at its own distance", () => {
    const built = buildNetwork(workbookShape());
    const lengths = ["A->B", "B->C", "C->TOR"].map(
      (edge) => built.segments.find((s) => `${s.fromNodeId}->${s.toNodeId}` === edge)?.pipeLengthFt,
    );

    // The helper makes branch 1's cross main 10 ft; branch 3's is the long one.
    expect(lengths).toEqual([10, 10, 100]);
  });

  it("ignores the sprinklers an identical branch still holds, hidden, in the form", () => {
    const hidden = network([
      branch(2, {}, { key: "a" }),
      branch(5, {}, { key: "b", identicalToKey: "a" }),
    ]);
    const built = buildNetwork(hidden);

    expect(built.sprinklers).toHaveLength(2);
    expect(built.segments.some((s) => s.fromNodeId.startsWith("BL2"))).toBe(false);
    expect(pipeRuns(hidden).map((r) => r.path)).toEqual([
      "network.branches.0.sprinklers.0.pipe",
      "network.branches.0.sprinklers.1.pipe",
      "network.branches.0.crossMain",
      "network.branches.1.crossMain",
    ]);
  });

  it("follows the key, not the position: a branch inserted before keeps the pointing intact", () => {
    const shape = network([
      branch(1, {}, { key: "inserted" }),
      branch(3, {}, { key: "reference" }),
      branch(0, {}, { key: "copy", identicalToKey: "reference" }),
    ]);

    expect(buildNetwork(shape).identicalBranches).toEqual([{ joinNodeId: "C", referenceNodeId: "BL2-S3" }]);
  });

  it("refuses a copy whose reference is missing, later, or itself a copy", () => {
    const missing = network([branch(1, {}, { key: "a" }), branch(0, {}, { identicalToKey: "gone" })]);
    const later = network([branch(0, {}, { key: "a", identicalToKey: "b" }), branch(1, {}, { key: "b" })]);
    const chained = network([
      branch(1, {}, { key: "a" }),
      branch(0, {}, { key: "b", identicalToKey: "a" }),
      branch(0, {}, { key: "c", identicalToKey: "b" }),
    ]);

    expect(() => buildNetwork(missing)).toThrow(/identical/);
    expect(() => buildNetwork(later)).toThrow(/identical/);
    expect(() => buildNetwork(chained)).toThrow(/identical/);
  });

  it("is still a tree the API will accept, with one sink", () => {
    const built = buildNetwork(workbookShape());
    const from = built.segments.map((s) => s.fromNodeId);
    const known = new Set(built.nodeIds);

    expect(new Set(from).size).toBe(from.length);
    expect(built.nodeIds.filter((id) => !from.includes(id))).toEqual(["BOR"]);
    // Every copy arrives at a node that exists, and repeats a node that has a pipe leaving it.
    for (const copy of built.identicalBranches) {
      expect(known.has(copy.joinNodeId)).toBe(true);
      expect(from.includes(copy.referenceNodeId)).toBe(true);
    }
  });

  it("counts a copy as the sprinklers of the branch it repeats", () => {
    expect(countSprinklers(workbookShape())).toBe(12);
  });

  it("counts none for a copy that points at nothing", () => {
    const dangling = network([branch(3, {}, { key: "a" }), branch(0, {}, { identicalToKey: "gone" })]);
    expect(countSprinklers(dangling)).toBe(3);
  });

  it("names the branch a generated node belongs to, so a result can say 'branch 2'", () => {
    expect(branchIndexOfNode("BL3-S4")).toBe(2);
    expect(branchIndexOfNode("A")).toBe(0);
    expect(branchIndexOfNode("C")).toBe(2);
    expect(branchIndexOfNode("AA")).toBe(26);
    expect(branchIndexOfNode("TOR")).toBeNull();
    expect(branchIndexOfNode("BOR")).toBeNull();
    expect(branchIndexOfNode("R2")).toBeNull();
  });
});

describe("describeSprinklerNode", () => {
  it("says which sprinkler a generated node is, in words", () => {
    expect(describeSprinklerNode("BL1-S1")).toBe("Branch 1, sprinkler 1");
    expect(describeSprinklerNode("BL12-S4")).toBe("Branch 12, sprinkler 4");
  });

  it("has nothing to say about the junctions and the riser", () => {
    expect(describeSprinklerNode("A")).toBeNull();
    expect(describeSprinklerNode("TOR")).toBeNull();
    expect(describeSprinklerNode("S1")).toBeNull();
  });
});
