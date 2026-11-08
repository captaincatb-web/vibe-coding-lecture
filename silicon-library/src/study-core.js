(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SiliconStudyCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var paths = [
    {
      id: "intro",
      title: "입문 · 제조 흐름 잡기",
      steps: [
        { id: "intro-wafer", title: "웨이퍼", href: "#t-wafer" },
        { id: "intro-photo", title: "노광", href: "#t-photo" },
        { id: "intro-dep", title: "박막과 증착", href: "#t-dep" },
        {
          id: "intro-lithography",
          title: "빛과 패턴 실험",
          href: "#labs?lab=lithography",
        },
      ],
    },
    {
      id: "practice",
      title: "실무 · 품목과 공정 잇기",
      steps: [
        { id: "practice-pre", title: "전구체", href: "#x-pre" },
        { id: "practice-etch", title: "식각", href: "#t-etch" },
        { id: "practice-cmp", title: "CMP", href: "#t-cmp" },
        {
          id: "practice-sequence",
          title: "공정 시퀀스 실험",
          href: "#labs?lab=sequence",
        },
      ],
    },
    {
      id: "advanced",
      title: "심화 · 적층과 검사 이해하기",
      steps: [
        { id: "advanced-hbm", title: "HBM 심화", href: "#t-hbm" },
        { id: "advanced-test", title: "테스트", href: "#t-test" },
        {
          id: "advanced-packaging",
          title: "적층 구조 탐색",
          href: "#labs?lab=packaging",
        },
        { id: "advanced-ald", title: "ALD 실험", href: "#labs?lab=ald" },
      ],
    },
    {
      id: "industry",
      title: "산업 · 기업과 근거 따라가기",
      steps: [
        { id: "industry-explore", title: "통합 탐색", href: "#explore" },
        {
          id: "industry-company",
          title: "기업별 자료",
          href: "#explore?type=company",
        },
        {
          id: "industry-product",
          title: "품목별 연결",
          href: "#explore?type=product",
        },
        { id: "industry-map", title: "공정 지도", href: "#map" },
      ],
    },
  ];
  var stepIds = new Set();
  paths.forEach(function (path) {
    path.steps.forEach(function (step) {
      stepIds.add(step.id);
      Object.freeze(step);
    });
    Object.freeze(path.steps);
    Object.freeze(path);
  });
  Object.freeze(paths);
  var labIds = ["lithography", "ald", "cmp", "sequence", "packaging"];

  function empty() {
    return { version: 1, completed: [], answers: {}, lastLab: null };
  }
  function record(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  // Read only stored data properties, never inherited values or accessors.
  function own(value, key) {
    var descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && "value" in descriptor ? descriptor.value : undefined;
  }
  function validLab(id) {
    return typeof id === "string" && labIds.includes(id);
  }
  function validChoice(choice) {
    return Number.isInteger(choice) && choice >= 0 && choice <= 2;
  }
  function validResume(id, hash) {
    if (
      !validLab(id) ||
      typeof hash !== "string" ||
      hash.length > 2000 ||
      !/^#labs(?:\?|$)/.test(hash) ||
      /[\u0000-\u001f\u007f]/.test(hash) ||
      hash.indexOf("#", 1) !== -1
    )
      return false;
    var params = new URLSearchParams(hash.slice(6));
    var ids = params.getAll("lab");
    return ids.length === 0
      ? id === "lithography"
      : ids.length === 1 && ids[0] === id;
  }
  function parse(raw) {
    var state = empty();
    try {
      var value = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!record(value) || own(value, "version") !== 1) return state;
      var completed = own(value, "completed"),
        answers = own(value, "answers"),
        lastLab = own(value, "lastLab");
      if (Array.isArray(completed)) {
        state.completed = Array.from(
          new Set(
            completed.filter(function (id) {
              return typeof id === "string" && stepIds.has(id);
            }),
          ),
        );
      }
      if (record(answers)) {
        labIds.forEach(function (id) {
          var choice = own(answers, id);
          if (validChoice(choice)) state.answers[id] = choice;
        });
      }
      if (record(lastLab)) {
        var id = own(lastLab, "id"),
          hash = own(lastLab, "hash");
        if (validResume(id, hash)) state.lastLab = { id: id, hash: hash };
      }
      return state;
    } catch (_) {
      return empty();
    }
  }
  function toggle(state, stepId, done) {
    if (
      typeof stepId !== "string" ||
      !stepIds.has(stepId) ||
      typeof done !== "boolean"
    )
      throw new RangeError("학습 단계와 완료 여부를 확인하세요.");
    var next = parse(state),
      index = next.completed.indexOf(stepId);
    if (done && index === -1) next.completed.push(stepId);
    if (!done && index !== -1) next.completed.splice(index, 1);
    return next;
  }
  function answer(state, labId, choice) {
    if (!validLab(labId) || !validChoice(choice))
      throw new RangeError("실험과 답안 번호를 확인하세요.");
    var next = parse(state);
    next.answers[labId] = choice;
    return next;
  }
  function resume(state, labId, hash) {
    if (!validResume(labId, hash))
      throw new RangeError("이어 볼 실험 주소를 확인하세요.");
    var next = parse(state);
    next.lastLab = { id: labId, hash: hash };
    return next;
  }
  return {
    paths: paths,
    empty: empty,
    parse: parse,
    toggle: toggle,
    answer: answer,
    resume: resume,
  };
});
