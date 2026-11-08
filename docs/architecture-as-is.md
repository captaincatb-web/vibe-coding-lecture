# Silicon Library 현재 구조
확인일: 2026-11-08 KST. 기준 SHA: `1424ab9a5613aba5f21349fdd7aea02c23a63663`.

## 저장소·운영 원본
- 기본 브랜치: `ccr-6094f858-7eoy34`, SHA `fc786ba9be1840e466e1c8ac865090b57d00798e`. silicon-library가 없다.
- 작업 기준: `claude/sharp-cannon-dyi1jj`. PR #2의 병합 커밋이며 실제 사이트 소스를 가진 통합 후보 브랜치다.
- PR #1: OPEN, sharp-cannon → 기본 브랜치. PR #2: MERGED, 데이터 정합성.
- PR #3: OPEN, `claude/silicon-library-pr2-process-depth` → sharp-cannon. head `abc28ea981f0ec428545458761b9e32dbad69be5`.
- 공개 PR 화면의 embedded JSON과 HTTPS Git refs를 다시 조회했다. 첨부 문서의 상태를 단순 복사하지 않았다.
- [Pages 실행 #41537156736](https://github.com/captaincatb-web/vibe-coding-lecture/actions/runs/41537156736): 2026-11-02 22:25:35 UTC 시작, SUCCESS, sharp-cannon 브랜치. 10월 31일의 두 실행도 같은 브랜치다. 이는 **실행 이력**이며 현재 Pages 설정이나 배포된 HTML의 SHA를 확정하지 않는다.
- Pages 설정 API는 HTTP 403. 운영 URL도 CONNECT 403으로 **운영 확인 불가**. 운영 콘솔 오류·소스와의 일치·운영 SHA는 미확인이다.

## 정적 실행 구조
루트 index.html → silicon-library/ 이동. 사이트 HTML 안에 CSS, 데이터, 렌더러, 라우터가 들어 있다. 런타임 프레임워크나 서버 API는 없다.
B/B0/PATCH는 책·보정, ENT는 기업 식별/사업 단위/사실, TX/TXN은 품목/기업 연결, PROC는 공정, S/REP는 출처/리포트다.
`scripts/load-silicon-library.js`는 VM과 DOM stub으로 export hook을 실행해 최종 데이터를 읽는다. 신뢰할 수 없는 외부 스크립트를 이 로더에 넣지 않는다.

## 호환성 계약
- #b0…#b45: 46개 기존 행. ref 행은 통합 기업 책으로 이동한다.
- #map, #tech, #t-{process_id}, #x-{technology_id}, #g-{group_id}.
- localStorage `semiPartners:fav:v1`의 이름 기반 즐겨찾기와 기존 별칭 유지.
- 책 46행 ≠ 기업 레코드 45개 ≠ 법인 수. 린데 레코드의 두 법인과 에이텍솔루션 두 사업을 보존한다.
- Google Fonts 외부 stylesheet에 의존한다. 차단된 환경에서는 시스템 글꼴로 대체되지만 브라우저 리소스 오류가 발생한다.

## 점진적 분리와 PR #3
PR #3은 10파일, +2884/-7행이며 deep-content.json, build-deep.js, diagnose-content.js와 5개 심화 영역 및 정량 주장 검증을 추가한다.
이번 PR은 이 파일들을 복사·병합·재구현하지 않는다. 신규 진단기는 이름 충돌을 피하여 audit-silicon-library-v2.js로 둔다.
B 단계에서 export adapter → 스키마 검사 → JSON 이중 읽기 비교 → 렌더러 교체 순서로 전환한다.
먼저 PR #3을 별도 검토한 뒤 그 최종 SHA를 B의 기반으로 삼는다. 이 PR의 빈 상태 문구와 #3의 renderProc 변경은 통합 시 재검사한다.

