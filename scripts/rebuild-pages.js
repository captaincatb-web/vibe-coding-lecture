#!/usr/bin/env node
"use strict";
const {
  RequestError,
  retryAfter,
  withRetry,
  wait,
} = require("./network-retry");
function createApi({ repository, token, fetcher = fetch, sleep = wait }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !token)
    throw new Error("A repository and GitHub job token are required");
  return (path, method = "GET") =>
    withRetry(
      async () => {
        let response;
        try {
          response = await fetcher(
            "https://api.github.com/repos/" + repository + "/" + path,
            {
              method,
              redirect: "error",
              signal: AbortSignal.timeout(20000),
              headers: {
                Authorization: "Bearer " + token,
                Accept: "application/vnd.github+json",
                "User-Agent": "SiliconLibraryWeekly/1.1",
                "X-GitHub-Api-Version": "2022-11-28",
              },
            },
          );
        } catch (error) {
          throw new RequestError(error.message, { retryable: true });
        }
        if (!response.ok) {
          await response.body?.cancel().catch(() => {});
          throw new RequestError(
            "GitHub " + method + " " + path + ": HTTP " + response.status,
            {
              status: response.status,
              retryable: response.status === 429 || response.status >= 500,
              retryAfterMs: retryAfter(response.headers.get("retry-after")),
            },
          );
        }
        try {
          return await response.json();
        } catch (error) {
          if (error instanceof SyntaxError) throw error;
          throw new RequestError(error.message, { retryable: true });
        }
      },
      { sleep },
    );
}
async function rebuild({
  expectedCommit,
  targetBranch,
  api,
  sleep = wait,
  now = Date.now,
  maxChecks = 60,
  log = console.log,
}) {
  if (
    typeof expectedCommit !== "string" ||
    typeof targetBranch !== "string" ||
    !/^[a-f0-9]{40}$/.test(expectedCommit) ||
    !/^[\w./-]+$/.test(targetBranch)
  )
    throw new Error("Invalid Pages commit or source branch");
  const settings = await api("pages");
  if (settings.source?.branch !== targetBranch)
    throw new Error("Pages source branch differs from the weekly target");
  let latest;
  try {
    latest = await api("pages/builds/latest");
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  const complete = (build) =>
    build?.commit === expectedCommit && build.status === "built";
  if (!complete(latest)) {
    try {
      await api("pages/builds", "POST");
    } catch (error) {
      if (error.status !== 409) throw error;
    }
    const deadline = now() + 10 * 60000;
    for (let check = 0; check < maxChecks && now() <= deadline; check++) {
      try {
        latest = await api("pages/builds/latest");
      } catch (error) {
        if (!error.retryable || error.retryDeferred) throw error;
        log("Retrying Pages status after a temporary connection failure");
        await sleep(10000);
        continue;
      }
      if (complete(latest)) break;
      if (latest.commit === expectedCommit && latest.status === "errored")
        throw new Error("Pages reported a build error for " + expectedCommit);
      await sleep(10000);
    }
  }
  if (!complete(latest))
    throw new Error(
      "Pages did not confirm the expected commit within ten minutes",
    );
  const receipt = {
    status: "built",
    commit: expectedCommit,
    branch: targetBranch,
    checked_at: new Date(now()).toISOString(),
  };
  log("Pages deployed " + expectedCommit);
  return receipt;
}
module.exports = { createApi, rebuild };
if (require.main === module)
  (async () => {
    const fs = require("node:fs"),
      path = require("node:path"),
      cp = require("node:child_process");
    const expectedCommit = cp
      .execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" })
      .trim();
    const receipt = await rebuild({
      expectedCommit,
      targetBranch: process.env.TARGET_BRANCH,
      api: createApi({
        repository: process.env.GITHUB_REPOSITORY,
        token: process.env.GH_TOKEN,
      }),
    });
    const target = path.join(
      process.env.RUNNER_TEMP || "/tmp",
      "silicon-weekly-deployment.json",
    );
    fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + "\n");
    if (process.env.GITHUB_STEP_SUMMARY)
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        "### Pages deployment confirmed\n\nCommit: `" +
          receipt.commit +
          "`\n\nBranch: `" +
          receipt.branch +
          "`\n\nChecked: " +
          receipt.checked_at +
          "\n",
      );
  })().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
