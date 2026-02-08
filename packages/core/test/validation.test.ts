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

test("study spec accepts conditional question flow when parent option is valid", () => {
  assert.doesNotThrow(() => {
    assertValidStudySpec({
      study_id: "s2",
      rubric_version: "v1",
      task_type: "label",
      unitization_mode: "document",
      run_mode: "participant",
      questions: [
        {
          question_id: "q1",
          prompt: "Primary label",
          response_type: "single_select",
          options: [
            { value: "good", label: "Good" },
            { value: "bad", label: "Bad" }
          ]
        },
        {
          question_id: "q2",
          prompt: "Why bad?",
          response_type: "multi_select",
          options: [
            { value: "logic", label: "Logic issue" },
            { value: "factual", label: "Factual issue" }
          ],
          show_if: {
            question_id: "q1",
            equals: "bad"
          }
        }
      ]
    });
  });
});

test("study spec rejects conditional flow that references a non-prior question", () => {
  assert.throws(() => {
    assertValidStudySpec({
      study_id: "s3",
      rubric_version: "v1",
      task_type: "label",
      unitization_mode: "document",
      run_mode: "participant",
      questions: [
        {
          question_id: "q2",
          prompt: "Follow-up",
          response_type: "single_select",
          options: [
            { value: "x", label: "X" },
            { value: "y", label: "Y" }
          ],
          show_if: {
            question_id: "q1",
            equals: "x"
          }
        },
        {
          question_id: "q1",
          prompt: "Primary",
          response_type: "single_select",
          options: [
            { value: "x", label: "X" },
            { value: "y", label: "Y" }
          ]
        }
      ]
    });
  }, /show_if references unknown or non-prior question_id/);
});

test("study spec rejects conditional flow with unknown parent option value", () => {
  assert.throws(() => {
    assertValidStudySpec({
      study_id: "s4",
      rubric_version: "v1",
      task_type: "label",
      unitization_mode: "document",
      run_mode: "participant",
      questions: [
        {
          question_id: "q1",
          prompt: "Primary",
          response_type: "single_select",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" }
          ]
        },
        {
          question_id: "q2",
          prompt: "Follow-up",
          response_type: "single_select",
          options: [
            { value: "r1", label: "Reason 1" },
            { value: "r2", label: "Reason 2" }
          ],
          show_if: {
            question_id: "q1",
            equals: "maybe"
          }
        }
      ]
    });
  }, /show_if.equals must match one of parent options/);
});

test("study spec allows compare shared context inline_meta mode", () => {
  assert.doesNotThrow(() => {
    assertValidStudySpec({
      study_id: "s5",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare: {
        shared_context_mode: "inline_meta",
        shared_context_field: "shared_context"
      }
    });
  });
});

test("study spec rejects compare config for non-compare task", () => {
  assert.throws(() => {
    assertValidStudySpec({
      study_id: "s6",
      rubric_version: "v1",
      task_type: "label",
      unitization_mode: "document",
      run_mode: "participant",
      compare: {
        shared_context_mode: "inline_meta",
        shared_context_field: "shared_context"
      }
    });
  }, /only supported when task_type is compare/);
});

test("study spec rejects inline_meta shared context mode without field", () => {
  assert.throws(() => {
    assertValidStudySpec({
      study_id: "s7",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare: {
        shared_context_mode: "inline_meta"
      }
    });
  }, /shared_context_field is required/);
});


test("study spec allows compare shared context sidecar mode", () => {
  assert.doesNotThrow(() => {
    assertValidStudySpec({
      study_id: "s8",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare: {
        shared_context_mode: "sidecar_jsonl",
        shared_context_sidecar_path: "./compare_context.jsonl"
      }
    });
  });
});

test("study spec rejects sidecar mode without sidecar path", () => {
  assert.throws(() => {
    assertValidStudySpec({
      study_id: "s9",
      rubric_version: "v1",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare: {
        shared_context_mode: "sidecar_jsonl"
      }
    });
  }, /shared_context_sidecar_path is required/);
});
