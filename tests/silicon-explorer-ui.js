"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
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
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    if (process.env.SL_OFFLINE_FIXTURES === "1")
      await ctx.route("https://fonts.googleapis.com/**", (r) =>
        r.fulfill({
          status: 200,
          contentType: "text/css",
          body: "/* System font fixture */",
        }),
      );
    const page = await ctx.newPage(),
      errors = [],
      dataRequests = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("request", (r) => {
      if (r.url().includes("explorer-index.json")) dataRequests.push(r.url());
    });
    await page.goto(url);
    ok("bookshelf does not request explorer data", dataRequests.length === 0);
    await page.getByRole("link", { name: "통합 탐색", exact: true }).click();
    await page.locator("#explorer-query").waitFor();
    ok("explorer loads once on demand", dataRequests.length === 1);
    const query = page.locator("#explorer-query"),
      type = page.locator("#explorer-type");
    await query.fill("ALD");
    await type.selectOption("product");
    await page
      .locator('.explorer-results button[data-key="product:pre"]')
      .click();
    ok(
      "ALD finds precursor and deposition",
      (await page
        .locator('.explorer-detail button[data-key="process:dep"]')
        .count()) === 1,
    );
    await page
      .locator('.explorer-detail button[data-key="process:dep"]')
      .click();
    await page
      .locator('.explorer-detail button[data-key="product:pre"]')
      .click();
    await page
      .locator('.explorer-detail button[data-key="company:c05"]')
      .click();
    ok(
      "product→process→product→company opens Soulbrain",
      /솔브레인/.test(await page.locator(".explorer-detail h2").innerText()),
    );
    ok(
      "company shows references with safe new-tab attributes",
      (await page
        .locator(
          '.explorer-sources a[target="_blank"][rel="noopener noreferrer"]',
        )
        .count()) > 0,
    );
    ok(
      "relation disclaimer visible",
      /실제 납품이나 고객 관계를 뜻하지 않습니다/.test(
        await page.locator("#explorer-root").innerText(),
      ),
    );
    await page.locator("#explorer-bookmark").click();
    ok(
      "typed bookmark can be saved",
      (await page
        .locator("#explorer-bookmark")
        .getAttribute("aria-pressed")) === "true",
    );
    await page.reload();
    await page.locator("#explorer-bookmark").waitFor();
    ok(
      "bookmark survives reload",
      (await page
        .locator("#explorer-bookmark")
        .getAttribute("aria-pressed")) === "true",
    );
    await page.getByText("탐색 책갈피와 최근 본 항목", { exact: true }).click();
    ok(
      "recent records are available",
      (await page
        .locator('.explorer-saved button[data-key="company:c05"]')
        .count()) > 0,
    );
    await page.locator("#explorer-bookmark").click();
    ok(
      "bookmark can be removed",
      (await page
        .locator("#explorer-bookmark")
        .getAttribute("aria-pressed")) === "false",
    );
    await page.locator("#explorer-query").fill("원자층 증착");
    await page
      .locator('.explorer-results button[data-key="product:pre"]')
      .click();
    const beforeBack = page.url();
    await page
      .locator('.explorer-detail button[data-key="process:dep"]')
      .click();
    await page.goBack();
    await page.waitForFunction(
      () =>
        document.querySelector(".explorer-detail h2")?.textContent ===
        "ALD·CVD 전구체",
    );
    ok(
      "browser Back restores the previous selected record",
      page.url() === beforeBack,
    );
    const shared = page.url();
    await page.reload();
    await page.locator("#explorer-query").waitFor();
    ok(
      "reload restores query and selected item",
      (await page.locator("#explorer-query").inputValue()) === "원자층 증착" &&
        (await page.locator(".explorer-detail h2").innerText()) ===
          "ALD·CVD 전구체",
    );
    await page.locator("#explorer-query").fill("HBM");
    await page.locator("#explorer-type").selectOption("process");
    await page
      .locator('.explorer-results button[data-key="process:hbm"]')
      .click();
    await page
      .locator('.explorer-detail button[data-key="knowledge:deep:hbm"]')
      .click();
    ok(
      "HBM leads to deep explanation and original sources",
      (await page.locator(".explorer-sources a").count()) > 0,
    );
    await page.locator("#explorer-query").fill("Soulbrain");
    await page.locator("#explorer-type").selectOption("company");
    await page
      .locator('.explorer-results button[data-key="company:c05"]')
      .click();
    await page
      .locator('.explorer-detail button[data-key="product:cmp"]')
      .click();
    ok(
      "company→product→process path works",
      (await page
        .locator('.explorer-detail button[data-key="process:cmp"]')
        .count()) === 1,
    );
    await page.locator("#explorer-query").fill("no-such-item-999");
    ok(
      "empty query results are explicit",
      /검색 결과가 없습니다/.test(
        await page.locator(".explorer-results").innerText(),
      ),
    );
    await page.locator("#explorer-query").fill("<img src=x onerror=alert(1)>");
    ok(
      "query text does not create markup",
      (await page.locator("#explorer-root img").count()) === 0,
    );
    await page.goto(url + "#explore?item=company%3Ac27");
    await page.locator(".explorer-detail h2").waitFor();
    ok(
      "Linde displays distinct legal scopes and original fact records",
      /린데코리아 주식회사/.test(
        await page.locator(".explorer-detail").innerText(),
      ) &&
        /Linde AMT Chonan/.test(
          await page.locator(".explorer-detail").innerText(),
        ) &&
        /기존 기록: 검증/.test(
          await page.locator(".explorer-detail").innerText(),
        ),
    );
    await page.goto(url + "#explore?item=process%3Ametro");
    await page.locator(".explorer-detail h2").waitFor();
    ok(
      "metrology shows a meaningful empty relation state",
      /아직 연결된 항목이 없습니다/.test(
        await page.locator(".explorer-detail").innerText(),
      ),
    );
    await page.getByRole("link", { name: "기존 상세 페이지 열기" }).click();
    ok("existing route still opens", page.url().endsWith("#t-metro"));
    for (const width of [400, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(shared);
      await page.locator(".explorer-detail h2").waitFor();
      ok(
        "no horizontal overflow " + width,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    await page.locator("#explorer-query").fill("HBM");
    await page.locator("#explorer-type").selectOption("process");
    await page.locator("#explorer-query").press("Enter");
    ok(
      "keyboard reaches a search result",
      await page.evaluate(() =>
        document.activeElement.matches(".explorer-results button"),
      ),
    );
    await page.keyboard.press("Enter");
    ok(
      "keyboard selection focuses the detail heading",
      await page.evaluate(() =>
        document.activeElement.matches(".explorer-detail h2"),
      ),
    );
    await page.emulateMedia({ colorScheme: "dark" });
    ok(
      "dark mode uses dark paper",
      await page.evaluate(
        () =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--paper")
            .trim() === "#182127",
      ),
    );
    ok("no runtime errors", errors.length === 0);
    // New context forces a fresh request to exercise recovery instead of cache.
    const failure = await browser.newContext();
    if (process.env.SL_OFFLINE_FIXTURES === "1")
      await failure.route("https://fonts.googleapis.com/**", (r) =>
        r.fulfill({ status: 200, contentType: "text/css", body: "" }),
      );
    let fail = true;
    await failure.route("**/data/explorer-index.json", (r) =>
      fail
        ? r.fulfill({ status: 503, body: "temporarily unavailable" })
        : r.continue(),
    );
    const fp = await failure.newPage();
    await fp.goto(url + "#explore");
    await fp.getByRole("alert").waitFor();
    ok(
      "load failure preserves navigation and reports recovery",
      (await fp.getByRole("link", { name: "기술 백과 열기" }).count()) === 1,
    );
    fail = false;
    await fp.getByRole("button", { name: "다시 시도" }).click();
    await fp.locator("#explorer-query").waitFor();
    ok(
      "retry recovers after server failure",
      (await fp.locator(".explorer-results button").count()) > 0,
    );
    await failure.close();
    console.log(passed + "/" + passed + " explorer UI checks passed");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
