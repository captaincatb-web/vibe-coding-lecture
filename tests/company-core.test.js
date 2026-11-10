"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const content = require("../silicon-library/src/company-core"),
  { loadData } = require("../scripts/load-silicon-library"),
  { normalize } = require("../scripts/normalize-silicon-library"),
  explorer = require("../silicon-library/src/explorer-core");
const data = JSON.parse(JSON.stringify(loadData())),
  profiles = Object.values(content.profiles);
test("company chapters cover all 45 company records without merging affiliated entities or book aliases", () => {
  const firms = data.ENT.list;
  assert.deepEqual(
    profiles.map((p) => p.id).sort(),
    firms.map((e) => e.id).sort(),
  );
  for (const p of profiles) {
    const entity = firms.find((e) => e.id === p.id);
    assert.equal(p.name, entity.row);
    assert.deepEqual([...p.product_ids].sort(), [...entity.products].sort());
  }
  assert.notEqual(content.get("c03"), content.get("c05"));
  for (const id of Object.keys(data.TX))
    assert.deepEqual(
      content
        .forProduct(id)
        .map((p) => p.id)
        .sort(),
      firms
        .filter((e) => e.products.includes(id))
        .map((e) => e.id)
        .sort(),
    );
  assert.equal(content.forProduct("pre").length, 5);
  assert.equal(profiles.length, 45);
  assert.equal(data.B.length, 46);
});
test("every displayed material and company chapter has existing source identifiers and complete renderable content", () => {
  for (const p of profiles) {
    assert.ok(p.materials.length >= 1 && p.materials.length <= 3);
    assert.equal(p.chapters.length, 3);
    assert.equal(p.peers.length, 2);
    for (const item of p.materials.concat(p.chapters)) {
      assert.ok(item.sources.length || p.evidence_limited);
      for (const id of item.sources) {
        assert.ok(data.S[id], id);
        assert.match(data.S[id][1], /^https?:\/\//);
      }
    }
    for (const ch of p.chapters) {
      assert.ok(ch.title);
      assert.equal(ch.paragraphs.length, 2);
      assert.ok(ch.paragraphs.every((x) => typeof x === "string" && x.trim()));
    }
    for (const peer of p.peers) {
      assert.ok(content.get(peer.id));
      assert.notEqual(peer.id, p.id);
    }
    assert.match(p.example.situation, /가정/);
    assert.equal(p.example.hypothetical, true);
  }
});
test("company narratives, examples and evaluation questions do not repeat a shared template", () => {
  for (const field of [
    (p) => p.theme,
    (p) => p.intro,
    (p) => p.chapters.map((c) => c.paragraphs.join(" ")).join(" "),
    (p) => p.example.title,
    (p) => p.questions.join(" "),
  ])
    assert.equal(new Set(profiles.map(field)).size, profiles.length);
  const paragraphs = profiles.flatMap((p) =>
    p.chapters.flatMap((c) => c.paragraphs),
  );
  assert.equal(new Set(paragraphs).size, paragraphs.length);
});
test("prior overgeneralizations about DPT, a complete business transition, rankings and Mo feed conditions do not return", () => {
  const dnf = data.B.find((b) => b.n === "디엔에프"),
    soul = data.B.find((b) => b.n === "솔브레인"),
    merck = data.B.find((b) => b.n === "Merck (한국머크)");
  assert.ok(!dnf.one.includes("전환한 업체"));
  assert.ok(!dnf.tech.some((s) => s.includes("DPT 공정 필수 소재")));
  assert.ok(!soul.one.includes("국내 최대"));
  assert.ok(!merck.tech.some((s) => s.includes("몰리브덴은 상온 고체라 175")));
  const before = { 검증: 7, "부분 검증": 6, 미검증: 2 };
  assert.deepEqual(
    data.ENT.facts.reduce((o, f) => ((o[f.vs] = (o[f.vs] || 0) + 1), o), {}),
    before,
  );
  assert.ok(data.ENT.facts.every((f) => f.checked === "2026-11-02"));
  assert.match(content.scope, /원문 재열람 전/);
});
test("new company explanations can be found in the existing integrated search without adding records or verified claims", () => {
  const index = explorer.createIndex(normalize(data));
  assert.equal(index.records.length, 94);
  assert.deepEqual(explorer.validateIndex(index), []);
  for (const [query, id] of [
    ["잔류 염소", "c01"],
    ["TMA 원천 기술", "c02"],
    ["특허 종료 보도", "c03"],
    ["고체 전구체", "c04"],
    ["내부거래 제거", "c05"],
  ])
    assert.ok(
      explorer.search(index, query, "company").some((r) => r.id === id),
      query,
    );
  assert.equal(index.claims.length, data.ENT.facts.length);
});
test("company content is immutable, works in the browser and ignores inherited names", () => {
  assert.ok(Object.isFrozen(profiles[0].chapters[0].paragraphs));
  for (const id of ["__proto__", "constructor", "toString", "unknown", ""])
    assert.equal(content.get(id), null);
  const context = {};
  vm.runInNewContext(
    fs.readFileSync(
      require.resolve("../silicon-library/src/company-supplements"),
      "utf8",
    ),
    context,
  );
  vm.runInNewContext(
    fs.readFileSync(
      require.resolve("../silicon-library/src/company-core"),
      "utf8",
    ),
    context,
  );
  assert.equal(
    context.SiliconCompanyCore.get("c04").theme,
    content.get("c04").theme,
  );
  assert.equal(Object.keys(context.SiliconCompanyCore.profiles).length, 45);
});
test("records without company sources keep their gap explicit rather than acquiring fabricated product evidence", () => {
  assert.deepEqual(
    profiles.filter((p) => p.evidence_limited).map((p) => p.id),
    ["c34", "c36"],
  );
  for (const id of ["c34", "c36"]) {
    const p = content.get(id);
    assert.ok(p.intro.includes("목록"));
    assert.ok(
      p.materials.concat(p.chapters).every((x) => x.sources.length === 0),
    );
    assert.ok(p.compare.material.includes("확인 전"));
  }
  assert.match(content.get("c39").intro, /HBM.*추정/);
});
