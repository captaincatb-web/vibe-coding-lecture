"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { loadData } = require("../scripts/load-silicon-library");
const reading = require("../silicon-library/src/reading-core");
const data = loadData();
function fieldAt(locator) {
  const [kind, id, field] = locator.split(".");
  const item =
    kind === "TX"
      ? data.TX[id]
      : kind === "PROC"
        ? data.PROC.find((p) => p.id === id)
        : null;
  return item && item[field];
}
test("every published product has explanatory content and valid comparison destinations", () => {
  assert.deepEqual(
    Object.keys(reading.topics).sort(),
    Object.keys(data.TX).sort(),
  );
  for (const [key, topic] of Object.entries(reading.topics)) {
    assert.ok(
      topic.role.length > 50,
      key + " needs a substantive role explanation",
    );
    assert.equal(
      topic.steps.length,
      3,
      key + " needs input, operation and evaluation context",
    );
    assert.ok(
      topic.steps.every((step) => /^.+: .+/.test(step)),
      key + " needs labelled flow steps",
    );
    assert.ok(data.TX[topic.compare.id], key + " comparison must resolve");
    assert.notEqual(topic.compare.id, key);
    for (const field of [
      topic.compare.text,
      topic.question,
      topic.answer,
      topic.focus,
    ])
      assert.ok(
        typeof field === "string" && field.length > 20,
        key + " has an incomplete reading field",
      );
  }
});
test("all ten editorial corrections exist in canonical text and the prior errors do not return", () => {
  assert.equal(reading.corrections.length, 10);
  const fields = new Set();
  for (const correction of reading.corrections) {
    const current = fieldAt(correction.target);
    assert.ok(typeof current === "string", correction.target);
    assert.ok(
      current.includes(correction.replacement),
      correction.target + " lost its correction",
    );
    assert.ok(
      !current.includes(correction.old),
      correction.target + " restored prior wording",
    );
    assert.ok(correction.reason.length > 20);
    assert.ok(
      correction.basis.length > 0 &&
        correction.basis.every((location) => fieldAt(location)),
      correction.target + " basis must refer to existing material",
    );
    assert.ok(!fields.has(correction.target));
    fields.add(correction.target);
  }
});
test("critical distinctions retain separate roles and avoid claiming universal process outcomes", () => {
  assert.match(reading.get("gasEtch").compare.text, /WF6.*텅스텐 증착/);
  assert.match(reading.get("gasBulk").answer, /수소.*공기분리.*별도/);
  assert.equal(reading.get("pr").compare.id, "pid");
  assert.equal(reading.get("probe").compare.id, "wtester");
  assert.match(reading.get("clean").role, /웨이퍼.*약액.*다릅니다/);
  assert.match(reading.get("alcap").role, /제조공정.*구분/);
  assert.match(reading.get("hbmfilm").answer, /별도 근거/);
});
test("unknown and inherited topic names do not become content", () => {
  for (const key of ["unknown", "constructor", "toString", "__proto__", ""])
    assert.equal(reading.get(key), null);
});
test("reading supplements keep company verification and source dates unchanged", () => {
  const statuses = data.ENT.facts.reduce((counts, fact) => {
    counts[fact.vs] = (counts[fact.vs] || 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(statuses, { 검증: 7, "부분 검증": 6, 미검증: 2 });
  assert.ok(data.ENT.facts.every((fact) => fact.checked === "2026-11-02"));
  assert.ok(
    Object.values(data.DEEP.sources).every(
      (source) => source.readAt === "2026-11-02",
    ),
  );
  assert.match(reading.scope, /교육용 일반 원리.*재열람 전/);
});
test("browser export provides all published topics without CommonJS", () => {
  const context = {};
  vm.runInNewContext(
    fs.readFileSync(
      require.resolve("../silicon-library/src/applied-reading"),
      "utf8",
    ),
    context,
  );
  vm.runInNewContext(
    fs.readFileSync(
      path.join(__dirname, "../silicon-library/src/reading-core.js"),
      "utf8",
    ),
    context,
  );
  assert.equal(Object.keys(context.SiliconReadingCore.topics).length, 31);
  assert.equal(
    Object.values(context.SiliconReadingCore.topics).filter((p) => p.practical)
      .length,
    31,
  );
  assert.equal(
    context.SiliconReadingCore.get("pid").question,
    reading.get("pid").question,
  );
});
test("all 31 products have distinct, immutable evaluation criteria and hypothetical investigations", () => {
  const notes = Object.entries(reading.topics).map(([id, topic]) => {
    const p = topic.practical;
    assert.ok(p && p.insight.length > 60, id);
    assert.deepEqual(p.basis, ["TX." + id]);
    assert.equal(p.metrics.length, 3);
    for (const metric of p.metrics) {
      assert.ok(
        metric.name.length > 2 &&
          metric.meaning.length > 8 &&
          metric.conditions.length > 8,
        id,
      );
    }
    const c = p.investigation;
    assert.equal(c.hypothetical, true);
    assert.match(c.observation, /가정/);
    assert.equal(c.hypotheses.length, 2);
    assert.ok(c.comparison.length > 40 && c.interpretation.length > 40, id);
    assert.ok(
      Object.isFrozen(p) &&
        Object.isFrozen(c.hypotheses) &&
        Object.isFrozen(p.metrics[0]),
    );
    return p;
  });
  for (const field of [
    (p) => p.insight,
    (p) => p.investigation.observation,
    (p) => p.investigation.comparison,
    (p) => p.investigation.interpretation,
  ])
    assert.equal(new Set(notes.map(field)).size, 31);
});
test("practical cases preserve critical distinctions for uncertain company mappings and system-level metrics", () => {
  assert.match(
    reading.get("hbmfilm").practical.investigation.interpretation,
    /AMMK.*새로 확인.*아닙니다/,
  );
  assert.match(
    reading.get("sisic").practical.investigation.interpretation,
    /와이컴.*확인.*않습니다/,
  );
  assert.match(
    reading.get("oring").practical.investigation.interpretation,
    /GT.*확인.*아닙니다/,
  );
  assert.match(
    reading.get("upw").practical.insight,
    /비저항.*모든 오염.*아닙니다/,
  );
  assert.match(
    reading.get("amhs").practical.investigation.interpretation,
    /장치 속도.*처리량.*쓰지 않습니다/,
  );
});
