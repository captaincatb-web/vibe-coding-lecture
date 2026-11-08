# 주간 자료 자동 업데이트

서재 첫 화면과 기업 책 표지의 기준일은 `silicon-library/data/weekly-updates.json`의 `as_of`를 사용한다. 첫 적용일은 **2026.11.08**이다. 방문자의 컴퓨터 날짜로 매번 바꾸지 않고 실제로 자료 확인에 성공한 한국 날짜를 기록한다. 기업별 기존 정보 기준일·원문 확인일과 기사 발행일은 원래 날짜를 유지한다.

## 수집과 표시

`data/weekly-sources.json`에 등록한 SK hynix·Samsung 뉴스룸, Semiconductor Engineering의 RSS와 OpenROAD·Yosys 공식 릴리스 Atom을 확인한다. 각 출처에서 최신 자료를 최대 8건 보존하며, 제목·발행/수정일·원문 링크만 게시한다. 전체 기사와 릴리스 본문을 복제하지 않는다. 첫 화면의 ‘주간 새 자료’, 관련 품목의 ‘최근 동향’, 해당 주제의 내부 교과서에서 연결한다. 새 글이 없으면 기존 자료와 원래 날짜를 유지하고 최근 확인일만 갱신한다.

주제 연결은 자동 분류다. 수집 자료에는 ‘원문 대조 전’을 표시하며 기존 기업 사실·고객 관계·납품 근거나 검증 등급을 자동으로 바꾸지 않는다. 직접 작성한 교과서 11종·33개 장은 보존하고 함께 볼 최신 자료를 보강한다.

HTTPS 출처 허용 목록, GitHub 저장소별 링크 경로, XML 크기·시간 제한, 미래 날짜 제외, 중복 제거와 안전한 텍스트 렌더링을 적용한다. 한 출처가 실패하면 그 출처의 이전 정상 자료를 남긴다. 전부 실패하면 작업은 실패로 종료하고 운영 자료와 기준일을 갱신하지 않는다. 첫 화면의 ‘자료 수집 상태와 확인 범위’에서 출처별 확인 결과를 볼 수 있다.

## 예약 실행과 배포

워크플로: [silicon-library-weekly.yml](../.github/workflows/silicon-library-weekly.yml).

- 매주 월요일 00:00 UTC, **한국 시간 오전 9시** (`0 0 * * 1`). GitHub 예약 시작은 지연될 수 있다.
- 예약 정의는 실제 기본 브랜치 `ccr-6094f858-7eoy34`에 둔다. 기본 브랜치의 다른 앱 파일과 Pages 설정을 변경하지 않는다.
- 실행 시 Pages 소스 브랜치 `claude/sharp-cannon-dyi1jj`를 체크아웃하고 의존성 설치 → 수집 → 데이터 검사 → 브라우저 검사 순서로 실행한다.
- 성공한 JSON과 브라우저 생성본만 봇 커밋으로 저장한다. 브랜치가 실행 중 변경되어 push가 충돌하면 덮어쓰지 않고 실패한다.
- `GITHUB_TOKEN`의 봇 push는 다른 워크플로를 자동 실행하지 않으므로 Pages 빌드 API를 명시적으로 호출한다. 정확히 해당 커밋이 `built`인지 확인해야 성공한다. `contents: write`, `pages: write` 권한을 사용하며 별도 개인 토큰은 필요 없다.
- 초기 설치 시 기본 브랜치의 이 워크플로 파일 변경으로 한 번 실행한다. 이후 GitHub Actions의 `silicon-library-weekly`에서 `Run workflow`로 수동 실행할 수도 있다.

## 로컬 확인

Node.js 20 이상, Python 3이 필요하다.

```bash
npm ci
npm run update:weekly
npm run check
python3 -m http.server 8767 --bind 127.0.0.1
```

다른 터미널에서 `SL_TEST_URL=http://127.0.0.1:8767/silicon-library/ npm run test:weekly`를 실행한다. Playwright Chromium을 먼저 설치한다. 이 관리형 환경의 Node 24에서 프록시가 필요하면 `NODE_USE_ENV_PROXY=1 npm run update:weekly`를 사용한다. 외부 피드 접근 실패는 출처별로 기록하며 임의의 대체 기사를 만들지 않는다.

`npm run build`는 저장된 JSON에서 브라우저용 `src/weekly-data.js`를 생성한다. `npm run check`는 생성본 일치 여부와 실패 보존·URL·날짜·분류·중복을 검사한다.
