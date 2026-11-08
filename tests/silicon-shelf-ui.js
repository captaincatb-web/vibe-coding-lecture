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
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    if (process.env.SL_OFFLINE_FIXTURES === "1")
      await context.route("https://fonts.googleapis.com/**", (route) =>
        route.fulfill({ status: 200, contentType: "text/css", body: "" }),
      );
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(url);
    await page.locator(".library-hero").waitFor();
    const books = await page.locator(".spine").evaluateAll((nodes) =>
      nodes.map((node) => ({
        id: node.dataset.i,
        name: node.getAttribute("aria-label").split(",")[0],
      })),
    );
    ok(
      "all 46 book routes remain available",
      books.length === 46 && new Set(books.map((b) => b.id)).size === 46,
    );
    ok(
      "book motifs are decorative and every cover retains a name and subject",
      await page
        .locator(".spine")
        .evaluateAll((nodes) =>
          nodes.every(
            (node) =>
              node.querySelector(".t")?.textContent.trim() &&
              node.querySelector(".i")?.textContent.trim() &&
              node.querySelector("svg")?.getAttribute("aria-hidden") === "true",
          ),
        ),
    );
    const featured = await page
      .locator(".featured-volume")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          href: node.getAttribute("href"),
          name: node.querySelector(".featured-name").textContent,
        })),
      );
    ok(
      "featured volumes point to three existing books",
      featured.length === 3 &&
        featured.every((f) =>
          books.some((b) => f.href === "#b" + b.id && f.name === b.name),
        ),
    );
    for (const feature of featured) {
      await page
        .locator('.featured-volume[href="' + feature.href + '"]')
        .click();
      await page.locator(".cover h1").waitFor();
      ok(
        "featured book opens: " + feature.name,
        (await page.locator(".cover h1").innerText()) === feature.name,
      );
      await page
        .getByRole("button", { name: "← 책장으로", exact: true })
        .click();
      await page.locator(".library-hero").waitFor();
    }
    await page.locator('[data-shelf-jump="catalog"]').focus();
    await page.keyboard.press("Enter");
    ok(
      "keyboard catalog shortcut moves focus without changing the route",
      await page.evaluate(
        () =>
          document.activeElement.id === "library-catalog-title" &&
          !location.hash,
      ),
    );
    await page.locator('[data-shelf-jump="eq"]').click();
    ok(
      "equipment shortcut focuses its shelf heading",
      await page.evaluate(
        () =>
          document.activeElement.closest(".shelf")?.id === "library-shelf-eq" &&
          !location.hash,
      ),
    );
    await page.locator("#q").fill("에이텍솔루션");
    ok(
      "search retains canonical company counting and hides empty groups",
      /회사 1권/.test(await page.locator("#hits").innerText()) &&
        (await page.locator(".spine-slot:not([hidden])").count()) ===
          (await page.locator(".spine:not([hidden])").count()) &&
        (await page
          .locator(".grp:not([hidden]), .shelf:not([hidden])")
          .evaluateAll((nodes) =>
            nodes.every((node) => node.querySelector(".spine:not([hidden])")),
          )),
    );
    await page.locator("#q").fill("__no_such_book__");
    ok(
      "empty results expose no empty shelves and disable unavailable shortcuts",
      /회사 0권/.test(await page.locator("#hits").innerText()) &&
        (await page.locator(".shelf:not([hidden])").count()) === 0 &&
        (await page.locator(".library-shelf-links button:disabled").count()) ===
          3,
    );
    await page.locator("#q").fill("");
    ok(
      "clearing search restores all covers and shelf shortcuts",
      (await page.locator(".spine:not([hidden])").count()) === 46 &&
        (await page.locator(".library-shelf-links button:disabled").count()) ===
          0,
    );
    await page.locator("#fc").selectOption("F");
    ok(
      "empty favorite shelves explain how to save a book",
      /아직 즐겨찾은 책이 없습니다/.test(
        await page.locator("#hits").innerText(),
      ) && (await page.locator(".spine:not([hidden])").count()) === 0,
    );
    await page.evaluate(() =>
      localStorage.setItem(
        "semiPartners:fav:v1",
        JSON.stringify(["솔브레인", "TSE"]),
      ),
    );
    await page.reload();
    await page.locator("#fc").selectOption("F");
    ok(
      "favorite filtering and saved stars still work",
      (await page.locator(".spine:not([hidden])").count()) === 2 &&
        (await page.locator(".spine:not([hidden]) .star").count()) === 2,
    );
    const chosen = page.locator(".spine:not([hidden])").first();
    const chosenName = (await chosen.getAttribute("aria-label")).split(",")[0];
    await chosen.focus();
    await page.keyboard.press("Enter");
    await page.locator(".cover h1").waitFor();
    ok(
      "keyboard activation of a cover opens the correct book",
      (await page.locator(".cover h1").innerText()) === chosenName,
    );
    await page.goto(url);
    await page.locator(".spine").first().waitFor();
    ok(
      "reduced-motion preference removes cover transitions",
      await page
        .locator(".spine")
        .first()
        .evaluate((node) => getComputedStyle(node).transitionDuration === "0s"),
    );
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      ok(
        "homepage has no horizontal overflow at " + width,
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      const clipped = await page.locator(".spine").evaluateAll((nodes) =>
        nodes
          .filter((node) => {
            const book = node.getBoundingClientRect(),
              footer = node
                .querySelector(".volume-bottom")
                .getBoundingClientRect();
            return (
              footer.bottom > book.bottom + 1 || footer.right > book.right + 1
            );
          })
          .map((node) => node.getAttribute("aria-label")),
      );
      ok(
        "cover status stays inside each book at " + width,
        clipped.length === 0,
      );
      ok(
        "upright book spines keep complete names above their shelf ornaments at " +
          width,
        await page.locator(".spine").evaluateAll((nodes) =>
          nodes.every((node) => {
            const title = node.querySelector(".t"),
              range = document.createRange();
            range.selectNodeContents(title);
            return (
              getComputedStyle(title).writingMode === "vertical-rl" &&
              node.offsetHeight > node.offsetWidth * 3 &&
              range.getBoundingClientRect().bottom <=
                node.querySelector(".spine-labels").getBoundingClientRect()
                  .bottom +
                  1
            );
          }),
        ),
      );
    }
    ok("no homepage runtime errors", errors.length === 0);
    console.log(passed + "/" + passed + " shelf UI checks passed");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
