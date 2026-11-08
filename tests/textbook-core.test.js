"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm");
const { loadData } = require("../scripts/load-silicon-library");
const core = require("../silicon-library/src/textbook-core");
const data = loadData();
test("eleven original textbooks contain thirty-three complete lessons and all existing products are covered", () => {
  assert.deepEqual(
    core.books.map((book) => book.id).sort(),
    [
      "IND",
      "FIL",
      "PLS",
      "ETC",
      "LIT",
      "CMP",
      "PRC",
      "PKG",
      "TST",
      "MEM",
      "FAB",
    ].sort(),
  );
  assert.equal(
    core.books.reduce((n, book) => n + book.chapters.length, 0),
    33,
  );
  assert.deepEqual(
    [...new Set(core.books.flatMap((book) => book.products))].sort(),
    Object.keys(data.TX).sort(),
  );
  for (const book of core.books) {
    assert.equal(book.chapters.length, 3);
    assert.equal(new Set(book.chapters.map((chapter) => chapter.id)).size, 3);
    assert.equal(book.goals.length, 3);
    assert.equal(book.terms.length, 3);
    for (const chapter of book.chapters) {
      assert.ok(
        chapter.paragraphs.length >= 2 &&
          chapter.paragraphs.join("").length > 200,
        book.id + "/" + chapter.id,
      );
      assert.ok(
        chapter.example.length > 60 &&
          chapter.question.length > 10 &&
          chapter.answer.length > 30,
      );
      assert.ok(chapter.links.length > 0);
    }
  }
});
test("lesson links resolve to existing processes, products, labs and company records", () => {
  const labs = new Set(["ald", "lithography", "cmp", "sequence", "packaging"]);
  for (const book of core.books) {
    assert.ok(book.products.every((id) => data.TX[id]));
    const reference = new URL(book.reference);
    assert.equal(reference.protocol, "https:");
    assert.equal(reference.hostname, "semi.euiyun.com");
    for (const chapter of book.chapters)
      for (const [label, href] of chapter.links) {
        assert.ok(label.length > 0);
        if (href.startsWith("#x-")) assert.ok(data.TX[href.slice(3)], href);
        else if (href.startsWith("#t-"))
          assert.ok(
            data.PROC.some((p) => p.id === href.slice(3)),
            href,
          );
        else if (href.startsWith("#labs?"))
          assert.ok(
            labs.has(new URLSearchParams(href.split("?")[1]).get("lab")),
            href,
          );
        else assert.ok(href === "#map" || href.startsWith("#explore"), href);
      }
  }
});
test("every chapter and whole-book URL round trips without losing identity", () => {
  for (const book of core.books) {
    assert.equal(
      core.resolve(core.route(book.id)).chapter.id,
      book.chapters[0].id,
    );
    for (const chapter of book.chapters) {
      const state = core.resolve(core.route(book.id, chapter.id));
      assert.equal(state.book.id, book.id);
      assert.equal(state.chapter.id, chapter.id);
      assert.equal(state.all, false);
    }
    assert.equal(core.resolve(core.route(book.id, "all")).all, true);
  }
});
test("invalid and inherited book names never become textbook records", () => {
  for (const id of ["constructor", "toString", "__proto__", "UNKNOWN", ""]) {
    assert.equal(core.get(id), null);
    assert.equal(core.resolve("#textbook?book=" + id), null);
    assert.throws(() => core.route(id), RangeError);
  }
  for (const hash of [
    null,
    "#textbooks",
    "#textbook?book=FIL&book=MEM",
    "#textbook?book=FIL&chapter=methods&chapter=all",
    "https://example.com/#textbook?book=FIL",
    "#textbook?book=FIL&x=" + "x".repeat(2000),
  ])
    assert.equal(core.resolve(hash), null);
  assert.equal(
    core.resolve("#textbook?book=FIL&chapter=constructor").chapter.id,
    "function",
  );
  assert.throws(() => core.route("FIL", "constructor"), RangeError);
});
test("textbook search handles bilingual, spaced, width-normalized and empty queries", () => {
  assert.equal(core.search("").length, 11);
  assert.deepEqual(
    core.search("지연시간").map((book) => book.id),
    ["MEM"],
  );
  assert.ok(core.search("ＡＬＤ").some((book) => book.id === "FIL"));
  assert.ok(core.search("부산물 배출").some((book) => book.id === "ETC"));
  assert.deepEqual(core.search("<script>alert(1)</script>"), []);
});
test("textbook module exports in a browser without a CommonJS runtime", () => {
  const context = { URLSearchParams };
  vm.runInNewContext(
    fs.readFileSync(
      require.resolve("../silicon-library/src/textbook-core"),
      "utf8",
    ),
    context,
  );
  assert.equal(
    context.SiliconTextbookCore.resolve("#textbook?book=TST&chapter=interfaces")
      .chapter.id,
    "interfaces",
  );
});
