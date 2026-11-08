(function () {
  "use strict";
  var core = window.SiliconTextbookCore,
    reading = window.SiliconReadingCore,
    focusOnMount = false;
  function el(tag, text, cls) {
    var node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  function link(text, href, cls) {
    var node = el("a", text, cls);
    node.href = href;
    return node;
  }
  function chapterLink(text, href) {
    var anchor = link(text, href);
    anchor.onclick = function (event) {
      if (
        event.button ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      if (anchor.hash === location.hash)
        document.querySelector(".textbook-focus").focus();
      else focusOnMount = true;
    };
    return anchor;
  }
  function catalog(root, missing) {
    root.append(
      el("h2", "함께 읽는 교과서", "ttl"),
      el(
        "p",
        "서재에서 직접 작성한 11종의 개념 교과서, 33개 장입니다. 원리를 읽고 예시로 생각한 뒤 품목·공정·실습으로 이어 가세요.",
        "lede",
      ),
    );
    if (missing) {
      var status = el(
        "p",
        "요청한 교과서를 찾지 못했습니다. 아래 목록에서 다시 골라 주세요.",
        "note",
      );
      status.setAttribute("role", "status");
      root.append(status);
    }
    var paths = el("nav", undefined, "textbook-starts");
    paths.setAttribute("aria-label", "교과서 시작점");
    [
      ["처음이라면 · 제조 흐름", "PRC"],
      ["소재가 궁금하면 · 박막과 증착", "FIL"],
      ["HBM이 궁금하면 · 패키징", "PKG"],
    ].forEach(function (entry) {
      paths.append(link(entry[0], core.route(entry[1])));
    });
    root.append(paths);
    var searchLabel = el("label", "교과서·본문 찾기", "textbook-search"),
      input = el("input"),
      count = el("p", undefined, "cap");
    input.id = "textbook-search";
    input.type = "search";
    input.maxLength = 200;
    input.placeholder = "예: ALD, 지연시간, 선택비";
    input.value = (
      new URLSearchParams(location.hash.split("?")[1] || "").get("q") || ""
    ).slice(0, 200);
    searchLabel.append(input);
    count.id = "textbook-search-status";
    count.setAttribute("role", "status");
    root.append(searchLabel, count);
    var grid = el("div", undefined, "textbook-grid");
    core.books.forEach(function (book, index) {
      var card = link("", core.route(book.id), "textbook-card");
      card.dataset.book = book.id;
      card.title = book.subtitle;
      card.setAttribute("aria-label", book.title + " 교과서 읽기");
      card.style.setProperty("--textbook-color", book.color);
      card.style.setProperty("--textbook-foil", book.foil);
      var cover = el("div", undefined, "textbook-cover"),
        symbol = el("span", book.symbol, "textbook-symbol");
      symbol.setAttribute("aria-hidden", "true");
      cover.append(
        el(
          "span",
          String(index + 1).padStart(2, "0") + " · 교과서",
          "textbook-edition",
        ),
        el("h3", book.title),
        symbol,
        el("span", "원리 · 예시 · 복습 / 3개 장", "textbook-cover-footer"),
      );
      card.append(cover, el("p", book.subtitle, "textbook-card-caption"));
      grid.append(card);
    });
    function filter() {
      var ids = new Set(
        core.search(input.value).map(function (book) {
          return book.id;
        }),
      );
      grid.querySelectorAll(".textbook-card").forEach(function (card) {
        card.hidden = !ids.has(card.dataset.book);
      });
      count.textContent =
        ids.size +
        "종의 교과서" +
        (ids.size
          ? " · 본문과 핵심 용어도 함께 검색합니다."
          : " · 다른 용어나 약어로 찾아보세요.");
    }
    input.oninput = function () {
      history.replaceState(
        null,
        "",
        "#textbooks" +
          (input.value ? "?q=" + encodeURIComponent(input.value) : ""),
      );
      filter();
    };
    filter();
    root.append(
      grid,
      el(
        "p",
        "교육용 일반 원리를 직접 집필한 자료입니다. 각 장의 예시는 생각을 돕는 상황이며 실제 양산 결과나 회사 제품의 성능 자료가 아닙니다.",
        "cap",
      ),
    );
  }
  function renderChapter(chapter, index) {
    var article = el("article", undefined, "textbook-chapter");
    article.dataset.chapter = chapter.id;
    var title = el(
      "h3",
      String(index + 1).padStart(2, "0") + ". " + chapter.title,
    );
    title.tabIndex = -1;
    title.className = "textbook-focus";
    article.append(title);
    chapter.paragraphs.forEach(function (paragraph) {
      article.append(el("p", paragraph));
    });
    var example = el("div", undefined, "textbook-example");
    example.append(el("h4", "예시로 생각해 보기"), el("p", chapter.example));
    article.append(example);
    var check = el("details", undefined, "textbook-review");
    check.append(
      el("summary", "스스로 답해 보기 · " + chapter.question),
      el("p", chapter.answer),
    );
    article.append(check);
    var related = el("nav", undefined, "textbook-related");
    related.setAttribute("aria-label", chapter.title + " 이어 읽기");
    chapter.links.forEach(function (entry) {
      related.append(link(entry[0] + " →", entry[1]));
    });
    article.append(related);
    return article;
  }
  function reader(root, state) {
    var book = state.book,
      back = link("← 교과서 서가", "#textbooks", "textbook-back");
    root.append(back);
    var banner = el("header", undefined, "textbook-banner"),
      emblem = el("div", book.symbol, "textbook-emblem"),
      intro = el("div");
    emblem.setAttribute("aria-hidden", "true");
    banner.style.setProperty("--textbook-color", book.color);
    banner.style.setProperty("--textbook-foil", book.foil);
    var title = el("h2", book.title);
    if (state.all) {
      title.tabIndex = -1;
      title.className = "textbook-focus";
    }
    intro.append(
      el("p", "SILICON LIBRARY · 직접 작성한 개념 교과서", "textbook-overline"),
      title,
      el("p", book.introduction),
    );
    banner.append(emblem, intro);
    root.append(banner);
    var goals = el("div", undefined, "textbook-goals");
    goals.append(el("h3", "이 책에서 배울 것"));
    var list = el("ul");
    book.goals.forEach(function (goal) {
      list.append(el("li", goal));
    });
    goals.append(list);
    root.append(goals);
    var layout = el("div", undefined, "textbook-layout"),
      toc = el("nav", undefined, "textbook-toc"),
      body = el("div", undefined, "textbook-body");
    toc.setAttribute("aria-label", book.title + " 목차");
    toc.append(el("p", "목차 · 3개 장"));
    book.chapters.forEach(function (chapter, index) {
      var anchor = chapterLink(
        String(index + 1).padStart(2, "0") + " " + chapter.title,
        core.route(book.id, chapter.id),
      );
      if (!state.all && state.chapter.id === chapter.id)
        anchor.setAttribute("aria-current", "page");
      toc.append(anchor);
    });
    var all = chapterLink("전체 본문 읽기", core.route(book.id, "all"));
    if (state.all) all.setAttribute("aria-current", "page");
    toc.append(all);
    var print = el("button", "현재 본문 인쇄");
    print.type = "button";
    print.onclick = function () {
      window.print();
    };
    toc.append(print);
    if (state.all)
      book.chapters.forEach(function (chapter, index) {
        body.append(renderChapter(chapter, index));
      });
    else body.append(renderChapter(state.chapter, state.index));
    if (!state.all) {
      var pagination = el("nav", undefined, "textbook-pagination");
      pagination.setAttribute("aria-label", "교과서 장 이동");
      if (state.index > 0)
        pagination.append(
          chapterLink(
            "← 이전 장",
            core.route(book.id, book.chapters[state.index - 1].id),
          ),
        );
      pagination.append(
        el("span", state.index + 1 + " / " + book.chapters.length + " 장"),
      );
      if (state.index < book.chapters.length - 1)
        pagination.append(
          chapterLink(
            "다음 장 →",
            core.route(book.id, book.chapters[state.index + 1].id),
          ),
        );
      body.append(pagination);
    }
    layout.append(toc, body);
    root.append(layout);
    var terms = el("section", undefined, "textbook-terms"),
      definitions = el("dl");
    terms.append(el("h3", "이 책의 핵심 용어"));
    book.terms.forEach(function (entry) {
      definitions.append(el("dt", entry[0]), el("dd", entry[1]));
    });
    terms.append(definitions);
    root.append(terms);
    var products = el("section", undefined, "textbook-products");
    products.append(el("h3", "품목 해설로 넓혀 읽기"));
    var chips = el("div", undefined, "kchips");
    book.products.forEach(function (id) {
      var topic = reading.get(id),
        anchor = link(
          root.textbookContext.productTitles[id],
          "#x-" + id,
          "textbook-product-link",
        );
      anchor.title = topic.focus;
      chips.append(anchor);
    });
    products.append(chips);
    root.append(products);
    var scope = el("details", undefined, "textbook-scope");
    scope.append(
      el("summary", "집필 범위와 참고자료"),
      el(
        "p",
        "이 교과서는 기존 서재의 공정·품목·심화 해설을 바탕으로 직접 작성한 교육용 설명입니다. 외부 교과서의 본문·그림을 옮긴 자료가 아닙니다. 연결한 기업의 사양·고객 채택이나 실제 양산 성능을 새로 검증했다는 뜻은 아닙니다.",
      ),
    );
    var reference = link(
      "기존 외부 참고 교과서 (새 탭 · 이번 재열람 전)",
      book.reference,
    );
    reference.target = "_blank";
    reference.rel = "noopener noreferrer";
    scope.append(
      reference,
      el(
        "p",
        "편집일: " +
          core.editedAt +
          " · 기존 출처의 열람 상태와 확인일은 해당 심화 해설에서 확인하세요.",
        "cap",
      ),
    );
    root.append(scope);
  }
  function mount(root) {
    root.replaceChildren();
    var state = core.resolve(location.hash);
    if (state) reader(root, state);
    else catalog(root, location.hash.split("?")[0] === "#textbook");
    if (focusOnMount) {
      focusOnMount = false;
      var target = root.querySelector(".textbook-focus");
      if (target) target.focus();
    }
  }
  window.SiliconTextbooks = { mount: mount };
  var root = document.getElementById("textbook-root");
  if (root) mount(root);
})();
