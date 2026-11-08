계측·검사 페이지의 빈 회사 연결이 업체 부재로 읽힐 수 있어 수록·연결 공백임을 명시하고, 빈 제품 목록에서 기술 백과로 돌아갈 수 있게 했습니다. 기존 데이터 export 전체는 기준 SHA 1424ab9와 동일합니다.

PR-A 범위로 현행 구조·배포 이력·전수 진단(45개 기업/13개 공정/31개 기술)·출처 및 라이선스 정책·스키마 전환 계획·B~G 로드맵을 추가했습니다. 참고자료의 검증 주장은 사용자 제공 내용과 이번 확인 결과를 구분했습니다.

- base: claude/sharp-cannon-dyi1jj. 기본 브랜치에는 사이트 소스가 없습니다.
- PR #3은 OPEN이며 심화 콘텐츠를 가져오거나 재구현하지 않았습니다. B는 #3과 A의 최종 통합 SHA에서 시작합니다. renderProc의 인접 변경은 통합 시 보존해야 합니다.
- 변경 파일과 재현 명령: docs/validation.md 및 docs/architecture-as-is.md.
- [변경 전](https://github.com/captaincatb-web/vibe-coding-lecture/blob/codex/silicon-library-v2-baseline/docs/screenshots/metro-before.png) / [변경 후](https://github.com/captaincatb-web/vibe-coding-lecture/blob/codex/silicon-library-v2-baseline/docs/screenshots/metro-after.png).
- 데이터 검사 오류/경고 0; 부정 테스트 15/15; 진단기 5개 검사 통과. 시스템 글꼴 fixture 모드 UI 98/98, 원본 네트워크 포함 모드 49/51(외부 글꼴 차단·favicon 오류). 상세는 docs/validation.md 참고.
- 운영 URL/Pages 설정은 네트워크 403으로 직접 확인하지 못했습니다. 공개 Actions 이력에서 sharp-cannon 브랜치의 Pages 성공을 확인했습니다.
- 병합·배포하지 않습니다. 데이터 변경이 없어 PR 커밋 revert로 롤백 가능합니다.
