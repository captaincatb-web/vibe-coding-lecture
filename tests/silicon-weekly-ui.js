"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright");
const data = require("../silicon-library/data/weekly-updates.json"),
  core = require("../silicon-library/src/weekly-core");
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
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(url);
    await page.locator(".weekly-materials").waitFor();
    ok(
      "header displays the actual stored edition date, not a hard-coded October date",
      (await page.locator(".library-date").innerText()) ===
        core.dateText(data.as_of) + " 기준" &&
        (await page.locator(".library-date").getAttribute("datetime")) ===
          data.as_of,
    );
    ok(
      "homepage publishes collected metadata with its weekly schedule",
      (await page.locator(".weekly-materials ol > li").count()) ===
        Math.min(6, data.entries.length) &&
        /월요일 오전 9시/.test(
          await page.locator(".weekly-materials").innerText(),
        ),
    );
    ok(
      "automatic material is explicitly not a newly verified company fact",
      /원문 대조 전/.test(
        await page.locator(".weekly-materials").innerText(),
      ) &&
        /납품 근거를 뜻하지 않습니다/.test(
          await page.locator(".weekly-materials").innerText(),
        ),
    );
    ok(
      "source links use HTTPS and safe new-tab attributes",
      await page
        .locator(".weekly-materials a")
        .evaluateAll((nodes) =>
          nodes.every(
            (n) =>
              n.protocol === "https:" &&
              n.target === "_blank" &&
              n.rel.includes("noopener") &&
              n.rel.includes("noreferrer"),
          ),
        ),
    );
    await page.locator(".weekly-materials summary").click();
    ok(
      "source collection failures are visible without deleting successful materials",
      (await page.locator(".weekly-materials details li").count()) ===
        data.sources.length &&
        (await page.locator(".weekly-materials ol > li").count()) > 0,
    );
    await page.goto(url + "#b0");
    await page.locator(".cover h1").waitFor();
    ok(
      "company cover uses the same current edition date",
      (await page.locator(".cover .foot").innerText()).includes(
        core.dateText(data.as_of),
      ),
    );
    await page.goto(url + "#textbook?book=IND");
    await page.locator(".weekly-materials").waitFor();
    ok(
      "related source metadata appears inside the appropriate textbook",
      (await page.locator(".weekly-materials ol > li").count()) ===
        core.entries(["IND"], 5).length,
    );
    await page.goto(url + "#textbook?book=PRC&chapter=all");
    await page.locator(".weekly-materials").waitFor();
    ok(
      "whole textbook retains all authored chapters alongside weekly material",
      (await page.locator(".textbook-chapter").count()) === 3 &&
        (await page.locator(".weekly-materials ol > li").count()) ===
          core.entries(["PRC"], 5).length,
    );
    await page.goto(url);
    await page.locator(".weekly-materials").waitFor();
    for (const width of [320, 400, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      ok(
        "weekly titles and source links fit width " + width,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    ok(
      "weekly data does not replace the 46 company book records",
      (await page.locator(".spine").count()) === 46,
    );
    ok("no weekly-material runtime errors", errors.length === 0);
    console.log(passed + "/" + passed + " weekly UI checks passed");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
