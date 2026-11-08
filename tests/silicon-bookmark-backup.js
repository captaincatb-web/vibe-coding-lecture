"use strict";
const { chromium } = require("playwright"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch(
    process.env.SL_BROWSER_EXECUTABLE
      ? { executablePath: process.env.SL_BROWSER_EXECUTABLE }
      : {},
  );
  try {
    const ctx = await browser.newContext();
    if (process.env.SL_OFFLINE_FIXTURES === "1")
      await ctx.route("https://fonts.googleapis.com/**", (r) =>
        r.fulfill({ status: 200, contentType: "text/css", body: "" }),
      );
    const p = await ctx.newPage();
    await p.goto(
      (process.env.SL_TEST_URL || "http://127.0.0.1:8767/silicon-library/") +
        "#explore",
    );
    const input = p.locator("#explorer-bookmark-import");
    await input.waitFor({ state: "attached" });
    await p.evaluate(() =>
      localStorage.setItem(
        "siliconLibrary:bookmarks:v1",
        JSON.stringify(["company:c05"]),
      ),
    );
    await input.setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "silicon-library-bookmarks",
          version: 1,
          keys: ["company:c27", "missing"],
        }),
      ),
    });
    await p.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("siliconLibrary:bookmarks:v1"))
          .length === 2,
    );
    assert.deepEqual(
      await p.evaluate(() =>
        JSON.parse(localStorage.getItem("siliconLibrary:bookmarks:v1")),
      ),
      ["company:c05", "company:c27"],
    );
    await input.setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{bad"),
    });
    await p.waitForFunction(() =>
      document
        .querySelector("#explorer-status")
        .textContent.includes("복원하지"),
    );
    assert.equal(
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("siliconLibrary:bookmarks:v1"))
            .length,
      ),
      2,
    );
    await p.getByText("탐색 책갈피 백업·복원", { exact: true }).click();
    const pending = p.waitForEvent("download");
    await p.getByRole("button", { name: "책갈피 백업 다운로드" }).click();
    assert.equal(
      (await pending).suggestedFilename(),
      "silicon-library-bookmarks.json",
    );
    console.log(
      "PASS backup merge, unknown references, invalid JSON preservation, download",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
