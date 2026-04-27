# genai-lab

Microsoft 공식 *Generative AI for Beginners* (22개 레슨) 코스를 한국어로 따라가며,
변수를 직접 조정해 LLM 동작을 체감할 수 있는 학습 실험실.

## 무엇이 다른가

기존 코스는 Jupyter Notebook + 터미널 + `.env` 셋업이 진입 장벽이고, 변수 하나
바꾸려면 코드 편집 → 저장 → 재실행 사이클이 필요합니다. genai-lab은:

- **한국어 강의 본문 + 인터랙티브 변수 패널을 한 화면에** (split-pane)
- **슬라이더/폼으로 변수 조정** (코드 편집 불필요)
- **Run 결과 자동 저장 + side-by-side 비교** (temperature 0.2 vs 1.0이 어떻게 다른가?)
- **자유 실험 Playground 탭** (레슨과 무관하게 자유 탐색)
- **Python 원본 + TypeScript 등가 탭** (학습 코드와 실행 코드 모두 투명)

## 시작하기

```bash
# 1. 의존성 설치
pnpm install

# 2. 원본 레포에서 콘텐츠 동기화
#    (../generative-ai-for-beginners 가 sibling 디렉토리에 있어야 함)
pnpm sync-content

# 3. 환경 변수 설정 (선택)
cp .env.example .env
# 편집기로 .env 열어서 GITHUB_TOKEN 등 채우기
# 비워두면 Settings 페이지에서 직접 입력 가능

# 4. dev 서버 실행
pnpm dev
# → http://localhost:3000
```

## 권장 학습 경로 (4주)

원본 레포의 `LEARNING_GUIDE.ko.md` 4주 경로를 따릅니다.

- **1주차 — 기초**: 01 → 04 → 05 → 06 (첫 빌드)
- **2주차 — 인터랙션**: 07 → 09 → 11 (Function Calling) → 12
- **3주차 — 검색·RAG**: 08 → 15 (RAG, 핵심) → 17 (Agents)
- **4주차 — 프로덕션**: 03 → 13 → 14 → 18/19

## 프로젝트 구조

```
src/
├── routes/                # TanStack Start 파일 라우팅
│   ├── __root.tsx
│   ├── index.tsx          # 랜딩
│   ├── lessons/           # 22개 레슨
│   ├── playground.tsx     # 자유 실험실
│   ├── history.tsx        # Run history + 비교
│   └── settings.tsx       # API 키
├── components/
│   ├── lesson/            # SplitPane, VariableForm, OutputPanel, ...
│   ├── playground/
│   └── ui/                # shadcn/ui
├── lib/
│   ├── llm/               # GitHub Models / OpenAI / Azure 어댑터
│   ├── storage/           # localStorage Run/Settings CRUD
│   └── lesson-specs/      # 레슨별 VariableSpec 정의
└── types/

content/                   # sync-content 가 채움
└── lessons/*.json         # 22개 레슨 (markdown + code refs)

scripts/
└── sync-content.ts        # ../generative-ai-for-beginners 에서 스냅샷
```

## 기술 스택

- **TanStack Start** + React 19 + TypeScript
- **shadcn/ui** + Tailwind CSS 4
- **react-markdown** + remark-gfm + Shiki (코드 하이라이팅)
- **eventsource-parser** (LLM 스트리밍 응답)
- **localStorage** (Run history, 설정) — 백엔드 DB 없음

## API 키 처리 (BYOK)

- 로컬 dev: `.env` 파일이 있으면 server function이 1회 클라이언트로 주입 → localStorage 저장
- 그 외: Settings 페이지에서 직접 입력
- 모든 LLM API 호출은 클라이언트에서 직접 (서버 프록시 아님)
- 키는 사용자 브라우저에만 머무름

## 개발 명령어

```bash
pnpm dev             # dev 서버 (http://localhost:3000)
pnpm build           # 프로덕션 빌드
pnpm preview         # 프로덕션 빌드 미리보기
pnpm test            # Vitest 단위 테스트
pnpm sync-content    # 원본 레포 → content/ 스냅샷
```

## Out of scope (현재)

- 다국어 토글 (한국어 only)
- 클라우드 동기화 / 계정
- Pyodide 기반 Python 실행
- Monaco editor 고급 모드
- 배포 (로컬 우선)

## 라이선스

원본 콘텐츠 © Microsoft Corporation, MIT License.
genai-lab 자체 코드는 사용자가 결정.
