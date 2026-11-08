# 통합 버전 검증 기록

2026-11-08 KST. 로컬 Node 24.22.1, npm 11.9.0, 시스템 Chromium, Playwright 1.63.0. CI는 Node 20과 고정 package-lock을 사용한다.

## 실행 결과

- `npm run check`: 기존 데이터·DEEP 동기화 검사, 부정 테스트, 진단기, Node 테스트 **56/56**, 정규화 자료와 탐색 인덱스 최신성 통과. 기존 검토 12건은 자동 검증 완료로 바꾸지 않았다.
- 기존 UI 통합 회귀 **152/152** 통과. PR #3의 심화·수치·출처 상태 검사와 기존 46개 책/44개 공정·기술 URL을 포함한다.
- 통합 탐색 UI **27/27** 통과: ALD/HBM/기업 3개 흐름, URL·뒤로가기·책갈피·최근 항목·키보드·다크모드·빈 상태·503 복구를 검증했다.
- 학습 랩 UI **31/31** 통과: 수식 반영·초기화·공유 복원·모바일·키보드·퀴즈·순서 오류·층 가시성·용어집·잘못된 입력 복구.
- axe-core/Playwright 4.10.2로 400px·1280px 뷰포트의 탐색·노광·ALD·CMP·HBM 구조·학습 경로 **12개 화면/뷰포트 검사**: 자동 감지 위반 0건. 고정 개발 의존성과 `npm run test:a11y`로 CI에 포함했다. 수동 스크린리더 인증이나 모든 기존 화면의 접근성을 보장하는 결과는 아니다.
- PR #3의 deep-content.json 원본 바이트 동일, 원본 export 전체 JSON 동일. 새 데이터 수집·사실 검증 상태 승격 없음.

## 반복 실행

```bash
cd /workspace/vibe-coding-lecture
npm ci --cache /tmp/showreel-npm-cache --no-audit --no-fund
npm run build
npm run check
python3 -m http.server 8767 --bind 127.0.0.1
```

다른 터미널에서 아래 네 가지를 각각 실행한다.

```bash
SL_BROWSER_EXECUTABLE=/usr/bin/chromium SL_TEST_URL=http://127.0.0.1:8767/silicon-library/ SL_OFFLINE_FIXTURES=1 npm run test:ui
SL_BROWSER_EXECUTABLE=/usr/bin/chromium SL_TEST_URL=http://127.0.0.1:8767/silicon-library/ SL_OFFLINE_FIXTURES=1 npm run test:explorer
SL_BROWSER_EXECUTABLE=/usr/bin/chromium SL_TEST_URL=http://127.0.0.1:8767/silicon-library/ SL_OFFLINE_FIXTURES=1 npm run test:labs
SL_BROWSER_EXECUTABLE=/usr/bin/chromium SL_TEST_URL=http://127.0.0.1:8767/silicon-library/ SL_OFFLINE_FIXTURES=1 npm run test:a11y
```

Fixture는 외부 Google Fonts를 빈 CSS로 대체해 시스템 글꼴을 사용한다. 실 글꼴 전달·운영 사이트 네트워크는 이 테스트의 검증 대상이 아니다. CI 기본 모드는 이 fixture를 사용하지 않는다.

## 성능과 화면

400px 뷰포트·데스크톱 Chromium·로컬 HTTP·네트워크 제한 없음·시스템 글꼴에서 측정:

| 측정 | 결과 |
|---|---:|
| 탐색 인덱스 원본 / gzip 추정 | 259,457 / 69,999 bytes |
| 탐색 화면 초기 준비 | 233 ms |
| 50회 검색 평균 / p95 | 0.082 / 0.400 ms |

실제 모바일 통신망이나 현장 사용자 지표가 아니다. gzip 크기는 압축 가능 크기이며 Python 개발 서버가 gzip으로 응답했다고 주장하지 않는다. 책장 진입 때 인덱스를 요청하지 않고 탐색 진입 후 한 번만 요청하는 동작은 브라우저 테스트로 확인했다.

[통합 탐색](screenshots/v2/explorer.png) · [ALD 랩](screenshots/v2/ald-lab.png) · [HBM 구조](screenshots/v2/hbm-lab.png) · [학습 경로](screenshots/v2/learning.png) · [모바일](screenshots/v2/mobile-ald.png)

## 적용 상태

배포·운영 브랜치 병합은 미실행. 네트워크 설정 초안 저장과 실행 환경 적용도 구분한다. PR/API 접근과 운영 원본 재검증은 실제 네트워크 정책 반영 후 다시 확인해야 한다.
