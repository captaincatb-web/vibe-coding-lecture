"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const {
  koreanDate,
  safeUrl,
  parseFeed,
  entryFrom,
  refresh,
  javascript,
  config,
} = require("../scripts/update-weekly");
const core = require("../silicon-library/src/weekly-core"),
  data = require("../silicon-library/data/weekly-updates.json");
const now = "2026-11-08T10:00:00.000Z",
  source = config.sources.find((s) => s.id === "yosys");
const row = {
  title: "Yosys release",
  url: "https://github.com/YosysHQ/yosys/releases/tag/v1",
  published_at: "2026-11-07T00:00:00Z",
  date_kind: "published",
};
const empty = () => ({
  version: 1,
  as_of: "2026-11-01",
  last_attempt_at: null,
  last_success_at: null,
  last_content_change_at: null,
  entries: [],
  sources: [],
  schedule: config.schedule.label,
});
test("public RSS and Atom parsers extract plain metadata without keeping article HTML", () => {
  const rss = parseFeed(
    "<rss><channel><item><title><![CDATA[<b>HBM</b> news &amp; tests]]></title><link>https://example.com/story</link><pubDate>Sat, 07 Nov 2026 00:00:00 GMT</pubDate><description><![CDATA[<p>Memory</p>]]></description></item></channel></rss>",
  );
  assert.equal(rss[0].title, "HBM news & tests");
  assert.equal(rss[0].date_kind, "published");
  const atom = parseFeed(
    '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Release</title><link href="https://example.com/release"/><updated>2026-11-07T00:00:00Z</updated></entry></feed>',
  );
  assert.equal(atom[0].date_kind, "updated");
  assert.equal(atom[0].url, "https://example.com/release");
  assert.throws(() => parseFeed('<!DOCTYPE rss [<!ENTITY x "bad">]><rss/>'));
  assert.throws(() => parseFeed("<html><body>Blocked</body></html>"));
});
test("source URLs reject scripts, credentials, other hosts and other GitHub repositories", () => {
  for (const url of [
    "javascript:alert(1)",
    "http://github.com/YosysHQ/yosys/releases/tag/v1",
    "https://user:secret@github.com/YosysHQ/yosys/releases/tag/v1",
    "https://github.com.attacker.example/",
    "https://github.com/other/repo/releases/tag/v1",
  ])
    assert.equal(safeUrl(url, source), null);
  assert.equal(safeUrl(row.url + "?utm_source=test#fragment", source), row.url);
});
test("future and invalid publications are not published; metadata never becomes a verified company fact", () => {
  assert.equal(
    entryFrom({ ...row, published_at: "2027-01-01" }, source, now),
    null,
  );
  assert.equal(entryFrom({ ...row, published_at: "bad" }, source, now), null);
  const entry = entryFrom(row, source, now);
  assert.match(entry.verification, /원문 대조 전/);
  assert.equal(entry.company_id, undefined);
  assert.equal(entry.match_text, undefined);
});
test("successful refresh uses Korean calendar date and keeps original publication dates", async () => {
  assert.equal(koreanDate("2026-11-08T16:00:00Z"), "2026-11-09");
  const result = await refresh(empty(), {
    now,
    sources: [source],
    loader: async () => [row],
  });
  assert.equal(result.successful, 1);
  assert.equal(result.data.as_of, "2026-11-08");
  assert.equal(result.data.entries[0].published_at, "2026-11-07T00:00:00.000Z");
  assert.ok(core.valid(result.data));
});
test("all failures preserve previous good entries, edition date and success timestamp", async () => {
  const first = await refresh(empty(), {
    now,
    sources: [source],
    loader: async () => [row],
  });
  const before = JSON.stringify(first.data);
  const result = await refresh(first.data, {
    now: "2026-11-15T10:00:00Z",
    sources: [source],
    loader: async () => {
      throw new Error("HTTP 403");
    },
  });
  assert.equal(result.successful, 0);
  assert.deepEqual(result.data.entries, first.data.entries);
  assert.equal(result.data.as_of, first.data.as_of);
  assert.equal(result.data.last_success_at, now);
  assert.equal(JSON.stringify(first.data), before);
});
test("partial failure and repeated feeds deduplicate entries without changing first-seen or content-change dates", async () => {
  const second = config.sources.find((s) => s.id === "openroad");
  const first = await refresh(empty(), {
    now,
    sources: [source],
    loader: async () => [row, row],
  });
  const result = await refresh(first.data, {
    now: "2026-11-15T10:00:00Z",
    sources: [source, second],
    loader: async (s) => {
      if (s.id === second.id) throw new Error("HTTP 403");
      return [row];
    },
  });
  assert.equal(result.successful, 1);
  assert.equal(result.data.entries.length, 1);
  assert.equal(result.data.entries[0].first_seen_at, now);
  assert.equal(
    result.data.last_content_change_at,
    first.data.last_content_change_at,
  );
});
test("generated browser data is safe and actual dataset has known sources and bounded public titles", () => {
  assert.ok(core.valid(data));
  for (const item of data.entries) {
    const input = config.sources.find((s) => s.id === item.source_id);
    assert.ok(input && safeUrl(item.url, input));
  }
  for (const input of config.sources)
    assert.ok(data.entries.filter((e) => e.source_id === input.id).length <= 8);
  assert.ok(!javascript({ title: "</script><img>" }).includes("</script>"));
  assert.equal(config.schedule.cron, "0 0 * * 1");
  assert.equal(config.schedule.timezone, "Asia/Seoul");
  assert.equal(core.valid({ ...data, as_of: "2026-99-99" }), false);
});
