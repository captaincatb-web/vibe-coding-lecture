(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SiliconExplorerCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var TYPES = ["company", "product", "process", "knowledge"];
  var ALIASES = {
    "product:pre": [
      "ALD",
      "CVD",
      "원자층 증착",
      "atomic layer deposition",
      "chemical vapor deposition",
      "precursor",
    ],
    "process:dep": ["deposition", "박막 증착", "PVD", "물리 기상 증착"],
    "process:hbm": [
      "HBM",
      "고대역폭 메모리",
      "high bandwidth memory",
      "TSV",
      "패키징",
    ],
    "product:cmp": ["CMP", "화학 기계 연마", "chemical mechanical polishing"],
    "process:cmp": [
      "CMP",
      "화학 기계 평탄화",
      "chemical mechanical planarization",
    ],
    "process:photo": ["photolithography", "리소그래피", "EUV", "DUV"],
    "product:pr": ["photoresist", "포토 레지스트"],
    "company:c05": ["Soulbrain"],
    "knowledge:deep:dep": ["ALD", "원자층 증착", "atomic layer deposition"],
    "knowledge:deep:hbm": ["HBM", "고대역폭 메모리", "high bandwidth memory"],
  };
  function text(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[\s·._()\-]/g, "");
  }
  function strings(value) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    return Object.values(value).map(strings).join(" ");
  }
  function createIndex(data) {
    var records = [],
      byKey = new Map(),
      sourceIds = new Set(data.sources.map((s) => s.source_id));
    function add(type, id, title, summary, route, terms, sources, claims) {
      var key = type + ":" + id;
      var r = {
        key: key,
        type: type,
        id: id,
        title: title,
        summary: summary,
        route: route,
        aliases: ALIASES[key] || [],
        related_keys: [],
        source_ids: sources || [],
        claim_ids: claims || [],
        search_text: terms,
      };
      records.push(r);
      byKey.set(key, r);
    }
    data.companies
      .filter((c) => c.visibility === "public")
      .forEach((c) => {
        var book = data.legacy_snapshot.B[c.legacy_row_index];
        add(
          "company",
          c.company_id,
          c.display_name,
          book.one,
          "#b" + c.legacy_row_index,
          strings([
            book,
            c.aliases,
            data.business_units.filter((u) => u.company_id === c.company_id),
          ]),
          c.source_ids,
          data.claims
            .filter((f) => f.company_id === c.company_id)
            .map((f) => f.claim_id),
        );
        byKey.get("company:" + c.company_id).aliases = c.aliases.concat(
          ALIASES["company:" + c.company_id] || [],
        );
      });
    data.products.forEach((p) =>
      add(
        "product",
        p.product_id,
        p.name,
        p.legacy.w,
        "#x-" + p.product_id,
        strings(p.legacy),
      ),
    );
    data.processes.forEach((p) =>
      add(
        "process",
        p.process_id,
        p.name_ko,
        p.purpose,
        "#t-" + p.process_id,
        strings(p.legacy),
      ),
    );
    data.knowledge.forEach((k) => {
      var refs = new Set();
      function collect(v) {
        if (!v || typeof v !== "object") return;
        if (Array.isArray(v.s))
          v.s.filter((id) => sourceIds.has(id)).forEach((id) => refs.add(id));
        Object.values(v).forEach(collect);
      }
      collect(k.legacy);
      add(
        "knowledge",
        k.knowledge_id,
        k.title,
        k.legacy.intro || "",
        "#t-" + k.process_ids[0],
        strings(k.legacy),
        [...refs],
      );
    });
    function link(a, b) {
      if (!byKey.has(a) || !byKey.has(b)) return;
      if (!byKey.get(a).related_keys.includes(b))
        byKey.get(a).related_keys.push(b);
      if (!byKey.get(b).related_keys.includes(a))
        byKey.get(b).related_keys.push(a);
    }
    data.company_products.forEach((r) =>
      link("company:" + r.company_id, "product:" + r.product_id),
    );
    data.relationship_edges.forEach((r) =>
      link("product:" + r.from_id, "process:" + r.to_id),
    );
    data.knowledge.forEach((k) => {
      k.product_ids.forEach((id) =>
        link("knowledge:" + k.knowledge_id, "product:" + id),
      );
      k.process_ids.forEach((id) =>
        link("knowledge:" + k.knowledge_id, "process:" + id),
      );
    });
    records.forEach((r) => {
      r.search_text = text(
        [
          r.title,
          r.aliases.join(" "),
          r.search_text,
          r.related_keys
            .map(
              (k) => byKey.get(k).title + " " + byKey.get(k).aliases.join(" "),
            )
            .join(" "),
        ].join(" "),
      );
    });
    return {
      version: 1,
      source_digest: data.metadata.legacy_digest,
      records: records,
      sources: data.sources,
      claims: data.claims,
    };
  }
  function validateIndex(index) {
    var errors = [];
    if (
      !index ||
      index.version !== 1 ||
      !Array.isArray(index.records) ||
      !Array.isArray(index.sources) ||
      !Array.isArray(index.claims)
    )
      return ["Unsupported index"];
    var ids = new Set(),
      sources = new Set(index.sources.map((s) => s.source_id)),
      claims = new Set(index.claims.map((c) => c.claim_id));
    index.records.forEach((r) => {
      if (
        !r ||
        !TYPES.includes(r.type) ||
        r.key !== r.type + ":" + r.id ||
        ids.has(r.key) ||
        typeof r.title !== "string" ||
        typeof r.summary !== "string" ||
        typeof r.search_text !== "string" ||
        !Array.isArray(r.aliases) ||
        !Array.isArray(r.related_keys) ||
        !Array.isArray(r.source_ids) ||
        !Array.isArray(r.claim_ids) ||
        !/^#(?:b\d+|[tx]-[\w-]+)$/.test(r.route)
      )
        errors.push("Invalid record");
      if (r) ids.add(r.key);
    });
    index.records.forEach((r) => {
      if (
        !r ||
        !Array.isArray(r.related_keys) ||
        !Array.isArray(r.source_ids) ||
        !Array.isArray(r.claim_ids)
      )
        return;
      if (
        r.related_keys.some((k) => !ids.has(k)) ||
        r.source_ids.some((k) => !sources.has(k)) ||
        r.claim_ids.some((k) => !claims.has(k))
      )
        errors.push("Orphan reference");
    });
    var byKey = new Map(index.records.filter(Boolean).map((r) => [r.key, r]));
    index.records.forEach((r) => {
      if (Array.isArray(r?.related_keys))
        r.related_keys.forEach((k) => {
          if (byKey.has(k) && !byKey.get(k).related_keys?.includes(r.key))
            errors.push("One-way relation");
        });
    });
    index.sources.forEach((s) => {
      try {
        var u = new URL(s.url);
        if (!/^https?:$/.test(u.protocol) || u.username || u.password)
          errors.push("Unsafe source URL");
      } catch (e) {
        errors.push("Invalid source URL");
      }
    });
    return errors;
  }
  function search(index, query, type) {
    var tokens = String(query || "")
        .trim()
        .split(/\s+/)
        .map(text)
        .filter(Boolean),
      exact = text(query);
    return index.records
      .filter(
        (r) =>
          (!type || type === "all" || r.type === type) &&
          tokens.every((t) => r.search_text.includes(t)),
      )
      .map((r) => ({
        record: r,
        score:
          text(r.title) === exact
            ? 1000
            : r.aliases.some((a) => text(a) === exact)
              ? 900
              : exact && text(r.title).includes(exact)
                ? 700
                : 100,
      }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.record.title.localeCompare(b.record.title, "ko"),
      )
      .map((x) => x.record);
  }
  function related(index, key) {
    var record = index.records.find((r) => r.key === key);
    if (!record) return [];
    var keys = new Set(record.related_keys);
    return index.records.filter((r) => keys.has(r.key));
  }
  function readState(hash) {
    var q = new URLSearchParams(String(hash || "").split("?")[1] || "");
    return {
      query: (q.get("q") || "").slice(0, 200),
      type: TYPES.includes(q.get("type")) ? q.get("type") : "all",
      item: q.get("item") || "",
    };
  }
  function stateHash(state) {
    var p = new URLSearchParams();
    if (state.query) p.set("q", state.query.slice(0, 200));
    if (TYPES.includes(state.type)) p.set("type", state.type);
    if (state.item) p.set("item", state.item);
    return "#explore" + (p.size ? "?" + p.toString() : "");
  }
  return {
    createIndex: createIndex,
    validateIndex: validateIndex,
    search: search,
    related: related,
    readState: readState,
    stateHash: stateHash,
  };
});
