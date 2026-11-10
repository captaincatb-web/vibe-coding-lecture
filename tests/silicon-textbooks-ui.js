"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const core = require("../silicon-library/src/textbook-core");
const url = process.env.SL_TEST_URL || "http://127.0.0.1:8767/silicon-library/";
let passed = 0;
function ok(name, condition) {
  assert.ok(condition, name);
  console.log("PASS " + name);
  passed++;
}
(async () => {
  const browser = await chromium.launch(
    process.env.SL_BROWSER_EXECUTABLE
      ? { executablePath: process.env.SL_BROWSER_EXECUTABLE }
      : {},
  );
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    if (process.env.SL_OFFLINE_FIXTURES === "1")
      await context.route("https://fonts.googleapis.com/**", (r) =>
        r.fulfill({ contentType: "text/css", body: "" }),
      );
    let externalRequests = 0;
    await context.route("https://semi.euiyun.com/**", (r) => {
      externalRequests++;
      return r.abort();
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(url);
    await page.evaluate(() => {
      localStorage.setItem("semiPartners:fav:v1", '["솔브레인"]');
      localStorage.setItem(
        "siliconLibrary:study:v1",
        '{"version":1,"completed":["intro-wafer"],"answers":{},"lastLab":null}',
      );
    });
    const saved = await page.evaluate(() => [
      localStorage.getItem("semiPartners:fav:v1"),
      localStorage.getItem("siliconLibrary:study:v1"),
    ]);
    await page.goto(url + "#b0");
    const local = page.locator('ul.rel a[href^="#textbook?book="]');
    ok(
      "company book offers local textbooks and retains external reference links",
      (await local.count()) > 0 &&
        (await page.locator('ul.rel a[target="_blank"]').count()) > 0,
    );
    await local.first().click();
    await page.locator(".textbook-chapter").waitFor();
    ok(
      "together-reading opens an authored local chapter",
      /book=FIL/.test(page.url()) &&
        /박막과 증착/.test(
          await page.locator(".textbook-banner h2").innerText(),
        ),
    );
    await page.goto(url + "#textbooks");
    await page.locator(".textbook-card").first().waitFor();
    ok(
      "textbook library contains eleven readable covers",
      (await page.locator(".textbook-card").count()) === 11,
    );
    const shortcuts = await page
      .getByRole("navigation", { name: "계산 예제 바로가기" })
      .locator("a")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));
    for (const href of shortcuts) {
      await page
        .locator('.textbook-applied-starts a[href="' + href + '"]')
        .click();
      await page.locator(".textbook-worked").waitFor();
      ok(
        "curated calculation shortcut opens the matching lesson: " + href,
        (await page
          .locator(
            '.textbook-chapter[data-chapter="' +
              core.resolve(href).chapter.id +
              '"]',
          )
          .count()) === 1,
      );
      await page
        .getByRole("link", { name: "← 교과서 서가", exact: true })
        .click();
      await page.locator("#textbook-search").waitFor();
    }
    await page.locator("#textbook-search").fill("지연시간");
    ok(
      "full-text search finds the memory textbook",
      (await page.locator(".textbook-card:not([hidden])").count()) === 1 &&
        /MEM/.test(
          await page
            .locator(".textbook-card:not([hidden])")
            .getAttribute("href"),
        ),
    );
    await page.reload();
    await page.locator("#textbook-search").waitFor();
    ok(
      "shared search URL restores the query",
      (await page.locator("#textbook-search").inputValue()) === "지연시간",
    );
    for (const [query, id] of [
      ["18.4 nm", "FIL"],
      ["0.102%", "TST"],
      ["102.4 GB/s", "MEM"],
    ]) {
      await page.locator("#textbook-search").fill(query);
      ok(
        "worked example values are searchable: " + id,
        (await page.locator(".textbook-card:not([hidden])").count()) === 1 &&
          (await page
            .locator(".textbook-card:not([hidden])")
            .getAttribute("data-book")) === id,
      );
    }
    await page.locator("#textbook-search").fill("<img src=x onerror=alert(1)>");
    ok(
      "empty search is explicit and input is never interpreted as markup",
      /0종/.test(await page.locator("#textbook-search-status").innerText()) &&
        (await page.locator("#textbook-root img").count()) === 0,
    );
    for (const book of core.books) {
      for (const chapter of book.chapters) {
        await page.goto(url + core.route(book.id, chapter.id));
        const article = page.locator(
          '.textbook-chapter[data-chapter="' + chapter.id + '"]',
        );
        await article.waitFor();
        ok(
          book.id +
            "/" +
            chapter.id +
            " publishes its explanation, example and review",
          (await article.locator(":scope > p").count()) ===
            chapter.paragraphs.length &&
            (await article.locator(".textbook-example p").innerText()) ===
              chapter.example &&
            (await article.locator(".textbook-review p").textContent()) ===
              chapter.answer,
        );
        if (chapter.worked) {
          const worked = article.locator(".textbook-worked");
          ok(
            book.id +
              " publishes assumptions, inputs, calculations and model limits",
            (await worked.locator("tbody tr").count()) ===
              chapter.worked.rows.length &&
              (await worked.locator("ol li").allTextContents()).join(" ") ===
                chapter.worked.steps.join(" ") &&
              (await worked.locator(".textbook-model-result").innerText()) ===
                chapter.worked.conclusion &&
              (
                await worked.locator(".textbook-model-limits").innerText()
              ).includes(chapter.worked.limits) &&
              /가상 수치.*실제 회사 성능.*아닙니다/.test(
                await worked.innerText(),
              ),
          );
        }
      }
      await page.goto(url + core.route(book.id, "all"));
      await page.locator(".textbook-chapter").first().waitFor();
      ok(
        book.id + " whole-book view contains every chapter and its terms",
        (await page.locator(".textbook-chapter").count()) ===
          book.chapters.length &&
          (await page.locator(".textbook-terms dt").count()) ===
            book.terms.length &&
          (await page.locator(".textbook-product-link").count()) ===
            book.products.length,
      );
    }
    await page.goto(url + core.route("FIL"));
    await page.setViewportSize({ width: 400, height: 900 });
    const methods = page.locator(
      '.textbook-toc a[href="' + core.route("FIL", "methods") + '"]',
    );
    await methods.focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-chapter="methods"]').waitFor();
    ok(
      "mobile keyboard table of contents focuses and reveals the chosen chapter",
      await page.evaluate(
        () =>
          document.activeElement.matches(".textbook-chapter h3") &&
          document.activeElement.getBoundingClientRect().top >= 0 &&
          document.activeElement.getBoundingClientRect().top < innerHeight,
      ),
    );
    await page.locator(".textbook-review summary").focus();
    await page.keyboard.press("Enter");
    ok(
      "review answer can be revealed by keyboard",
      (await page.locator(".textbook-review").getAttribute("open")) !== null,
    );
    await page.getByRole("link", { name: "다음 장 →", exact: true }).click();
    await page.locator('[data-chapter="quality"]').waitFor();
    ok(
      "next chapter updates the shareable URL",
      /chapter=quality/.test(page.url()),
    );
    await page.goBack();
    await page.locator('[data-chapter="methods"]').waitFor();
    ok(
      "browser Back restores the previous chapter",
      /chapter=methods/.test(page.url()),
    );
    await page.reload();
    await page.locator('[data-chapter="methods"]').waitFor();
    ok(
      "chapter deep link survives reload",
      (await page
        .locator('.textbook-toc a[aria-current="page"]')
        .innerText()) === "02 ALD·CVD·PVD는 무엇이 다른가",
    );
    await page.locator(".textbook-scope summary").click();
    const external = page.locator('.textbook-scope a[target="_blank"]');
    ok(
      "external reference is explicit and opens safely",
      /재열람 전/.test(await external.innerText()) &&
        /noopener/.test(await external.getAttribute("rel")) &&
        /noreferrer/.test(await external.getAttribute("rel")),
    );
    for (const id of ["constructor", "__proto__", "UNKNOWN"]) {
      await page.goto(url + "#textbook?book=" + id);
      await page.locator(".textbook-card").first().waitFor();
      ok(
        "unknown textbook falls back to the catalog: " + id,
        (await page.locator(".textbook-card").count()) === 11 &&
          /찾지 못했습니다/.test(
            await page
              .locator('#textbook-root [role="status"]')
              .first()
              .innerText(),
          ),
      );
    }
    for (const width of [320, 400, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url + "#textbooks");
      await page.locator(".textbook-card").first().waitFor();
      ok(
        "textbook catalog fits width " + width,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      ok(
        "textbooks stand upright on their shelf at " + width,
        await page.locator(".textbook-cover").evaluateAll((nodes) =>
          nodes.every((node) => {
            const title = node.querySelector("h3"),
              range = document.createRange();
            range.selectNodeContents(title);
            return (
              getComputedStyle(title).writingMode === "vertical-rl" &&
              node.offsetHeight > node.offsetWidth * 3 &&
              range.getBoundingClientRect().bottom <=
                node.querySelector(".textbook-symbol").getBoundingClientRect()
                  .top
            );
          }),
        ),
      );
      for (const book of core.books) {
        await page.goto(url + core.route(book.id, "all"));
        await page.locator(".textbook-chapter").first().waitFor();
        ok(
          book.id + " reader fits width " + width,
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
      }
    }
    await page.emulateMedia({ media: "print" });
    for (const book of core.books) {
      await page.goto(url + core.route(book.id, "all"));
      await page.locator(".textbook-worked").waitFor();
      ok(
        book.id +
          " print layout contains all chapters and its worked example without overflow",
        (await page.locator(".textbook-chapter").count()) ===
          book.chapters.length &&
          (await page.locator(".textbook-worked").count()) === 1 &&
          (await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          )),
      );
    }
    await page.emulateMedia({ media: "screen" });
    await page.getByRole("button", { name: "색상 모드 전환" }).click();
    await page.emulateMedia({ media: "print" });
    ok(
      "dark-mode printing keeps readable paper and a full-width introduction",
      await page.evaluate(() => {
        const banner = document.querySelector(".textbook-banner"),
          article = document.querySelector(".textbook-chapter");
        return (
          banner.lastElementChild.getBoundingClientRect().width >
            banner.getBoundingClientRect().width * 0.8 &&
          getComputedStyle(article).backgroundColor === "rgb(255, 255, 255)"
        );
      }),
    );
    ok(
      "textbooks leave favorites and manual learning progress intact",
      JSON.stringify(
        await page.evaluate(() => [
          localStorage.getItem("semiPartners:fav:v1"),
          localStorage.getItem("siliconLibrary:study:v1"),
        ]),
      ) === JSON.stringify(saved),
    );
    ok(
      "local textbooks never fetch external textbook content",
      externalRequests === 0,
    );
    ok("no textbook runtime errors", errors.length === 0);
    console.log(passed + "/" + passed + " textbook UI checks passed");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
