"use strict";
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const url = process.env.SL_TEST_URL || "http://127.0.0.1:8767/silicon-library/";
(async () => {
  const browser = await chromium.launch(
    process.env.SL_BROWSER_EXECUTABLE
      ? { executablePath: process.env.SL_BROWSER_EXECUTABLE }
      : {},
  );
  let count = 0,
    failures = [];
  async function inspect(page, hash, width) {
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
    const result = await new AxeBuilder({ page }).analyze();
    count++;
    if (result.violations.length)
      failures.push({
        hash,
        width,
        violations: result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          targets: v.nodes.map((n) => n.target),
        })),
      });
  }
  try {
    for (const width of [400, 1280]) {
      const ctx = await browser.newContext({
        viewport: { width, height: 900 },
      });
      if (process.env.SL_OFFLINE_FIXTURES === "1")
        await ctx.route("https://fonts.googleapis.com/**", (r) =>
          r.fulfill({ status: 200, contentType: "text/css", body: "" }),
        );
      const page = await ctx.newPage();
      for (const hash of [
        "#explore?item=product%3Apre",
        "#explore?compare=company:c05,company:c22,company:c27",
        "#labs?lab=lithography",
        "#labs?lab=ald",
        "#labs?lab=cmp",
        "#labs?lab=packaging",
        "#learn",
        "#b0",
      ]) {
        await page.goto(url + hash);
        await page
          .locator(
            hash.startsWith("#b")
              ? "#pg"
              : hash.includes("compare=")
                ? ".comparison-table"
                : hash.includes("explore")
                  ? ".explorer-detail h2"
                  : hash.includes("learn")
                    ? "#glossary-query"
                    : "#lab-result",
          )
          .waitFor();
        await inspect(page, hash, width);
        if (hash.startsWith("#b")) {
          await page.getByRole("button", { name: /핵심 기술$/ }).click();
          await inspect(page, hash + " · 핵심 기술", width);
        }
      }
      await ctx.close();
    }
    if (failures.length) {
      console.error(JSON.stringify(failures, null, 2));
      process.exitCode = 1;
    } else
      console.log(
        "PASS axe accessibility: " +
          count +
          " page/viewport checks, zero detected violations",
      );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
