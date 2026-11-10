"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const {
  RequestError,
  retryAfter,
  withRetry,
} = require("../scripts/network-retry");
const { fetchFeed, config, refresh } = require("../scripts/update-weekly");
const { createApi, rebuild } = require("../scripts/rebuild-pages");
const core = require("../silicon-library/src/weekly-core");
const commit = "a".repeat(40),
  oldCommit = "b".repeat(40),
  branch = "production";
const noWait = async () => {};
test("feed recovers from a temporary server failure and preserves plain RSS metadata", async () => {
  let calls = 0;
  const delays = [];
  const items = await fetchFeed(
    config.sources[0],
    async () =>
      ++calls === 1
        ? new Response("temporary", { status: 503 })
        : new Response(
            "<rss><channel><item><title>Memory update</title><link>https://news.skhynix.com/story</link><pubDate>2026-11-07</pubDate></item></channel></rss>",
          ),
    { sleep: async (ms) => delays.push(ms) },
  );
  assert.equal(calls, 2);
  assert.deepEqual(delays, [1000]);
  assert.equal(items[0].title, "Memory update");
});
test("feed retry is bounded and does not retry forbidden destinations, broken XML or unsafe redirects", async () => {
  for (const result of [
    () => new Response("denied", { status: 403 }),
    () => new Response("<html>bad</html>"),
    () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://other.example/feed" },
      }),
  ]) {
    let calls = 0;
    await assert.rejects(
      fetchFeed(
        config.sources[0],
        async () => {
          calls++;
          return result();
        },
        { sleep: noWait },
      ),
    );
    assert.equal(calls, 1);
  }
  let calls = 0;
  await assert.rejects(
    fetchFeed(
      config.sources[0],
      async () => {
        calls++;
        throw new Error("network disconnected");
      },
      { sleep: noWait },
    ),
  );
  assert.equal(calls, 3);
});
test("rate limits honor Retry-After and longer waits defer refresh instead of retrying early", async () => {
  assert.equal(retryAfter("5"), 5000);
  assert.equal(
    retryAfter(
      "Sun, 08 Nov 2026 00:00:10 GMT",
      Date.parse("2026-11-08T00:00:00Z"),
    ),
    10000,
  );
  let calls = 0;
  const delays = [];
  await withRetry(
    async () => {
      if (++calls === 1)
        throw new RequestError("rate limited", {
          retryable: true,
          retryAfterMs: 5000,
        });
    },
    { sleep: async (ms) => delays.push(ms) },
  );
  assert.deepEqual(delays, [5000]);
  calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
        throw new RequestError("rate limited", {
          retryable: true,
          retryAfterMs: 60000,
        });
      },
      { sleep: noWait },
    ),
  );
  assert.equal(calls, 1);
});
test("invalid source rows cannot advance the last successful edition date", async () => {
  const result = await refresh(core.data, {
    now: "2026-11-15T00:00:00Z",
    sources: [config.sources[0]],
    loader: async () => [null],
  });
  assert.equal(result.successful, 0);
  assert.equal(result.data.as_of, core.data.as_of);
  assert.equal(result.data.last_success_at, core.data.last_success_at);
});
test("Pages API retries temporary errors but stops on missing permissions", async () => {
  let calls = 0;
  const api = createApi({
    repository: "owner/repo",
    token: "test-only",
    sleep: noWait,
    fetcher: async (url, options) => {
      calls++;
      assert.equal(new URL(url).hostname, "api.github.com");
      assert.equal(options.redirect, "error");
      return calls === 1
        ? new Response("temporary", { status: 502 })
        : Response.json({ status: "built" });
    },
  });
  assert.equal((await api("pages/builds/latest")).status, "built");
  assert.equal(calls, 2);
  calls = 0;
  const forbidden = createApi({
    repository: "owner/repo",
    token: "test-only",
    sleep: noWait,
    fetcher: async () => {
      calls++;
      return new Response("denied", { status: 403 });
    },
  });
  await assert.rejects(forbidden("pages"), /HTTP 403/);
  assert.equal(calls, 1);
});
test("Pages receipt requires the exact commit and tolerates one failed status poll", async () => {
  let polls = 0,
    requested = 0;
  const states = [
    () => ({ commit: oldCommit, status: "built" }),
    () => {
      throw new RequestError("temporary", { retryable: true });
    },
    () => ({ commit, status: "building" }),
    () => ({ commit, status: "built" }),
  ];
  const result = await rebuild({
    expectedCommit: commit,
    targetBranch: branch,
    sleep: noWait,
    log: () => {},
    api: async (path, method) => {
      if (path === "pages") return { source: { branch } };
      if (method === "POST") {
        requested++;
        return {};
      }
      return states[polls++]();
    },
  });
  assert.equal(requested, 1);
  assert.equal(result.commit, commit);
  assert.equal(result.status, "built");
  assert.equal(polls, 4);
});
test("Pages does not rebuild an already confirmed commit or accept another source, stale commit or failed build", async () => {
  const base = {
    expectedCommit: commit,
    targetBranch: branch,
    sleep: noWait,
    log: () => {},
    maxChecks: 2,
  };
  let post = 0;
  await rebuild({
    ...base,
    api: async (path, method) => {
      if (method === "POST") post++;
      return path === "pages"
        ? { source: { branch } }
        : { commit, status: "built" };
    },
  });
  assert.equal(post, 0);
  await assert.rejects(
    rebuild({ ...base, api: async () => ({ source: { branch: "wrong" } }) }),
    /source branch/,
  );
  await assert.rejects(
    rebuild({
      ...base,
      api: async (path) =>
        path === "pages"
          ? { source: { branch } }
          : { commit: oldCommit, status: "built" },
    }),
    /did not confirm/,
  );
  await assert.rejects(
    rebuild({
      ...base,
      api: async (path) =>
        path === "pages"
          ? { source: { branch } }
          : { commit, status: "errored" },
    }),
    /build error/,
  );
});
test("weekly search combines source, Korean topic and title words; shared routes reject invalid filters", () => {
  const all = core.search({});
  assert.equal(all.length, core.data.entries.length);
  assert.ok(
    core
      .search({ q: "Ｙｏｓｙｓ", source: "yosys" })
      .every((item) => /yosys/i.test(item.title)),
  );
  const memory = core.search({ q: "메모리", topic: "MEM" });
  assert.ok(memory.length);
  assert.ok(memory.every((item) => item.topics.includes("MEM")));
  const samsung = core.search({ q: "삼성 메모리" });
  assert.ok(samsung.length);
  assert.ok(
    samsung.every(
      (item) => item.source_id === "samsung" && item.topics.includes("MEM"),
    ),
  );
  const state = { q: "memory & HBM", source: "skhynix", topic: "MEM" };
  assert.deepEqual(core.resolve(core.route(state)), state);
  assert.deepEqual(core.resolve("#updates?source=unknown&topic=INVALID"), {
    q: "",
    source: "",
    topic: "",
  });
  assert.equal(core.search({ q: "__no_matching_material__" }).length, 0);
});
test("Pages polling honors a longer server-requested pause instead of sending another request early", async () => {
  let calls = 0;
  const delays = [];
  const api = createApi({
    repository: "owner/repo",
    token: "test-only",
    sleep: async (ms) => delays.push(ms),
    fetcher: async () => {
      calls++;
      if (calls === 1) return Response.json({ source: { branch } });
      if (calls === 2)
        return Response.json({ commit: oldCommit, status: "built" });
      if (calls === 3) return Response.json({ status: "queued" });
      return new Response("rate limited", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    },
  });
  await assert.rejects(
    rebuild({
      expectedCommit: commit,
      targetBranch: branch,
      api,
      sleep: async (ms) => delays.push(ms),
      log: () => {},
    }),
    /HTTP 429/,
  );
  assert.equal(calls, 4);
  assert.deepEqual(delays, []);
});
test("stale collection warning follows actual last successful check rather than edition formatting", () => {
  const last = Date.parse(core.data.last_success_at);
  assert.equal(core.freshness(last + 7 * 86400000), false);
  assert.equal(core.freshness(last + 8 * 86400000), true);
});
