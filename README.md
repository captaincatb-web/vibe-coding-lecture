# Vibe Coding Lecture

## 실리콘 서재 2.0

기존 책장형 기업 도감에 공정·품목 통합 탐색, 출처와 기존 검증 기록, 직접 조작하는 학습 랩을 연결한 정적 웹 프로젝트입니다. 운영 브랜치 반영 전의 개발 버전입니다.

- **통합 탐색:** 한글·영문·약어 검색, 제품↔공정↔기업 연결, 최대 3곳 기업 비교, 탐색 책갈피·최근 본 항목·공유·인쇄.
- **학습 랩:** 노광, ALD, CMP 교육 모델, 공정 시퀀스, HBM 개념 구조. 수식·단위·가정·한계·퀴즈를 함께 표시합니다.
- **학습 경로:** 입문·실무·심화·산업의 4단계와 용어집.
- 기존 46개 책 URL, 45개 기업 레코드, 13개 공정, 31개 기술과 PR #3의 심화 콘텐츠를 보존합니다. 기업 레코드 수는 법인 수가 아닙니다.

Node.js 20 이상과 Python 3으로 실행합니다.

```bash
npm ci
npm run build
npm run check
python3 -m http.server 8767 --bind 127.0.0.1
```

로컬 서버에서 `/silicon-library/`를 열면 됩니다. 화면별 경로는 `#explore`, `#labs`, `#learn`입니다. 개발 브랜치에서 `npm run build` 후 생성본도 함께 커밋합니다.

UI 검사는 별도 터미널에서 `npm run test:ui`, `npm run test:explorer`, `npm run test:labs`로 실행합니다. Playwright 브라우저 설치는 `npx playwright install chromium`을 사용합니다. 관리형 클라우드에서 `/usr/bin/chromium`을 사용하는 구체적인 명령과 검증 범위는 [통합 검증 기록](docs/v2-release-validation.md)을 참고하세요.

공정 연결은 특정 고객 납품을 뜻하지 않으며, 교육 모델의 계산값은 실제 양산 성능 예측값이 아닙니다. [구현·사용 안내](docs/v2-experience.md)와 [출처 정책](docs/sources-and-licenses.md)을 함께 확인하세요.

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
