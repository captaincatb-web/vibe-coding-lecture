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
      }
      await page.goto(url + core.route(book.id, "all"));
      await page.locator(".textbook-chapter").first().waitFor();
      ok(
        book.id + " whole-book view contains every chapter and its terms",
        (await page.locator(".textbook-chapter").count()) === 3 &&
          (await page.locator(".textbook-terms dt").count()) === 3 &&
          (await page.locator(".textbook-product-link").count()) ===
            book.products.length,
      );
    }
    await page.goto(url + core.route("FIL"));
    const methods = page.locator(
      '.textbook-toc a[href="' + core.route("FIL", "methods") + '"]',
    );
    await methods.focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-chapter="methods"]').waitFor();
    ok(
      "keyboard table of contents focuses the chosen chapter",
      await page.evaluate(() =>
        document.activeElement.matches(".textbook-chapter h3"),
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
      for (const id of ["FIL", "PKG", "MEM", "FAB"]) {
        await page.goto(url + core.route(id, "all"));
        await page.locator(".textbook-chapter").first().waitFor();
        ok(
          id + " reader fits width " + width,
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
      }
    }
    await page.emulateMedia({ media: "print" });
    ok(
      "whole-book print layout contains three chapters without document overflow",
      (await page.locator(".textbook-chapter").count()) === 3 &&
        (await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        )),
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
