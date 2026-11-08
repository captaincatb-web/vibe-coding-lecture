(function () {
  "use strict";
  var core = window.SiliconWeeklyCore;
  function el(tag, text, cls) {
    var node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  function entryRow(entry, showTopics) {
    var item = el("li"),
      anchor = el("a", entry.title, "weekly-source-link");
    anchor.href = entry.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.append(el("span", " (새 탭)", "visually-hidden"));
    var meta = el(
      "p",
      entry.source_name +
        " · " +
        (entry.date_kind === "updated" ? "수정 " : "게시 "),
    );
    var time = el("time", core.dateText(entry.published_at));
    time.dateTime = entry.published_at;
    meta.append(time, document.createTextNode(" · 원문 대조 전"));
    item.append(anchor, meta);
    if (showTopics) {
      var links = el("div", undefined, "weekly-topics");
      core.topics
        .filter(function (topic) {
          return entry.topics.includes(topic[0]);
        })
        .forEach(function (topic) {
          var link = el("a", topic[1] + " 교과서");
          link.href = "#textbook?book=" + topic[0];
          links.append(link);
        });
      item.append(links);
    }
    return item;
  }
  function introduction(section) {
    section.append(
      el(
        "p",
        core.data.schedule +
          " · 최근 자료 확인: " +
          core.dateText(core.data.last_success_at),
      ),
    );
    section.append(
      el(
        "p",
        "출처가 발행한 자료의 제목·날짜·원문 링크를 자동 수집했습니다. 원문 대조 전이며, 주제 연결이 개별 기업의 제품·고객 채택이나 납품 근거를 뜻하지 않습니다.",
      ),
    );
    if (core.freshness())
      section.append(
        el(
          "p",
          "최근 자료 확인 기록이 8일 이상 지났습니다. 아래 날짜와 출처별 확인 상태를 함께 살펴보세요.",
          "weekly-stale",
        ),
      );
  }
  function sourceDetails() {
    var details = el("details"),
      statuses = el("ul");
    details.append(el("summary", "자료 수집 상태와 확인 범위"));
    core.data.sources.forEach(function (source) {
      statuses.append(
        el(
          "li",
          source.name +
            " · " +
            (source.status === "ok"
              ? "피드 확인"
              : "최근 수집 실패 · 이전 자료 보존") +
            " · 확인 시도 " +
            core.dateText(source.checked_at) +
            " · 최근 성공 " +
            core.dateText(source.last_success_at),
        ),
      );
    });
    details.append(statuses);
    return details;
  }
  function mount(root) {
    root.querySelectorAll(".weekly-slot").forEach(function (slot) {
      slot.replaceChildren();
      var mode = slot.dataset.weeklyMode || "products",
        topics = (slot.dataset.weeklyTopics || "").split(",").filter(Boolean),
        products = (slot.dataset.weeklyProducts || "")
          .split(",")
          .filter(Boolean);
      var items =
        mode === "all"
          ? core.entries([], 6)
          : mode === "topics"
            ? core.entries(topics, 5)
            : core.forProducts(products, 5);
      slot.hidden = mode !== "all" && !items.length;
      if (slot.hidden) return;
      var section = el("section", undefined, "weekly-materials");
      section.append(
        el(
          mode === "all" ? "h2" : "h3",
          mode === "all"
            ? "주간 새 자료"
            : mode === "topics"
              ? "교과서 주제로 함께 볼 새 자료"
              : "품목 주제로 함께 볼 새 자료",
        ),
      );
      introduction(section);
      var list = el("ol");
      items.forEach(function (entry) {
        list.append(entryRow(entry));
      });
      section.append(list);
      if (!items.length)
        section.append(
          el(
            "p",
            "아직 수집된 자료가 없습니다. 수집 실패 시 이전 정상 자료를 보존합니다.",
          ),
        );
      var more = el(
        "a",
        mode === "topics" && topics.length === 1
          ? "이 주제의 주간 자료 더 보기 →"
          : "주간 자료 전체 보기 · " + core.data.entries.length + "건 →",
        "weekly-more",
      );
      more.href = core.route(
        mode === "topics" && topics.length === 1 ? { topic: topics[0] } : {},
      );
      section.append(more);
      if (mode === "all") section.append(sourceDetails());
      slot.append(section);
    });
  }
  function mountArchive(root) {
    root.replaceChildren();
    root.className = "weekly-materials weekly-archive";
    var heading = el("h2", "주간 자료"),
      form = el("form", undefined, "weekly-filters");
    heading.tabIndex = -1;
    root.append(heading);
    introduction(root);
    root.append(
      el(
        "p",
        "내용 변경: " +
          core.dateText(core.data.last_content_change_at) +
          " · 저장된 자료 " +
          core.data.entries.length +
          "건",
      ),
    );
    form.setAttribute("role", "search");
    form.setAttribute("aria-label", "주간 자료 검색");
    var fieldCount = 0;
    function control(labelText, control) {
      var field = el("div", undefined, "weekly-field"),
        label = el("label", labelText);
      control.id = "weekly-filter-" + fieldCount++;
      label.htmlFor = control.id;
      field.append(label, control);
      form.append(field);
      return control;
    }
    var query = el("input");
    query.type = "search";
    query.maxLength = 160;
    query.placeholder = "제목·출처·주제 검색 (예: HBM, 메모리)";
    control("자료 찾기", query);
    var source = control("출처", el("select")),
      topic = control("주제", el("select"));
    function option(select, value, label) {
      var node = el("option", label);
      node.value = value;
      select.append(node);
    }
    option(source, "", "모든 출처");
    core.data.sources.forEach(function (item) {
      option(source, item.id, item.name);
    });
    option(topic, "", "모든 주제");
    core.topics.forEach(function (item) {
      option(topic, item[0], item[1]);
    });
    var reset = el("button", "검색 초기화");
    reset.type = "button";
    form.append(reset);
    var status = el("p", undefined, "weekly-result-count");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    var results = el("ol"),
      empty = el(
        "p",
        "조건에 맞는 자료가 없습니다. 검색어나 출처·주제를 바꾸거나 검색을 초기화하세요.",
        "weekly-empty",
      );
    var state = core.resolve(location.hash);
    query.value = state.q;
    source.value = state.source;
    topic.value = state.topic;
    function render(updateUrl) {
      state = {
        q: query.value.trim().slice(0, 160),
        source: source.value,
        topic: topic.value,
      };
      var items = core.search(state);
      results.replaceChildren();
      items.forEach(function (entry) {
        results.append(entryRow(entry, true));
      });
      status.textContent =
        items.length + "건 / 전체 " + core.data.entries.length + "건";
      empty.hidden = items.length > 0;
      reset.disabled = !state.q && !state.source && !state.topic;
      if (updateUrl) history.replaceState(null, "", core.route(state));
    }
    query.addEventListener("input", function () {
      render(true);
    });
    [source, topic].forEach(function (select) {
      select.addEventListener("change", function () {
        render(true);
      });
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      render(true);
    });
    reset.onclick = function () {
      query.value = "";
      source.value = "";
      topic.value = "";
      render(true);
      query.focus();
    };
    root.append(form, status, results, empty, sourceDetails());
    render(false);
    heading.focus({ preventScroll: true });
  }
  window.SiliconWeeklyUI = { mount: mount, mountArchive: mountArchive };
  mount(document);
  var archiveRoot = document.getElementById("weekly-root");
  if (archiveRoot) mountArchive(archiveRoot);
})();
