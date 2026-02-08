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
  const annotators = workplan.annotator_ids;
  const replicationFactor = workplan.replication_factor ?? 1;

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
