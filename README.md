# Vibe Coding Lecture

## 실리콘 서재 2.0

기존 책장형 기업 도감에 공정·품목 통합 탐색, 출처와 기존 검증 기록, 직접 조작하는 학습 랩을 연결한 정적 웹 프로젝트입니다. GitHub Pages에서 빌드된 정적 파일을 제공합니다.

- **통합 탐색:** 한글·영문·약어 검색, 제품↔공정↔기업 연결, 최대 3곳 기업 비교, 탐색 책갈피·최근 본 항목·공유·인쇄.
- **첫 화면 책장:** 46권을 책등이 나란히 보이는 나무 책꽂이에 배치했습니다. 색상·금박 장식·품목 문양과 서가 바로가기를 제공하며, 교과서 11종도 같은 책등 형태로 표시합니다. [책꽂이 안내](docs/colorful-books.md)
- **학습 랩:** 노광, ALD, CMP 교육 모델, 공정 시퀀스, HBM 개념 구조. 수식·단위·가정·한계·퀴즈를 함께 표시합니다.
- **학습 경로:** 입문·실무·심화·산업 4개 경로의 16단계 완료 표시, 퀴즈 선택 기록, 마지막 실습 이어가기와 용어집. 기록은 현재 브라우저에 저장됩니다.
- **책 본문:** 기존 품목·공정 연결을 바탕으로 읽기 길잡이와 실습 연결을 제공하고, 핵심 기술의 기존 주의사항과 수치 검증 상태를 함께 표시합니다. [책 본문 개선 안내](docs/reading-guide.md)
- **원리 확장:** 31개 품목의 작동 흐름·관련 품목 비교·이해 확인 문답과 기업별 제품 평가 질문을 제공합니다. 확장 설명도 통합 탐색에서 검색할 수 있습니다. [반복 개선 기록](docs/reading-depth.md)
- **내부 교과서:** 산업·공정·소재·메모리·패키징 등 11종, 33개 장과 핵심 용어 33개를 직접 작성했습니다. 기업 책의 ‘함께 읽을 교과서’에서 이어 읽고, 목차·본문 검색·전체 읽기·인쇄를 이용합니다. [교과서 안내](docs/local-textbooks.md)
- **주간 업데이트:** 서재 기준일을 2026.11.08로 갱신했습니다. 매주 월요일 오전 9시(한국 시간)에 공식 뉴스룸·기술 매체·공식 릴리스를 확인하고, 새 자료의 제목·원문 날짜·링크를 첫 화면과 관련 책·교과서에 반영합니다. 자동 수집 자료는 ‘원문 대조 전’으로 표시합니다. [자동 갱신 안내](docs/weekly-updates.md)
- 기존 46개 책 URL, 45개 기업 레코드, 13개 공정, 31개 기술과 PR #3의 심화 콘텐츠를 보존합니다. 기업 레코드 수는 법인 수가 아닙니다.

Node.js 20 이상과 Python 3으로 실행합니다.

```bash
npm ci
npm run build
npm run check
python3 -m http.server 8767 --bind 127.0.0.1
```

로컬 서버에서 `/silicon-library/`를 열면 됩니다. 화면별 경로는 `#explore`, `#labs`, `#learn`입니다. 개발 브랜치에서 `npm run build` 후 생성본도 함께 커밋합니다.

주간 자료를 수동 갱신하려면 `npm run update:weekly` 후 `npm run check`를 실행합니다. 주간 화면 검사는 서버가 실행된 상태에서 `npm run test:weekly`로 확인합니다. GitHub의 예약 작업은 기본 브랜치에서 실행되며 검증 후 기존 Pages 브랜치에 자료를 저장하고 재배포를 요청합니다.

UI 검사는 별도 터미널에서 `npm run test:ui`, `npm run test:explorer`, `npm run test:labs`, `npm run test:study`, `npm run test:reading`, `npm run test:a11y`로 실행합니다. Playwright 브라우저 설치는 `npx playwright install chromium`을 사용합니다. 학습 기록의 동작과 저장 실패 처리는 [학습 이어가기 안내](docs/study-progress.md), 관리형 클라우드의 구체적인 검증 명령은 [통합 검증 기록](docs/v2-release-validation.md)을 참고하세요.

공정 연결은 특정 고객 납품을 뜻하지 않으며, 교육 모델의 계산값은 실제 양산 성능 예측값이 아닙니다. [구현·사용 안내](docs/v2-experience.md)와 [출처 정책](docs/sources-and-licenses.md)을 함께 확인하세요.

학습 기록과 책 본문 개선의 검사 범위·결과는 [추가 검증 기록](docs/study-reading-validation.md)에 정리했습니다.

## Showreel

Remotion으로 제작한 강연 쇼릴 프로젝트입니다. 영상 구성은 `showreel/src/Root.tsx`에 등록되어 있으며, 결과물은 `showreel/out/`에 저장합니다.

## 시작하기

필수 도구: Node.js 20 이상과 Chromium 기반 브라우저.

```bash
cd showreel
npm ci
```

현재 Remotion 설정에는 특정 Chromium 경로가 지정되어 있습니다. 다른 환경에서는 아래처럼 설치된 Chromium 경로를 명시해 실행하세요.

```bash
npx remotion studio src/index.ts --browser-executable=/usr/bin/chromium
```

클라우드 환경에서는 `/usr/bin/chromium`을 사용할 수 있습니다. Studio가 준비되면 터미널에 표시된 로컬 주소로 열어 컴포지션을 미리 봅니다.

## 컴포지션

`Reel`은 16:9 쇼릴입니다. `NewsSemis`, `NewsAi`는 뉴스 형식 영상이고, `ShortSemis`, `ShortAi`, `ShortSemisEn`, `ShortAiEn`, `ShortRoadster`는 세로형 쇼츠입니다.

등록된 전체 컴포지션은 다음 명령으로 확인할 수 있습니다.

```bash
npx remotion compositions src/index.ts --browser-executable=/usr/bin/chromium
```

## 렌더링

기본 쇼릴을 렌더링합니다.

```bash
npx remotion render src/index.ts Reel out/reel.mp4 --browser-executable=/usr/bin/chromium
```

기존 npm 스크립트도 사용할 수 있습니다. Chromium 경로가 이미 설정된 환경에서 실행합니다.

```bash
npm run render
npm run render:semis
npm run render:ai
```

## 검증

타입 검사는 다음 명령으로 수행합니다.

```bash
npx tsc --noEmit
```

`out/`의 기존 MP4 파일은 예시 결과물입니다. 새 렌더 결과를 검토한 뒤 필요한 파일만 반영하세요.
