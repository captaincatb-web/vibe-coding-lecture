# PR-B: 손실 없는 정규화 읽기 모델

기준일 2026-11-08 KST. base는 PR-A 브랜치 `codex/silicon-library-v2-baseline`(5b35bd8)이다. PR #3은 공개 PR 화면 재조회 결과 OPEN, head abc28ea981f0ec428545458761b9e32dbad69be5. 기본 브랜치·운영 후보 브랜치·PR #3은 변경하지 않았다.

## 현재 동작

`scripts/normalize-silicon-library.js`는 기존 로더의 export를 복제해 변환한다. 원본 HTML이나 export 객체를 수정하지 않는다.
`silicon-library/data/library.schema.json`은 Draft-07 스키마이고 Ajv로 검사한다. ID와 외래키, 관계 근거, 법인·사업 범위, 날짜, 원문 위치, 과거 검증 상태 보존은 추가 검사기로 확인한다.
`normalized-library.json`은 생성된 정적 읽기 모델이다. 화면은 여전히 기존 HTML 데이터로 동작하며 생성본을 다운로드하지 않는다. 따라서 초기 로드 크기에 이 파일 크기가 추가되지 않는다.

| 집합 | 생성 건수 | 해석 |
|---|---:|---|
| books | 46 | 기존 #bN·즐겨찾기 이름·중복 사업 행의 정규 경로 |
| companies | 45 | 법인 수가 아닌 기존 기업 레코드, entity_kind는 unresolved_record |
| business_units | 4 | 린데 2개 법인/사업 단위, 에이텍솔루션 2개 사업 |
| processes / products | 13 / 31 | 기존 ID와 양방향 연결 보존 |
| company_products | 62 | legacy_catalog_link, 전부 unverified; 거래·제조 관계로 승격하지 않음 |
| claims / sources | 15 / 188 | 기존 사실 상태 verified 7 / partial 6 / unverified 2 보존 |
| relationship_edges | 40 | product→process, 타입을 구분한 연결; 전부 unverified |
| facilities / financials | 0 / 0 | 지역명을 시설로 추정하거나 문장 속 재무 숫자를 추출하지 않음 |
| knowledge | 0 | 현재 base에는 DEEP가 없음 |

`legacy_snapshot`은 export 전체를 보존한다. digest는 이 스냅샷의 변경 검출용 SHA256이며 외부 사실을 인증하는 서명이 아니다. 회사 공식 이름·국가·공시 코드·재무·라이선스 등 없는 정보는 null/unknown으로 두었다. A/B/C 자료 확보 등급과 사실별 검증 상태를 분리했다. 기존 sources의 published_at은 source 차원의 날짜가 없어서 null이며, 개별 사실의 원래 pub는 claims.published_at에 남아 있다.

## 근거와 관계

기존 서재 연결은 제조사·판매사·유통사·특정 고객 납품을 확정하지 않는다. 새 develops/manufactures/sells/distributes 관계는 회사·제품·관계 유형이 일치하는 claim을 요구한다. verified 관계는 verified claim만 참조할 수 있다.
새 verified claim은 출처·확인일·원문 위치와 출처의 원문/부분 원문 열람·접근일을 요구한다. 발췌만 열람했거나 차단된 출처로 verified를 부여할 수 없다. 기존 15개 사실의 과거 검증 표시는 그대로 보존하되 이번 변환으로 재검증한 것으로 표현하지 않는다. 기존 미확인 사실과 출처 없는 편집 분석도 삭제하지 않는다.
product와 process의 ID `cmp`처럼 문자열이 같을 수 있어 그래프에는 from_type/to_type을 두고 주장에도 subject_type/object_type을 둔다. 회사 간 납품 관계는 현재 enum에서 허용하지 않는다.
수치 value가 있으면 단위와 기간을 요구한다. 출처 URL에 자격증명 삽입, 미래 확인일, 존재하지 않는 날짜, 타 회사 사업 단위의 사실, 근거 없는 관계 승격은 검사에 실패한다.

## 재현

```bash
cd /workspace/vibe-coding-lecture
npm ci --cache /tmp/showreel-npm-cache --no-audit --no-fund
npm run build:data
npm run check
```

생성 시 전체 변환·검증을 메모리에서 완료한 뒤 임시 파일을 원자적으로 rename한다. 실패하면 이전 생성본을 보존한다. `--check`는 생성본이 누락되거나 원본과 어긋나면 exit 1이며 파일을 쓰지 않는다. 생성 시각을 넣지 않아 동일 입력은 동일 바이트로 재현된다.
CI는 root package-lock의 Ajv/Playwright를 npm ci로 설치하고 기존 검사·신규 테스트·생성본 최신성·UI 회귀를 실행한다. showreel의 manifest/lockfile은 변경하지 않았다.

## PR #3과 후속 전환

현재 PR #3의 실제 HTML을 git show로 읽어 변환한 결과 출처 224개, 심화 영역 knowledge 5개이며 검사 통과. DEEP 전체와 legacyNum·corrections·notes·출처 열람 상태는 스냅샷에 그대로 남는다. 발췌 열람을 원문 검증으로 바꾸거나 기존 수치 주장을 자동 승격하지 않는다. 해당 브랜치의 코드는 이번 생성본에 복사하지 않았다.
PR #3의 심화 문장별 근거를 정규 claims로 추출하는 작업은 후속 adapter 단계다. 지금은 원문 구조를 보존하는 knowledge와 legacy_snapshot으로 제공한다.
후속 UI 전환은 #3과 A의 최종 통합본에서 생성본과 기존 탐색 결과를 다시 대조한 뒤 진행한다. 이 PR은 B 데이터 기반에 한정하며 C 검색·D 콘텐츠·기업 확대를 완료했다고 주장하지 않는다.
화면 변경이 없어 PR-A의 변경 전후 화면이 그대로 적용된다. 롤백은 PR-B 커밋을 되돌리면 되며 데이터 마이그레이션이나 운영 배포는 없다.
