import { DerivedUnit, InputDocument, UnitizationMode } from "./types.js";

const SEGMENTATION_ALGO = "rulebased_v1";

export function getSegmentationVersion(mode: UnitizationMode): string {
  return `${SEGMENTATION_ALGO}_${stableHash(`${mode}:${SEGMENTATION_ALGO}`)}`;
}

export function deriveUnits(documents: InputDocument[], mode: UnitizationMode): DerivedUnit[] {
  const segmentationVersion = getSegmentationVersion(mode);

  if (mode === "document" || mode === "target_span") {
    return documents.map((doc) => ({
      doc_id: doc.doc_id,
      unit_id: `${doc.doc_id}:u0`,
      unit_type: mode,
      index: 0,
      char_start: 0,
      char_end: doc.text.length,
      unit_text: doc.text,
      segmentation_version: segmentationVersion
    }));
  }

  return documents.flatMap((doc) => splitSentences(doc, segmentationVersion));
}

function splitSentences(doc: InputDocument, segmentationVersion: string): DerivedUnit[] {
  const units: DerivedUnit[] = [];
  const regex = /[^.!?\n]+[.!?]?/g;
  const matches = doc.text.matchAll(regex);
  let index = 0;

  for (const match of matches) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const localOffset = raw.indexOf(trimmed);
    const matchStart = match.index ?? 0;
    const charStart = matchStart + localOffset;
    const charEnd = charStart + trimmed.length;

    units.push({
      doc_id: doc.doc_id,
      unit_id: `${doc.doc_id}:u${index}`,
      unit_type: "sentence_step",
      index,
      char_start: charStart,
      char_end: charEnd,
      unit_text: trimmed,
      segmentation_version: segmentationVersion
    });
    index += 1;
  }

  if (units.length === 0) {
    units.push({
      doc_id: doc.doc_id,
      unit_id: `${doc.doc_id}:u0`,
      unit_type: "sentence_step",
      index: 0,
      char_start: 0,
      char_end: doc.text.length,
      unit_text: doc.text,
      segmentation_version: segmentationVersion
    });
  }

  return units;
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
