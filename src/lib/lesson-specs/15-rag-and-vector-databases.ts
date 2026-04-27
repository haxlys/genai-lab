/**
 * 레슨 15: RAG (Retrieval Augmented Generation).
 *
 * 흐름:
 *   1) query를 임베딩 (text-embedding-3-small/large)
 *   2) corpus도 임베딩
 *   3) 코사인 유사도 top-K 추출
 *   4) 그 chunk들을 system 메시지에 주입해 chat 호출
 *
 * OutputPanel은 retrieved chunk와 최종 답변을 따로 보여줘서 "어떤 자료가
 * 활용됐는지" 투명하게 확인 가능.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { RagRequest } from '#/types/llm'
import { GITHUB_MODELS_OPTIONS } from './_models'

function parseCorpus(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const CORPUS_GENAI_FAQ = [
  'Q: GitHub Models는 무료인가요? A: 학습/테스트용 무료 티어를 제공합니다. 분당/일당 요청 제한이 있고, 프로덕션에는 OpenAI나 Azure를 사용해야 합니다.',
  'Q: temperature와 top_p의 차이는? A: temperature는 다음 토큰 확률 분포의 sharpness를 조정합니다. top_p는 누적 확률 임계값으로 후보를 제한합니다. 둘 중 하나만 조정하는 게 일반적입니다.',
  'Q: RAG는 fine-tuning과 어떻게 다른가요? A: RAG는 외부 지식을 검색해 프롬프트에 주입합니다. fine-tuning은 모델 가중치를 추가 학습합니다. 최신 정보는 RAG, 스타일/포맷은 fine-tuning이 적합합니다.',
  'Q: 토큰이란? A: 모델이 텍스트를 처리하는 단위입니다. 영어 1토큰 ≈ 0.75단어, 한국어는 1글자 ≈ 1-2토큰. 비용과 컨텍스트 길이가 토큰 단위로 계산됩니다.',
  'Q: Function calling은 안전한가요? A: 모델은 함수를 직접 실행하지 않고 호출 의도(이름+arguments)만 반환합니다. 실제 실행은 개발자가 안전성/권한을 검증한 후 수행합니다.',
  'Q: 임베딩은 왜 사용하나요? A: 텍스트를 고차원 벡터로 변환해 의미적 유사도를 계산할 수 있습니다. 검색, 추천, 클러스터링, RAG의 retrieval 단계에 쓰입니다.',
  'Q: 환각(hallucination)은 어떻게 줄이나요? A: temperature 낮추기, RAG로 외부 지식 주입, system 메시지에 "모르면 모른다고 답하라" 명시, 검증 단계 추가 등이 효과적입니다.',
  'Q: GPT-4와 GPT-4o의 차이는? A: GPT-4o는 더 빠르고 저렴하며 멀티모달(이미지+오디오) 입력을 네이티브로 처리합니다. GPT-4 (turbo)는 텍스트 중심으로 좀 더 안정적인 응답을 줄 수 있습니다.',
  'Q: 프롬프트 인젝션이란? A: 사용자 입력에 악의적 지시("이전 지시 무시")를 넣어 system 제약을 우회하는 공격입니다. 입력 검증, 권한 분리, 출력 검증으로 완화합니다.',
  'Q: 한국어 응답 품질을 높이려면? A: system 메시지에 한국어로 답하라 명시, 한국어 few-shot 예제 제공, 한국어 기본 사전학습이 강한 모델(gpt-4o, Llama 3.1) 선택이 유효합니다.',
].join('\n')

const SYSTEM_PREAMBLE_DEFAULT = '당신은 정확한 정보 전달을 우선시하는 한국어 어시스턴트입니다. 반드시 주어진 컨텍스트만 근거로 답하고, 없으면 "주어진 자료에는 없습니다"라고 답하세요.'

export const LESSON_15_PRESETS: Preset[] = [
  {
    id: 'faq-rag',
    label: 'GenAI FAQ RAG',
    description: '10개 FAQ에서 query에 가장 가까운 답변을 찾아 자연어로 응답',
    values: {
      embeddingModel: 'text-embedding-3-small',
      chatModel: 'gpt-4o',
      query: '환각이 자꾸 일어나는데 어떻게 해결할 수 있나요?',
      corpus: CORPUS_GENAI_FAQ,
      topK: 3,
      systemPreamble: SYSTEM_PREAMBLE_DEFAULT,
      temperature: 0.3,
      max_tokens: 600,
    },
  },
  {
    id: 'top-k-experiment',
    label: 'Top-K 실험',
    description: 'top-K를 1로 줄이면 답변이 좁아지고 5로 늘리면 풍부해짐',
    values: {
      embeddingModel: 'text-embedding-3-small',
      chatModel: 'gpt-4o',
      query: 'fine-tuning과 RAG 중 뭘 선택해야 할까?',
      corpus: CORPUS_GENAI_FAQ,
      topK: 5,
      systemPreamble: SYSTEM_PREAMBLE_DEFAULT,
      temperature: 0.3,
      max_tokens: 600,
    },
  },
  {
    id: 'no-context',
    label: '컨텍스트 부재 (정직 응답 테스트)',
    description: 'corpus에 없는 정보를 물어보면 모델이 정직하게 모른다고 답하는지',
    values: {
      embeddingModel: 'text-embedding-3-small',
      chatModel: 'gpt-4o',
      query: '2026년 4월 기준 GPT-5 출시일이 언제예요?',
      corpus: CORPUS_GENAI_FAQ,
      topK: 3,
      systemPreamble: SYSTEM_PREAMBLE_DEFAULT,
      temperature: 0.0,
      max_tokens: 300,
    },
  },
  {
    id: 'embedding-comparison',
    label: 'small vs large 임베딩 비교',
    description: 'embedding 모델 크기가 retrieval 품질에 미치는 영향',
    values: {
      embeddingModel: 'text-embedding-3-large',
      chatModel: 'gpt-4o-mini',
      query: '내 프롬프트가 안 먹는 것 같아 — 모델이 다른 답을 내요',
      corpus: CORPUS_GENAI_FAQ,
      topK: 3,
      systemPreamble: SYSTEM_PREAMBLE_DEFAULT,
      temperature: 0.5,
      max_tokens: 500,
    },
  },
]

export const lesson15Spec: VariableSpec = {
  kind: 'rag',
  fields: [
    {
      type: 'select',
      name: 'embeddingModel',
      label: '임베딩 모델',
      description: 'small이 빠르고 일반적, large는 미묘한 의미 차이에 유리',
      options: [
        { value: 'text-embedding-3-small', label: 'text-embedding-3-small (1536 dim)' },
        { value: 'text-embedding-3-large', label: 'text-embedding-3-large (3072 dim)' },
      ],
      defaultValue: 'text-embedding-3-small',
    },
    {
      type: 'select',
      name: 'chatModel',
      label: '답변 생성 모델',
      options: GITHUB_MODELS_OPTIONS,
      defaultValue: 'gpt-4o',
    },
    {
      type: 'number',
      name: 'topK',
      label: 'Top-K (검색해서 컨텍스트로 줄 chunk 수)',
      description: '너무 작으면 정보 부족, 너무 크면 노이즈 증가 (3-5 권장)',
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 3,
    },
    {
      type: 'slider',
      name: 'temperature',
      label: 'Temperature',
      description: 'RAG 답변은 0.0~0.4 권장 (사실성 우선)',
      min: 0,
      max: 2,
      step: 0.05,
      defaultValue: 0.3,
    },
    {
      type: 'number',
      name: 'max_tokens',
      label: 'Max tokens',
      min: 50,
      max: 4000,
      step: 50,
      defaultValue: 600,
    },
    {
      type: 'textarea',
      name: 'systemPreamble',
      label: 'System 프리앰블',
      description: '컨텍스트 사용 규칙. "주어진 자료만 사용" / "없으면 모른다고" 같은 제약',
      rows: 3,
      defaultValue: SYSTEM_PREAMBLE_DEFAULT,
    },
    {
      type: 'textarea',
      name: 'query',
      label: '질문',
      placeholder: '자연어 질문을 입력하세요',
      rows: 2,
      defaultValue: '환각이 자꾸 일어나는데 어떻게 해결할 수 있나요?',
    },
    {
      type: 'textarea',
      name: 'corpus',
      label: 'Knowledge base (한 줄에 한 chunk)',
      description: '검색 대상 문서. 빈 줄은 무시.',
      rows: 12,
      defaultValue: CORPUS_GENAI_FAQ,
    },
  ],
  buildRequest: (values): RagRequest => ({
    provider: 'github-models',
    embeddingModel: String(values.embeddingModel ?? 'text-embedding-3-small'),
    chatModel: String(values.chatModel ?? 'gpt-4o'),
    query: String(values.query ?? ''),
    corpus: parseCorpus(String(values.corpus ?? '')),
    topK: Number(values.topK ?? 3),
    systemPreamble: String(values.systemPreamble ?? SYSTEM_PREAMBLE_DEFAULT),
    temperature: Number(values.temperature ?? 0.3),
    max_tokens: Number(values.max_tokens ?? 600),
  }),
  presets: LESSON_15_PRESETS,
  typescriptSnippet: `// 15번 RAG 흐름 — 클라이언트가 직접 retrieval + chat 합성
// 1) query + corpus를 한 번에 임베딩
const embedRes = await fetch('https://models.inference.ai.azure.com/embeddings', {
  method: 'POST',
  headers: { Authorization: \`Bearer \${githubToken}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'text-embedding-3-small',
    input: [query, ...corpus],
  }),
})
const { data } = await embedRes.json()
const [qVec, ...docVecs] = data.map((d) => d.embedding)

// 2) 코사인 유사도 → top-K
const hits = docVecs
  .map((vec, i) => ({ index: i, score: cosineSimilarity(qVec, vec), text: corpus[i] }))
  .sort((a, b) => b.score - a.score)
  .slice(0, topK)

// 3) 검색된 chunk를 system에 주입해 chat
const chatRes = await fetch('https://models.inference.ai.azure.com/chat/completions', {
  method: 'POST',
  headers: { Authorization: \`Bearer \${githubToken}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    stream: true,
    messages: [
      {
        role: 'system',
        content: systemPreamble + '\\n\\n──── 컨텍스트 ────\\n' +
          hits.map((h, i) => \`[\${i+1}] \${h.text}\`).join('\\n\\n'),
      },
      { role: 'user', content: query },
    ],
    temperature: 0.3,
    max_tokens: 600,
  }),
})
`,
}
