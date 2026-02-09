import { buildArtifacts, deriveUnits, type InputDoc, type StudySpec } from "./compilerCompat";

describe("compilerCompat artifacts", () => {
  const docs: InputDoc[] = [{ doc_id: "d1", text: "Hello world." }];
  const baseSpec: StudySpec = {
    study_id: "study_alpha",
    rubric_version: "v1",
    task_type: "annotate",
    unitization_mode: "document",
    run_mode: "ra",
    questions: [{ question_id: "q1", prompt: "Annotate", response_type: "free_text" }]
  };

  it("keeps annotation_template.csv header parity with compiler order", () => {
    const units = deriveUnits(docs, baseSpec.unitization_mode);
    const artifacts = buildArtifacts(baseSpec, docs, units);

    const [header, firstRow] = artifacts["annotation_template.csv"].split("\n");
    expect(header).toBe(
      "study_id,rubric_version,annotator_id,doc_id,unit_id,task_type,response_payload,confidence,rationale,condition_id,compare_context,created_at,updated_at"
    );
    expect(firstRow).toBe("study_alpha,v1,,d1,d1:u0,annotate,,,,,,,");
  });

  it("generates expected artifact list including optional compare_context.jsonl", () => {
    const units = deriveUnits(docs, baseSpec.unitization_mode);
    const artifactsWithoutCompareContext = buildArtifacts(baseSpec, docs, units);

    expect(Object.keys(artifactsWithoutCompareContext)).toEqual([
      "manifest.json",
      "units.jsonl",
      "annotation_template.csv",
      "event_log_template.jsonl",
      "studio_bundle.json"
    ]);

    const artifactsWithCompareContext = buildArtifacts(
      {
        ...baseSpec,
        compare_context: [{ unit_id: "d1:u0", left: "A", right: "B" }]
      },
      docs,
      units
    );

    expect(Object.keys(artifactsWithCompareContext)).toEqual([
      "manifest.json",
      "units.jsonl",
      "annotation_template.csv",
      "compare_context.jsonl",
      "event_log_template.jsonl",
      "studio_bundle.json"
    ]);
  });

  it("produces stable output and includes round-trip reproducibility fields", () => {
    const units = deriveUnits(docs, baseSpec.unitization_mode);

    const first = buildArtifacts(baseSpec, docs, units);
    const second = buildArtifacts(baseSpec, docs, units);

    expect(first).toEqual(second);

    const studioBundle = JSON.parse(first["studio_bundle.json"]) as {
      spec: StudySpec;
      docs: InputDoc[];
      units: ReturnType<typeof deriveUnits>;
      generated_files: string[];
      rubric_config: { questions: Array<{ question_id: string }> };
    };

    expect(studioBundle.spec).toEqual(baseSpec);
    expect(studioBundle.docs).toEqual(docs);
    expect(studioBundle.units).toEqual(units);
    expect(studioBundle.generated_files).toEqual([
      "manifest.json",
      "units.jsonl",
      "annotation_template.csv",
      "event_log_template.jsonl",
      "studio_bundle.json"
    ]);
    expect(studioBundle.rubric_config.questions[0].question_id).toBe("q1");
  });
});
