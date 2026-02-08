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
