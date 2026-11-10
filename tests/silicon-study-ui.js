"use strict";
const assert = require("node:assert/strict"),
  { chromium } = require("playwright");
const url = process.env.SL_TEST_URL || "http://127.0.0.1:8767/silicon-library/",
  studyKey = "siliconLibrary:study:v1",
  unrelated = {
    "semiPartners:fav:v1": "[]",
    "siliconLibrary:bookmarks:v1": '["company:c05"]',
    "siliconLibrary:theme:v1": "light",
    "study-test-sentinel": "keep-unchanged",
  };
let passed = 0;
function ok(name, condition) {
  assert.ok(condition, name);
  console.log("PASS " + name);
  passed++;
}
function saveFailed(text) {
  return /저장하지 못|저장할 수 없|저장 실패/.test(text);
}
function visitOnly(text) {
  return /이번 방문|현재 방문|이번 화면|현재 화면/.test(text);
}

(async () => {
  const browser = await chromium.launch(
    process.env.SL_BROWSER_EXECUTABLE
      ? { executablePath: process.env.SL_BROWSER_EXECUTABLE }
      : {},
  );
  try {
    async function fixture(options = {}) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      });
      if (process.env.SL_OFFLINE_FIXTURES === "1")
        await context.route("https://fonts.googleapis.com/**", (route) =>
          route.fulfill({ status: 200, contentType: "text/css", body: "" }),
        );
      await context.addInitScript(
        ({ key, preferences, options }) => {
          const get = Storage.prototype.getItem,
            set = Storage.prototype.setItem,
            marker = "study-test-fixture-initialized";
          if (get.call(localStorage, marker) !== "1") {
            for (const [name, value] of Object.entries(preferences))
              set.call(localStorage, name, value);
            if (options.study !== undefined)
              set.call(localStorage, key, options.study);
            set.call(localStorage, marker, "1");
          }
          if (options.readDenied)
            Storage.prototype.getItem = function (name) {
              if (name === key)
                throw new DOMException(
                  "Storage access denied",
                  "SecurityError",
                );
              return get.call(this, name);
            };
          if (options.writeDenied)
            Storage.prototype.setItem = function (name, value) {
              if (name === key)
                throw new DOMException(
                  "Storage quota exceeded",
                  "QuotaExceededError",
                );
              return set.call(this, name, value);
            };
        },
        { key: studyKey, preferences: unrelated, options },
      );
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      return { context, page, errors };
    }
    async function learn(page) {
      await page.goto(url + "#learn");
      await page.locator("#study-total").waitFor();
    }
    async function lab(page, hash, cycles) {
      await page.goto(url + hash);
      await page.locator("#lab-result").waitFor();
      if (cycles !== undefined)
        await page.waitForFunction(
          (value) =>
            document.querySelector("#lab-cycles")?.value === String(value),
          cycles,
        );
    }
    async function saved(page) {
      return page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)),
        studyKey,
      );
    }
    async function range(page, id, value) {
      await page.locator("#lab-" + id).evaluate((input, next) => {
        input.value = String(next);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }, value);
    }
    async function preferencesPreserved(page) {
      return page.evaluate(
        (preferences) =>
          Object.entries(preferences).every(
            ([key, value]) => localStorage.getItem(key) === value,
          ),
        unrelated,
      );
    }

    const normal = await fixture(),
      page = normal.page;
    await learn(page);
    ok(
      "learning progress begins at zero with 16 explicit checkboxes",
      (await page.locator('[data-study-step][type="checkbox"]').count()) ===
        16 &&
        /완료 0 \/ 16.*퀴즈 정답 0 \/ 5/.test(
          await page.locator("#study-total").innerText(),
        ) &&
        (await page
          .locator("#study-progress")
          .evaluate((p) => p.value === 0 && p.max === 16)),
    );
    ok(
      "a new reader has no resume link",
      (await page.locator("#study-resume").count()) === 0,
    );
    const wafer = () => page.locator('[data-study-step="intro-wafer"]');
    await wafer().check();
    ok(
      "manual completion updates total, path progress and persisted state",
      /완료 1 \/ 16/.test(await page.locator("#study-total").innerText()) &&
        /완료 1 \/ 4/.test(
          await page.locator('[data-study-path="intro"]').innerText(),
        ) &&
        (await page
          .locator("#study-progress")
          .evaluate((p) => p.value === 1)) &&
        (await saved(page)).completed.join() === "intro-wafer",
    );
    ok(
      "completion feedback is announced",
      (await page.locator("#study-status").getAttribute("role")) === "status",
    );
    await page.reload();
    await wafer().waitFor();
    ok("manual completion survives reload", await wafer().isChecked());
    await wafer().uncheck();
    await page.reload();
    await wafer().waitFor();
    ok(
      "unchecking a step survives reload",
      !(await wafer().isChecked()) &&
        (await saved(page)).completed.length === 0,
    );
    await wafer().check();
    await lab(page, "#labs?lab=ald&cycles=120&phase=0", 120);
    ok(
      "initial lab visit does not save resume or complete a step",
      (await saved(page)).lastLab === null &&
        (await saved(page)).completed.join() === "intro-wafer",
    );
    await page.locator('.lab-quiz input[value="0"]').check();
    ok(
      "incorrect quiz answer is remembered with an explanation",
      (await saved(page)).answers.ald === 0 &&
        /다시 생각/.test(
          await page.locator('.lab-quiz [role="status"]').innerText(),
        ),
    );
    await page.reload();
    await page.locator("#lab-cycles").waitFor();
    ok(
      "incorrect answer and explanation restore after reload",
      (await page.locator('.lab-quiz input[value="0"]').isChecked()) &&
        /다시 생각/.test(
          await page.locator('.lab-quiz [role="status"]').innerText(),
        ),
    );
    await page.locator('.lab-quiz input[value="1"]').check();
    await page.reload();
    await page.locator("#lab-cycles").waitFor();
    ok(
      "corrected quiz answer and explanation restore after reload",
      (await page.locator('.lab-quiz input[value="1"]').isChecked()) &&
        /정답입니다/.test(
          await page.locator('.lab-quiz [role="status"]').innerText(),
        ) &&
        (await saved(page)).answers.ald === 1,
    );
    await range(page, "cycles", 137);
    await page.locator("#lab-next-phase").click();
    await page.locator("#lab-next-phase").click();
    const resumeHash = (await saved(page)).lastLab.hash;
    const resumeParams = new URLSearchParams(resumeHash.split("?")[1]);
    ok(
      "control interactions save ALD cycles and reaction phase",
      resumeParams.get("lab") === "ald" &&
        resumeParams.get("cycles") === "137" &&
        resumeParams.get("phase") === "2" &&
        (await page.locator("#study-save-status").getAttribute("role")) ===
          "status",
    );
    await lab(page, "#labs?lab=ald&cycles=25&phase=3", 25);
    ok(
      "a shared URL controls the model without overwriting saved progress",
      (await saved(page)).lastLab.hash === resumeHash &&
        /다음 사이클 준비/.test(
          await page.locator(".lab-figure svg").textContent(),
        ),
    );
    await lab(page, "#labs?lab=ald", 50);
    ok(
      "a direct lab link uses defaults and keeps the explicit resume target",
      (await saved(page)).lastLab.hash === resumeHash,
    );
    for (const key of ["lithography", "cmp", "sequence", "packaging"])
      await lab(page, "#labs?lab=" + key);
    await learn(page);
    ok(
      "visiting labs and answering quizzes do not complete learning steps",
      /완료 1 \/ 16.*퀴즈 정답 1 \/ 5/.test(
        await page.locator("#study-total").innerText(),
      ) && (await saved(page)).completed.join() === "intro-wafer",
    );
    ok(
      "learning page offers the saved lab URL explicitly",
      (await page.locator("#study-resume").getAttribute("href")) === resumeHash,
    );
    await page.locator("#study-resume").click();
    await page.locator("#lab-cycles").waitFor();
    ok(
      "resume link restores ALD controls and phase",
      (await page.locator("#lab-cycles").inputValue()) === "137" &&
        new URLSearchParams(page.url().split("?")[1]).get("phase") === "2" &&
        /반응가스 공급/.test(
          await page.locator(".lab-figure svg").textContent(),
        ),
    );
    await page.locator("#lab-reset").click();
    ok(
      "reset replaces the saved resume URL with lab defaults",
      (await page.locator("#lab-cycles").inputValue()) === "50" &&
        (await saved(page)).lastLab.id === "ald" &&
        (await saved(page)).lastLab.hash === "#labs?lab=ald" &&
        (await saved(page)).answers.ald === 1,
    );
    await learn(page);
    await page.setViewportSize({ width: 400, height: 850 });
    ok(
      "learning progress fits a mobile viewport",
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    ok(
      "study updates preserve unrelated saved preferences",
      await preferencesPreserved(page),
    );
    ok("normal study flows have no runtime errors", normal.errors.length === 0);
    await normal.context.close();

    const tabs = await fixture(),
      secondTab = await tabs.context.newPage();
    secondTab.on("pageerror", (error) => tabs.errors.push(String(error)));
    await learn(tabs.page);
    await learn(secondTab);
    await tabs.page.locator('[data-study-step="intro-wafer"]').check();
    await secondTab.locator('[data-study-step="intro-photo"]').check();
    ok(
      "saving in a second tab synchronizes merged counts and completion checkboxes",
      /완료 2 \/ 16/.test(
        await secondTab.locator("#study-total").innerText(),
      ) &&
        /완료 2 \/ 4/.test(
          await secondTab.locator('[data-study-path="intro"]').innerText(),
        ) &&
        (await secondTab
          .locator("#study-progress")
          .evaluate((p) => p.value === 2)) &&
        (await secondTab
          .locator('[data-study-step="intro-wafer"]')
          .isChecked()) &&
        (await secondTab
          .locator('[data-study-step="intro-photo"]')
          .isChecked()) &&
        (await secondTab.locator("[data-study-step]:checked").count()) === 2 &&
        (await saved(secondTab)).completed.slice().sort().join() ===
          "intro-photo,intro-wafer",
    );
    await secondTab.locator('[data-study-step="intro-wafer"]').uncheck();
    ok(
      "a merged completion can be unchecked without losing the second tab's step",
      !(await secondTab
        .locator('[data-study-step="intro-wafer"]')
        .isChecked()) &&
        (await secondTab
          .locator('[data-study-step="intro-photo"]')
          .isChecked()) &&
        /완료 1 \/ 16/.test(
          await secondTab.locator("#study-total").innerText(),
        ) &&
        /완료 1 \/ 4/.test(
          await secondTab.locator('[data-study-path="intro"]').innerText(),
        ) &&
        (await saved(secondTab)).completed.join() === "intro-photo",
    );
    ok(
      "two-tab study updates have no runtime errors",
      tabs.errors.length === 0,
    );
    await tabs.context.close();

    const corrupt = await fixture({ study: "{invalid JSON" });
    await learn(corrupt.page);
    ok(
      "corrupt saved JSON falls back to an empty learning state",
      /완료 0 \/ 16.*퀴즈 정답 0 \/ 5/.test(
        await corrupt.page.locator("#study-total").innerText(),
      ) && (await corrupt.page.locator("#study-resume").count()) === 0,
    );
    await corrupt.page.locator('[data-study-step="industry-map"]').check();
    ok(
      "a new manual change repairs corrupt stored study data",
      (await saved(corrupt.page)).version === 1 &&
        (await saved(corrupt.page)).completed.join() === "industry-map",
    );
    ok("corrupt data has no runtime errors", corrupt.errors.length === 0);
    await corrupt.context.close();

    const invalid = await fixture({
      study: JSON.stringify({
        version: 1,
        completed: ["intro-wafer", "unknown", "intro-wafer"],
        answers: { ald: 2, cmp: "1", unknown: 1 },
        lastLab: { id: "ald", hash: "https://example.com/#labs?lab=ald" },
      }),
    });
    await learn(invalid.page);
    ok(
      "unknown, duplicate and invalid data cannot inflate progress or create an external resume link",
      /완료 1 \/ 16.*퀴즈 정답 0 \/ 5/.test(
        await invalid.page.locator("#study-total").innerText(),
      ) && (await invalid.page.locator("#study-resume").count()) === 0,
    );
    await lab(invalid.page, "#labs?lab=ald", 50);
    ok(
      "an unavailable stored quiz option is not selected",
      (await invalid.page.locator(".lab-quiz input:checked").count()) === 0,
    );
    ok(
      "invalid stored data has no runtime errors",
      invalid.errors.length === 0,
    );
    await invalid.context.close();

    const denied = await fixture({ readDenied: true });
    await learn(denied.page);
    await denied.page.locator('[data-study-step="intro-wafer"]').click();
    ok(
      "denied storage leaves completion unchecked and explains the failure",
      !(await denied.page
        .locator('[data-study-step="intro-wafer"]')
        .isChecked()) &&
        /완료 0 \/ 16/.test(
          await denied.page.locator("#study-total").innerText(),
        ) &&
        saveFailed(await denied.page.locator("#study-status").innerText()),
    );
    await lab(denied.page, "#labs?lab=ald", 50);
    await denied.page.locator('.lab-quiz input[value="1"]').check();
    ok(
      "denied storage still explains a quiz answer for the current visit",
      /정답입니다/.test(
        await denied.page.locator('.lab-quiz [role="status"]').innerText(),
      ) &&
        visitOnly(
          await denied.page.locator('.lab-quiz [role="status"]').innerText(),
        ) &&
        saveFailed(await denied.page.locator("#study-save-status").innerText()),
    );
    await denied.page.reload();
    await denied.page.locator("#lab-cycles").waitFor();
    ok(
      "an answer with denied storage is not represented as durable after reload",
      (await denied.page.locator(".lab-quiz input:checked").count()) === 0,
    );
    ok(
      "denied study storage does not alter other preferences",
      await preferencesPreserved(denied.page),
    );
    ok("denied storage has no runtime errors", denied.errors.length === 0);
    await denied.context.close();

    const original = {
      version: 1,
      completed: ["intro-wafer"],
      answers: { ald: 0 },
      lastLab: { id: "ald", hash: "#labs?lab=ald&cycles=80&phase=1" },
    };
    const quota = await fixture({
      study: JSON.stringify(original),
      writeDenied: true,
    });
    await learn(quota.page);
    await quota.page.locator('[data-study-step="practice-cmp"]').click();
    ok(
      "quota failure reverts the completion checkbox and count",
      !(await quota.page
        .locator('[data-study-step="practice-cmp"]')
        .isChecked()) &&
        /완료 1 \/ 16/.test(
          await quota.page.locator("#study-total").innerText(),
        ) &&
        saveFailed(await quota.page.locator("#study-status").innerText()),
    );
    await lab(quota.page, "#labs?lab=ald", 50);
    await range(quota.page, "cycles", 150);
    ok(
      "quota failure keeps controls usable and announces unsaved resume state",
      (await quota.page.locator("#lab-cycles").inputValue()) === "150" &&
        saveFailed(await quota.page.locator("#study-save-status").innerText()),
    );
    await quota.page.locator('.lab-quiz input[value="1"]').check();
    ok(
      "quota failure gives current-visit quiz feedback without overwriting stored state",
      visitOnly(
        await quota.page.locator('.lab-quiz [role="status"]').innerText(),
      ) && JSON.stringify(await saved(quota.page)) === JSON.stringify(original),
    );
    await quota.page.reload();
    await quota.page.locator("#lab-cycles").waitFor();
    ok(
      "reload restores the last durable quiz answer after a quota failure",
      (await quota.page.locator('.lab-quiz input[value="0"]').isChecked()) &&
        /다시 생각/.test(
          await quota.page.locator('.lab-quiz [role="status"]').innerText(),
        ),
    );
    ok(
      "quota failure preserves unrelated preferences",
      await preferencesPreserved(quota.page),
    );
    ok("quota failures have no runtime errors", quota.errors.length === 0);
    await quota.context.close();
    console.log(passed + "/" + passed + " study UI checks passed");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
