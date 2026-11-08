(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./weekly-data"));
  else root.SiliconWeeklyCore = factory(root.SiliconWeeklyData);
})(typeof globalThis !== "undefined" ? globalThis : this, function (data) {
  "use strict";
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
    dateText: dateText,
    entries: entries,
    forProducts: forProducts,
    valid: valid,
  };
});
