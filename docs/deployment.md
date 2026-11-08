# Silicon Library 배포와 복구

배포 대상은 https://captaincatb-web.github.io/vibe-coding-lecture/silicon-library/ 이며, Pages 브랜치는 `claude/sharp-cannon-dyi1jj`다. 이번 책등 배치 복원 전 운영 기준은 425f2ca2f940eb5fd04d89776beae245d6fcce1a이며, [Pages 실행 #42469134261](https://github.com/captaincatb-web/vibe-coding-lecture/actions/runs/42469134261)의 성공으로 배포를 확인했다.

2026.11.08 책꽂이 복원·기준일·주간 자료 기능은 `fe641eb35a5c0196b2d0b8593e6349ad82922bdd`에 반영했다. [전체 CI #42471798867](https://github.com/captaincatb-web/vibe-coding-lecture/actions/runs/42471798867)와 [Pages #42472067662](https://github.com/captaincatb-web/vibe-coding-lecture/actions/runs/42472067662)가 성공했으며, Pages 실행의 정확한 SHA·소스 브랜치·사이트 주소를 대조했다.

이전 버전의 1152432(책갈피 백업 포함)에서 발견한 CI 실패는 새 펼침 메뉴가 추가되면서 `.explorer-saved summary`가 2개와 일치한 회귀 테스트의 모호한 선택자 때문이었다. 49ae1b6에서 의도한 '탐색 책갈피와 최근 본 항목'을 정확히 선택하도록 수정했으며 검사를 생략하지 않았다. 이번 개선은 그 운영 버전을 이어서 학습 기록과 책 본문 읽기 안내를 보완한다.

## 절차

1. 개선 브랜치에서 `npm run check`, 브라우저 회귀·학습 기록·책 본문·백업·접근성 검사와 원격 CI 성공을 확인한다.
2. 배포 브랜치의 최신 SHA를 다시 조회하고, release HEAD가 그 SHA를 포함하는지 확인한다.
3. force 없이 release HEAD를 기존 Pages 브랜치에 fast-forward로 푸시한다. 다른 변경이 있으면 보존·통합 후 재검증한다.
4. GitHub Actions의 `pages build and deployment`가 정확한 release SHA에서 성공했는지 확인한다.
5. 네트워크가 허용되면 운영 HTML, 정적 JS/JSON, `release.json`, 주요 탐색·학습 경로를 직접 검사한다. 접근 차단은 배포 작업 성공과 별도로 보고한다.

루트 `.nojekyll`로 빌드된 HTML/JS/JSON을 정적으로 제공한다. `silicon-library/release.json`은 배포 버전과 앱 기준 커밋을 표시한다. 기본 브랜치나 Pages 설정을 임의로 바꾸지 않는다.

## 주간 갱신

책등 배치와 2026.11.08 기준일을 반영한 버전에는 주간 자료 갱신을 추가한다. 사용자 요청에 따라 실제 기본 브랜치 `ccr-6094f858-7eoy34`에 주간 워크플로 파일만 별도로 설치한다. 앱 소스는 기존 Pages 브랜치에서 유지한다. 예약은 월요일 오전 9시(한국 시간)이며 수집·검사·자료 저장·정확한 커밋의 Pages 빌드 확인을 모두 수행한다. [주간 갱신 안내](weekly-updates.md)에 실패 보존, 수동 실행과 검사 방법을 기록했다.

기본 브랜치의 설치 커밋은 `d1558fc94901a2cc03d66c844d4d87a04c031ddf`다. [첫 자동 실행 #42472155449](https://github.com/captaincatb-web/vibe-coding-lecture/actions/runs/42472155449)은 뉴스룸·기술 매체 3곳의 자료를 추가하고, 접근 실패한 공식 릴리스 2곳의 기존 자료를 보존해 총 34건을 `8f10667be2d2393a65ba16cf0fea81e917cd20ae`에 저장했다. 이 결과로 로컬 데이터 93개·주간 화면 13개·교과서 82개·접근성 32개 검사가 통과했다. 마지막 확인 시점(2026.11.08 10:47 UTC)에는 GitHub 공개 실행 조회가 upstream 503으로 실패해 이 봇 커밋의 최종 자동 재배포 완료 여부를 확인하지 못했다. 앱 기능 배포 성공과 주간 자료 재배포 확인을 구분한다. 운영 URL 직접 접근도 현재 환경의 허용 도메인에 포함되지 않는다.

## 복구

이번 개선의 배포 전 운영 기준은 위의 425f2ca SHA다. 롤백이 필요하면 해당 트리를 되살리는 새 커밋을 현재 운영 브랜치 위에 만들고 검증·푸시한다. 과거 SHA로 force reset하거나 다른 사용자의 변경을 덮어쓰지 않는다. 브라우저 개인화 저장 키와 기존 책 URL은 배포·복구 과정에서도 유지한다.
