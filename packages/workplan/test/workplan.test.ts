import test from "node:test";
import assert from "node:assert/strict";
import { buildAssignmentManifest } from "../src/index.js";

test("buildAssignmentManifest assigns units deterministically with round-robin replication", () => {
  const rows = buildAssignmentManifest(
    [
      {
        doc_id: "d1",
        unit_id: "d1:u0",
        unit_type: "sentence_step",
        index: 0,
        char_start: 0,
        char_end: 5,
        unit_text: "Alpha",
        segmentation_version: "rulebased_v1"
      },
      {
        doc_id: "d1",
        unit_id: "d1:u1",
        unit_type: "sentence_step",
        index: 1,
        char_start: 6,
        char_end: 10,
        unit_text: "Beta",
        segmentation_version: "rulebased_v1"
      }
    ],
    {
      annotator_ids: ["ann_a", "ann_b", "ann_c"],
      replication_factor: 2,
      assignment_strategy: "round_robin"
    }
  );

  assert.deepEqual(
    rows.map((r) => [r.unit_id, r.annotator_id]),
    [
      ["d1:u0", "ann_a"],
      ["d1:u0", "ann_b"],
      ["d1:u1", "ann_b"],
      ["d1:u1", "ann_c"]
    ]
  );
});

test("buildAssignmentManifest supports deterministic load-balanced assignment", () => {
  const units = [
    {
      doc_id: "d1",
      unit_id: "d1:u0",
      unit_type: "sentence_step" as const,
      index: 0,
      char_start: 0,
      char_end: 1,
      unit_text: "A",
      segmentation_version: "rulebased_v1"
    },
    {
      doc_id: "d1",
      unit_id: "d1:u1",
      unit_type: "sentence_step" as const,
      index: 1,
      char_start: 2,
      char_end: 3,
      unit_text: "B",
      segmentation_version: "rulebased_v1"
    },
    {
      doc_id: "d1",
      unit_id: "d1:u2",
      unit_type: "sentence_step" as const,
      index: 2,
      char_start: 4,
      char_end: 5,
      unit_text: "C",
      segmentation_version: "rulebased_v1"
    },
    {
      doc_id: "d1",
      unit_id: "d1:u3",
      unit_type: "sentence_step" as const,
      index: 3,
      char_start: 6,
      char_end: 7,
      unit_text: "D",
      segmentation_version: "rulebased_v1"
    }
  ];

  const workplan = {
    annotator_ids: ["ann_a", "ann_b", "ann_c"],
    replication_factor: 2,
    assignment_strategy: "load_balanced" as const,
    assignment_seed: "s1"
  };

  const rows1 = buildAssignmentManifest(units, workplan);
  const rows2 = buildAssignmentManifest(units, workplan);

  assert.deepEqual(rows1, rows2);

  const counts = rows1.reduce<Record<string, number>>((acc, row) => {
    acc[row.annotator_id] = (acc[row.annotator_id] ?? 0) + 1;
    return acc;
  }, {});

  assert.equal(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)), 1);
});

test("buildAssignmentManifest supports weighted assignment", () => {
  const units = Array.from({ length: 9 }).map((_, i) => ({
    doc_id: "d1",
    unit_id: `d1:u${i}`,
    unit_type: "sentence_step" as const,
    index: i,
    char_start: i,
    char_end: i + 1,
    unit_text: "X",
    segmentation_version: "rulebased_v1"
  }));

  const rows = buildAssignmentManifest(units, {
    annotator_ids: ["ann_a", "ann_b"],
    replication_factor: 1,
    assignment_strategy: "weighted",
    assignment_seed: "s1",
    assignment_weights: { ann_a: 2, ann_b: 1 }
  });

  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.annotator_id] = (acc[row.annotator_id] ?? 0) + 1;
    return acc;
  }, {});

  assert.equal(counts.ann_a, 6);
  assert.equal(counts.ann_b, 3);
});

test("buildAssignmentManifest supports stratified round-robin", () => {
  const rows = buildAssignmentManifest(
    [
      { doc_id: "d1", unit_id: "u1", unit_type: "document", index: 0, char_start: 0, char_end: 1, unit_text: "a", segmentation_version: "v", meta: { source: "s1" } },
      { doc_id: "d2", unit_id: "u2", unit_type: "document", index: 0, char_start: 0, char_end: 1, unit_text: "a", segmentation_version: "v", meta: { source: "s2" } },
      { doc_id: "d3", unit_id: "u3", unit_type: "document", index: 0, char_start: 0, char_end: 1, unit_text: "a", segmentation_version: "v", meta: { source: "s1" } },
      { doc_id: "d4", unit_id: "u4", unit_type: "document", index: 0, char_start: 0, char_end: 1, unit_text: "a", segmentation_version: "v", meta: { source: "s2" } }
    ],
    {
      annotator_ids: ["ann_a", "ann_b"],
      replication_factor: 1,
      assignment_strategy: "stratified_round_robin",
      stratify_by_meta_key: "source"
    }
  );

  assert.deepEqual(
    rows.map((r) => [r.unit_id, r.annotator_id]),
    [
      ["u1", "ann_a"],
      ["u2", "ann_a"],
      ["u3", "ann_b"],
      ["u4", "ann_b"]
    ]
  );
});
