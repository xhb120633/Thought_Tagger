import { DerivedUnit, InputDocument, UnitizationMode } from "./types.js";

const SEGMENTATION_VERSION = "rulebased_v1";

export function deriveUnits(documents: InputDocument[], mode: UnitizationMode): DerivedUnit[] {
  if (mode === "document") {
    return documents.map((doc) => ({
      doc_id: doc.doc_id,
      unit_id: `${doc.doc_id}:u0`,
      unit_type: mode,
      index: 0,
      char_start: 0,
      char_end: doc.text.length,
      unit_text: doc.text,
      segmentation_version: SEGMENTATION_VERSION
    }));
  }

  if (mode === "target_span") {
    return documents.map((doc) => ({
      doc_id: doc.doc_id,
      unit_id: `${doc.doc_id}:u0`,
      unit_type: mode,
      index: 0,
      char_start: 0,
      char_end: doc.text.length,
      unit_text: doc.text,
      segmentation_version: SEGMENTATION_VERSION
    }));
  }

  return documents.flatMap((doc) => splitSentences(doc));
}

function splitSentences(doc: InputDocument): DerivedUnit[] {
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
      segmentation_version: SEGMENTATION_VERSION
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
      segmentation_version: SEGMENTATION_VERSION
    });
  }

  return units;
}
