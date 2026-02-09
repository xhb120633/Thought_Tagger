import { buildArtifacts, deriveUnits, parseCsv, StudySpec, Unit } from "./compilerCompat";

describe("compilerCompat artifact generation", () => {
  test("annotation template header includes compare_context column in compiler order", () => {
    const spec: StudySpec = {
      study_id: "study_1",
      rubric_version: "v1",
      task_type: "annotate",
      unitization_mode: "document",
      run_mode: "participant"
    };

    const units: Unit[] = [
      {
        doc_id: "d1",
        unit_id: "d1:u0",
        unit_type: "document",
        index: 0,
        char_start: 0,
        char_end: 5,
        unit_text: "hello",
        segmentation_version: "rulebased_v1"
      }
    ];

    const artifacts = buildArtifacts(spec, [{ doc_id: "d1", text: "hello" }], units);
    const [header, firstRow] = artifacts["annotation_template.csv"].split("\n");

    expect(header).toBe(
      "study_id,rubric_version,annotator_id,doc_id,unit_id,task_type,response_payload,confidence,rationale,condition_id,compare_context,created_at,updated_at"
    );
    expect(firstRow).toBe("study_1,v1,,d1,d1:u0,annotate,,,,,,,");
  });

  test("compare_context.jsonl is emitted when compare context mode is configured", () => {
    const spec: StudySpec = {
      study_id: "compare_study",
      rubric_version: "v2",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant",
      compare_context: {
        mode: "inline_meta",
        context_meta_key: "shared_context"
      }
    };

    const docs = parseCsv([
      "doc_id,text,pair_id,meta.shared_context",
      "pair_1:A,left,pair_1,prompt"
    ].join("\n"));
    const units = deriveUnits(docs, "document");

    const artifacts = buildArtifacts(spec, docs, units);

    expect(artifacts["compare_context.jsonl"]).toBe(
      '{"unit_id":"pair_1:A:u0","pair_id":"pair_1","context":"prompt"}'
    );
  });

  test("does not emit compare_context.jsonl when compare context is not configured", () => {
    const spec: StudySpec = {
      study_id: "compare_study",
      rubric_version: "v2",
      task_type: "compare",
      unitization_mode: "document",
      run_mode: "participant"
    };

    const units: Unit[] = [
      {
        doc_id: "pair_1:A",
        unit_id: "pair_1:A:u0",
        unit_type: "document",
        index: 0,
        char_start: 0,
        char_end: 4,
        unit_text: "left",
        segmentation_version: "rulebased_v1"
      }
    ];

    const artifacts = buildArtifacts(spec, [{ doc_id: "pair_1:A", text: "left" }], units);
    expect(artifacts["compare_context.jsonl"]).toBeUndefined();
  });

  test("load_balanced workplan strategy is supported", () => {
    const spec: StudySpec = {
      study_id: "wp_study",
      rubric_version: "v1",
      task_type: "annotate",
      unitization_mode: "document",
      run_mode: "participant",
      workplan: {
        annotator_ids: ["a1", "a2"],
        replication_factor: 1,
        assignment_strategy: "load_balanced",
        assignment_seed: "seed"
      }
    };

    const units: Unit[] = [
      {
        doc_id: "d1",
        unit_id: "d1:u0",
        unit_type: "document",
        index: 0,
        char_start: 0,
        char_end: 5,
        unit_text: "hello",
        segmentation_version: "rulebased_v1"
      },
      {
        doc_id: "d2",
        unit_id: "d2:u0",
        unit_type: "document",
        index: 0,
        char_start: 0,
        char_end: 5,
        unit_text: "world",
        segmentation_version: "rulebased_v1"
      }
    ];

    const artifacts = buildArtifacts(
      spec,
      [
        { doc_id: "d1", text: "hello" },
        { doc_id: "d2", text: "world" }
      ],
      units
    );

    const assignments = artifacts["assignment_manifest.jsonl"].split("\n").map((row) => JSON.parse(row));
    expect(assignments).toHaveLength(2);
    expect(new Set(assignments.map((row: { annotator_id: string }) => row.annotator_id))).toEqual(new Set(["a1", "a2"]));
  });
});
