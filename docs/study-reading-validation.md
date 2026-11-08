# 학습 기록·책 본문 개선 검증

2026-11-08, 운영 기준 `49ae1b6`에서 이어서 검증했습니다. 새 기능의 안내는 [학습 이어가기](study-progress.md)와 [책 본문 개선](reading-guide.md)을 참고하세요.

| 검사 | 결과 |
| --- | --- |
| `npm run check` | 데이터 오류·경고 0, Node 검사 73개 통과, 정규화 데이터·탐색 인덱스 생성본 일치 |
| `npm run test:ui` | 기존 책장·46권·별칭·목차·즐겨찾기·화면 이동 152개 통과 |
| `npm run test:explorer` | 통합 탐색·책갈피·실패 복구 27개 통과 |
| `npm run test:comparison` | 기업 비교·공유·인쇄 19개 통과 |
| `node tests/silicon-bookmark-backup.js` | 병합·알 수 없는 참조·잘못된 JSON 보존·다운로드 통과 |
| `npm run test:labs` | 모델·URL·키보드·단계 취소 등 39개 통과 |
| `npm run test:study` | 학습 기록·퀴즈·이어가기·저장 실패·두 탭 병합 등 40개 통과 |
| `npm run test:reading` | 46권 길잡이·연결·기존 수치·세정 범위·모바일 101개 통과 |
| `npm run test:a11y` | 책 개요·핵심 기술 포함 18개 화면/뷰포트에서 axe 위반 0 |

관리형 클라우드에서 파일 URL 접근이 차단되어, 브라우저 검사는 HTTP 서버의 `/silicon-library/` 경로를 사용했습니다. 브라우저는 `/usr/bin/chromium`, 외부 폰트는 시스템 폰트 대체 fixture를 사용했습니다. 이 검사는 Google Fonts 제공 상태나 운영 사이트의 직접 접근을 검증하지 않습니다.

```bash
python3 -m http.server 8767 --bind 127.0.0.1
# 별도 터미널에서 원하는 검사 실행
SL_TEST_URL=http://127.0.0.1:8767/silicon-library/ \
SL_BROWSER_EXECUTABLE=/usr/bin/chromium SL_OFFLINE_FIXTURES=1 npm run test:study
```

기존 자료의 검토 항목 12건과 미검증 수치는 그대로 남아 있습니다. UI 개선과 데이터 정합성 검사 통과가 기존 기업 정보의 재검증을 뜻하지 않습니다. 배포 전에는 원격 CI 성공을 확인하고, Pages 작업에서 정확한 커밋과 운영 브랜치를 대조합니다.
