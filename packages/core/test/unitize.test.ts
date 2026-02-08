import test from "node:test";
import assert from "node:assert/strict";
import { deriveUnits } from "../src/unitize.js";

test("sentence_step unitization splits deterministic sentences", () => {
  const units = deriveUnits([{ doc_id: "d1", text: "Alpha. Beta!" }], "sentence_step");
  assert.equal(units.length, 2);
  assert.equal(units[0].unit_text, "Alpha.");
  assert.equal(units[1].unit_text, "Beta!");
  assert.equal(units[1].index, 1);
});

test("target_span unitization emits one unit per span in deterministic offset order", () => {
  const units = deriveUnits(
    [
      {
        doc_id: "d2",
        text: "Alpha Beta Gamma",
        target_spans: [
          { char_start: 11, char_end: 16 },
          { char_start: 0, char_end: 5 }
        ]
      }
    ],
    "target_span"
  );

  assert.equal(units.length, 2);
  assert.deepEqual(
    units.map((unit) => ({
      index: unit.index,
      char_start: unit.char_start,
      char_end: unit.char_end,
      unit_text: unit.unit_text,
      unit_id: unit.unit_id
    })),
    [
      { index: 0, char_start: 0, char_end: 5, unit_text: "Alpha", unit_id: "d2:u0" },
      { index: 1, char_start: 11, char_end: 16, unit_text: "Gamma", unit_id: "d2:u1" }
    ]
  );
});

test("target_span unitization rejects missing spans", () => {
  assert.throws(
    () => deriveUnits([{ doc_id: "d3", text: "Alpha" }], "target_span"),
    /must include at least one target span/
  );
});

test("target_span unitization rejects out-of-range spans", () => {
  assert.throws(
    () =>
      deriveUnits(
        [{ doc_id: "d4", text: "Alpha", target_spans: [{ char_start: 1, char_end: 99 }] }],
        "target_span"
      ),
    /out-of-range target span/
  );
});

test("target_span unitization rejects empty spans", () => {
  assert.throws(
    () =>
      deriveUnits(
        [{ doc_id: "d5", text: "Alpha", target_spans: [{ char_start: 2, char_end: 2 }] }],
        "target_span"
      ),
    /empty target span/
  );
});

test("target_span unitization rejects overlapping spans", () => {
  assert.throws(
    () =>
      deriveUnits(
        [
          {
            doc_id: "d6",
            text: "Alpha Beta",
            target_spans: [
              { char_start: 0, char_end: 5 },
              { char_start: 4, char_end: 8 }
            ]
          }
        ],
        "target_span"
      ),
    /overlapping target spans/
  );
});
