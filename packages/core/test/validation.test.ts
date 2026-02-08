import test from "node:test";
import assert from "node:assert/strict";
import { assertValidStudySpec } from "../src/validation.js";

test("study spec allows valid workplan configuration", () => {
  assert.doesNotThrow(() => {
    assertValidStudySpec({
      study_id: "s1",
      rubric_version: "v1",
      task_type: "label",
      unitization_mode: "document",
      run_mode: "ra",
      workplan: {
        annotator_ids: ["ann_a", "ann_b"],
        replication_factor: 2,
        assignment_strategy: "round_robin"
      }
    });
  });
});

test("study spec rejects invalid workplan replication factor", () => {
  assert.throws(() => {
    assertValidStudySpec({
      study_id: "s1",
      rubric_version: "v1",
      task_type: "label",
      unitization_mode: "document",
      run_mode: "ra",
      workplan: {
        annotator_ids: ["ann_a"],
        replication_factor: 2
      }
    });
  }, /replication_factor cannot exceed annotator count/);
});
