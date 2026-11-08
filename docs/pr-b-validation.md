# PR-B 검증과 제한

2026-11-08 KST. base 5b35bd8, PR #3 head abc28ea981f0ec428545458761b9e32dbad69be5.

- `npm ci --cache /tmp/showreel-npm-cache --no-audit --no-fund`: 고정 lockfile로 의존성 설치 성공.
- `npm run check`: 기존 데이터 검사(오류·경고 0, 검토 12), 부정 테스트 15/15, 진단기 5개 검사, 신규 Node 테스트 37/37, 정적 생성본 최신성 검사.
- 신규 테스트에는 중복·고아 참조·잘못된 사업 범위·날짜·계층 순환·관계 근거·발췌 검증 승격 거부·기존 사실 상태 보존·빌드 실패 시 마지막 정상 파일 유지·반복 생성 동일 바이트를 포함한다.
- 신규 제조 관계 테스트는 TEST FIXTURE ONLY로 표시한 메모리 내 가상 자료이며 공개 생성본에는 포함되지 않는다.
- PR #3의 실제 HTML export 변환 검사: source 224 / knowledge 5 / DEEP 원본 일치, 오류 0. PR #3은 아직 병합하지 않았다.
- PR-A 기준과 `silicon-library/index.html`, showreel manifest/lockfile을 git diff로 비교: 변경 없음.
- 기존 UI 회귀: 시스템 글꼴 fixture 모드 **98/98 통과**, exit 0. 모바일 400px/데스크톱 1280px, 46개 책의 탭, 44개 공정·기술 URL, 즐겨찾기·키보드·다크모드 포함.
- 생성 JSON의 모든 legacy 데이터는 원래 export와 JSON 기준 동일. 수치·기업·출처 추가 수집 없음.

## 화면 검사 재현

```bash
cd /workspace/vibe-coding-lecture
python3 -m http.server 8766 --bind 127.0.0.1
```

다른 터미널에서:

```bash
cd /workspace/vibe-coding-lecture
SL_BROWSER_EXECUTABLE=/usr/bin/chromium SL_TEST_URL=http://127.0.0.1:8766/silicon-library/ SL_OFFLINE_FIXTURES=1 npm run test:ui
```

SL_OFFLINE_FIXTURES는 외부 Google Fonts 대신 시스템 글꼴과 빈 favicon을 사용한다. 운영 페이지/실 글꼴 전달을 검증하는 모드가 아니다. CI는 이 옵션을 설정하지 않는 기존 네트워크 모드다. GitHub Actions 자체 실행 결과와 로컬 검증은 구분한다.

## 배포와 후속

정규화 JSON은 현재 화면에서 읽지 않으므로 성능·렌더링 개선을 주장하지 않는다. 운영 사이트 직접 확인은 기존 네트워크 제한으로 미완료다. 실제 UI 전환과 심화 문장의 정규 claims 추출은 PR #3 통합 후 추가 검증이 필요하다.
배포·운영 브랜치 병합은 하지 않는다. PR-B base는 PR-A 브랜치이며 후속 C의 기반으로 삼기 전에 A/#3 검토와 통합이 필요하다.
