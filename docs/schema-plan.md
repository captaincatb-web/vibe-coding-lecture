# 근거 중심 데이터 모델 전환
PR-A의 설계에 이어 PR-B에서 손실 없는 읽기 모델, JSON Schema, 관계·근거 검사와 정적 생성본을 구현했다. 상세는 [PR-B 데이터 모델](data-model-v2.md) 참조. 화면의 데이터 읽기 전환과 기업 확장은 후속 단계다.

| 집합 | 기존 입력 | ID·핵심 제약 |
|---|---|---|
| companies | ENT.list, B, PATCH | 기존 cNN 유지; 법인/그룹/브랜드/사업장 후보를 구분; 동일 이름 자동 병합 금지 |
| facilities | ENT.units | facility_id, company_id; 본사/공장/연구소와 위치 근거 분리 |
| products | TX | 기존 key 유지, 원본 분류 및 UI용 매핑 별도 |
| processes | PROC | 기존 id/해시 유지, parent_process_id는 후속 확장 |
| company_products | ENT.products/TXN | 개발/제조/판매/유통 관계와 evidence_id, 검증 상태; 고객 납품 추론 금지 |
| claims | ENT.facts | 기존 fNNN 유지, 주체/술어/값/단위/범위/기간/자료유형/원문 위치/확인일 |
| sources | S, REP | source_id, URL, 발행일, 접근일, 원문 위치, 라이선스·접근 상태; 미확인은 null |
| knowledge | PROC/TX 설명, PR #3 DEEP | 수식, 변수, 가정, 한계, 학습 수준, 관련 ID |
| financials | 향후 공식 공시 | 법인 ID, 회계기간, 통화, 단위, 연결/별도, 원문·확인일 |
| relationship_edges | 위 관계의 읽기 모델 | 유형별 근거, verified_at, confidence_status; 거래관계와 공정 사용관계 구별 |

## 변환·검사 순서
1. 기존 export를 읽는 adapter로 관계와 배열 순서를 보존한다. 46개 책 URL과 45개 레코드를 각각 대조한다.
2. source/claim의 누락 메타데이터는 null/미확인. A/B/C에서 개별 사실 검증을 추론하지 않는다.
3. 린데 레코드를 법인 수로 집계하지 않는다. 두 법인은 사업 단위에 연결하고 원본·집계 기준을 유지한다.
4. JSON Schema와 FK 검사: 중복 ID, 고아 참조, 고객관계 무근거, 기간/단위 누락, 미래 확인일을 실패 처리.
5. 기존/신규 모델에서 렌더링과 검색·즐겨찾기 결과를 비교한 뒤 정적 생성으로 전환한다. 실패 시 이전 정상 공개 JSON 유지.
6. 원본을 삭제하지 않고 읽기 모델만 교체하므로 역전환 가능하다.

Sangsaengnews의 국내/해외, 설비/원자재/인프라/부품, 상세구분2~5를 원본으로 보존한다.
UI 매핑은 별도 테이블로 관리하고 인프라를 장비에 합치지 않는다. 불명확한 경우 unmapped/review_required.

