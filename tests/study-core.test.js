"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const c = require("../silicon-library/src/study-core");

test("learning paths have stable unique IDs and the existing public destinations", () => {
  assert.deepEqual(
    c.paths.map((p) => p.id),
    ["intro", "practice", "advanced", "industry"],
  );
  assert.deepEqual(
    c.paths.map((p) => p.title),
    [
      "입문 · 제조 흐름 잡기",
      "실무 · 품목과 공정 잇기",
      "심화 · 적층과 검사 이해하기",
      "산업 · 기업과 근거 따라가기",
    ],
  );
  assert.deepEqual(
    c.paths.map((p) => p.steps.map((s) => s.href)),
    [
      ["#t-wafer", "#t-photo", "#t-dep", "#labs?lab=lithography"],
      ["#x-pre", "#t-etch", "#t-cmp", "#labs?lab=sequence"],
      ["#t-hbm", "#t-test", "#labs?lab=packaging", "#labs?lab=ald"],
      ["#explore", "#explore?type=company", "#explore?type=product", "#map"],
    ],
  );
  const ids = c.paths.flatMap((p) => p.steps.map((s) => s.id));
  assert.equal(ids.length, 16);
  assert.equal(new Set(ids).size, 16);
  assert.throws(() => {
    c.paths[0].steps[0].id = "replacement";
  }, TypeError);
});

test("empty and parsed state are fresh and survive a JSON round trip", () => {
  let state = c.toggle(c.empty(), "intro-wafer", true);
  state = c.answer(state, "ald", 0);
  state = c.resume(state, "ald", "#labs?lab=ald&cycles=120&gpc=0.1");
  assert.deepEqual(c.parse(JSON.stringify(state)), state);
  const parsed = c.parse(state);
  assert.deepEqual(parsed, state);
  assert.notEqual(parsed, state);
  assert.notEqual(parsed.completed, state.completed);
  assert.notEqual(parsed.answers, state.answers);
  assert.notEqual(parsed.lastLab, state.lastLab);
  assert.notEqual(c.empty().completed, c.empty().completed);
  assert.notEqual(c.empty().answers, c.empty().answers);
});

test("malformed, primitive and unsupported payloads reset safely", () => {
  for (const raw of [
    undefined,
    null,
    true,
    42,
    [],
    "",
    "{",
    "null",
    "[]",
    {},
    { version: 2 },
    { version: "1" },
  ])
    assert.deepEqual(c.parse(raw), c.empty());
  const accessor = {
    version: 1,
    get completed() {
      throw new Error("must not execute");
    },
  };
  assert.deepEqual(c.parse(accessor), c.empty());
  const inherited = Object.create({ version: 1, completed: ["intro-wafer"] });
  assert.deepEqual(c.parse(inherited), c.empty());
  assert.deepEqual(
    c.parse(
      new Proxy(
        {},
        {
          getOwnPropertyDescriptor() {
            throw new Error("unreadable");
          },
        },
      ),
    ),
    c.empty(),
  );
});

test("parsing filters unknown and duplicate steps and invalid answers without losing valid data", () => {
  const normalized = c.parse({
    version: 1,
    completed: [
      "intro-wafer",
      "unknown",
      "intro-wafer",
      0,
      null,
      "advanced-ald",
    ],
    answers: {
      lithography: 2,
      ald: 0,
      cmp: "1",
      sequence: -1,
      packaging: 3,
      unknown: 1,
    },
    lastLab: { id: "ald", hash: "#labs?lab=ald&cycles=120" },
    theme: "light",
  });
  assert.deepEqual(normalized, {
    version: 1,
    completed: ["intro-wafer", "advanced-ald"],
    answers: { lithography: 2, ald: 0 },
    lastLab: { id: "ald", hash: "#labs?lab=ald&cycles=120" },
  });
  const polluted = JSON.parse(
    '{"version":1,"answers":{"__proto__":{"bad":true},"constructor":1,"cmp":1},"completed":["__proto__"]}',
  );
  assert.deepEqual(c.parse(polluted).answers, { cmp: 1 });
  const inheritedAnswers = Object.create({ ald: 1 });
  inheritedAnswers.cmp = 2;
  assert.deepEqual(c.parse({ version: 1, answers: inheritedAnswers }).answers, {
    cmp: 2,
  });
});

test("all mutations preserve input and independent study fields", () => {
  const state = {
    version: 1,
    completed: ["intro-wafer"],
    answers: { ald: 0 },
    lastLab: { id: "ald", hash: "#labs?lab=ald&cycles=40" },
  };
  const before = JSON.stringify(state);
  const added = c.toggle(state, "practice-cmp", true);
  assert.deepEqual(added.completed, ["intro-wafer", "practice-cmp"]);
  assert.deepEqual(c.toggle(added, "practice-cmp", true), added);
  assert.deepEqual(c.toggle(added, "intro-wafer", false).completed, [
    "practice-cmp",
  ]);
  assert.deepEqual(c.toggle(state, "industry-map", false), state);
  const answered = c.answer(state, "ald", 1);
  assert.deepEqual(answered.answers, { ald: 1 });
  assert.deepEqual(answered.completed, state.completed);
  assert.deepEqual(answered.lastLab, state.lastLab);
  const resumed = c.resume(state, "cmp", "#labs?lab=cmp&pressure=2");
  assert.deepEqual(resumed.answers, state.answers);
  assert.deepEqual(resumed.completed, state.completed);
  for (const next of [added, answered, resumed]) {
    assert.notEqual(next.completed, state.completed);
    assert.notEqual(next.answers, state.answers);
    assert.notEqual(next.lastLab, state.lastLab);
  }
  assert.equal(JSON.stringify(state), before);
});

test("visiting and answering labs never mark a learning step complete", () => {
  let state = c.empty();
  for (const lab of ["lithography", "ald", "cmp", "sequence", "packaging"]) {
    state = c.resume(state, lab, "#labs?lab=" + lab);
    state = c.answer(state, lab, 0);
  }
  assert.deepEqual(state.completed, []);
  assert.equal(Object.keys(state.answers).length, 5);
  state = c.toggle(state, "advanced-ald", true);
  state = c.resume(state, "ald", "#labs?lab=ald&cycles=50");
  assert.deepEqual(state.completed, ["advanced-ald"]);
});

test("mutations reject unknown IDs and invalid completion or choice values", () => {
  for (const step of ["unknown", "__proto__", "ald", null, 0, {}])
    assert.throws(() => c.toggle(c.empty(), step, true), RangeError);
  for (const done of [undefined, 0, 1, "true", null])
    assert.throws(() => c.toggle(c.empty(), "intro-wafer", done), RangeError);
  for (const lab of ["unknown", "constructor", null, 1, {}])
    assert.throws(() => c.answer(c.empty(), lab, 0), RangeError);
  for (const choice of [-1, 3, 0.5, NaN, Infinity, "0", null, true, undefined])
    assert.throws(() => c.answer(c.empty(), "ald", choice), RangeError);
});

test("resume keeps valid local lab URLs including default and encoded lab IDs", () => {
  for (const [id, hash] of [
    ["lithography", "#labs"],
    ["lithography", "#labs?na=1.2"],
    ["ald", "#labs?cycles=120&lab=%61ld"],
    ["sequence", "#labs?lab=sequence&steps=wafer%2Cdep%2Cphoto"],
  ]) {
    const expected = { id, hash };
    assert.deepEqual(c.resume(c.empty(), id, hash).lastLab, expected);
    assert.deepEqual(
      c.parse({ version: 1, lastLab: expected }).lastLab,
      expected,
    );
  }
});

test("resume rejects mismatched, ambiguous, external and oversized URLs", () => {
  for (const [id, hash] of [
    ["ald", "#labs"],
    ["ald", "#labs?lab=cmp"],
    ["ald", "#labs?lab=ald&lab=ald"],
    ["lithography", "#labs?lab="],
    ["unknown", "#labs?lab=unknown"],
    ["ald", "https://example.com/#labs?lab=ald"],
    ["ald", "#explore?lab=ald"],
    ["ald", "#labs-extra?lab=ald"],
    ["ald", "#labs?lab=ald#fragment"],
    ["ald", "#labs?lab=ald\n"],
    ["ald", null],
    ["ald", 12],
    ["ald", "#labs?lab=ald&x=" + "a".repeat(2000)],
  ]) {
    assert.throws(() => c.resume(c.empty(), id, hash), RangeError);
    assert.equal(c.parse({ version: 1, lastLab: { id, hash } }).lastLab, null);
  }
  const prefix = "#labs?lab=ald&x=",
    hash = prefix + "a".repeat(2000 - prefix.length);
  assert.equal(c.resume(c.empty(), "ald", hash).lastLab.hash.length, 2000);
});

test("UMD browser export exposes the same pure API without CommonJS", () => {
  const vm = require("node:vm"),
    fs = require("node:fs");
  const sandbox = { URLSearchParams };
  vm.runInNewContext(
    fs.readFileSync(
      require.resolve("../silicon-library/src/study-core"),
      "utf8",
    ),
    sandbox,
  );
  assert.equal(typeof sandbox.SiliconStudyCore.toggle, "function");
  assert.equal(sandbox.SiliconStudyCore.paths.length, 4);
  assert.equal(
    sandbox.SiliconStudyCore.resume(null, "ald", "#labs?lab=ald").lastLab.id,
    "ald",
  );
});
