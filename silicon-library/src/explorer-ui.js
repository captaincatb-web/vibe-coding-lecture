(function () {
  "use strict";
  var core = window.SiliconExplorerCore,
    indexPromise,
    mounted;
  var dataURL = new URL(
    "../data/explorer-index.json",
    document.currentScript.src,
  );
  var LABEL = {
    company: "기업",
    product: "제품 기술",
    process: "공정",
    knowledge: "심화 해설",
  };
  function el(tag, text, cls) {
    var node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  function load() {
    if (!indexPromise)
      indexPromise = fetch(dataURL, { credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) throw new Error("Index unavailable");
          return r.json();
        })
        .then(function (d) {
          if (core.validateIndex(d).length) throw new Error("Invalid index");
          return d;
        })
        .catch(function (e) {
          indexPromise = null;
          throw e;
        });
    return indexPromise;
  }
  function mount(root) {
    mounted = root;
    root.replaceChildren(el("p", "탐색 자료를 불러오는 중입니다…", "note"));
    root.setAttribute("aria-busy", "true");
    load()
      .then(function (index) {
        if (root !== mounted || !root.isConnected) return;
        root.setAttribute("aria-busy", "false");
        render(root, index);
      })
      .catch(function () {
        if (!root.isConnected) return;
        root.setAttribute("aria-busy", "false");
        var p = el(
          "p",
          "탐색 자료를 불러오지 못했습니다. 기존 책장과 기술 백과는 계속 이용할 수 있습니다.",
          "note",
        );
        p.setAttribute("role", "alert");
        var retry = el("button", "다시 시도");
        retry.type = "button";
        retry.onclick = function () {
          mount(root);
        };
        var link = el("a", "기술 백과 열기");
        link.href = "#tech";
        root.replaceChildren(p, retry, link);
      });
  }
  function render(root, index) {
    var state = core.readState(location.hash),
      sources = new Map(
        index.sources.map(function (s) {
          return [s.source_id, s];
        }),
      );
    state.compare = core
      .compareCompanies(index, state.compare)
      .map((c) => c.record.key);
    function saved(name) {
      try {
        var keys = JSON.parse(
          localStorage.getItem("siliconLibrary:" + name + ":v1") || "[]",
        );
        return Array.isArray(keys)
          ? keys
              .filter(function (k) {
                return (
                  typeof k === "string" &&
                  index.records.some(function (r) {
                    return r.key === k;
                  })
                );
              })
              .slice(0, 100)
          : [];
      } catch (e) {
        return [];
      }
    }
    function save(name, keys) {
      try {
        localStorage.setItem(
          "siliconLibrary:" + name + ":v1",
          JSON.stringify(keys),
        );
        return true;
      } catch (e) {
        if (status)
          status.textContent =
            "브라우저에 기록을 저장하지 못했습니다. 저장 공간과 개인정보 설정을 확인하세요.";
        return false;
      }
    }
    root.replaceChildren();
    var intro = el(
      "p",
      "기업·제품·공정을 함께 찾고, 연결을 따라 근거 자료를 확인하세요. 검색에는 설명과 연결 항목도 포함됩니다.",
      "lede",
    );
    root.append(intro);
    var note = el(
      "p",
      "연결선은 서재의 품목·공정 분류입니다. 실제 납품이나 고객 관계를 뜻하지 않습니다. 기존 대조 기록과 이번 원문 재확인은 구분합니다.",
      "note",
    );
    root.append(note);
    var form = el("form", undefined, "explorer-tools");
    form.setAttribute("role", "search");
    var queryLabel = el("label", "검색어"),
      query = el("input");
    query.id = "explorer-query";
    query.type = "search";
    query.maxLength = 200;
    query.value = state.query;
    query.placeholder = "ALD · 원자층 증착 · HBM · 솔브레인";
    queryLabel.append(query);
    var typeLabel = el("label", "결과 종류"),
      type = el("select");
    type.id = "explorer-type";
    var all = el("option", "전체");
    all.value = "all";
    type.append(all);
    Object.keys(LABEL).forEach(function (k) {
      var op = el("option", LABEL[k]);
      op.value = k;
      type.append(op);
    });
    type.value = state.type;
    typeLabel.append(type);
    form.append(queryLabel, typeLabel);
    root.append(form);
    var savedPanel = el("details", undefined, "explorer-saved");
    savedPanel.append(el("summary", "탐색 책갈피와 최근 본 항목"));
    var savedBody = el("div");
    savedPanel.append(savedBody);
    root.append(savedPanel);
    var status = el("p", undefined, "cap");
    status.id = "explorer-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    root.append(status);
    var backup = el("details", undefined, "explorer-saved");
    backup.append(el("summary", "탐색 책갈피 백업·복원"));
    backup.append(
      el(
        "p",
        "이 브라우저의 탐색 책갈피를 JSON 파일로 보관합니다. 복원은 기존 책갈피에 병합하며 기존 책장 즐겨찾기는 변경하지 않습니다.",
        "cap",
      ),
    );
    var download = el("button", "책갈피 백업 다운로드");
    download.type = "button";
    download.onclick = function () {
      var blob = new Blob(
        [
          JSON.stringify(
            {
              format: "silicon-library-bookmarks",
              version: 1,
              keys: saved("bookmarks"),
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      var address = URL.createObjectURL(blob),
        anchor = el("a");
      anchor.href = address;
      anchor.download = "silicon-library-bookmarks.json";
      anchor.click();
      setTimeout(function () {
        URL.revokeObjectURL(address);
      }, 1000);
      status.textContent = "탐색 책갈피 백업 파일을 만들었습니다.";
    };
    var uploadLabel = el("label", "책갈피 백업 파일 복원"),
      upload = el("input");
    upload.type = "file";
    upload.accept = ".json,application/json";
    upload.id = "explorer-bookmark-import";
    upload.onchange = async function () {
      var file = upload.files[0];
      if (!file) return;
      try {
        if (file.size > 1048576)
          throw new Error("백업 파일은 1MB 이하여야 합니다.");
        var data = JSON.parse(await file.text());
        if (
          !data ||
          data.format !== "silicon-library-bookmarks" ||
          data.version !== 1 ||
          !Array.isArray(data.keys) ||
          data.keys.length > 100 ||
          data.keys.some((k) => typeof k !== "string")
        )
          throw new Error("지원하는 책갈피 백업 형식이 아닙니다.");
        var valid = data.keys.filter((k) =>
          index.records.some((r) => r.key === k),
        );
        var merged = [...new Set(saved("bookmarks").concat(valid))];
        if (merged.length > 100)
          throw new Error(
            "병합 결과가 100개를 넘습니다. 기존 책갈피를 정리한 뒤 복원하세요.",
          );
        if (!save("bookmarks", merged)) return;
        drawSaved();
        drawDetails(false);
        status.textContent =
          "책갈피 " +
          merged.length +
          "개를 보관했습니다. 현재 자료에 없는 항목 " +
          (data.keys.length - valid.length) +
          "개는 제외했습니다.";
      } catch (e) {
        status.textContent =
          "복원하지 못했습니다. 기존 책갈피는 유지됩니다. " +
          (e instanceof SyntaxError ? "JSON 파일을 확인하세요." : e.message);
      } finally {
        upload.value = "";
      }
    };
    uploadLabel.append(upload);
    backup.append(download, uploadLabel);
    root.append(backup);
    var comparisonPanel = el("section", undefined, "comparison-panel");
    comparisonPanel.setAttribute(
      "aria-labelledby",
      "explorer-comparison-title",
    );
    root.append(comparisonPanel);
    var layout = el("div", undefined, "explorer-layout"),
      results = el("ul", undefined, "explorer-results"),
      detail = el("section", undefined, "explorer-detail");
    results.setAttribute("aria-label", "통합 검색 결과");
    detail.setAttribute("aria-label", "선택 항목과 연결");
    layout.append(results, detail);
    root.append(layout);
    function updateURL(push) {
      history[push ? "pushState" : "replaceState"](
        null,
        "",
        core.stateHash(state),
      );
    }
    function choose(key) {
      state.item = key;
      save(
        "recent",
        [key]
          .concat(
            saved("recent").filter(function (k) {
              return k !== key;
            }),
          )
          .slice(0, 12),
      );
      updateURL(true);
      drawDetails(true);
      drawResults();
      drawSaved();
      drawComparison();
    }
    function drawSaved() {
      savedBody.replaceChildren();
      [
        ["bookmarks", "탐색 책갈피"],
        ["recent", "최근 본 항목"],
      ].forEach(function (pair) {
        savedBody.append(el("h4", pair[1]));
        var keys = saved(pair[0]);
        if (!keys.length)
          savedBody.append(el("p", "아직 저장된 항목이 없습니다.", "empty"));
        keys.forEach(function (k) {
          var r = index.records.find(function (r) {
            return r.key === k;
          });
          savedBody.append(recordButton(r));
        });
      });
    }
    function recordButton(record) {
      var b = el("button");
      b.type = "button";
      b.dataset.key = record.key;
      b.append(el("small", LABEL[record.type]), el("span", record.title));
      if (record.key === state.item) b.setAttribute("aria-current", "true");
      b.onclick = function () {
        choose(record.key);
      };
      return b;
    }
    function drawResults() {
      var found = core.search(index, state.query, state.type);
      results.replaceChildren();
      status.textContent =
        "검색 결과 " +
        found.length +
        "건" +
        (found.length > 100 ? " · 처음 100건 표시" : "");
      found.slice(0, 100).forEach(function (r) {
        var li = el("li");
        li.append(recordButton(r));
        results.append(li);
      });
      if (!found.length)
        results.append(
          el(
            "li",
            "검색 결과가 없습니다. 다른 별칭을 입력하거나 결과 종류를 전체로 바꿔 보세요.",
            "empty",
          ),
        );
    }
    function changeComparison(key) {
      if (state.compare.includes(key))
        state.compare = state.compare.filter((k) => k !== key);
      else {
        if (state.compare.length >= 3) {
          status.textContent =
            "비교는 최대 3곳까지 가능합니다. 기존 기업을 제외한 뒤 추가하세요.";
          return;
        }
        state.compare.push(key);
      }
      updateURL(true);
      drawComparison();
      drawDetails(false);
      status.textContent =
        "비교 기업 " +
        state.compare.length +
        "/3곳 · 선택은 공유 주소에 함께 저장됩니다.";
    }
    function drawComparison() {
      comparisonPanel.replaceChildren();
      var columns = core.compareCompanies(index, state.compare);
      comparisonPanel.hidden = columns.length === 0;
      if (!columns.length) return;
      var heading = el("h2", "기업 비교 · " + columns.length + "/3곳");
      heading.id = "explorer-comparison-title";
      comparisonPanel.append(
        heading,
        el(
          "p",
          "기업 레코드 단위 비교입니다. 법인 수나 특정 고객의 납품 관계를 뜻하지 않습니다. A/B/C는 자료 확보 수준이며 사실별 검증과 구분합니다.",
          "cap",
        ),
        el("p", "좁은 화면에서는 표를 좌우로 스크롤할 수 있습니다.", "cap"),
      );
      var clear = el("button", "비교 전체 비우기");
      clear.type = "button";
      clear.onclick = function () {
        state.compare = [];
        updateURL(true);
        drawComparison();
        drawDetails(false);
        status.textContent = "비교 선택을 비웠습니다.";
        query.focus();
      };
      comparisonPanel.append(clear);
      var scroll = el("div", undefined, "comparison-scroll");
      scroll.tabIndex = 0;
      scroll.setAttribute("role", "region");
      scroll.setAttribute(
        "aria-label",
        "기업 비교 표 · 좌우로 스크롤할 수 있습니다",
      );
      var table = el("table", undefined, "comparison-table");
      table.dataset.columns = columns.length;
      table.append(el("caption", "수록 분류·공정 연결·기존 근거 비교"));
      var head = el("thead"),
        names = el("tr"),
        first = el("th", "비교 항목");
      first.scope = "col";
      names.append(first);
      columns.forEach((c) => {
        var th = el("th");
        th.scope = "col";
        th.append(el("strong", c.record.title));
        var remove = el("button", "제외");
        remove.type = "button";
        remove.setAttribute("aria-label", c.record.title + " 비교에서 제외");
        remove.onclick = function () {
          changeComparison(c.record.key);
          var toggle = detail.querySelector("#explorer-compare");
          (toggle || query).focus();
        };
        th.append(remove);
        names.append(th);
      });
      head.append(names);
      table.append(head);
      var body = el("tbody");
      function row(title, renderCell) {
        var tr = el("tr"),
          th = el("th", title);
        th.scope = "row";
        tr.append(th);
        columns.forEach((c) => {
          var td = el("td");
          renderCell(td, c, c.profile || {});
          tr.append(td);
        });
        body.append(tr);
      }
      function records(td, items) {
        if (!items.length) {
          td.append(el("span", "연결 미수록"));
          return;
        }
        items.forEach((r) => td.append(recordButton(r)));
      }
      row("주 분류 / 보조 분류", (td, c, p) =>
        td.append(
          el(
            "span",
            (p.classification || "미확인") +
              (p.secondary_classifications?.length
                ? " / " + p.secondary_classifications.join(", ")
                : ""),
          ),
        ),
      );
      row("자료 확보 등급", (td, c, p) =>
        td.append(
          el(
            "span",
            p.material_grade
              ? p.material_grade + " · 자료 확보 수준"
              : "미확인",
          ),
        ),
      );
      row("공급망 구분과 판단 근거", (td, c, p) =>
        td.append(
          el(
            "span",
            (p.supply_chain_class || "미확인") +
              " · " +
              (p.supply_chain_basis || "판단 근거 미수록"),
          ),
        ),
      );
      row("소재 국가", (td, c, p) =>
        td.append(el("span", p.country || "미확인")),
      );
      row("사업·법인 구분", (td, c, p) => {
        if (!p.units?.length) {
          td.append(el("span", "별도 사업·법인 단위 미수록"));
          return;
        }
        var ul = el("ul");
        p.units.forEach((u) =>
          ul.append(
            el(
              "li",
              u.name +
                " · " +
                (u.legal_name || "법인명 미확인") +
                " (" +
                (u.legal_verified ? "기존 법인명 확인" : "법인명 미확인") +
                ")",
            ),
          ),
        );
        td.append(ul);
      });
      row("연결 제품", (td, c) => records(td, c.products));
      row("제품에서 이어진 공정", (td, c) => records(td, c.processes));
      row("기존 사실 대조", (td, c) => {
        var f = c.facts,
          total = f.verified + f.partial + f.unverified;
        td.append(
          el(
            "span",
            total
              ? "검증 " +
                  f.verified +
                  " · 부분 " +
                  f.partial +
                  " · 미검증 " +
                  f.unverified
              : "등록된 사실 대조 기록 없음",
          ),
        );
      });
      row("기존 대조 최신 날짜", (td, c) =>
        td.append(
          el("span", c.last_checked_at || "등록된 사실 대조 기록 없음"),
        ),
      );
      row("등록 참고자료", (td, c) =>
        td.append(
          el("span", c.record.source_ids.length + "건 · 이번 원문 재확인 전"),
        ),
      );
      row("정규화 공시·재무", (td) =>
        td.append(el("span", "공시 기반 정규화 데이터 미수록")),
      );
      row("기존 상세 페이지", (td, c) => {
        var a = el("a", "회사 책 열기");
        a.href = c.record.route;
        td.append(a);
      });
      table.append(body);
      scroll.append(table);
      comparisonPanel.append(scroll);
    }
    function drawDetails(focus) {
      detail.replaceChildren();
      var record = index.records.find(function (r) {
        return r.key === state.item;
      });
      if (!record) {
        detail.append(
          el(
            "p",
            state.item
              ? "공유된 항목을 찾지 못했습니다. 검색 결과에서 다시 선택해 주세요."
              : "검색 결과를 선택하면 관련 기업·제품·공정과 출처가 표시됩니다.",
            "empty",
          ),
        );
        return;
      }
      var heading = el("h2", record.title);
      heading.tabIndex = -1;
      detail.append(
        el("small", LABEL[record.type]),
        heading,
        el("p", record.summary),
      );
      var actions = el("div", undefined, "explorer-actions"),
        full = el("a", "기존 상세 페이지 열기");
      full.href = record.route;
      full.className = "kchip";
      actions.append(full);
      var bookmark = el("button"),
        bookmarked = saved("bookmarks").includes(record.key);
      bookmark.type = "button";
      bookmark.id = "explorer-bookmark";
      bookmark.textContent = bookmarked
        ? "탐색 책갈피 해제"
        : "탐색 책갈피 저장";
      bookmark.setAttribute("aria-pressed", String(bookmarked));
      bookmark.onclick = function () {
        var keys = saved("bookmarks");
        if (keys.includes(record.key))
          keys = keys.filter(function (k) {
            return k !== record.key;
          });
        else keys.unshift(record.key);
        if (!save("bookmarks", keys.slice(0, 100))) return;
        drawDetails(false);
        drawSaved();
        detail.querySelector("#explorer-bookmark").focus();
      };
      actions.append(bookmark);
      if (record.type === "company") {
        var compare = el(
          "button",
          state.compare.includes(record.key)
            ? "기업 비교에서 제외"
            : "기업 비교에 추가",
        );
        compare.type = "button";
        compare.id = "explorer-compare";
        compare.setAttribute(
          "aria-pressed",
          String(state.compare.includes(record.key)),
        );
        compare.onclick = function () {
          changeComparison(record.key);
          detail.querySelector("#explorer-compare").focus();
        };
        actions.append(compare);
      }
      var share = el("button", "공유 주소 복사");
      share.type = "button";
      share.onclick = async function () {
        try {
          await navigator.clipboard.writeText(location.href);
          status.textContent =
            "현재 검색과 선택 항목의 공유 주소를 복사했습니다.";
        } catch (e) {
          status.textContent =
            "주소창의 URL을 복사하면 현재 검색과 선택 항목을 공유할 수 있습니다.";
        }
      };
      actions.append(share);
      var print = el("button", "선택 항목 인쇄");
      print.type = "button";
      print.onclick = function () {
        window.print();
      };
      actions.append(print);
      detail.append(actions);
      detail.append(el("h3", "연결된 항목"));
      var neighbors = core.related(index, record.key),
        groups = el("div", undefined, "explorer-relations");
      Object.keys(LABEL).forEach(function (kind) {
        var rows = neighbors.filter(function (r) {
          return r.type === kind;
        });
        if (!rows.length) return;
        var group = el("section");
        group.append(el("h4", LABEL[kind] + " " + rows.length + "건"));
        var list = el("ul");
        rows.forEach(function (r) {
          var li = el("li");
          li.append(recordButton(r));
          list.append(li);
        });
        group.append(list);
        groups.append(group);
      });
      if (!neighbors.length)
        groups.append(
          el(
            "p",
            "아직 연결된 항목이 없습니다. 확인된 근거를 확보한 뒤 연결합니다.",
            "empty",
          ),
        );
      detail.append(groups);
      detail.append(el("h3", "기존 사실 대조 기록"));
      var claims = index.claims.filter(function (c) {
        return record.claim_ids.includes(c.claim_id);
      });
      if (!claims.length)
        detail.append(
          el(
            "p",
            "이 항목에 직접 연결된 사실 대조 기록은 없습니다. 기업 자료 확보 등급은 개별 주장의 검증 상태와 다릅니다.",
            "empty",
          ),
        );
      claims.forEach(function (c) {
        var box = el("div", undefined, "explorer-claim");
        var labels = {
          verified: "검증",
          partial: "부분 검증",
          unverified: "미검증",
        };
        box.append(
          el(
            "strong",
            "기존 기록: " +
              labels[c.verification_status] +
              " · " +
              c.scope +
              " · " +
              (c.checked_at || "확인일 미기재"),
          ),
          el("p", c.statement),
        );
        c.source_ids.forEach(function (id) {
          var s = sources.get(id);
          if (s) box.append(sourceLink(s));
        });
        detail.append(box);
      });
      detail.append(el("h3", "참고자료"));
      detail.append(
        el(
          "p",
          "참고자료 등록은 이 항목의 모든 문장을 검증했다는 뜻이 아닙니다. 심화 해설은 기존 상세 페이지에서 문장별 근거와 열람 상태를 확인하세요.",
          "cap",
        ),
      );
      if (!record.source_ids.length)
        detail.append(
          el(
            "p",
            "직접 연결된 참고자료가 없습니다. 연결된 심화 해설이나 기업 항목에서 자료 범위를 확인하세요.",
            "empty",
          ),
        );
      var sourceList = el("ul", undefined, "explorer-sources");
      record.source_ids.forEach(function (id) {
        var s = sources.get(id);
        if (!s) return;
        var li = el("li");
        li.append(
          sourceLink(s),
          el(
            "small",
            "이번 원문 재확인 전" +
              (s.legacy_read_status ? " · 기존 " + s.legacy_read_status : ""),
          ),
        );
        sourceList.append(li);
      });
      detail.append(sourceList);
      if (focus) heading.focus({ preventScroll: true });
    }
    function sourceLink(s) {
      var a = el("a", s.title + " (새 탭)");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      return a;
    }
    query.oninput = function () {
      state.query = query.value;
      updateURL(false);
      drawResults();
    };
    type.onchange = function () {
      state.type = type.value;
      updateURL(false);
      drawResults();
    };
    form.onsubmit = function (e) {
      e.preventDefault();
      var first = results.querySelector("button");
      if (first) first.focus();
    };
    drawResults();
    drawDetails(false);
    drawSaved();
    drawComparison();
  }
  window.SiliconExplorer = { mount: mount };
  var root = document.getElementById("explorer-root");
  if (root) mount(root);
})();
