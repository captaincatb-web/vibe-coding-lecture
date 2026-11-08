"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright");
const url = process.env.SL_TEST_URL || "http://127.0.0.1:8767/silicon-library/";
let passed = 0;
function ok(name, result) {
  assert.ok(result, name);
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
    });
    if (process.env.SL_OFFLINE_FIXTURES === "1")
      await context.route("https://fonts.googleapis.com/**", (r) =>
        r.fulfill({ status: 200, contentType: "text/css", body: "" }),
      );
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(url + "#explore?item=company%3Ac05");
    await page.locator("#explorer-compare").waitFor();
    await page.locator("#explorer-compare").click();
    ok(
      "a company can be added to comparison",
      /1\/3/.test(await page.locator("#explorer-comparison-title").innerText()),
    );
    async function choose(name, key) {
      await page.locator("#explorer-query").fill(name);
      await page.locator("#explorer-type").selectOption("company");
      await page
        .locator('.explorer-results button[data-key="' + key + '"]')
        .click();
    }
    await choose("에이텍솔루션", "company:c22");
    await page.locator("#explorer-compare").click();
    await choose("린데", "company:c27");
    await page.locator("#explorer-compare").click();
    ok(
      "three canonical company records form three columns",
      (await page.locator(".comparison-table thead th").count()) === 4,
    );
    const table = () => page.locator(".comparison-table");
    ok(
      "legal units and unverified names remain distinct",
      /Linde AMT Chonan Co., Ltd./.test(await table().innerText()) &&
        /법인명 미확인/.test(await table().innerText()),
    );
    ok(
      "grades are explicitly material coverage, not fact verification",
      /자료 확보 수준/.test(await table().innerText()) &&
        /등록된 사실 대조 기록 없음/.test(await table().innerText()),
    );
    ok(
      "unavailable financials are not represented as zero",
      /공시 기반 정규화 데이터 미수록/.test(await table().innerText()),
    );
    const countries = await page
      .locator(".comparison-table tr")
      .filter({
        has: page.getByRole("rowheader", { name: "소재 국가", exact: true }),
      })
      .locator("td")
      .allTextContents();
    ok(
      "unknown country is not inferred from names",
      countries.length === 3 && countries.every((v) => v === "미확인"),
    );
    await choose("덕산테코피아", "company:c01");
    await page.locator("#explorer-compare").click();
    ok(
      "a fourth company is rejected with guidance",
      /최대 3곳/.test(await page.locator("#explorer-status").innerText()) &&
        (await page.locator(".comparison-table thead th").count()) === 4,
    );
    const shared = page.url();
    await page.reload();
    await page.locator(".comparison-table").waitFor();
    ok(
      "shared URL restores all comparison selections",
      (await page.locator(".comparison-table thead th").count()) === 4,
    );
    await page.setViewportSize({ width: 400, height: 850 });
    ok(
      "mobile comparison does not overflow the document",
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.locator(".comparison-scroll").focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      () => document.querySelector(".comparison-scroll").scrollLeft > 0,
    );
    ok("comparison supports keyboard horizontal scrolling", true);
    await page.emulateMedia({ media: "print" });
    ok(
      "print comparison fits the viewport",
      await page
        .locator(".comparison-table")
        .evaluate((t) => t.getBoundingClientRect().width <= innerWidth),
    );
    await page.emulateMedia({ media: "screen" });
    await page
      .getByRole("button", { name: "린데 비교에서 제외", exact: true })
      .click();
    ok(
      "one comparison can be removed",
      (await page.locator(".comparison-table thead th").count()) === 3,
    );
    await page.goBack();
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".comparison-table thead th").length === 4,
    );
    ok("browser Back restores an excluded comparison", true);
    await page
      .getByRole("button", { name: "린데 비교에서 제외", exact: true })
      .click();
    await page
      .getByRole("button", { name: "비교 전체 비우기", exact: true })
      .click();
    ok(
      "clearing comparison updates URL and focus",
      (await page.locator(".comparison-panel").isHidden()) &&
        !page.url().includes("compare=") &&
        (await page
          .locator("#explorer-query")
          .evaluate((e) => e === document.activeElement)),
    );
    await page.goto(shared);
    await page.locator(".comparison-table").waitFor();
    await page
      .locator('.comparison-table button[data-key="product:pre"]')
      .first()
      .click();
    ok(
      "comparison product links preserve selected companies",
      (await page.locator(".explorer-detail h2").innerText()) ===
        "ALD·CVD 전구체" &&
        (await page.locator(".comparison-table thead th").count()) === 4,
    );
    await page.goto(
      url +
        "#explore?compare=company:missing,product:pre,company:c05,company:c05",
    );
    await page.locator(".comparison-table").waitFor();
    ok(
      "invalid and duplicate shared selections are ignored",
      (await page.locator(".comparison-table thead th").count()) === 2,
    );
    await page.goto(url + "#explore?item=product:pre");
    await page.locator(".explorer-detail h2").waitFor();
    ok(
      "products cannot be added as company comparisons",
      (await page.locator("#explorer-compare").count()) === 0,
    );
    await page.goto(url + "#explore?q=ALD%2FCVD&type=product");
    await page.locator("#explorer-query").waitFor();
    ok(
      "slash-separated product search works",
      (await page
        .locator('.explorer-results button[data-key="product:pre"]')
        .count()) === 1,
    );
    ok("no comparison runtime errors", errors.length === 0);
    console.log(passed + "/" + passed + " comparison UI checks passed");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
