(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./weekly-data"));
  else root.SiliconWeeklyCore = factory(root.SiliconWeeklyData);
})(typeof globalThis !== "undefined" ? globalThis : this, function (data) {
  "use strict";
  var topics = [
    ["IND", "산업"],
    ["PRC", "공정"],
    ["FIL", "증착"],
    ["PLS", "플라즈마"],
    ["ETC", "식각"],
    ["LIT", "노광"],
    ["CMP", "평탄화"],
    ["PKG", "패키징"],
    ["TST", "테스트"],
    ["MEM", "메모리"],
    ["FAB", "팹 인프라"],
  ];
  function normalize(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }
  function resolve(hash) {
    var params = new URLSearchParams(String(hash || "").split("?")[1] || ""),
      source = params.get("source") || "",
      topic = params.get("topic") || "";
    return {
      q: (params.get("q") || "").trim().slice(0, 160),
      source: data.sources.some(function (item) {
        return item.id === source;
      })
        ? source
        : "",
      topic: topics.some(function (item) {
        return item[0] === topic;
      })
        ? topic
        : "",
    };
  }
  function route(state) {
    var params = new URLSearchParams();
    ["q", "source", "topic"].forEach(function (key) {
      if (state[key]) params.set(key, state[key]);
    });
    return "#updates" + (params.size ? "?" + params.toString() : "");
  }
  function search(state) {
    var words = normalize(state.q).split(" ").filter(Boolean);
    var sourceAliases = {
      skhynix: "SK하이닉스 하이닉스",
      samsung: "삼성 삼성전자",
      semiengineering: "세미컨덕터 엔지니어링",
      openroad: "오픈로드",
      yosys: "요시스",
    };
    return data.entries.filter(function (entry) {
      var labels = topics
        .filter(function (topic) {
          return entry.topics.includes(topic[0]);
        })
        .map(function (topic) {
          return topic.join(" ");
        })
        .join(" ");
      var text = normalize(
        entry.title +
          " " +
          entry.source_name +
          " " +
          (sourceAliases[entry.source_id] || "") +
          " " +
          labels,
      );
      return (
        (!state.source || state.source === entry.source_id) &&
        (!state.topic || entry.topics.includes(state.topic)) &&
        words.every(function (word) {
          return text.includes(word);
        })
      );
    });
  }
  function freshness(now) {
    var checked = new Date(data.last_success_at).getTime();
    return (
      !Number.isFinite(checked) ||
      new Date(now || Date.now()).getTime() - checked >= 8 * 86400000
    );
  }
  var productTopics = {
    pre: ["FIL"],
    etch: ["ETC"],
    gasEtch: ["ETC", "PLS"],
    gasDep: ["FIL"],
    gasRare: ["LIT", "FAB"],
    gasBulk: ["FAB"],
    pr: ["LIT"],
    barc: ["LIT"],
    cmp: ["CMP"],
    wafer: ["PRC"],
    reclaim: ["PRC"],
    substrate: ["PKG"],
    mask: ["LIT"],
    film: ["PKG"],
    pid: ["PKG", "LIT"],
    hbmfilm: ["PKG", "MEM"],
    target: ["FIL"],
    alcap: ["IND"],
    probe: ["TST"],
    socket: ["TST"],
    sisic: ["ETC", "PLS"],
    quartz: ["FAB", "PLS"],
    oring: ["FAB", "PLS"],
    clean: ["ETC", "CMP"],
    metal: ["FAB"],
    pump: ["FAB"],
    upw: ["FAB", "CMP"],
    amhs: ["FAB"],
    wtester: ["TST", "MEM"],
    ptester: ["TST", "MEM"],
    handler: ["TST"],
  };
  function dateText(value) {
    if (!value) return "미기록";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replace(/-/g, ".");
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "미기록";
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(date)
      .replace(/-/g, ".");
  }
  function entries(topics, limit) {
    var ids = Array.isArray(topics) ? topics : [];
    return data.entries
      .filter(function (entry) {
        return (
          !ids.length ||
          entry.topics.some(function (id) {
            return ids.includes(id);
          })
        );
      })
      .slice(0, Number.isInteger(limit) ? Math.max(0, Math.min(limit, 20)) : 6);
  }
  function forProducts(ids, limit) {
    var topics = new Set();
    (ids || []).forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(productTopics, id))
        productTopics[id].forEach(function (topic) {
          topics.add(topic);
        });
    });
    return topics.size ? entries([...topics], limit) : [];
  }
  function valid(dataValue) {
    if (
      !dataValue ||
      dataValue.version !== 1 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dataValue.as_of) ||
      !Array.isArray(dataValue.entries) ||
      !Array.isArray(dataValue.sources)
    )
      return false;
    var edition = new Date(dataValue.as_of + "T00:00:00.000Z");
    if (
      !Number.isFinite(edition.getTime()) ||
      edition.toISOString().slice(0, 10) !== dataValue.as_of
    )
      return false;
    var ids = new Set(),
      sourceIds = new Set(
        dataValue.sources.map(function (source) {
          return source.id;
        }),
      );
    return dataValue.entries.every(function (entry) {
      if (
        !entry ||
        typeof entry.title !== "string" ||
        !entry.title ||
        entry.title.length > 160 ||
        ids.has(entry.id) ||
        !sourceIds.has(entry.source_id) ||
        !Array.isArray(entry.topics) ||
        !["published", "updated"].includes(entry.date_kind) ||
        typeof entry.verification !== "string" ||
        !entry.verification.includes("원문 대조 전") ||
        !entry.topics.every(function (topic) {
          return [
            "IND",
            "FIL",
            "PLS",
            "ETC",
            "LIT",
            "CMP",
            "PRC",
            "PKG",
            "TST",
            "MEM",
            "FAB",
          ].includes(topic);
        }) ||
        !Number.isFinite(new Date(entry.published_at).getTime())
      )
        return false;
      try {
        var url = new URL(entry.url);
        if (url.protocol !== "https:" || url.username || url.password)
          return false;
      } catch (_) {
        return false;
      }
      ids.add(entry.id);
      return true;
    });
  }
  return {
    data: data,
    topics: topics,
    resolve: resolve,
    route: route,
    search: search,
    freshness: freshness,
    dateText: dateText,
    entries: entries,
    forProducts: forProducts,
    valid: valid,
  };
});
