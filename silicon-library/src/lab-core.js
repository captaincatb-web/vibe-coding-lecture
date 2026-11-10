(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SiliconLabCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function bounded(value, min, max, name) {
    if (
      (typeof value !== "number" && typeof value !== "string") ||
      String(value).trim() === ""
    )
      throw new RangeError(name + " 값을 확인하세요.");
    var n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max)
      throw new RangeError(name + " 입력 범위를 벗어났습니다.");
    return n;
  }
  function lithography(wavelength, na, k1) {
    var w = bounded(wavelength, 13.5, 365, "파장");
    if (![13.5, 193, 248, 365].includes(w))
      throw new RangeError("지원하는 파장 예시를 선택하세요.");
    var aperture = bounded(na, 0.1, w === 13.5 ? 0.55 : 1.35, "NA"),
      k = bounded(k1, 0.25, 0.8, "k1");
    return { cd_nm: (k * w) / aperture, immersion_assumption: aperture > 1 };
  }
  function ald(cycles, gpc) {
    var c = bounded(cycles, 0, 300, "사이클 수");
    if (!Number.isInteger(c)) throw new RangeError("사이클 수는 정수입니다.");
    return { thickness_nm: c * bounded(gpc, 0.02, 0.2, "GPC") };
  }
  function cmp(pressure, speed, time, coefficient) {
    return {
      relative_removal:
        bounded(pressure, 0, 3, "상대 압력") *
        bounded(speed, 0, 3, "상대 속도") *
        bounded(time, 0, 3, "상대 시간") *
        bounded(coefficient, 0.1, 2, "상대 계수"),
    };
  }
  var STEPS = {
    wafer: "웨이퍼",
    dep: "박막",
    photo: "포토",
    etch: "식각",
    clean: "세정",
    metro: "계측",
  };
  var NEXT = {
    wafer: ["dep", "metro"],
    dep: ["photo", "clean", "metro"],
    photo: ["etch"],
    etch: ["clean", "metro"],
    clean: ["dep", "photo", "metro"],
    metro: ["dep", "clean", "photo"],
  };
  function sequence(steps) {
    if (
      !Array.isArray(steps) ||
      steps.length < 1 ||
      steps.length > 24 ||
      steps[0] !== "wafer"
    )
      throw new RangeError("웨이퍼로 시작하는 최대 24단계 학습 모델입니다.");
    var hasFilm = false,
      patterned = false;
    steps.forEach(function (s, i) {
      if (!STEPS[s] || (i > 0 && !NEXT[steps[i - 1]].includes(s)))
        throw new RangeError(
          "이 단순 학습 모델에서 가능한 다음 순서: " +
            (NEXT[steps[i - 1]] || ["wafer"]).map((k) => STEPS[k]).join(", "),
        );
      if (s === "photo" && !hasFilm)
        throw new RangeError(
          "이 학습 모델에서는 박막을 추가한 뒤 포토를 진행하세요.",
        );
      if (s === "dep") {
        hasFilm = true;
        patterned = false;
      }
      if (s === "etch") patterned = true;
    });
    return {
      steps: steps.slice(),
      last: steps[steps.length - 1],
      has_film: hasFilm,
      patterned: patterned,
      next: NEXT[steps[steps.length - 1]].filter(
        (k) => k !== "photo" || hasFilm,
      ),
    };
  }
  var MODELS = {
    lithography: {
      title: "노광 · 빛과 패턴",
      formula: "CD = k1 × λ / NA",
      unit: "λ와 CD: nm · NA와 k1: 무차원",
      assumptions:
        "Rayleigh 해상도 관계의 교육용 탐색입니다. k1은 공정·광학·마스크 조건을 묶은 가정값입니다. NA > 1은 액침을 전제로 합니다. EUV 예시는 NA 0.55 이내로 제한했습니다.",
      limits:
        "계산한 CD는 실제 장비 성능이나 특정 제품의 양산 선폭을 보장하지 않습니다. 레지스트·초점심도·광자 통계·패턴 종류를 계산하지 않습니다.",
      route: "#t-photo",
      reference: "https://www.asml.com/en/technology/lithography-principles",
      quiz: {
        question: "다른 조건이 같을 때 NA를 키우면 이 식의 CD는?",
        options: ["작아집니다", "커집니다", "변하지 않습니다"],
        answer: 0,
        explanation:
          "NA가 분모에 있으므로 계산상 CD가 작아집니다. 실제 패터닝 한계는 더 많은 조건에 달려 있습니다.",
      },
    },
    ald: {
      title: "ALD · 한 사이클씩 쌓기",
      formula: "두께 = 사이클 수 × 가정한 GPC",
      unit: "두께: nm · GPC: nm/cycle",
      assumptions:
        "GPC가 모든 사이클에서 일정하다고 가정한 선형 모델입니다. 표면 반응의 포화, 적절한 온도 창, 전구체·반응가스·퍼지 조건이 필요합니다.",
      limits:
        "ALD 1사이클이 항상 원자 1층이라는 뜻이 아닙니다. 초기 핵생성·전구체 분해·깊은 구조 내 전달 지연을 계산하지 않습니다.",
      route: "#t-dep",
      reference: "https://thinfilm.wordpress.ncsu.edu/research/basics-of-ald",
      quiz: {
        question: "ALD 1사이클은 항상 원자 1층일까요?",
        options: [
          "항상 그렇습니다",
          "아닙니다. 표면 반응과 공정 조건에 따라 달라집니다",
        ],
        answer: 1,
        explanation:
          "자기제한 반응이 원자층 하나와 같다는 의미는 아닙니다. GPC는 물질·표면·온도·반응 조건에 따라 달라집니다.",
      },
    },
    cmp: {
      title: "CMP · 누르고 움직이며 평탄하게",
      formula: "상대 제거량 = (K/K₀) × (P/P₀) × (V/V₀) × (t/t₀)",
      unit: "모든 입력과 결과: 기준값 대비 배수",
      assumptions:
        "Preston 관계를 정규화한 교육용 모델입니다. K는 슬러리·패드·재료·온도 등의 영향을 묶은 입력 가정입니다. 기준 조건의 제거량을 1로 둡니다.",
      limits:
        "nm/min이나 양산 제거량을 예측하지 않습니다. 비선형 반응·디싱·에로전·국부 압력·표면 화학·패드 마모는 포함하지 않습니다.",
      route: "#t-cmp",
      reference: "https://link.springer.com/article/10.1557/s43578-020-00060-x",
      quiz: {
        question: "압력만 2배로 하면 이 단순 모델의 상대 제거량은?",
        options: ["1/2배", "2배", "반드시 실제 수율이 2배"],
        answer: 1,
        explanation:
          "식에서는 2배입니다. 모델에 없는 결함·비선형 효과 때문에 실제 공정 결과로 일반화할 수 없습니다.",
      },
    },
    sequence: {
      title: "공정 시퀀스 · 층을 만들고 패턴을 옮기기",
      formula: "웨이퍼 → 박막 → 포토 → 식각 → 세정 → 계측",
      unit: "단계와 단면: 개념도, 실제 축척 없음",
      assumptions:
        "하나의 패턴 전사 루프를 단순화한 상태 모델입니다. 계측과 세정은 여러 위치에서 반복될 수 있습니다.",
      limits:
        "실제 FAB에서는 수십·수백 번의 공정 반복과 추가 단계가 필요합니다. 여기서 허용하는 순서는 교육 모델의 규칙이며 양산 레시피가 아닙니다.",
      route: "#tech",
      reference:
        "https://www.asml.com/en/technology/all-about-microchips/how-microchips-are-made",
      quiz: {
        question: "실제 칩은 여기 나온 단계를 한 번만 거칠까요?",
        options: [
          "한 번이면 완성됩니다",
          "여러 층을 위해 반복하며 다른 단계도 추가됩니다",
        ],
        answer: 1,
        explanation:
          "박막·패턴 전사·세정·계측 등이 반복되며 제품 구조마다 순서와 횟수가 다릅니다.",
      },
    },
    packaging: {
      title: "HBM 구조 · 층을 분리해 보기",
      formula: "다이 · TSV · 연결부 · 언더필 · 기판 · 열 경로",
      unit: "구조: 개념적 투영 도식, 치수·축척 없음",
      assumptions:
        "특정 회사나 세대의 설계를 복제하지 않은 개념적 적층 모델입니다. 회전·간격·가시성 조절은 구조를 이해하기 위한 표현입니다.",
      limits:
        "다이 수를 선택해도 실제 제품 지원 구성을 의미하지 않습니다. 범프/본딩 방식과 열 경로는 제품별로 다르며, 전기·열·응력 시뮬레이션은 수행하지 않습니다.",
      route: "#t-hbm",
      reference:
        "https://eps.ieee.org/technology/heterogeneous-integration-roadmap/",
      quiz: {
        question: "이 도식의 간격이나 다이 수로 실제 제품 치수를 알 수 있나요?",
        options: [
          "아닙니다. 축척 없는 개념 모델입니다",
          "그대로 제조 치수로 사용할 수 있습니다",
        ],
        answer: 0,
        explanation:
          "구조 관계를 이해하기 위한 개념도입니다. 실제 치수와 구성은 해당 제품의 공개 설계 자료를 확인해야 합니다.",
      },
    },
  };
  var GLOSSARY = [
    [
      "ALD",
      "원자층 증착",
      "전구체와 반응가스를 번갈아 공급하는 자기제한 표면 반응 기반 증착.",
      "#t-dep",
    ],
    [
      "CVD",
      "화학 기상 증착",
      "기체 반응물을 이용해 표면에 박막을 형성하는 공정.",
      "#t-dep",
    ],
    [
      "PVD",
      "물리 기상 증착",
      "타겟 등에서 나온 원자를 물리적으로 이동시켜 막을 형성하는 방식.",
      "#t-dep",
    ],
    [
      "CMP",
      "화학 기계 평탄화",
      "화학 반응과 기계적 작용을 함께 사용해 표면을 평탄하게 하는 공정.",
      "#t-cmp",
    ],
    [
      "HBM",
      "고대역폭 메모리",
      "여러 메모리 다이를 적층해 넓은 인터페이스를 구성하는 메모리 기술.",
      "#t-hbm",
    ],
    [
      "TSV",
      "실리콘 관통 전극",
      "실리콘 다이를 관통해 수직 전기 연결을 만드는 구조.",
      "#t-hbm",
    ],
    [
      "NA",
      "개구수",
      "광학계가 빛을 모으는 능력과 관련된 무차원 광학 변수.",
      "#t-photo",
    ],
    [
      "GPC",
      "사이클당 성장량",
      "주어진 조건에서 ALD 한 사이클당 증가하는 평균 막 두께.",
      "#t-dep",
    ],
    [
      "ARDE",
      "종횡비 의존 식각",
      "패턴의 종횡비에 따라 반응종 전달과 식각 진행이 달라지는 현상.",
      "#t-etch",
    ],
    [
      "EUV",
      "극자외선 노광",
      "극자외선 영역의 빛을 사용하는 패터닝 기술.",
      "#t-photo",
    ],
    [
      "KGD",
      "양품 다이",
      "적층·패키징 전에 정해진 검사 조건을 통과한 다이. 검사 범위와 조건을 함께 봐야 한다.",
      "#t-test",
    ],
    [
      "Underfill",
      "언더필",
      "연결부 주변 공간을 채워 구조적 신뢰성 등에 기여하는 재료.",
      "#t-hbm",
    ],
    [
      "Metrology",
      "계측",
      "공정 결과의 두께·선폭·정렬 등 물리량을 측정하는 활동.",
      "#t-metro",
    ],
    [
      "Inspection",
      "검사",
      "결함을 탐지·분류하는 활동. 계측과 목적·측정량을 구분한다.",
      "#t-metro",
    ],
  ];
  return {
    bounded: bounded,
    lithography: lithography,
    ald: ald,
    cmp: cmp,
    sequence: sequence,
    steps: STEPS,
    models: MODELS,
    glossary: GLOSSARY,
  };
});
