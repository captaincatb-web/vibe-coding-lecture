# PR-A 검증 기록과 재현
2026-11-08 KST. 기준 1424ab9. 운영 브라우저 검증은 네트워크 차단으로 미실행.

## 원본
- 데이터 검사: exit 0, 오류 0·경고 0·검토 12·참고 30.
- 부정 테스트: 원본 포함 15/15 통과.
- 기존 UI 기본 명령: 브라우저 실행 파일 부재로 exit 2.
- /usr/bin/chromium 적용: file:// 관리 정책 차단으로 exit 2.
- HTTP + Chromium: 49/51 통과, exit 1. 외부 Google Fonts 연결 실패 및 favicon 404로 콘솔 검사 2건 실패. 기능·모바일·즐겨찾기·키보드 검사는 통과.

## 재현 명령
의존성은 checkout 밖에 설치해 기존 manifest/lockfile을 보존한다.

```bash
cd /workspace/vibe-coding-lecture
npm install --prefix /tmp/silicon-library-test-tools --cache /tmp/showreel-npm-cache --no-audit --no-fund --no-package-lock playwright@1.63.0
python3 -m http.server 8765 --bind 127.0.0.1
```

다른 터미널에서:

```bash
cd /workspace/vibe-coding-lecture
node scripts/validate-silicon-library.js
node tests/validator-negative.js
node tests/silicon-library-audit.js
node scripts/audit-silicon-library-v2.js
NODE_PATH=/tmp/silicon-library-test-tools/node_modules SL_BROWSER_EXECUTABLE=/usr/bin/chromium SL_TEST_URL=http://127.0.0.1:8765/silicon-library/ SL_OFFLINE_FIXTURES=1 node tests/silicon-library-ui.js
```

SL_OFFLINE_FIXTURES=1은 글꼴 stylesheet를 빈 CSS, favicon을 204 응답으로 명시적으로 대체한다. 기능 검사를 유지하며 외부 글꼴 전달과 실 글꼴 배치는 검증하지 않는다. 이 변수가 없으면 기존 네트워크 검사가 그대로 동작한다. CI는 기본 모드다.
SL_BROWSER_EXECUTABLE과 SL_TEST_URL이 없으면 기존 Playwright 브라우저와 file:// 경로를 사용한다.

## 데이터 보존·화면
개선 후: 데이터 검사 exit 0(오류·경고 0), 부정 테스트 15/15, 진단기 5개 검사 통과. 시스템 글꼴 fixture 모드 UI **98/98 통과**, exit 0. 신규 44개 공정/기술 URL과 빈 상태 3개 검사를 포함한다. 원본 49/51의 네트워크 실패가 해소됐다고 주장하지 않는다.
기준 HTML과 변경 HTML을 기존 로더로 읽어 export 전체를 JSON 직렬화 비교: 동일.
전수 진단 스냅샷은 audit-inventory.json이며 다시 생성할 수 있다. 설명 길이는 JSON 문자 수로 정의했다.
[변경 전](screenshots/metro-before.png) / [변경 후](screenshots/metro-after.png): 1280×900 viewport, 전체 페이지, 시스템 글꼴 환경.

## 배포·롤백
라이브 배포·병합 미실행. PR #3 deep-content 및 정량 주장 메타데이터는 이번 브랜치에서 변경하지 않았다.
병합 전에는 PR을 닫으면 된다. 병합 후에는 해당 PR 커밋만 revert하고 검사한 뒤 사용자가 배포 여부를 결정한다. 데이터 마이그레이션은 없다.
