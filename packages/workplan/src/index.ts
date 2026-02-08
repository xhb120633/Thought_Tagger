import { DerivedUnit, StudyWorkplanConfig } from "@thought-tagger/core";

export interface AssignmentManifestRow {
  assignment_id: string;
  annotator_id: string;
  doc_id: string;
  unit_id: string;
}

export function buildAssignmentManifest(
  units: DerivedUnit[],
  workplan: StudyWorkplanConfig
): AssignmentManifestRow[] {
  const strategy = workplan.assignment_strategy ?? "round_robin";
  const annotators = [...workplan.annotator_ids];
  const replicationFactor = workplan.replication_factor ?? 1;
  const seed = workplan.assignment_seed ?? "thought-tagger-v1";

  if (strategy === "load_balanced") {
    return buildLoadBalancedAssignmentManifest(units, annotators, replicationFactor, seed);
  }

  return units.flatMap((unit, unitIndex) => {
    const selectedAnnotators = pickAnnotatorsRoundRobin(annotators, unitIndex, replicationFactor);
    return selectedAnnotators.map((annotatorId) => ({
      assignment_id: `${unit.unit_id}:${annotatorId}`,
      annotator_id: annotatorId,
      doc_id: unit.doc_id,
      unit_id: unit.unit_id
    }));
  });
}

function buildLoadBalancedAssignmentManifest(
  units: DerivedUnit[],
  annotators: string[],
  replicationFactor: number,
  seed: string
): AssignmentManifestRow[] {
  const assignmentCountByAnnotator = new Map(annotators.map((annotatorId) => [annotatorId, 0]));

  return units.flatMap((unit) => {
    const selectedAnnotators = pickAnnotatorsLoadBalanced(
      unit,
      annotators,
      replicationFactor,
      seed,
      assignmentCountByAnnotator
    );

    for (const annotatorId of selectedAnnotators) {
      assignmentCountByAnnotator.set(annotatorId, (assignmentCountByAnnotator.get(annotatorId) ?? 0) + 1);
    }

    return selectedAnnotators.map((annotatorId) => ({
      assignment_id: `${unit.unit_id}:${annotatorId}`,
      annotator_id: annotatorId,
      doc_id: unit.doc_id,
      unit_id: unit.unit_id
    }));
  });
}

function pickAnnotatorsRoundRobin(
  annotators: string[],
  unitIndex: number,
  replicationFactor: number
): string[] {
  const out: string[] = [];
  const start = unitIndex % annotators.length;
  for (let i = 0; i < replicationFactor; i += 1) {
    out.push(annotators[(start + i) % annotators.length]);
  }
  return out;
}

function pickAnnotatorsLoadBalanced(
  unit: DerivedUnit,
  annotators: string[],
  replicationFactor: number,
  seed: string,
  assignmentCountByAnnotator: Map<string, number>
): string[] {
  const picked = new Set<string>();

  while (picked.size < replicationFactor) {
    const candidates = annotators.filter((annotatorId) => !picked.has(annotatorId));
    const minLoad = Math.min(...candidates.map((annotatorId) => assignmentCountByAnnotator.get(annotatorId) ?? 0));
    const leastLoaded = candidates.filter((annotatorId) => (assignmentCountByAnnotator.get(annotatorId) ?? 0) === minLoad);

    leastLoaded.sort((a, b) => {
      const hashA = stableHash(`${seed}:${unit.unit_id}:${a}`);
      const hashB = stableHash(`${seed}:${unit.unit_id}:${b}`);
      return hashA.localeCompare(hashB);
    });

    picked.add(leastLoaded[0]);
  }

  return [...picked];
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
