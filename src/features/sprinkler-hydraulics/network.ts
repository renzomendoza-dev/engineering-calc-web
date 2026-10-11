import type { SegmentFittingRequest, SprinklerPipeSegmentRequest } from "./types";

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

export interface BuiltNetwork {
  sprinklers: { nodeId: string; kFactor: number }[];
  segments: SprinklerPipeSegmentRequest[];
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
  const nodeIds: string[] = [];

  const riserIds = riserNodeIds(network.riser.length);
  const lastBranch = network.branches.length - 1;

  network.branches.forEach((branch, branchIndex) => {
    const junction = junctionId(branchIndex);
    nodeIds.push(junction);

    branch.sprinklers.forEach((sprinkler, sprinklerIndex) => {
      const nodeId = sprinklerNodeId(branchIndex, sprinklerIndex);
      nodeIds.push(nodeId);
      sprinklers.push({ nodeId, kFactor: sprinkler.kFactor });

      const isLast = sprinklerIndex === branch.sprinklers.length - 1;
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

  return { sprinklers, segments, nodeIds };
}

/** Every pipe run in the network, with the form path it lives at, in the order they are built. */
export function pipeRuns(network: NetworkValues): { path: string; run: PipeRunValues }[] {
  const runs: { path: string; run: PipeRunValues }[] = [];
  network.branches.forEach((branch, b) => {
    branch.sprinklers.forEach((sprinkler, s) => {
      runs.push({ path: `network.branches.${b}.sprinklers.${s}.pipe`, run: sprinkler.pipe });
    });
    runs.push({ path: `network.branches.${b}.crossMain`, run: branch.crossMain });
  });
  network.riser.forEach((run, r) => runs.push({ path: `network.riser.${r}`, run }));
  return runs;
}

/**
 * Total flowing sprinklers across all branches. Takes only what it counts, so it works on the
 * form's raw (not yet validated) values as well as on parsed ones.
 */
export function countSprinklers(network: { branches: { sprinklers: readonly unknown[] }[] }): number {
  return network.branches.reduce((sum, branch) => sum + branch.sprinklers.length, 0);
}
