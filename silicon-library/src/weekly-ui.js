(function () {
  "use strict";
  var core = window.SiliconWeeklyCore;
  function el(tag, text, cls) {
    var node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
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
      var section = el("section", undefined, "weekly-materials"),
        level = mode === "all" ? "h2" : "h3";
      section.append(
        el(
          level,
          mode === "all"
            ? "주간 새 자료"
            : mode === "topics"
              ? "교과서 주제로 함께 볼 새 자료"
              : "품목 주제로 함께 볼 새 자료",
        ),
      );
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
      var list = el("ol");
      items.forEach(function (entry) {
        var item = el("li"),
          anchor = el("a", entry.title);
        anchor.href = entry.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        var marker = el("span", " (새 탭)", "visually-hidden");
        anchor.append(marker);
        item.append(
          anchor,
          el(
            "p",
            entry.source_name +
              " · " +
              (entry.date_kind === "updated" ? "수정 " : "게시 ") +
              core.dateText(entry.published_at) +
              " · 원문 대조 전",
          ),
        );
        list.append(item);
      });
      section.append(list);
      if (!items.length)
        section.append(
          el(
            "p",
            "아직 수집된 자료가 없습니다. 수집 실패 시 이전 정상 자료를 보존합니다.",
          ),
        );
      if (mode === "all") {
        var details = el("details");
        details.append(el("summary", "자료 수집 상태와 확인 범위"));
        var statuses = el("ul");
        core.data.sources.forEach(function (source) {
          statuses.append(
            el(
              "li",
              source.name +
                " · " +
                (source.status === "ok"
                  ? "피드 확인"
                  : "현재 접근 실패 · 이전 자료 보존") +
                " · 최근 성공 " +
                core.dateText(source.last_success_at),
            ),
          );
        });
        details.append(statuses);
        section.append(details);
      }
      slot.append(section);
    });
  }
  window.SiliconWeeklyUI = { mount: mount };
  mount(document);
})();
