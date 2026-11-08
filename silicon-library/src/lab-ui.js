(function () {
  "use strict";
  var core = window.SiliconLabCore,
    study = window.SiliconStudyCore,
    NS = "http://www.w3.org/2000/svg",
    studyKey = "siliconLibrary:study:v1",
    focusOnMount = false;
  function readStudy() {
    try {
      return study.parse(localStorage.getItem(studyKey));
    } catch (_) {
      return study.empty();
    }
  }
  function saveStudy(state, status) {
    try {
      localStorage.getItem(studyKey);
      localStorage.setItem(studyKey, JSON.stringify(state));
      status.textContent = "이 브라우저에 학습 기록을 저장했습니다.";
      return true;
    } catch (_) {
      status.textContent =
        "학습 기록을 저장하지 못했습니다. 브라우저 저장 공간과 설정을 확인하세요. 현재 실습은 계속할 수 있습니다.";
      return false;
    }
  }
  function el(tag, text, cls) {
    var n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach((k) => n.setAttribute(k, String(attrs[k])));
    return n;
  }
  function link(text, href) {
    var n = el("a", text);
    n.href = href;
    return n;
  }
  function mount(root) {
    if (root.dataset.view === "learn") {
      learning(root);
      return;
    }
    var params = new URLSearchParams(location.hash.split("?")[1] || ""),
      key = params.get("lab") || "lithography";
    if (!Object.prototype.hasOwnProperty.call(core.models, key))
      key = "lithography";
    var model = core.models[key];
    root.replaceChildren();
    var nav = el("nav", undefined, "lab-tabs");
    nav.setAttribute("aria-label", "학습 랩 선택");
    Object.keys(core.models).forEach((k) => {
      var a = link(core.models[k].title.split(" · ")[0], "#labs?lab=" + k);
      if (k === key) a.setAttribute("aria-current", "page");
      a.onclick = function (event) {
        if (
          event.button ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        if (a.hash === location.hash) heading.focus();
        else focusOnMount = true;
      };
      nav.append(a);
    });
    root.append(nav);
    var heading = el("h3", model.title);
    heading.tabIndex = -1;
    root.append(
      heading,
      el(
        "p",
        "교육용 모델 · 실제 공정 처방이나 장비 성능 예측이 아닙니다.",
        "note",
      ),
    );
    var layout = el("div", undefined, "lab-layout"),
      controls = el("div", undefined, "lab-controls"),
      figure = el("figure", undefined, "lab-figure");
    layout.append(controls, figure);
    root.append(layout);
    var result = el("output");
    result.id = "lab-result";
    result.setAttribute("aria-live", "polite");
    figure.append(result);
    var drawing = svg("svg", {
      viewBox: "0 0 440 440",
      role: "img",
      "aria-label": model.title + " 개념도",
    });
    figure.append(
      drawing,
      el(
        "figcaption",
        "축척 없는 개념도입니다. 모양과 실제 제조 치수는 대응하지 않습니다.",
      ),
    );
    var message = el("p", undefined, "lab-message");
    message.setAttribute("role", "status");
    controls.append(message);
    var saveStatus = el("p", undefined, "study-status");
    saveStatus.id = "study-save-status";
    saveStatus.setAttribute("role", "status");
    controls.append(saveStatus);
    var values = {},
      inputs = {};
    function share() {
      var p = new URLSearchParams();
      p.set("lab", key);
      Object.keys(values).forEach((k) => p.set(k, String(values[k])));
      var hash = "#labs?" + p.toString();
      history.replaceState(null, "", hash);
      saveStudy(study.resume(readStudy(), key, hash), saveStatus);
    }
    function range(id, label, min, max, step, initial, unit) {
      var wrap = el("label", undefined, "lab-control"),
        title = el("span", label),
        input = el("input"),
        out = el("output");
      input.type = "range";
      input.id = "lab-" + id;
      input.min = min;
      input.max = max;
      input.step = step;
      var v = params.has(id) ? Number(params.get(id)) : initial;
      try {
        core.bounded(v, min, max, id);
      } catch (e) {
        v = initial;
      }
      input.value = v;
      values[id] = Number(input.value);
      inputs[id] = input;
      out.setAttribute("for", input.id);
      function show() {
        out.textContent = input.value + (unit ? " " + unit : "");
      }
      show();
      input.oninput = function () {
        values[id] = Number(input.value);
        show();
        share();
        draw();
      };
      wrap.append(title, out, input);
      controls.append(wrap);
      return input;
    }
    function toggle(id, label, initial) {
      var wrap = el("label", undefined, "lab-toggle"),
        input = el("input");
      input.type = "checkbox";
      input.id = "lab-" + id;
      input.checked = params.has(id) ? params.get(id) === "true" : initial;
      values[id] = input.checked;
      input.onchange = function () {
        values[id] = input.checked;
        share();
        draw();
      };
      wrap.append(input, document.createTextNode(" " + label));
      controls.append(wrap);
    }
    function rect(x, y, w, h, color) {
      drawing.append(
        svg("rect", { x: x, y: y, width: w, height: h, fill: color, rx: 2 }),
      );
    }
    function label(text, x, y) {
      var t = svg("text", {
        x: x,
        y: y,
        fill: "currentColor",
        "font-size": 14,
      });
      t.textContent = text;
      drawing.append(t);
    }
    if (key === "lithography") {
      var waveLabel = el("label", "파장 예시 λ (nm)"),
        wave = el("select");
      wave.id = "lab-wavelength";
      [365, 248, 193, 13.5].forEach((v) => {
        var o = el("option", String(v));
        o.value = v;
        wave.append(o);
      });
      wave.value = ["365", "248", "193", "13.5"].includes(
        params.get("wavelength"),
      )
        ? params.get("wavelength")
        : "193";
      values.wavelength = Number(wave.value);
      waveLabel.append(wave);
      controls.append(waveLabel);
      range(
        "na",
        "개구수 NA",
        0.1,
        values.wavelength === 13.5 ? 0.55 : 1.35,
        0.05,
        0.95,
        "",
      );
      range("k1", "교육용 k1 가정", 0.25, 0.8, 0.01, 0.5, "");
      wave.onchange = function () {
        values.wavelength = Number(wave.value);
        inputs.na.max = values.wavelength === 13.5 ? 0.55 : 1.35;
        if (Number(inputs.na.value) > Number(inputs.na.max))
          inputs.na.value = inputs.na.max;
        inputs.na.dispatchEvent(new Event("input"));
      };
    } else if (key === "ald") {
      range("cycles", "사이클 수", 0, 300, 1, 50, "cycle");
      range("gpc", "가정한 성장량 GPC", 0.02, 0.2, 0.01, 0.1, "nm/cycle");
      values.phase = Number(params.get("phase")) || 0;
      if (
        values.phase < 0 ||
        values.phase > 3 ||
        !Number.isInteger(values.phase)
      )
        values.phase = 0;
      var next = el("button", "다음 반응 단계");
      next.type = "button";
      next.id = "lab-next-phase";
      next.onclick = function () {
        values.phase = (values.phase + 1) % 4;
        share();
        draw();
      };
      controls.append(next);
    } else if (key === "cmp") {
      range("pressure", "압력 P/P₀", 0, 3, 0.1, 1, "배");
      range("speed", "상대속도 V/V₀", 0, 3, 0.1, 1, "배");
      range("time", "시간 t/t₀", 0, 3, 0.1, 1, "배");
      range("coefficient", "가정한 계수 K/K₀", 0.1, 2, 0.1, 1, "배");
    } else if (key === "sequence") {
      var steps = (params.get("steps") || "wafer").split(",");
      try {
        core.sequence(steps);
      } catch (e) {
        steps = ["wafer"];
      }
      values.steps = steps.join(",");
      Object.keys(core.steps)
        .filter((k) => k !== "wafer")
        .forEach((k) => {
          var b = el("button", core.steps[k] + " 추가");
          b.type = "button";
          b.dataset.step = k;
          b.onclick = function () {
            try {
              var s = values.steps.split(",");
              s.push(k);
              core.sequence(s);
              values.steps = s.join(",");
              share();
              message.textContent = "단계가 추가됐습니다.";
              draw();
            } catch (e) {
              message.textContent = e.message;
            }
          };
          controls.append(b);
        });
      var undo = el("button", "마지막 단계 취소");
      undo.type = "button";
      undo.onclick = function () {
        var s = values.steps.split(",");
        if (s.length > 1) s.pop();
        values.steps = s.join(",");
        share();
        message.textContent = "현재 단계: " + core.steps[s[s.length - 1]] + ".";
        draw();
      };
      controls.append(undo);
    } else {
      range("dies", "개념 모델 다이 수", 4, 12, 1, 8, "개");
      range("gap", "층 분리 정도", 0, 20, 1, 10, "");
      range("rotation", "도식 회전", -20, 20, 1, 0, "°");
      [
        ["die", "DRAM 다이"],
        ["tsv", "TSV"],
        ["bump", "연결부(범프 예시)"],
        ["underfill", "언더필 개념 영역"],
        ["substrate", "기판"],
        ["heat", "열 흐름(개념)"],
      ].forEach((pair) => toggle(pair[0], pair[1], true));
    }
    function draw() {
      drawing.replaceChildren();
      try {
        if (key === "lithography") {
          var m = core.lithography(values.wavelength, values.na, values.k1),
            width = Math.max(8, Math.min(62, m.cd_nm / 3));
          result.textContent = "교육용 CD: " + m.cd_nm.toFixed(2) + " nm";
          rect(35, 240, 370, 70, "#315f86");
          for (var i = 0; i < 4; i++)
            rect(55 + i * 88, 150, width, 90, "#db9b50");
          label("패턴 폭 변화 · 축척 없음", 35, 120);
          label("웨이퍼", 45, 285);
          message.textContent = m.immersion_assumption
            ? "NA > 1: 액침 조건을 가정한 수학적 예시입니다."
            : "";
        } else if (key === "ald") {
          var a = core.ald(values.cycles, values.gpc),
            height = Math.min(125, a.thickness_nm * 3);
          result.textContent =
            "가정한 막 두께: " + a.thickness_nm.toFixed(2) + " nm";
          rect(40, 260, 360, 65, "#315f86");
          rect(40, 260 - height, 360, height, "#d4964b");
          var phases = [
            "전구체 흡착 · 표면 반응",
            "퍼지 · 잔류 기체 제거",
            "반응가스 공급 · 표면 반응",
            "퍼지 · 다음 사이클 준비",
          ];
          label(phases[values.phase], 25, 95);
          label("막 두께 = 사이클 × GPC", 35, 355);
          for (var j = 0; j < 8; j++)
            drawing.append(
              svg("circle", {
                cx: 60 + j * 44,
                cy: 115 + (j % 2) * 20,
                r: 6,
                fill: values.phase % 2 === 0 ? "#bd4a53" : "#6a8d9b",
              }),
            );
        } else if (key === "cmp") {
          var c = core.cmp(
            values.pressure,
            values.speed,
            values.time,
            values.coefficient,
          );
          result.textContent =
            "기준 대비 제거량: " + c.relative_removal.toFixed(2) + " 배";
          var remaining = Math.max(15, 110 - c.relative_removal * 12);
          rect(45, 280, 350, 50, "#315f86");
          rect(45, 280 - remaining, 350, remaining, "#d4964b");
          rect(25, 125, 390, 28, "#7b8890");
          label("패드의 상대 운동 →", 50, 110);
          label("남은 막 두께 도식 · 축척 없음", 35, 370);
        } else if (key === "sequence") {
          var seq = core.sequence(values.steps.split(","));
          result.textContent = seq.steps.map((k) => core.steps[k]).join(" → ");
          rect(35, 255, 370, 65, "#315f86");
          if (seq.has_film) {
            if (seq.patterned) {
              for (var k = 0; k < 4; k++)
                rect(45 + k * 88, 185, 50, 70, "#d4964b");
            } else rect(35, 185, 370, 70, "#d4964b");
          }
          if (seq.last === "photo")
            for (var p = 0; p < 4; p++)
              rect(45 + p * 88, 150, 50, 35, "#b85c87");
          label("현재 단계: " + core.steps[seq.last], 35, 100);
          label(
            "가능한 다음 단계: " +
              seq.next.map((k) => core.steps[k]).join(" · "),
            20,
            365,
          );
        } else {
          result.textContent =
            "개념적 적층: " + values.dies + "개 다이 · 실제 제품 사양 아님";
          var group = svg("g", {
            transform: "rotate(" + values.rotation + " 220 220)",
          });
          drawing.append(group);
          if (values.substrate)
            group.append(
              svg("polygon", {
                points: "55,350 330,350 390,380 115,380",
                fill: "#437361",
              }),
            );
          var spacing = 10 + values.gap / 2;
          for (var d = 0; d < values.dies; d++) {
            var y = 326 - d * spacing,
              offset = d * 2;
            if (values.underfill)
              group.append(
                svg("polygon", {
                  points:
                    70 +
                    offset +
                    "," +
                    (y + 6) +
                    " " +
                    (320 + offset) +
                    "," +
                    (y + 6) +
                    " " +
                    (360 + offset) +
                    "," +
                    (y + 26) +
                    " " +
                    (110 + offset) +
                    "," +
                    (y + 26),
                  fill: "#d8a764",
                  opacity: 0.65,
                }),
              );
            if (values.die)
              group.append(
                svg("polygon", {
                  points:
                    70 +
                    offset +
                    "," +
                    y +
                    " " +
                    (320 + offset) +
                    "," +
                    y +
                    " " +
                    (360 + offset) +
                    "," +
                    (y + 20) +
                    " " +
                    (110 + offset) +
                    "," +
                    (y + 20),
                  fill: d % 2 ? "#40739b" : "#5489af",
                  stroke: "#b8d5e2",
                }),
              );
            if (values.bump)
              for (var b = 0; b < 6; b++)
                group.append(
                  svg("circle", {
                    cx: 120 + b * 32 + offset,
                    cy: y + 22,
                    r: 2.5,
                    fill: "#edc360",
                  }),
                );
          }
          if (values.tsv)
            for (var t = 0; t < 5; t++)
              group.append(
                svg("line", {
                  x1: 135 + t * 32,
                  y1: 326 - (values.dies - 1) * spacing,
                  x2: 135 + t * 32,
                  y2: 345,
                  stroke: "#ffcc66",
                  "stroke-width": 3,
                  "stroke-dasharray": "4 3",
                }),
              );
          if (values.heat) {
            group.append(
              svg("path", {
                d: "M 40 260 L 40 105 L 33 118 M 40 105 L 47 118 M 395 160 L 395 335 L 388 322 M 395 335 L 402 322",
                fill: "none",
                stroke: "#c96563",
                "stroke-width": 3,
              }),
            );
          }
          label("다이 · TSV · 연결부 · 언더필 · 기판", 35, 55);
          if (values.heat) label("열은 여러 경로로 전달됩니다", 55, 415);
        }
      } catch (e) {
        message.textContent = e.message;
      }
    }
    var reset = el("button", "초기값으로 재설정");
    reset.type = "button";
    reset.id = "lab-reset";
    reset.onclick = function () {
      var hash = "#labs?lab=" + key;
      history.replaceState(null, "", hash);
      mount(root);
      saveStudy(
        study.resume(readStudy(), key, hash),
        root.querySelector("#study-save-status"),
      );
      root.querySelector("h3").focus();
    };
    controls.append(reset);
    root.append(
      el("p", model.formula, "lab-formula"),
      el("p", model.unit, "cap"),
    );
    var details = el("details", undefined, "lab-assumptions");
    details.open = true;
    details.append(
      el("summary", "가정과 적용 한계"),
      el("p", model.assumptions),
      el("p", model.limits),
    );
    details.append(link("연결된 상세 해설", model.route));
    var ref = link("참고 원문 (새 탭 · 이번 재열람 전)", model.reference);
    ref.target = "_blank";
    ref.rel = "noopener noreferrer";
    details.append(document.createTextNode(" · "), ref);
    root.append(details);
    var quiz = el("fieldset", undefined, "lab-quiz");
    quiz.append(el("legend", model.quiz.question));
    var feedback = el("p");
    feedback.setAttribute("role", "status");
    var savedChoice = readStudy().answers[key];
    function explain(choice, saved) {
      feedback.textContent =
        (choice === model.quiz.answer
          ? "정답입니다. "
          : "다시 생각해 보세요. ") +
        model.quiz.explanation +
        (saved
          ? " 선택한 답안을 이 브라우저에 저장했습니다."
          : " 이번 방문에서 선택한 답안입니다. 저장되지 않았습니다.");
    }
    model.quiz.options.forEach((o, i) => {
      var l = el("label"),
        r = el("input");
      r.type = "radio";
      r.name = "lab-quiz";
      r.value = i;
      r.checked = savedChoice === i;
      r.onchange = function () {
        var p = new URLSearchParams();
        p.set("lab", key);
        Object.keys(values).forEach((k) => p.set(k, String(values[k])));
        var state = study.resume(
          study.answer(readStudy(), key, i),
          key,
          "#labs?" + p.toString(),
        );
        explain(i, saveStudy(state, saveStatus));
      };
      l.append(r, document.createTextNode(" " + o));
      quiz.append(l);
    });
    quiz.append(feedback);
    if (
      Number.isInteger(savedChoice) &&
      savedChoice < model.quiz.options.length
    )
      explain(savedChoice, true);
    root.append(quiz);
    draw();
    if (focusOnMount) {
      focusOnMount = false;
      heading.focus();
    }
  }
  function learning(root) {
    root.replaceChildren(
      el(
        "p",
        "입문부터 산업 탐색까지, 개념을 읽고 실험하고 근거를 확인하는 순서로 이어집니다.",
        "lede",
      ),
    );
    var state = readStudy(),
      summary = el("div", undefined, "study-summary"),
      total = el("p"),
      progress = el("progress"),
      status = el("p", undefined, "study-status"),
      counters = [];
    total.id = "study-total";
    progress.id = "study-progress";
    progress.max = 16;
    progress.setAttribute("aria-label", "학습 경로 완료 진행률");
    status.id = "study-status";
    status.setAttribute("role", "status");
    summary.append(
      el("h3", "나의 학습 기록"),
      total,
      progress,
      el(
        "p",
        "다 읽거나 실습을 마친 단계의 완료 칸을 직접 표시하세요. 기록은 이 브라우저에 저장됩니다. 방문이나 퀴즈 풀이만으로 완료 처리하지 않습니다.",
        "cap",
      ),
    );
    if (state.lastLab) {
      var resume = link(
        "마지막 실습 이어가기 · " +
          core.models[state.lastLab.id].title.split(" · ")[0],
        state.lastLab.hash,
      );
      resume.id = "study-resume";
      summary.append(resume);
    } else
      summary.append(
        el(
          "p",
          "실습을 조작하면 마지막 설정을 여기서 이어갈 수 있습니다.",
          "cap",
        ),
      );
    summary.append(status);
    root.append(summary);
    function refreshProgress() {
      var correct = Object.keys(core.models).filter(
        (id) => state.answers[id] === core.models[id].quiz.answer,
      ).length;
      total.textContent =
        "완료 " +
        state.completed.length +
        " / 16 · 퀴즈 정답 " +
        correct +
        " / 5";
      progress.value = state.completed.length;
      root.querySelectorAll("[data-study-step]").forEach((checkbox) => {
        checkbox.checked = state.completed.includes(checkbox.dataset.studyStep);
      });
      counters.forEach((entry) => {
        entry.node.textContent =
          "완료 " +
          entry.path.steps.filter((step) => state.completed.includes(step.id))
            .length +
          " / " +
          entry.path.steps.length;
      });
    }
    var cards = el("div", undefined, "learning-paths");
    study.paths.forEach((p, i) => {
      var s = el("section"),
        count = el("p", undefined, "cap");
      count.dataset.studyPath = p.id;
      counters.push({ node: count, path: p });
      s.append(el("h3", i + 1 + ". " + p.title), count);
      var ol = el("ol");
      p.steps.forEach((step) => {
        var li = el("li"),
          checkbox = el("input"),
          label = el("label", undefined, "study-check");
        checkbox.type = "checkbox";
        checkbox.dataset.studyStep = step.id;
        checkbox.checked = state.completed.includes(step.id);
        checkbox.setAttribute("aria-label", step.title + " 학습 완료");
        checkbox.onchange = function () {
          var next = study.toggle(readStudy(), step.id, checkbox.checked);
          if (saveStudy(next, status)) {
            state = next;
            refreshProgress();
          } else checkbox.checked = state.completed.includes(step.id);
        };
        label.append(checkbox, document.createTextNode(" 완료"));
        li.append(link(step.title, step.href), label);
        ol.append(li);
      });
      s.append(ol);
      cards.append(s);
    });
    refreshProgress();
    root.append(
      cards,
      el("h3", "용어집"),
      el(
        "p",
        "편집 용어 정리입니다. 상세 해설에서 범위와 출처를 함께 확인하세요.",
        "cap",
      ),
    );
    var label = el("label", "용어 찾기 · 한글 / 영문 / 약어"),
      input = el("input");
    input.type = "search";
    input.maxLength = 200;
    input.id = "glossary-query";
    label.append(input);
    root.append(label);
    var list = el("dl", undefined, "glossary-list"),
      glossaryStatus = el("p");
    glossaryStatus.setAttribute("role", "status");
    root.append(glossaryStatus, list);
    input.value = (
      new URLSearchParams(location.hash.split("?")[1] || "").get("q") || ""
    ).slice(0, 200);
    function draw() {
      list.replaceChildren();
      var q = input.value.normalize("NFKC").toLowerCase().replace(/\s/g, "");
      var rows = core.glossary.filter((r) =>
        r.join(" ").toLowerCase().replace(/\s/g, "").includes(q),
      );
      glossaryStatus.textContent = rows.length + "개 용어";
      rows.forEach((r) => {
        var dt = el("dt");
        dt.append(link(r[0] + " · " + r[1], r[3]));
        list.append(dt, el("dd", r[2]));
      });
      if (!rows.length)
        list.append(
          el("dd", "검색 결과가 없습니다. 다른 약어나 정의로 찾아보세요."),
        );
    }
    input.oninput = function () {
      history.replaceState(
        null,
        "",
        "#learn" + (input.value ? "?q=" + encodeURIComponent(input.value) : ""),
      );
      draw();
    };
    draw();
  }
  window.SiliconLabs = { mount: mount };
  var root = document.getElementById("lab-root");
  if (root) mount(root);
})();
