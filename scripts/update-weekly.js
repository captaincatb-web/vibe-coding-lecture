#!/usr/bin/env node
"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  cp = require("node:child_process");
const root = path.join(__dirname, "../silicon-library");
const config = JSON.parse(
  fs.readFileSync(path.join(root, "data/weekly-sources.json"), "utf8"),
);
const dataPath = path.join(root, "data/weekly-updates.json");
function koreanDate(now) {
  return new Date(new Date(now).getTime() + 9 * 3600000)
    .toISOString()
    .slice(0, 10);
}
function safeUrl(value, source) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !source.hosts.includes(url.hostname) ||
      (source.path_prefix && !url.pathname.startsWith(source.path_prefix))
    )
      return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()])
      if (/^utm_/i.test(key)) url.searchParams.delete(key);
    return url.href;
  } catch (_) {
    return null;
  }
}
function parseFeed(xml) {
  const result = cp.spawnSync(
    "python3",
    [path.join(__dirname, "parse-weekly-feed.py")],
    { input: xml, encoding: "utf8", maxBuffer: 2 * 1024 * 1024 },
  );
  if (result.status !== 0) throw new Error("RSS/Atom parse failed");
  return JSON.parse(result.stdout);
}
async function fetchFeed(source, fetcher = fetch) {
  let address = source.url;
  for (let redirects = 0; redirects < 4; redirects++) {
    const response = await fetcher(address, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
      headers: {
        "User-Agent":
          "SiliconLibraryWeekly/1.0 (+https://captaincatb-web.github.io/vibe-coding-lecture/)",
        Accept:
          "application/atom+xml, application/rss+xml, application/xml, text/xml",
      },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = new URL(response.headers.get("location"), address);
      if (
        next.protocol !== "https:" ||
        !source.hosts.includes(next.hostname) ||
        next.username ||
        next.password
      )
        throw new Error("Untrusted feed redirect");
      address = next.href;
      continue;
    }
    if (!response.ok) throw new Error("HTTP " + response.status);
    const reader = response.body.getReader();
    let total = 0,
      chunks = [];
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > 2 * 1024 * 1024) {
        await reader.cancel();
        throw new Error("Feed exceeds size limit");
      }
      chunks.push(Buffer.from(part.value));
    }
    return parseFeed(Buffer.concat(chunks).toString("utf8"));
  }
  throw new Error("Too many feed redirects");
}
function topicsFor(source, title) {
  const topics = new Set(source.topics),
    add = (pattern, ids) => {
      if (pattern.test(title)) ids.forEach((id) => topics.add(id));
    };
  add(/ALD|CVD|deposition|precursor|증착|전구체/i, ["FIL"]);
  add(/plasma|플라즈마/i, ["PLS"]);
  add(/etch|식각/i, ["ETC"]);
  add(/EUV|lithograph|photoresist|노광|레지스트/i, ["LIT"]);
  add(/CMP|planariz|평탄화/i, ["CMP"]);
  add(/HBM|packag|bonding|패키징|본딩/i, ["PKG", "MEM"]);
  add(/DRAM|NAND|memory|메모리/i, ["MEM"]);
  add(/test|probe|테스트|검사/i, ["TST"]);
  add(/fab|manufactur|제조|공정/i, ["PRC"]);
  add(/water|vacuum|물류|초순수|진공/i, ["FAB"]);
  return [...topics].sort();
}
function entryFrom(row, source, now) {
  const url = safeUrl(row.url, source),
    date = new Date(row.published_at);
  if (
    !url ||
    !row.title ||
    !Number.isFinite(date.getTime()) ||
    date.getTime() > new Date(now).getTime() + 5 * 60000
  )
    return null;
  if (
    source.filter &&
    !new RegExp(source.filter, "i").test(
      row.title + " " + (row.match_text || ""),
    )
  )
    return null;
  return {
    id: crypto
      .createHash("sha256")
      .update(source.id + "\n" + url)
      .digest("hex")
      .slice(0, 20),
    source_id: source.id,
    source_name: source.name,
    title: row.title.slice(0, 160),
    url,
    published_at: date.toISOString(),
    date_kind: row.date_kind === "updated" ? "updated" : "published",
    first_seen_at: now,
    topics: topicsFor(source, row.title),
    verification: "원문 대조 전 · 자동 수집한 제목·게시일·링크",
  };
}
async function refresh(
  previous,
  {
    now = new Date().toISOString(),
    loader = fetchFeed,
    sources = config.sources,
  } = {},
) {
  const entries = new Map(
      (previous.entries || []).map((entry) => [entry.id, entry]),
    ),
    statuses = [],
    oldStatuses = new Map(
      (previous.sources || []).map((source) => [source.id, source]),
    );
  let successful = 0;
  await Promise.all(
    sources.map(async (source) => {
      const old = oldStatuses.get(source.id);
      try {
        const rows = await loader(source);
        successful++;
        const incoming = rows
          .map((row) => entryFrom(row, source, now))
          .filter(Boolean)
          .sort((a, b) => b.published_at.localeCompare(a.published_at))
          .slice(0, 8);
        incoming.forEach((entry) => {
          const prior = entries.get(entry.id);
          entries.set(entry.id, {
            ...entry,
            first_seen_at: prior ? prior.first_seen_at : now,
          });
        });
        statuses.push({
          id: source.id,
          name: source.name,
          url: source.url,
          status: "ok",
          checked_at: now,
          last_success_at: now,
          entries: incoming.length,
          error: null,
        });
      } catch (error) {
        statuses.push({
          id: source.id,
          name: source.name,
          url: source.url,
          status: "failed",
          checked_at: now,
          last_success_at: old ? old.last_success_at : null,
          entries: old ? old.entries : 0,
          error: String(error.message).slice(0, 160),
        });
      }
    }),
  );
  const resultEntries = [];
  for (const source of sources)
    resultEntries.push(
      ...[...entries.values()]
        .filter((entry) => entry.source_id === source.id)
        .sort((a, b) => b.published_at.localeCompare(a.published_at))
        .slice(0, 8),
    );
  resultEntries.sort(
    (a, b) =>
      b.published_at.localeCompare(a.published_at) || a.id.localeCompare(b.id),
  );
  const contentChanged =
    JSON.stringify(resultEntries) !== JSON.stringify(previous.entries || []);
  return {
    successful,
    data: {
      version: 1,
      as_of: successful ? koreanDate(now) : previous.as_of,
      last_attempt_at: now,
      last_success_at: successful ? now : previous.last_success_at,
      last_content_change_at: contentChanged
        ? now
        : previous.last_content_change_at,
      schedule: config.schedule.label,
      entries: resultEntries,
      sources: statuses.sort((a, b) => a.id.localeCompare(b.id)),
    },
  };
}
function javascript(data) {
  return (
    '(function(root){"use strict";var data=' +
    JSON.stringify(data)
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029") +
    ';if(typeof module==="object"&&module.exports)module.exports=data;else root.SiliconWeeklyData=data;})(typeof globalThis!=="undefined"?globalThis:this);\n'
  );
}
function build(data, { check = false } = {}) {
  if (!require("../silicon-library/src/weekly-core").valid(data))
    throw new Error("Invalid weekly metadata");
  const target = path.join(root, "src/weekly-data.js"),
    body = javascript(data);
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== body)
      throw new Error("Weekly data artifact is stale");
  } else fs.writeFileSync(target, body);
}
module.exports = {
  koreanDate,
  safeUrl,
  parseFeed,
  entryFrom,
  refresh,
  javascript,
  build,
  config,
};
if (require.main === module)
  (async () => {
    const args = process.argv.slice(2),
      previous = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    if (args.includes("--check")) {
      build(previous, { check: true });
      console.log("PASS weekly data artifact is current");
      return;
    }
    if (args.includes("--build-only")) {
      build(previous);
      return;
    }
    const result = await refresh(previous);
    fs.writeFileSync(dataPath, JSON.stringify(result.data, null, 2) + "\n");
    build(result.data);
    for (const source of result.data.sources)
      console.log(
        source.id +
          ": " +
          source.status +
          " / " +
          source.entries +
          " items" +
          (source.error ? " / " + source.error : ""),
      );
    console.log(
      "Successful sources: " + result.successful + "/" + config.sources.length,
    );
    if (process.env.GITHUB_OUTPUT)
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        "successful=" + result.successful + "\n",
      );
    if (!result.successful) process.exitCode = 1;
  })().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
