# PR2 정량 주장·출처 검증 기록

검증일 2026-11-02. 이 표는 `silicon-library/data/deep-content.json`의 정량 문장(q 메타 보유)에서 생성한 것이다. "원문 확인"은 문서 전문 또는 원문 해당 절에서 문장과 수치를 직접 본 것이고, "발췌 확인"은 검색 도구 발췌만 본 것, "미확인"은 확인하지 못한 것이다.

## 1. 정량 주장 27건
| 위치 | 주장(앞부분) | 유형 | 검증 | 발행 | 비교 대상 | 조건·범위 | 한계 | 원 자료 | 출처 |
|---|---|---|---|---|---|---|---|---|---|
| dep/mechanism | 정정: '한 사이클에 원자 1층(약 0.1nm)'은 단순화된 표현입니다. 한 리뷰는 알루미나 위 TMA/H₂O ALD에서 반응… | 리뷰 재인용 | 원문 확인 | 2019 | OH 반응 자리 밀도 대 사이클당 증착 Al 원자 밀도 | Al₂O₃ 열 ALD(TMA/H₂O), 전형적 ALD 조건(온도는 해당 문장에 명시 없음) |  | 리뷰가 '알려져 있다'고 쓴 값이며 인용 원문은 확인하지 않음 | d_ald1 |
| dep/params | 한 논문의 서론은 ALD의 자기제한 반응이 비교적 낮은 온도(일반적으로 100~400℃)에서 고품질 막을 허용하는 경우가 많다… | 원논문 실험 | 원문 확인 | 2017 | 서론의 100~400℃ 일반 서술 대 본 공정의 250~325℃ 자기제한 구간 | MoS₂ ALD, Mo(thd)₃+H₂S, 유동형 F-120 반응기 약 5mbar, 250~400℃ 탐색, 실리콘 기판 |  | 서론의 100~400℃는 논문이 인용한 일반 서술이며 인용 원문은 확인하지 않음 | d_ald7 |
| dep/params | Conformality(균일 피복)는 구조 안쪽 두께와 바깥쪽 두께의 비입니다. step coverage는 측벽 중간 또는 바… | 리뷰 재인용 | 원문 확인 | 2019 | PVD·(PE)CVD에서 어려운 5:1 구조 대 ALD | step coverage 정의와 'EAR 5:1은 ALD가 보통 100%' 서술. 측정 구조에 따라 달라짐 |  | 리뷰가 인용한 원 논문은 열람하지 않음 | d_ald1 |
| dep/params | ALD라도 피복은 조건에 따라 크게 달라집니다. 한 리뷰가 문헌을 정리한 표에서, 같은 TMA/H₂O 공정의 보고된 피복 가능… | 리뷰 재인용 | 원문 확인 | 2019 | 열 ALD 대 오존 기반 대 플라즈마 강화 ALD | 문헌 보고값을 표 II~IV로 정리. 극단 7000:1은 양극 산화 알루미나(AAO) 구조 사례. 160%는 EAR 50:1 정사각 홀의 3D 몬테카를로 시뮬레이션 | 보고된 최고값이며 양산 보장값이 아님. 구조·공정 조건이 보고마다 다름 | 표의 원 논문들은 열람하지 않음 | d_ald1 |
| dep/defects | TSV처럼 종횡비 10 이상인 구조에서는 PVD·CVD가 한계에 이르고 일정 종횡비를 넘으면 ALD만이 고품질 피복을 줄 수 … | 원논문 실험 | 발췌 확인 | 2019 | TaxNy 배리어+ALD Ru 시드 대 TixNy 배리어+i-PVD Cu 시드 | 300mm 웨이퍼, 열 ALD TaxNy 약 6nm + Ru 약 9nm 후 Cu 전기도금, TSV 종횡비 10~12 |  | 초록의 검색 발췌만 확인(유료 본문 미열람) | d_ald8 |
| etch/concept | 한 리뷰는 최첨단 고종횡비 플라즈마 식각에서 목표 종횡비가 100에 가까워질 수 있고, 그러려면 이방성이 1에 아주 가까워야 … | 논문 서술 | 원문 확인 | 2021 |  | 최첨단 플라즈마 HAR 공정의 목표를 서술한 문장(실험값 아님) |  |  | d_et1 |
| etch/mechanism | SC1에서는 과산화수소의 산화와 암모니아의 식각이 연속해 일어나 입자 밑을 파고들어 떨어뜨립니다(입자가 undercut되어 l… | 원논문 실험 | 원문 확인 | 1994 | 식각 깊이별 입자 제거 효율(혼합비 3종 비교) | NH₄OH/H₂O₂/H₂O 3종 혼합(0.25/1/5·0.05/1/5·0.01/1/5) 70℃, 열산화막 식각률 0.2~0.05nm/min, HF-last 방식으로 오염시킨 웨이퍼, 입자 크기 LSE>0.5μm 계수 | 1990년대 실험실 조건(권 번호 기준 추정). 현재 양산 세정 공정의 표준 성능으로 일반화하지 않음 | 논문 저자는 확인하지 못함 | d_cl1 |
| etch/defects | 종횡비가 커지면 식각 속도가 떨어지는 ARDE는 식각의 대표 문제입니다. 한 리뷰(Fig. 4b 설명)는 7nm 노드 로직 l… | 리뷰 재인용 | 원문 확인 | 2026 | 연속파 플라즈마 식각 대 준-ALE(QALE) | 7nm 노드 로직 low-k 유전체 식각, 서로 다른 피처 크기에서의 식각 깊이 차(RIE lag 매크로) 비교 | 단일 사례의 보고값. ALE 일반 성능이나 양산 표준이 아님 | 인용 원 논문(JVST A 37:011001, 2019)은 열람하지 않음 | d_et2 |
| cmp/params | Cu/배리어 선택비는 디싱과 배리어 손실을 모두 피하려고 1:1 근처로 정하는 경우가 많습니다. 한 연구의 서론은 보고된 [배… | 논문 서술 | 원문 확인 | 2024 | 보고된 선택비 범위 약 0.3~3.0과 1:1 선택 | Mo/Cu CMP 연구(약알칼리 시트르산계 슬러리)의 서론 서술. 선택비는 보통 블랭킷 웨이퍼 제거율로 설정됨 |  |  | d_cm7 |
| cmp/params | 디싱은 선폭에 크게 좌우됩니다. MIT 학위논문(2001) 5장은 중성 pH 슬러리(α-Al₂O₃ 300nm 4vol%, 48… | 원논문 실험 | 원문 확인 | 2001 | 중성 슬러리(본 실험) 대 화학 슬러리(문헌 Park 외 1999) | 본 실험은 pH 7 중성 슬러리, 비교 대상은 문헌의 상용 화학 슬러리(서로 다른 연구 간 비교). 넓은 Cu 영역(폭 100μm), 오버폴리싱 1~3분 | 2001년, 100mm 웨이퍼 학위논문. 서로 다른 연구 간 비교이며 현재 양산 CMP 성능이 아님 | 문헌(Park 외 1999)은 열람하지 않음 | d_cm3 |
| cmp/params | 하이브리드 본딩 Cu CMP 리뷰(J. Electron. Packag. 2025)에 디싱 목표 정확도를 0.5nm 이내, 변동… | 논문 서술 | 미확인 | 2025 |  | 검색 발췌만 확인. 공정 조건·인용 출처 미확인 |  |  | d_cm4 |
| cmp/trend | 하이브리드 본딩용 Cu CMP: 디싱 수 nm, 유전체 에로전 제어, 3단계 CMP 사용 시 슬러리·컨디셔닝 소재 소비 증가가… | 논문 서술 | 발췌 확인 | 2025 |  | 3단계 CMP의 소모품 증가 서술(검색 발췌). 구체 수치 없음 |  |  | d_cm4 |
| cmp/unc | 하이브리드 본딩 CMP 목표값(0.5nm 등)은 리뷰가 인용한 보고값이며 양산 규격이 아닙니다.… | 논문 서술 | 미확인 | 2025 |  | 검색 발췌만 확인. 공정 조건·인용 출처 미확인 |  |  |  |
| hbm/concept | JEDEC HBM 표준(HBM1·HBM2, JESD235D)은 HBM DRAM이 호스트 연산 다이에 밀접히 결합되고 인터페이스… | 일반화 가능 사실 | 원문 확인 | 2021 | HBM1·HBM2 표준(HBM3 이후 아님) | JESD235D(HBM1·HBM2) 3절. 스택당 최대 8채널은 표준이 "예상(anticipated)"하는 값이며 DRAM 업체가 구성을 정함 |  |  | d_hb1 |
| hbm/concept | HBM4(JESD270-4, 2025-04 공표)는 2048비트 인터페이스, 핀당 최대 8Gb/s, 총 대역폭 최대 2TB/s… | 일반화 가능 사실 | 원문 확인 | 2025 | HBM3(16채널) 대 HBM4(32채널) | JEDEC 보도자료(2025-04-16) 본문. 표준 본문(JESD270-4)은 열람하지 않음 | 표준 본문이 아니라 보도자료 요약. 상용 제품 사양과 같다는 뜻이 아님 |  | d_hb2 |
| hbm/concept | 일반 메모리 패키지가 솔더볼(300~400μm)로 4~32개 I/O를 쓰는 것과 달리, HBM은 훨씬 작고 많은 마이크로범프로… | 기업 발표 | 원문 확인 | 2023 | 일반 메모리 패키지 대 HBM 마이크로범프 | SK hynix 논문의 서술. 일반 메모리 패키지 4~32개 I/O·솔더볼 300~400μm 대 HBM |  |  | d_hb3 |
| hbm/params | 한 SK hynix ISSCC 2018 논문은 도입부에서 '적층 칩의 전체 수율은 TSV 하나의 수율을 TSV 개수만큼 거듭제… | 기업 발표 | 원문 확인 | 2018 |  | SK hynix 논문 도입부의 서술(8단 HBM2 사례). 실험 결과가 아니라 문제 설명용 단순 모델 | 양산 수율 예측식이 아님. 가정 3개는 모델의 수학적 전제를 편집자가 풀어 쓴 것 |  | d_hb5 |
| hbm/params | 한 리뷰는 MR-MUF 같은 기존 방식이 내부 열저항을 낮추지만 없애지는 못하며, 열저항이 12단 이상 스택에서 급격히 커진다… | 리뷰 재인용 | 원문 확인 | 2025 | 12단 이하 스택 대비 12단 이상(정성 서술) | 리뷰의 정성 서술(초록·본문). 구체 열저항 수치는 이 문장에 없음 |  | 리뷰가 인용한 원 논문은 열람하지 않음 | d_hb4 |
| hbm/params | 이 리뷰는 여러 연구를 종합해 하이브리드 본딩이 접합부 열저항을 22.8~47% 줄일 수 있다고 정리합니다. 상한 47%는 M… | 시뮬레이션 | 원문 확인 | 2025 | 47%: 하이브리드 본딩 대 마이크로범프, 20%: 하이브리드 본딩 대 MR-MUF | 47%: Mehta 외 16단 HBM 열 시뮬레이션(리뷰 인용). 20%: ECTC 2023 16단 HBM4 사례(시뮬레이션/측정 여부 리뷰에 없음) | 리뷰가 재인용한 값. 양산 결과가 아님 | Mehta 외·ECTC 2023 원 논문은 열람하지 않음 | d_hb4 |
| hbm/params | 전력 효율: SK hynix 논문은 HBM2E 약 4.3pJ/bit 대비 HBM3E는 20% 감소, HBM4는 60% 감소를 … | 기업 발표 | 원문 확인 | 2023 | HBM2E 대비 | SK hynix 논문 서술. HBM2E 약 4.3pJ/bit 대비 HBM3E 20%·HBM4 60% 감소. HBM4는 "예상(expected)" | 회사의 예상이며 HBM4 실제 제품값이 아님 |  | d_hb3 |
| hbm/trend | HBM은 세대마다 대역폭과 용량을 2~3배 늘려 왔고, HBM4 이후는 전력 밀도가 높아져 열 관리가 중요해진다고 IEEE E… | 논문 서술 | 발췌 확인 | 2025 | 이전 세대 대비 | IEEE ECTC 2025 초록의 서술(검색 발췌). 세대별 구체값 없음 | 초록만 확인 |  | d_hb6 |
| hbm/trend | 16단 이상에서는 칩-투-웨이퍼 하이브리드 본딩이 갭 충진재를 없애 높이 제한 안에서 더 많은 다이를 쌓고 방열도 제어할 수 … | 기업 발표 | 원문 확인 | 2023 | 기존 갭 충진 방식 대비 | SK hynix 논문의 서술. 16단 이상에서 칩-투-웨이퍼 하이브리드 본딩의 높이·방열 이점(표 3은 추출되지 않아 확인 못함) | 회사의 전망 |  | d_hb3 |
| hbm/unc | SK hynix 2023 논문은 HBM4가 12Gbps 이상의 I/O 속도와 16단 이상을 요구한다고 쓰지만, JEDEC 20… | 기업 발표 | 원문 확인 | 2023 | SK hynix 2023 논문 대 JEDEC 2025 보도자료 | 2023년 회사 논문의 요구 사양(전망) 대 2025년 표준 발표(최대 8Gb/s) |  |  | d_hb3, d_hb2 |
| test/concept | 프로브카드는 시험 대상 칩(DUT)과 자동 테스트 장비(ATE)의 테스트 헤드 사이의 인터페이스입니다. 웨이퍼 한 번 테스트에… | 특허 실시예 | 발췌 확인 | 2010 |  | 특허 배경 서술(웨이퍼 레벨 시험 일반 설명). 원문 PDF 접근 실패, 검색 발췌만 확인 | 특허 배경은 출원인의 서술이며 업계 표준값이 아님 |  | d_ts3 |
| test/params | 프로브 피치: 특허 실시예에서 탐침 피치는 약 40μm 수준으로 제시됩니다(특정 설계의 예이며 업계 표준값이 아님). 한편 I… | 특허 실시예 | 발췌 확인 | 2014 | 직접 마이크로범프 프로빙 대 기존 방식(재인용 문장) | 특허 실시예(약 40μm 피치)와 IEEE 가이드의 예시(40×50μm 테스트 패드, 2014년 Wide-I/O 40/50μm 피치 연구 재인용) | 특허 실시예·재인용 값이며 업계 일반값이 아님 | 특허 PDF는 접근 실패, 2014년 연구 원문은 열람하지 않음 | d_ts5, d_ts2 |
| test/params | 병렬도(동시에 측정하는 DUT 수)는 비용을 좌우합니다. 광대역 갭 전력반도체 문맥에서는 4~16개 사이트를 중간 병렬 수준으… | 리뷰 재인용 | 원문 확인 | 2026 | 웨이퍼 레벨 선별 대 중간 병렬 시험 | 광대역 갭 전력반도체(자동차·고신뢰성), 전류 약 50~200A 수준의 중간 병렬 시험 | 전력반도체 맥락이며 메모리·HBM 시험 병렬도가 아님 |  | d_ts4 |
| test/params | 그 밖의 변수: 접촉 저항, 테스트 온도 범위, 신호 무결성, 테스트 시간·원가. 서재 프로브카드 해설의 '-40~150℃' … | 논문 서술 | 미확인 | 2026 |  | 서재 프로브카드 기존 해설의 '-40~150℃'는 이번 PR에서 출처를 연결하지 못함 |  |  |  |

## 2. 출처 36건의 열람 상태
| ID | 제목 | 발행 | 유형 | 열람 | 확인한 내용 |
|---|---|---|---|---|---|
| d_ald1 | Cremers·Puurunen·Dendooven, Conformality in atomic layer deposition: Current sta | 2019-04-04 | 학술논문(리뷰) | 원문 일부 열람 | 원문 PDF 해당 절: OH 7~9/nm²·Al 약 4.5/nm², step coverage 정의, 코팅 EAR 5:1~1750:1·열 ALD 극단 7000:1·오존 20:1·PE-ALD 30:1, CVD 기여 시뮬레이션 입구 약 160% |
| d_ald2 | Johnson·Hultqvist·Bent, A brief review of atomic layer deposition: from fundamen | 2014-06 | 학술논문(리뷰) | 검색 발췌 열람 |  |
| d_ald3 | Parsons Research Group(NC State), Basics of ALD | 2015-11-16 | 대학 연구실 교육자료 | 검색 발췌 열람 |  |
| d_ald4 | EPFL CMi, Atomic Layer Deposition Process Development | 2019-02-15 | 대학 시설 기술문서 | 검색 발췌 열람 |  |
| d_ald5 | Kim 외, Enhancement of Conformality of Silicon Nitride Thin Films by ABC-Type Ato | 2024-03 | 학술논문 | 검색 발췌 열람 |  |
| d_ald6 | Aalto University 학위논문, ALD process development with an organometallic hafnium ox | 2025-07-30 | 학위논문 | 검색 발췌 열람 |  |
| d_ald7 | Mattinen 외, Atomic Layer Deposition of Crystalline MoS2 Thin Films: New Molybden | 2017-09 | 학술논문 | 원문 일부 열람 | 서론의 100~400℃ 일반 서술, 결과 절의 250~325℃ 자기제한·300℃ 선택·350~400℃ 분해, 실험 조건 |
| d_ald8 | 3D system integration on 300 mm wafer level: High-aspect-ratio TSVs with rutheni | 2019-01-15 | 학술논문 | 검색 발췌 열람 |  |
| d_et1 | Fischer 외, Thermal atomic layer etching: A review (J. Vac. Sci. Technol. A 39(3) | 2021-03-11 | 학술논문(리뷰) | 원문 열람 | 이방성 정의식 A=(EPCv−EPCh)/EPCv, 목표 종횡비 100 근접 서술(본문 전체 수신) |
| d_et2 | Atomic Layer Etching for Extreme Manufacturing: Pushing the Limits of Atomic Sca | 2026-03-23 | 학술논문(리뷰) | 원문 일부 열람 | 5.1절 서술(RIE lag 약 11.9nm→1.3nm)과 인용 원문(Lutker-Lee 외, JVST A 37:011001, 2019) 표시 확인. 인용 원 논문은 열람하지 않음 |
| d_et3 | Vanraes 외, Assessing neutral transport mechanisms in aspect ratio dependent etch | 2023-07-26 | 학술논문 | 검색 발췌 열람 |  |
| d_et4 | High aspect ratio SiO2/SiN (ON) stacked layer etching using C3HF5, C4H2F6, and C | 2024-06-20 | 학술논문 | 검색 발췌 열람 |  |
| d_cl1 | The Electrochemical Society, Cleaning Technology in Semiconductor Device Manufac | 1994 | 학회 논문집 | 원문 일부 열람 | 해당 실험 절: SC1 입자 제거 효율 대 열산화막 식각 깊이, 조건(70℃, 혼합비 3종, 입자 LSE>0.5μm, HF-last 오염), 1.5~2nm에서 0.80~0.90 |
| d_cl2 | The Electrochemical Society, Cleaning Technology in Semiconductor Device Manufac | 2001 | 학회 논문집 | 검색 발췌 열람 |  |
| d_cl3 | Pall Corporation, Dilute HF Aqueous Cleaning Using Asymmetric Polyarylsulfone Me | 2009-11-25 | 기업 기술문서 | 검색 발췌 열람 |  |
| d_cm1 | Seo, A review on chemical and mechanical phenomena at the wafer interface during | 2020-09-14 | 학술논문(리뷰) | 검색 발췌 열람 |  |
| d_cm2 | Scratch formation and its mechanism in chemical mechanical planarization (CMP) ( | 2013-12 | 학술논문(리뷰) | 검색 발췌 열람 |  |
| d_cm3 | Lai, Dishing and Overpolishing in the Copper Chemical Mechanical Polishing Proce | 2001-02-22 | 학위논문 | 원문 일부 열람 | 5.3·5.4절: 실험 조건 표(Table 5.2), 문헌(Park 외 1999)과의 디싱 비교, 0.65배·450→230nm 서술 |
| d_cm4 | A Review of the Cu Chemical Mechanical Planarization Process in Hybrid Bonding T | 2025-06-27 | 학술논문(리뷰) | 검색 발췌 열람 |  |
| d_cm5 | Effect of Controlling Abrasive Size in Slurry for Tungsten Contact CMP Process ( | 2019-06-05 | 학술논문 | 검색 발췌 열람 |  |
| d_cm6 | GLOBALFOUNDRIES, Three Complementary Strategies for Micro-scratch Reduction duri | 2016-03-31 | 기업 학회 발표 | 검색 발췌 열람 |  |
| d_cm7 | Gamagedara 외, Mechanisms of Chemically Promoted Material Removal Examined for Mo | 2024-10-07 | 학술논문 | 원문 열람 | 서론: [배리어:Cu] 선택비 보고 범위 약 0.3~3.0과 1:1 근처 선택(본문 전체 수신) |
| d_hb1 | JEDEC, JESD235D High Bandwidth Memory DRAM (HBM1, HBM2) | 2021-02 | 표준(JEDEC) | 원문 열람 | 3절 Organization: 스택당 최대 8채널 예상, 채널당 128비트 DDR 데이터 버스(문서 전문 수신, 해당 절 확인) |
| d_hb2 | JEDEC, JESD270-4 HBM4 표준 발표 보도자료 | 2025-04-16 | 표준 기관 보도자료 | 원문 열람 | HBM4 수치(2048비트·핀당 8Gb/s·2TB/s·32채널·4~16단·24/32Gb·64GB)를 보도자료 본문에서 확인. 표준 본문(JESD270-4)은 아님 |
| d_hb3 | Moon·Son·Lee(SK hynix), Advanced Packaging Technologies in Memory Applications f | 2023 | 기업 학회 논문 | 원문 열람 | 본문에서 4.3pJ/bit·20%·60%, 솔더볼 대비 마이크로범프, MR-MUF/TC-NCF 열 경로 서술, 하이브리드 본딩 서술 확인. 표 1~3과 그림은 텍스트로 추출되지 않아 확인하지 못함 |
| d_hb4 | Thermal Issues Related to Hybrid Bonding of 3D-Stacked High Bandwidth Memory: A  | 2025-07 | 학술논문(리뷰) | 원문 열람 | 초록·본문에서 47%(Mehta 외 열 시뮬레이션 인용), 약 20%(ECTC 2023 인용), 22.8~47% 범위, 12단 이후 열저항 급증 서술 확인. 인용 원 논문은 열람하지 않음 |
| d_hb5 | Cho 외(SK hynix), A 1.2V 64Gb 341GB/s HBM2 stacked DRAM with spiral point-to-poin | 2018-03-06 | 기업 학회 논문 | 원문 열람 | 본문 전체에서 TSV 수율 서술, 8단에서 TSV 하나 불량 시 9개 다이 폐기, TSV 자가 수리 회로 확인. 저자 소속은 SK hynix(Samsung이 아님) |
| d_hb6 | Thermal Characterization of HBMs Integrated via Hybrid Bonding (IEEE ECTC 2025)  | 2025-05-30 | 학회 논문(초록) | 검색 발췌 열람 |  |
| d_hb7 | Nomad Semi, Deep Dive on HBM | 2025-06-03 | 제3자 분석 매체 | 검색 발췌 열람 |  |
| d_hb8 | The Elec, Samsung considers applying MUF to server DRAM | 2024-03-03 | 언론 보도(익명 소식통) | 검색 발췌 열람 |  |
| d_ts1 | IEEE EPS, Heterogeneous Integration Roadmap 2024, Chapter 17: Test Technology | 2024-11-25 | 로드맵(IEEE EPS) | 원문 열람 | Memory Test 항목의 KGSD·개별 다이 시험 과제, HBM 시험 방식 서술, 모듈 시험 위치(본문) |
| d_ts2 | IEEE EPS Test, Heterogeneous Integrated Product Testability Best-Known Methods | 2022-01-14 | 기술 가이드(IEEE EPS) | 원문 열람 | 프로브 피치 분리, 테스트 패드(40×50μm 알루미늄 패드 예시), 소수 업체 서술, 2014년 직접 마이크로범프 프로빙 경제성 재인용(본문) |
| d_ts3 | US 7,750,651 B2, Wafer level test probe card (배경 설명) | 2010-07-06 | 특허 | 검색 발췌 열람 |  |
| d_ts4 | Probe Card Technologies in Advanced Semiconductor Testing for Wide Band Gap Devi | 2026-07-09 | 학술논문(리뷰) | 원문 열람 | 프로브카드 분류, 중간 병렬 4~16개 사이트·50~200A 서술(본문 전체 수신, 전력반도체 맥락) |
| d_ts5 | US 8,832,933 B2, Method of fabricating a semiconductor test probe head (배경 설명) | 2014-09-16 | 특허 | 검색 발췌 열람 |  |
| d_hb9 | A Study on the Effectiveness of Underfills in the High Bandwidth Memory with TSV | 2013-09-19 | 학회 논문 | 검색 발췌 열람 |  |
