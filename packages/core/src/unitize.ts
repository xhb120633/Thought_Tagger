import { DerivedUnit, InputDocument, UnitizationMode } from "./types.js";

const SEGMENTATION_ALGO = "rulebased_v1";

export function getSegmentationVersion(mode: UnitizationMode): string {
  return `${SEGMENTATION_ALGO}_${stableHash(`${mode}:${SEGMENTATION_ALGO}`)}`;
}

export function deriveUnits(documents: InputDocument[], mode: UnitizationMode): DerivedUnit[] {
  const segmentationVersion = getSegmentationVersion(mode);

  if (mode === "document") {
    return documents.map((doc) => ({
      doc_id: doc.doc_id,
      pair_id: doc.pair_id,
      unit_id: `${doc.doc_id}:u0`,
      unit_type: mode,
      index: 0,
      char_start: 0,
      char_end: doc.text.length,
      unit_text: doc.text,
      segmentation_version: segmentationVersion,
      meta: doc.meta
    }));
  }

  if (mode === "target_span") {
    return documents.flatMap((doc) => toTargetSpanUnits(doc, segmentationVersion));
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
      pair_id: doc.pair_id,
      unit_id: `${doc.doc_id}:u${index}`,
      unit_type: "sentence_step",
      index,
      char_start: charStart,
      char_end: charEnd,
      unit_text: trimmed,
      segmentation_version: segmentationVersion,
      meta: doc.meta
    });
    index += 1;
  }

  if (units.length === 0) {
    units.push({
      doc_id: doc.doc_id,
      pair_id: doc.pair_id,
      unit_id: `${doc.doc_id}:u0`,
      unit_type: "sentence_step",
      index: 0,
      char_start: 0,
      char_end: doc.text.length,
      unit_text: doc.text,
      segmentation_version: segmentationVersion,
      meta: doc.meta
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


function toTargetSpanUnits(doc: InputDocument, segmentationVersion: string): DerivedUnit[] {
  const spans = [...(doc.target_spans ?? [])].sort((a, b) => a.char_start - b.char_start || a.char_end - b.char_end);

  if (spans.length === 0) {
    throw new Error(`Document ${doc.doc_id} must include at least one target span when unitization_mode=target_span`);
  }

  const units: DerivedUnit[] = [];
  let previousEnd = -1;

  for (const [index, span] of spans.entries()) {
    if (!Number.isInteger(span.char_start) || !Number.isInteger(span.char_end)) {
      throw new Error(`Document ${doc.doc_id} has target span with non-integer offsets`);
    }
    if (span.char_start < 0 || span.char_end < 0) {
      throw new Error(`Document ${doc.doc_id} has target span with negative offsets`);
    }
    if (span.char_start >= span.char_end) {
      throw new Error(`Document ${doc.doc_id} has empty target span [${span.char_start}, ${span.char_end})`);
    }
    if (span.char_end > doc.text.length) {
      throw new Error(`Document ${doc.doc_id} has out-of-range target span [${span.char_start}, ${span.char_end})`);
    }
    if (span.char_start < previousEnd) {
      throw new Error(`Document ${doc.doc_id} has overlapping target spans near [${span.char_start}, ${span.char_end})`);
    }

    units.push({
      doc_id: doc.doc_id,
      pair_id: doc.pair_id,
      unit_id: `${doc.doc_id}:u${index}`,
      unit_type: "target_span",
      index,
      char_start: span.char_start,
      char_end: span.char_end,
      unit_text: doc.text.slice(span.char_start, span.char_end),
      segmentation_version: segmentationVersion,
      meta: doc.meta
    });

    previousEnd = span.char_end;
  }

  return units;
}
