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

  if (strategy === "weighted") {
    return buildWeightedAssignmentManifest(units, annotators, replicationFactor, seed, workplan.assignment_weights ?? {});
  }

  if (strategy === "stratified_round_robin") {
    return buildStratifiedRoundRobinAssignmentManifest(
      units,
      annotators,
      replicationFactor,
      workplan.stratify_by_meta_key ?? ""
    );
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

function buildWeightedAssignmentManifest(
  units: DerivedUnit[],
  annotators: string[],
  replicationFactor: number,
  seed: string,
  weights: Record<string, number>
): AssignmentManifestRow[] {
  const defaultWeight = 1;
  const assignmentCountByAnnotator = new Map(annotators.map((annotatorId) => [annotatorId, 0]));

  return units.flatMap((unit) => {
    const selectedAnnotators = pickAnnotatorsWeighted(
      unit,
      annotators,
      replicationFactor,
      seed,
      weights,
      defaultWeight,
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

function buildStratifiedRoundRobinAssignmentManifest(
  units: DerivedUnit[],
  annotators: string[],
  replicationFactor: number,
  stratifyByMetaKey: string
): AssignmentManifestRow[] {
  const counters = new Map<string, number>();

  return units.flatMap((unit) => {
    const stratum = deriveStratumKey(unit, stratifyByMetaKey);
    const unitIndex = counters.get(stratum) ?? 0;
    counters.set(stratum, unitIndex + 1);

    const selectedAnnotators = pickAnnotatorsRoundRobin(annotators, unitIndex, replicationFactor);
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

function pickAnnotatorsWeighted(
  unit: DerivedUnit,
  annotators: string[],
  replicationFactor: number,
  seed: string,
  weights: Record<string, number>,
  defaultWeight: number,
  assignmentCountByAnnotator: Map<string, number>
): string[] {
  const picked = new Set<string>();

  while (picked.size < replicationFactor) {
    const candidates = annotators.filter((annotatorId) => !picked.has(annotatorId));
    const minRatio = Math.min(
      ...candidates.map((annotatorId) => {
        const load = assignmentCountByAnnotator.get(annotatorId) ?? 0;
        const weight = weights[annotatorId] ?? defaultWeight;
        return load / weight;
      })
    );

    const best = candidates.filter((annotatorId) => {
      const load = assignmentCountByAnnotator.get(annotatorId) ?? 0;
      const weight = weights[annotatorId] ?? defaultWeight;
      return load / weight === minRatio;
    });

    best.sort((a, b) => {
      const hashA = stableHash(`${seed}:${unit.unit_id}:${a}`);
      const hashB = stableHash(`${seed}:${unit.unit_id}:${b}`);
      return hashA.localeCompare(hashB);
    });

    picked.add(best[0]);
  }

  return [...picked];
}

function deriveStratumKey(unit: DerivedUnit, stratifyByMetaKey: string): string {
  if (!stratifyByMetaKey) return "__all__";
  const meta = unit.meta as Record<string, string | number | boolean | null> | undefined;
  const raw = meta?.[stratifyByMetaKey];
  if (raw === undefined || raw === null || String(raw).length === 0) {
    return "__missing__";
  }
  return String(raw);
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
