import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertValidDocuments, assertValidStudySpec, deriveUnits } from "@thought-tagger/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename.slice(0, __filename.lastIndexOf("/"));
const publicDir = join(__dirname, "public");
const dataDir = join(__dirname, ".localdata");
const PORT = process.env.PORT ? Number(process.env.PORT) : 4173;

const studies = new Map();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(`${JSON.stringify(payload)}\n`);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function parseDatasetJsonl(input) {
  const lines = input.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}

function buildDocMap(documents) {
  return Object.fromEntries(documents.map((doc) => [doc.doc_id, doc]));
}

function makeStudyId(studyId) {
  return `${studyId}_${Date.now().toString(36)}`;
}

async function saveSession(payload) {
  await mkdir(dataDir, { recursive: true });
  const path = join(dataDir, `session_${payload.study_id}_${payload.annotator_id}.json`);
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return path;
}

function createStudy(payload) {
  const { spec, datasetJsonl } = payload;
  const documents = parseDatasetJsonl(datasetJsonl);

  assertValidStudySpec(spec);
  assertValidDocuments(documents);

  const units = deriveUnits(documents, spec.unitization_mode);
  const studyRuntimeId = makeStudyId(spec.study_id);
  const record = {
    studyRuntimeId,
    spec,
    documents,
    docMap: buildDocMap(documents),
    units
  };
  studies.set(studyRuntimeId, record);
  return {
    studyRuntimeId,
    manifest: {
      study_id: spec.study_id,
      rubric_version: spec.rubric_version,
      task_type: spec.task_type,
      run_mode: spec.run_mode,
      unitization_mode: spec.unitization_mode,
      document_count: documents.length,
      unit_count: units.length
    }
  };
}

function getStudy(studyRuntimeId) {
  const record = studies.get(studyRuntimeId);
  if (!record) throw new Error(`Unknown studyRuntimeId: ${studyRuntimeId}`);

  return {
    studyRuntimeId: record.studyRuntimeId,
    spec: record.spec,
    units: record.units,
    documents: record.documents
  };
}

const server = createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: "missing url" });

  if (req.method === "POST" && req.url === "/api/studies") {
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw);
      return sendJson(res, 200, createStudy(payload));
    } catch (error) {
      return sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (req.method === "GET" && req.url.startsWith("/api/studies/")) {
    try {
      const studyRuntimeId = req.url.split("/").at(-1);
      return sendJson(res, 200, getStudy(studyRuntimeId));
    } catch (error) {
      return sendJson(res, 404, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (req.method === "POST" && req.url === "/api/sessions/save") {
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw);
      const savedTo = await saveSession(payload);
      return sendJson(res, 200, { ok: true, savedTo });
    } catch (error) {
      return sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  const path = req.url === "/" ? "/index.html" : req.url;
  const filePath = join(publicDir, path);

  try {
    if (!existsSync(filePath)) {
      return sendJson(res, 404, { error: "not found" });
    }
    const file = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
    res.end(file);
  } catch {
    sendJson(res, 404, { error: "not found" });
  }
});

server.listen(PORT, () => {
  console.log(`ThoughtTagger Studio running at http://localhost:${PORT}`);
});
