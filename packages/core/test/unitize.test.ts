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
