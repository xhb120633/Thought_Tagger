import { readFile } from "node:fs/promises";

const REQUIRED_FIELDS = ["event_id", "timestamp", "actor_id", "doc_id", "unit_id", "event_type", "event_payload"];

const path = process.argv[2];
if (!path) {
  console.error("Usage: node tools/validate-event-log.mjs <event_log.jsonl>");
  process.exit(1);
}

const raw = await readFile(path, "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);
if (lines.length < 1) {
  throw new Error("Event log must contain at least one event.");
}

for (let i = 0; i < lines.length; i += 1) {
  const parsed = JSON.parse(lines[i]);
  for (const key of REQUIRED_FIELDS) {
    if (!(key in parsed)) {
      throw new Error(`Line ${i + 1} missing required field: ${key}`);
    }
  }

  if (typeof parsed.event_payload !== "object" || parsed.event_payload === null || Array.isArray(parsed.event_payload)) {
    throw new Error(`Line ${i + 1} has invalid event_payload; expected object.`);
  }
}

console.log(`Validated event log: ${path} (${lines.length} event(s))`);
