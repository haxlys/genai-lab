# Contributing to genai-lab

genai-lab의 가장 흔한 기여 패턴은 **새 lesson-spec 추가**입니다. 22개 레슨 중 어느
하나라도 더 좋은 인터랙티브 랩을 제공할 수 있다면 환영합니다.

## 셋업

```bash
git clone https://github.com/haxlys/genai-lab.git
cd genai-lab
pnpm install

# ../generative-ai-for-beginners 가 sibling 디렉토리에 있어야 함
git clone https://github.com/microsoft/generative-ai-for-beginners.git ../generative-ai-for-beginners

pnpm sync-content   # content/lessons/*.json 생성
pnpm dev            # http://localhost:3000
```

## 새 lesson-spec 추가

각 spec은 `src/lib/lesson-specs/<id>.ts`에 정의하고 `index.ts`에 등록합니다.

### 1) chat spec (가장 흔함)

`buildTeacherSpec` 헬퍼로 1분 안에 만들 수 있습니다 (8개 Learn 레슨 모두 이 패턴):

```ts
// src/lib/lesson-specs/<id>.ts
import { buildTeacherSpec } from './_teacher-mode'

export const lessonXxSpec = buildTeacherSpec({
  lessonContext: 'XX. 레슨 제목',
  presets: [
    { id: 'concept-1', label: '핵심 개념 1', question: '이 레슨의 핵심 개념을 비유로 설명해줘.' },
    { id: 'concept-2', label: '...', question: '...' },
    // 3-4개 권장
  ],
})
```

직접 폼/요청을 정의하고 싶다면 04번 레슨처럼 `VariableSpec` 객체를 직접 작성:

```ts
import type { VariableSpec } from '#/types/lesson'
import type { ChatRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

export const lessonXxSpec: VariableSpec = {
  fields: [
    { type: 'select', name: 'model', label: '모델', options: GITHUB_MODELS_OPTIONS, defaultValue: 'gpt-4o-mini' },
    { type: 'slider', name: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.05, defaultValue: 0.7 },
    { type: 'textarea', name: 'user', label: 'User 메시지', rows: 4, defaultValue: '...' },
  ],
  buildRequest: (values): ChatRequest => ({
    provider: 'github-models',
    model: String(values.model),
    messages: [{ role: 'user', content: String(values.user) }],
    temperature: Number(values.temperature),
  }),
  presets: [/* 1-3개 권장 */],
}
```

### 2) image / embedding / rag / agent spec

`spec.kind`에 적절한 값을 지정하고 `buildRequest`가 `ImageRequest` / `SearchRequest` /
`RagRequest` / `AgentRequest`를 반환하도록 합니다. 예시:

- `09-building-image-applications.ts` (image)
- `08-building-search-applications.ts` (embedding)
- `15-rag-and-vector-databases.ts` (rag)
- `17-ai-agents.ts` (agent)

### 3) 등록 + 검증

```ts
// src/lib/lesson-specs/index.ts 에 추가:
import { lessonXxSpec } from './XX-name'

const REGISTRY: Record<string, VariableSpec> = {
  // ...
  'XX-name': lessonXxSpec,
}
```

```bash
pnpm sync-content   # hasVariableSpec=true 갱신
pnpm dev            # /lessons/XX-name 진입해 동작 확인
pnpm typecheck
```

## 코드 스타일

- TypeScript strict, ESM only
- 컴포넌트는 함수 컴포넌트 + hooks
- 새 외부 의존성은 신중히 (가능하면 자체 구현 우선)
- 한국어 주석/메시지 OK — 학습자 대상 텍스트는 한국어가 기본

## 검증

```bash
pnpm typecheck   # 타입 검사
pnpm test        # vitest 단위 테스트
pnpm build       # 프로덕션 빌드 확인
```

CI(.github/workflows/ci.yml)가 PR마다 자동으로 위 셋을 실행합니다.

## PR 가이드

- 한 PR = 한 이슈 (작게 유지)
- 커밋 메시지는 `type(scope): summary` (예: `feat(content): 22번 레슨 spec 추가`)
- Closes #N으로 이슈 자동 닫기

## 라이선스

원본 강의 콘텐츠 © Microsoft Corporation, MIT. genai-lab 자체 코드는 이 레포의
LICENSE를 따릅니다.
