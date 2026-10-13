import type {
  IdenticalBranchRequest,
  SegmentFittingRequest,
  SprinklerPipeSegmentRequest,
} from "./types";

/**
 * The pipe network, as the designer thinks of it, and how it becomes the node-and-segment tree the
 * API takes.
 *
 * The API wants a flat list of sprinklers and a flat list of pipe segments tied together by node
 * ids that the caller makes up and keeps consistent. That is the wrong thing to ask a person to
 * type: almost every sprinkler is on a pipe, and a mistyped id is an error with nothing to point
 * at. So the form holds the structure instead --
 *
 *   branch -> sprinklers, each with the pipe after it, then a cross main to the next branch
 *   riser  -> the pipe runs after the last branch, down to the supply connection
 *
 * -- and the ids are generated here, from position, so a sprinkler and its pipe are connected by
 * construction. Nothing in this file calculates hydraulics: it names nodes and lays out segments.
 *
 * Shape, which is the shape of a hand calculation sheet read top to bottom:
 *
 *   BL1-S1 --pipe--> BL1-S2 --pipe--> BL1-S3 --pipe--> A --cross main--> B --cross main--> TOR
 *                                                      ^                 ^
 *   BL2-S1 --pipe--> BL2-S2 --pipe--> BL2-S3 --pipe----+-----------------+  (branch 2 joins at B)
 *
 * A branch can instead be declared identical to an earlier one. It then has no sprinklers or pipes
 * of its own to list -- only its cross main, since its distance to its neighbour is its own -- and
 * the API works it out as a copy of the reference branch, balanced at its own junction.
 *
 * Flow runs toward the supply, so the API's "from" is always the upstream node.
 */

/** A pipe run as the form holds it: everything a segment needs except where it connects. */
export interface PipeRunValues {
  pipeMaterial: string;
  schedule?: string;
  nominalSize: string;
  cFactor: number;
  pipeLengthFt: number;
  elevationChangeFt: number;
  fittings: {
    fittingType?: string;
    quantity: number;
    explicitEquivalentLengthFt?: number;
  }[];
}

export interface BranchSprinklerValues {
  kFactor: number;
  /** The pipe after this sprinkler, towards the end of its branch. */
  pipe: PipeRunValues;
}

export interface BranchValues {
  /**
   * Identifies this branch for as long as it exists, so "identical to" can point at it without
   * pointing at a position: removing or inserting a branch moves positions, and a reference by
   * position would silently start meaning a different branch.
   */
  key: string;
  /**
   * The key of the branch this one is identical to, or "" when it is listed in full. An identical
   * branch carries no sprinklers (the form keeps any it had, hidden, but they are not read).
   */
  identicalToKey: string;
  /** Ordered from the most remote sprinkler towards the cross main. */
  sprinklers: BranchSprinklerValues[];
  /** The pipe from the end of this branch to the next branch's junction, or to the riser. */
  crossMain: PipeRunValues;
}

export interface NetworkValues {
  branches: BranchValues[];
  /** Runs after the last branch, from the top of the riser down to the supply connection. */
  riser: PipeRunValues[];
}

/** The node a branch's pipes all end at, and where the cross main picks it up: A, B, C ... AA. */
export function junctionId(branchIndex: number): string {
  let n = branchIndex;
  let id = "";
  do {
    id = String.fromCharCode(65 + (n % 26)) + id;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return id;
}

export function sprinklerNodeId(branchIndex: number, sprinklerIndex: number): string {
  return `BL${branchIndex + 1}-S${sprinklerIndex + 1}`;
}

/**
 * The riser's nodes, top to bottom. "TOR" is where the last cross main lands, "BOR" is the supply
 * connection at the bottom of the riser, and any run between them adds a numbered point. With no
 * riser runs the top of the riser *is* the supply connection, so there is just the one.
 */
export function riserNodeIds(riserRuns: number): string[] {
  if (riserRuns <= 0) return ["TOR"];
  const ids = ["TOR"];
  for (let i = 1; i < riserRuns; i += 1) ids.push(`R${i + 1}`);
  ids.push("BOR");
  return ids;
}

/** What a riser node is called to a person, for the place the hose stream is added. */
export function riserNodeLabel(id: string, riserRuns: number): string {
  if (riserRuns <= 0) return "Supply connection (top of riser)";
  if (id === "TOR") return "Top of riser";
  if (id === "BOR") return "Bottom of riser (supply connection)";
  return `Riser, after run ${Number(id.slice(1)) - 1}`;
}

/** Whether a branch is declared a copy of another, rather than listed in full. */
export function isIdenticalBranch(branch: { identicalToKey?: string }): boolean {
  return typeof branch.identicalToKey === "string" && branch.identicalToKey.trim() !== "";
}

/** The position of the branch an identical branch repeats, or -1 when it names none that exists. */
export function referenceIndex(
  branches: readonly { key?: string; identicalToKey?: string }[],
  branchIndex: number,
): number {
  const branch = branches[branchIndex];
  if (!branch || !isIdenticalBranch(branch)) return -1;
  return branches.findIndex((candidate) => candidate.key === branch.identicalToKey);
}

/**
 * Which branch a generated node belongs to (0-based), or null for the riser and for anything that
 * is not one of this file's names. Lets a result row speak of "branch 2" instead of node "B".
 */
export function branchIndexOfNode(nodeId: string): number | null {
  const sprinkler = /^BL(\d+)-S\d+$/.exec(nodeId);
  if (sprinkler) return Number(sprinkler[1]) - 1;
  if (nodeId === "TOR" || nodeId === "BOR" || !/^[A-Z]+$/.test(nodeId)) return null;
  // Bijective base 26, the inverse of junctionId: A = 0, Z = 25, AA = 26.
  let index = 0;
  for (const letter of nodeId) index = index * 26 + (letter.charCodeAt(0) - 64);
  return index - 1;
}

/**
 * What a generated sprinkler node is called to a person: "Branch 2, sprinkler 3". Null for
 * anything that is not one of this file's sprinkler names.
 */
export function describeSprinklerNode(nodeId: string): string | null {
  const match = /^BL(\d+)-S(\d+)$/.exec(nodeId);
  return match ? `Branch ${match[1]}, sprinkler ${match[2]}` : null;
}

export interface BuiltNetwork {
  sprinklers: { nodeId: string; kFactor: number }[];
  segments: SprinklerPipeSegmentRequest[];
  /** Branches declared identical, in branch order. */
  identicalBranches: IdenticalBranchRequest[];
  /** Every node that exists, so a caller can check a chosen node is one of them. */
  nodeIds: string[];
}

function toSegment(from: string, to: string, run: PipeRunValues): SprinklerPipeSegmentRequest {
  const fittings: SegmentFittingRequest[] = run.fittings.map((fitting) => ({
    fittingType: fitting.fittingType?.trim() ? fitting.fittingType.trim() : null,
    quantity: fitting.quantity,
    explicitEquivalentLengthFt: fitting.explicitEquivalentLengthFt ?? null,
  }));
  return {
    fromNodeId: from,
    toNodeId: to,
    pipeMaterial: run.pipeMaterial,
    schedule: run.schedule?.trim() ? run.schedule.trim() : null,
    nominalSize: run.nominalSize,
    cFactor: run.cFactor,
    pipeLengthFt: run.pipeLengthFt,
    elevationChangeFt: run.elevationChangeFt,
    fittings: fittings.length > 0 ? fittings : null,
  };
}

/**
 * Lays the structured network out as the API's sprinklers and segments, generating every node id.
 *
 * A sprinkler's own pipe runs from its node to the next sprinkler on the branch -- or, for the last
 * one, to the branch's junction. Each branch's cross main runs from its junction to the next
 * branch's, and the last one to the top of the riser. Riser runs follow, top to bottom.
 */
export function buildNetwork(network: NetworkValues): BuiltNetwork {
  const sprinklers: BuiltNetwork["sprinklers"] = [];
  const segments: SprinklerPipeSegmentRequest[] = [];
  const identicalBranches: IdenticalBranchRequest[] = [];
  const nodeIds: string[] = [];

  const riserIds = riserNodeIds(network.riser.length);
  const lastBranch = network.branches.length - 1;

  network.branches.forEach((branch, branchIndex) => {
    const junction = junctionId(branchIndex);
    nodeIds.push(junction);

    if (isIdenticalBranch(branch)) {
      // Nothing of it is listed but where it arrives and which branch it repeats. The reference is
      // named by its last sprinkler, the node its final pipe leaves from.
      const reference = referenceIndex(network.branches, branchIndex);
      const referenceBranch = network.branches[reference];
      if (reference < 0 || reference >= branchIndex || isIdenticalBranch(referenceBranch)) {
        throw new Error(
          `Branch ${branchIndex + 1} is declared identical to a branch that is not an earlier, listed one`,
        );
      }
      identicalBranches.push({
        joinNodeId: junction,
        referenceNodeId: sprinklerNodeId(reference, referenceBranch.sprinklers.length - 1),
      });
    }

    const listed = isIdenticalBranch(branch) ? [] : branch.sprinklers;
    listed.forEach((sprinkler, sprinklerIndex) => {
      const nodeId = sprinklerNodeId(branchIndex, sprinklerIndex);
      nodeIds.push(nodeId);
      sprinklers.push({ nodeId, kFactor: sprinkler.kFactor });

      const isLast = sprinklerIndex === listed.length - 1;
      const downstream = isLast ? junction : sprinklerNodeId(branchIndex, sprinklerIndex + 1);
      segments.push(toSegment(nodeId, downstream, sprinkler.pipe));
    });

    const next = branchIndex === lastBranch ? riserIds[0] : junctionId(branchIndex + 1);
    segments.push(toSegment(junction, next, branch.crossMain));
  });

  nodeIds.push(...riserIds);
  network.riser.forEach((run, index) => {
    segments.push(toSegment(riserIds[index], riserIds[index + 1], run));
  });

  return { sprinklers, segments, identicalBranches, nodeIds };
}

/** Every pipe run in the network, with the form path it lives at, in the order they are built. */
export function pipeRuns(network: NetworkValues): { path: string; run: PipeRunValues }[] {
  const runs: { path: string; run: PipeRunValues }[] = [];
  network.branches.forEach((branch, b) => {
    // An identical branch's own sprinklers are not part of the calculation, whatever the form holds.
    const listed = isIdenticalBranch(branch) ? [] : branch.sprinklers;
    listed.forEach((sprinkler, s) => {
      runs.push({ path: `network.branches.${b}.sprinklers.${s}.pipe`, run: sprinkler.pipe });
    });
    runs.push({ path: `network.branches.${b}.crossMain`, run: branch.crossMain });
  });
  network.riser.forEach((run, r) => runs.push({ path: `network.riser.${r}`, run }));
  return runs;
}

/**
 * Total flowing sprinklers across all branches, counting an identical branch as the sprinklers of
 * the branch it repeats. Takes only what it counts, so it works on the form's raw (not yet
 * validated) values as well as on parsed ones; an identical branch pointing at nothing counts none.
 */
export function countSprinklers(network: {
  branches: { key?: string; identicalToKey?: string; sprinklers: readonly unknown[] }[];
}): number {
  return network.branches.reduce((sum, branch, index) => {
    if (!isIdenticalBranch(branch)) return sum + branch.sprinklers.length;
    const reference = referenceIndex(network.branches, index);
    if (reference < 0 || reference === index || isIdenticalBranch(network.branches[reference])) return sum;
    return sum + network.branches[reference].sprinklers.length;
  }, 0);
}
