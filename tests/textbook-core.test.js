"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm");
const { loadData } = require("../scripts/load-silicon-library");
const core = require("../silicon-library/src/textbook-core");
const data = loadData();
test("eleven original textbooks contain fifty-five complete lessons and all existing products are covered", () => {
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
    55,
  );
  assert.deepEqual(
    [...new Set(core.books.flatMap((book) => book.products))].sort(),
    Object.keys(data.TX).sort(),
  );
  for (const book of core.books) {
    assert.equal(book.chapters.length, 5);
    assert.equal(new Set(book.chapters.map((chapter) => chapter.id)).size, 5);
    assert.equal(book.goals.length, 3);
    assert.equal(book.terms.length, 6);
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
      require.resolve("../silicon-library/src/textbook-advanced"),
      "utf8",
    ),
    context,
  );
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
  assert.equal(context.SiliconTextbookCore.stats.chapters, 55);
  assert.equal(
    context.SiliconTextbookCore.get("MEM").chapters[3].worked.hypothetical,
    true,
  );
});
test("every book has a bounded worked example, a synthesis lesson and six substantive terms", () => {
  assert.deepEqual(core.stats, {
    books: 11,
    chapters: 55,
    terms: 66,
    worked: 11,
  });
  for (const book of core.books) {
    assert.equal(book.chapters.filter((c) => c.worked).length, 1);
    assert.ok(book.chapters[3].worked && !book.chapters[4].worked);
    const w = book.chapters[3].worked;
    assert.equal(w.hypothetical, true);
    assert.ok(
      w.assumptions.length >= 2 && w.steps.length >= 2 && w.rows.length >= 2,
    );
    assert.ok(
      w.rows.every(
        (row) =>
          row.length === 2 &&
          row.every((v) => typeof v === "string" && v.length),
      ),
    );
    assert.ok(
      w.formula.length > 15 && w.conclusion.length > 30 && w.limits.length > 30,
    );
    assert.ok(Object.isFrozen(w) && Object.isFrozen(w.assumptions));
    assert.ok(book.terms.every((t) => t[1].length > 20));
  }
  const ps = core.books.flatMap((b) => b.chapters.flatMap((c) => c.paragraphs));
  assert.equal(
    new Set(ps).size,
    ps.length,
    "paragraphs must not be copied between lessons",
  );
});
test("the eleven published numerical examples retain independently checked arithmetic and units", () => {
  const steps = (id) => core.get(id).chapters[3].worked.steps.join(" ");
  assert.ok(steps("IND").includes((20 / 160) * 100 + "%"));
  assert.ok(steps("FIL").includes(((250 - 20) * 0.08).toFixed(1) + " nm"));
  assert.ok(
    steps("PLS").includes(
      (((20 / 400 - 8 / 400) / (20 / 400)) * 100).toFixed(0) + "%",
    ),
  );
  assert.ok(steps("ETC").includes((120 / 60) * 1.25 * 3 + " nm"));
  assert.ok(steps("LIT").includes((0.8 ** 2).toFixed(2)));
  assert.ok(steps("CMP").includes((820 + 850 + 880) / 3 + " nm"));
  assert.ok(steps("PRC").includes((0.98 * 0.97 * 0.99 * 100).toFixed(2) + "%"));
  assert.ok(steps("PKG").includes((0.99 ** 8 * 0.98 * 100).toFixed(2) + "%"));
  assert.ok(steps("TST").includes(((90 / (90 + 99)) * 100).toFixed(2) + "%"));
  assert.ok(steps("TST").includes(((10 / (9801 + 10)) * 100).toFixed(3) + "%"));
  assert.ok(steps("MEM").includes(((256 * 4) / 8) * 0.8 + " GB/s"));
  assert.ok(steps("FAB").includes(((100 - (15 + 60 + 10)) / 100) * 100 + "%"));
});
