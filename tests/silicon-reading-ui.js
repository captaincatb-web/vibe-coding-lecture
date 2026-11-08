"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const reading = require("../silicon-library/src/reading-core");
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
    if (process.env.SL_OFFLINE_FIXTURES === "1") {
      await context.route("https://fonts.googleapis.com/**", (route) =>
        route.fulfill({ status: 200, contentType: "text/css", body: "" }),
      );
    }
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(url);
    const books = await page.locator(".spine").evaluateAll((nodes) =>
      nodes.map((node) => ({
        hash: "#b" + node.dataset.i,
        name: node.getAttribute("aria-label").split(",")[0],
      })),
    );
    const links = new Set();
    for (const book of books) {
      await page.goto(url + book.hash);
      const overview = page.getByRole("button", { name: /기업 개요$/ });
      if ((await overview.getAttribute("aria-current")) !== "page") {
        await overview.click();
      }
      const guide = page.locator(".reading-guide");
      ok(
        book.name + " offers a local accompanying textbook",
        (await page.locator('ul.rel a[href^="#textbook?book="]').count()) > 0,
      );
      await guide.waitFor();
      ok(
        book.name +
          " has product roles, reading questions, and evidence limits",
        (await guide.locator("tbody tr").count()) > 0 &&
          (await guide.locator("li").count()) > 0 &&
          /개별 제품 사양·고객 채택·실제 납품/.test(await guide.innerText()),
      );
      for (const href of await guide
        .locator("a")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("href")),
        )) {
        links.add(href);
      }
      await page.getByRole("button", { name: /사업·제품$/ }).click();
      ok(
        book.name + " has product-specific evaluation questions",
        (await page.locator(".product-questions li").count()) > 0,
      );
      await page.getByRole("button", { name: /핵심 기술$/ }).click();
      ok(
        book.name +
          " includes a three-stage explanation and a self-check for each topic",
        await page
          .locator(".concept-reading")
          .evaluateAll(
            (nodes) =>
              nodes.length > 0 &&
              nodes.every(
                (node) =>
                  node.querySelectorAll(".concept-flow li").length === 3 &&
                  node.querySelector(".concept-check summary") &&
                  node.querySelector(".concept-compare a"),
              ),
          ),
      );
    }
    for (const href of links) {
      await page.goto(url + href);
      const destination = href.startsWith("#labs")
        ? "#lab-result"
        : href === "#learn"
          ? "#study-progress"
          : "h2.ttl";
      await page.locator(destination).waitFor();
      ok("reading link resolves: " + href, new URL(page.url()).hash === href);
    }
    for (const [key, topic] of Object.entries(reading.topics)) {
      await page.goto(url + "#x-" + key);
      const article = page.locator('[data-reading-topic="' + key + '"]');
      await article.waitFor();
      ok(
        "standalone topic publishes the matching explanation and comparison: " +
          key,
        (await article.locator(".concept-role").innerText()) === topic.role &&
          (await article.locator(".concept-flow li").count()) === 3 &&
          (await article.locator(".concept-compare a").getAttribute("href")) ===
            "#x-" + topic.compare.id,
      );
    }
    await page.goto(url + "#x-pr");
    await page.locator(".concept-check summary").focus();
    await page.keyboard.press("Enter");
    ok(
      "self-check explanation can be opened with the keyboard",
      (await page.locator(".concept-check").getAttribute("open")) !== null &&
        (await page.locator(".concept-check p").innerText()) ===
          reading.get("pr").answer,
    );
    const prText = await page.locator("#app").innerText();
    ok(
      "PR chapter distinguishes material families and records both editorial corrections",
      /감광성 재료/.test(prText) &&
        /예를 들어 화학증폭형/.test(prText) &&
        /모든 PR의 반응 방식/.test(prText) &&
        (await page.locator(".concept-corrections li").count()) === 2,
    );
    await page.goto(url + "#explore?item=product%3AgasEtch");
    await page.locator(".explorer-detail h2").waitFor();
    ok(
      "integrated explorer shows the corrected WF6 scope",
      /WF6.*텅스텐 증착 원료/.test(
        await page.locator(".explorer-detail").innerText(),
      ),
    );
    await page.goto(url);
    await page.locator("#q").fill("비저항 하나만으로");
    ok(
      "bookshelf knowledge search finds expanded explanatory text",
      (await page.locator('#hits a[href="#x-upw"]').count()) === 1,
    );

    await page.goto(
      url +
        "#explore?q=" +
        encodeURIComponent("비저항 하나만으로") +
        "&type=product",
    );
    await page.locator(".explorer-results button").first().waitFor();
    ok(
      "integrated search also finds the expanded explanation",
      (await page.locator(".explorer-results button").count()) === 1 &&
        /초순수/.test(await page.locator(".explorer-results").innerText()),
    );
    const book = (name) => books.find((entry) => entry.name === name);
    await page.goto(url + book("덕산테코피아").hash);
    ok(
      "precursor guidance explains conditional ALD growth and links the lab",
      /한 원자층과 같은 값이 아니며/.test(
        await page.locator(".reading-guide").innerText(),
      ) &&
        (await page
          .locator('.reading-guide a[href="#labs?lab=ald"]')
          .count()) === 1,
    );
    await page.getByRole("button", { name: /핵심 기술$/ }).click();
    ok(
      "embedded precursor chapter exposes existing unverified numbers",
      /6N/.test(await page.locator(".book-number-notice").innerText()) &&
        /미검증/.test(await page.locator(".book-number-notice").innerText()) &&
        (await page.locator('#pg a[href="#t-dep"]').count()) > 0,
    );
    await page.goto(url + book("AMMK").hash);
    await page.getByRole("button", { name: /핵심 기술$/ }).click();
    ok(
      "embedded HBM film chapter preserves uncertainty for temperature and layers",
      /250℃/.test(await page.locator(".book-number-notice").innerText()) &&
        /16단/.test(await page.locator(".book-number-notice").innerText()),
    );
    await page.goto(url + book("한솔아이원스").hash);
    await page.getByRole("button", { name: /핵심 기술$/ }).click();
    ok(
      "embedded cleaning chapter distinguishes equipment parts from wafer cleaning",
      /웨이퍼를 씻는 세정 공정 재료가 아닙니다/.test(
        await page.locator("#pg").innerText(),
      ),
    );
    await page.goto(url + book("삼화전기").hash);
    ok(
      "electronic component guidance avoids an unsupported fabrication or lab link",
      /전원 회로에 탑재되는 전자부품/.test(
        await page.locator(".reading-guide").innerText(),
      ) &&
        (await page
          .locator(
            '.reading-guide a[href^="#t-"], .reading-guide a[href^="#labs"]',
          )
          .count()) === 0,
    );
    await page.setViewportSize({ width: 400, height: 900 });
    for (const name of ["솔브레인", "Qnity", "한솔아이원스", "AMMK"]) {
      await page.goto(url + book(name).hash);
      await page.locator(".reading-guide").waitFor();
      ok(
        name + " reading guide fits a mobile viewport",
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    ok("book reading changes have no runtime errors", errors.length === 0);
    console.log(passed + "/" + passed + " reading UI checks passed");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
