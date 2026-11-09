"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright"),
  content = require("../silicon-library/src/company-core"),
  { loadData } = require("../scripts/load-silicon-library");
const data = loadData(),
  url = process.env.SL_TEST_URL || "http://127.0.0.1:8767/silicon-library/";
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
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    const narratives = [];
    for (const p of content.forProduct("pre")) {
      const i = data.B.findIndex((b) => b.n === p.name);
      await page.goto(url + "#b" + i);
      await page.locator(".company-overview").waitFor();
      ok(
        p.name + " opens with its own company theme",
        (await page.locator(".company-overview").innerText()).includes(
          p.theme,
        ) && (await page.locator(".cover .one").innerText()) === p.tagline,
      );
      await page
        .getByRole("button", { name: "이 회사의 기술장 읽기 →", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await page.locator(".company-chapter").waitFor();
      ok(
        p.name + " keyboard shortcut opens and focuses its own chapter",
        (await page
          .locator(".company-chapter")
          .getAttribute("data-company-chapter")) === p.id &&
          (await page
            .locator(".company-chapter > h3")
            .evaluate((n) => n === document.activeElement)),
      );
      ok(
        p.name + " contains three unique technical/business sections",
        (await page.locator(".company-section").count()) === 3 &&
          (await page.locator(".company-section").first().innerText()).includes(
            p.chapters[0].paragraphs[0],
          ),
      );
      narratives.push(await page.locator(".company-chapter").innerText());
      ok(
        p.name +
          " keeps common textbook material behind an explicit disclosure",
        (await page
          .locator(".company-common")
          .evaluateAll(
            (nodes) => nodes.length > 0 && nodes.every((n) => !n.open),
          )) && (await page.locator(".concept-reading").count()) > 0,
      );
      await page.locator(".company-common > summary").first().focus();
      await page.keyboard.press("Enter");
      ok(
        p.name + " common principle remains available by keyboard",
        await page
          .locator(".company-common")
          .first()
          .evaluate((n) => n.open),
      );
      await page.locator(".company-case summary").click();
      ok(
        p.name + " hypothetical case includes its tailored explanation",
        (await page.locator(".company-case details p").innerText()) ===
          p.example.answer,
      );
      await page.locator(".company-evidence > summary").click();
      ok(
        p.name + " sources retain unreviewed scope and safe external links",
        (await page.locator(".company-evidence").innerText()).includes(
          "이번 원문 재열람 전",
        ) &&
          (await page
            .locator(".company-source-link")
            .evaluateAll((nodes) =>
              nodes.every(
                (n) =>
                  /^https?:$/.test(n.protocol) &&
                  n.target === "_blank" &&
                  n.rel.includes("noopener") &&
                  n.dataset.sourceId,
              ),
            )),
      );
      await page.getByRole("button", { name: /사업·제품$/ }).click();
      const businessText = await page.locator(".company-materials").innerText();
      ok(
        p.name +
          " business page explains three material groups and its own questions",
        (await page.locator(".company-material-grid article").count()) === 3 &&
          p.questions.every((q) => businessText.includes(q)) &&
          (await page.locator(".company-legacy").getAttribute("open")) === null,
      );
    }
    ok(
      "five company books no longer have identical chapter bodies",
      new Set(narratives).size === 5,
    );
    await page.goto(url + "#x-pre");
    await page.locator(".company-comparison").waitFor();
    ok(
      "precursor comparison exposes all five distinct company records",
      (await page.locator("[data-company-row]").count()) === 5 &&
        (await page
          .locator("[data-company-row]")
          .evaluateAll(
            (rows) =>
              new Set(rows.map((r) => r.cells[2].textContent)).size === 5,
          )),
    );
    for (const width of [320, 400, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      ok(
        "comparison table is contained at width " + width,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      if (width === 320)
        ok(
          "wide comparison can be scrolled inside its labelled region",
          await page.locator(".company-comparison-scroll").evaluate((n) => {
            n.scrollLeft = 300;
            return n.scrollLeft > 0;
          }),
        );
    }
    await page.locator('[data-company-row="c03"] a').click();
    await page.locator(".cover h1").waitFor();
    ok(
      "comparison opens DNF rather than its affiliated company's book",
      (await page.locator(".cover h1").innerText()) === "디엔에프",
    );
    await page
      .getByRole("button", { name: "이 회사의 기술장 읽기 →", exact: true })
      .click();
    for (const width of [320, 400, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      ok(
        "company chapter and source references fit width " + width,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    await page.goto(
      url + "#explore?q=" + encodeURIComponent("잔류 염소") + "&type=company",
    );
    await page.locator(".explorer-results button").first().waitFor();
    ok(
      "company-specific text is searchable in the integrated explorer",
      (await page.locator(".explorer-results").innerText()).includes(
        "덕산테코피아",
      ),
    );
    await page.goto(url);
    await page.locator("#q").fill("잔류 염소");
    ok(
      "bookshelf search finds the new company chapter",
      await page.locator('.spine[data-i="0"]').isVisible(),
    );
    ok("no company chapter runtime errors", errors.length === 0);
    console.log(passed + "/" + passed + " company UI checks passed");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
