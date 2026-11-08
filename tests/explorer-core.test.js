"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"),
  os = require("os"),
  path = require("path");
const { normalize } = require("../scripts/normalize-silicon-library");
const { loadData } = require("../scripts/load-silicon-library");
const core = require("../silicon-library/src/explorer-core");
const { buildIndex } = require("../scripts/build-explorer-index");
const data = normalize(loadData()),
  index = core.createIndex(data);
test("index covers every canonical record without merging book aliases", () => {
  assert.deepEqual(core.validateIndex(index), []);
  assert.equal(index.records.length, 94);
  assert.equal(index.records.filter((r) => r.type === "company").length, 45);
  assert.equal(index.records.filter((r) => r.id === "c22").length, 1);
  assert.equal(index.source_digest, data.metadata.legacy_digest);
});
test("Korean/English and spaced aliases find the same product", () => {
  for (const q of [
    "ALD",
    "원자층 증착",
    "원자층증착",
    "atomic layer deposition",
    "ＡＬＤ",
  ])
    assert.ok(
      core.search(index, q, "product").some((r) => r.key === "product:pre"),
    );
  assert.ok(
    core
      .search(index, "Soulbrain", "company")
      .some((r) => r.key === "company:c05"),
  );
  assert.ok(
    core
      .search(index, "에이텍솔루션 (세정)", "company")
      .some((r) => r.key === "company:c22"),
  );
});
test("deep text is searchable and type filters remain strict", () => {
  assert.ok(
    core.search(index, "Preston").some((r) => r.key === "knowledge:deep:cmp"),
  );
  for (const type of ["company", "product", "process", "knowledge"])
    assert.ok(core.search(index, "HBM", type).every((r) => r.type === type));
  assert.deepEqual(core.search(index, "no-such-item-999"), []);
});
test("product→process→company and company→product links are reciprocal", () => {
  const pre = core.related(index, "product:pre");
  assert.ok(pre.some((r) => r.key === "process:dep"));
  assert.ok(pre.some((r) => r.key === "company:c05"));
  assert.ok(
    core.related(index, "company:c05").some((r) => r.key === "product:pre"),
  );
  assert.deepEqual(core.related(index, "missing"), []);
});
test("metrology has no invented firm and related industry has no fabricated process", () => {
  assert.equal(
    core.related(index, "process:metro").filter((r) => r.type === "company")
      .length,
    0,
  );
  assert.equal(
    core.related(index, "product:alcap").filter((r) => r.type === "process")
      .length,
    0,
  );
});
test("sources retain original access limits and historical facts", () => {
  assert.equal(index.claims.length, 15);
  assert.ok(index.sources.every((s) => s.retrieval_status === "not_rechecked"));
  const knowledge = index.records.find((r) => r.key === "knowledge:deep:dep");
  assert.ok(knowledge.source_ids.includes("d_ald1"));
  assert.equal(
    index.records.find((r) => r.key === "company:c27").claim_ids.length,
    6,
  );
});
test("shared URL state round trips Korean queries and typed selections", () => {
  const state = { query: "원자층 증착", type: "product", item: "product:pre" };
  assert.deepEqual(core.readState(core.stateHash(state)), state);
  assert.equal(core.readState("#explore?type=invalid").type, "all");
  assert.equal(
    core.readState("#explore?q=" + "a".repeat(300)).query.length,
    200,
  );
});
test("duplicate keys, orphan links, asymmetric edges and unsafe sources fail", () => {
  const clone = () => JSON.parse(JSON.stringify(index));
  let d = clone();
  d.records.push(d.records[0]);
  assert.ok(core.validateIndex(d).length);
  d = clone();
  d.records[0].related_keys.push("product:missing");
  assert.ok(core.validateIndex(d).length);
  d = clone();
  d.records[0].related_keys = [];
  assert.ok(core.validateIndex(d).length);
  d = clone();
  d.sources[0].url = "javascript:alert(1)";
  assert.ok(core.validateIndex(d).length);
});
test("index build is deterministic and failed conversion preserves prior output", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "silicon-explorer-test-")),
    output = path.join(dir, "index.json");
  try {
    buildIndex({ data, output });
    const good = fs.readFileSync(output, "utf8");
    buildIndex({ data, output });
    assert.equal(fs.readFileSync(output, "utf8"), good);
    assert.doesNotThrow(() => buildIndex({ data, output, check: true }));
    const bad = JSON.parse(JSON.stringify(data));
    bad.companies[0].source_ids.push("missing");
    assert.throws(() => buildIndex({ data: bad, output }));
    assert.equal(fs.readFileSync(output, "utf8"), good);
    fs.writeFileSync(output, "stale");
    assert.throws(() => buildIndex({ data, output, check: true }), /stale/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
