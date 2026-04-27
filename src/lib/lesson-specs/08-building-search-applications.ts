/**
 * 레슨 08: 시맨틱 검색 — 임베딩 + 코사인 유사도.
 *
 * 사용자가 query + corpus(한 줄 1개)를 입력하면 query를 한 번, corpus 전체를
 * 한 번 임베딩해서 cosine similarity로 정렬. top-k 결과를 점수와 함께 표시.
 *
 * GitHub Models의 text-embedding-3-small (1536 dim) 사용.
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { SearchRequest } from '#/types/llm'

// 사이드 분리: 줄바꿈으로 구분된 corpus 텍스트를 배열로
function parseCorpus(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const CORPUS_MICROSOFT_LEARN = [
  '생성형 AI는 텍스트, 이미지, 오디오 등 새로운 콘텐츠를 만들어내는 AI입니다. GPT-4와 DALL-E가 대표적입니다.',
  'Azure OpenAI Service는 Azure 클라우드에서 OpenAI의 모델을 사용할 수 있게 해줍니다. 기업 보안과 컴플라이언스를 제공합니다.',
  'LangChain은 LLM 애플리케이션을 빠르게 만들 수 있게 해주는 프레임워크입니다. 체인, 에이전트, 메모리 등의 추상화를 제공합니다.',
  '벡터 데이터베이스는 임베딩 벡터를 저장하고 유사도 검색을 빠르게 수행합니다. Pinecone, Chroma, Qdrant 등이 있습니다.',
  '프롬프트 엔지니어링은 LLM에서 원하는 출력을 얻기 위해 프롬프트를 설계하는 기술입니다. system 메시지, few-shot 예제, chain-of-thought 등이 핵심입니다.',
  'RAG(Retrieval Augmented Generation)는 외부 지식을 검색해 LLM에 제공하는 패턴입니다. 환각(hallucination)을 줄이고 최신 정보를 활용할 수 있게 합니다.',
  'Function calling을 사용하면 LLM이 외부 도구나 API를 호출할 수 있습니다. JSON schema로 함수를 정의하면 모델이 적절한 시점에 호출합니다.',
  '이미지 생성 모델 DALL-E는 텍스트 프롬프트로부터 이미지를 만듭니다. 정사각형/세로/가로 비율을 지원하며, vivid와 natural 두 가지 스타일이 있습니다.',
  'Phi-3는 Microsoft의 Small Language Model(SLM)입니다. 작은 크기에도 강력한 추론 능력을 보여주며, 엣지 디바이스 배포에 적합합니다.',
  'Llama 3는 Meta가 공개한 오픈소스 LLM입니다. 8B, 70B, 405B 사이즈가 있으며 상업적 사용이 가능합니다.',
].join('\n')

export const LESSON_08_PRESETS: Preset[] = [
  {
    id: 'msl-rag',
    label: 'MS Learn 코퍼스: "RAG가 뭐야?"',
    description: '10개 문장 중 RAG 관련 문장이 가장 위로 올라오는지 확인',
    values: {
      model: 'text-embedding-3-small',
      query: 'RAG가 뭐야? 왜 사용해?',
      corpus: CORPUS_MICROSOFT_LEARN,
      topK: 3,
    },
  },
  {
    id: 'msl-image',
    label: 'MS Learn 코퍼스: "이미지 만들기"',
    description: 'DALL-E 관련 문장을 찾아내는지',
    values: {
      model: 'text-embedding-3-small',
      query: '텍스트로 그림을 만들고 싶어',
      corpus: CORPUS_MICROSOFT_LEARN,
      topK: 3,
    },
  },
  {
    id: 'msl-edge',
    label: 'MS Learn 코퍼스: "모바일에서 돌릴 수 있는 모델"',
    description: 'Phi(SLM) 관련 문장이 1위로 올라와야 함',
    values: {
      model: 'text-embedding-3-small',
      query: '모바일이나 엣지 디바이스에서 작은 LLM을 돌리고 싶다',
      corpus: CORPUS_MICROSOFT_LEARN,
      topK: 3,
    },
  },
  {
    id: 'small-large',
    label: 'small vs large 비교',
    description: 'embedding 모델 크기에 따라 결과 순서가 달라지는지 — small과 large로 두 번 Run',
    values: {
      model: 'text-embedding-3-large',
      query: '오픈소스 모델로 무료로 LLM을 쓰고 싶어',
      corpus: CORPUS_MICROSOFT_LEARN,
      topK: 5,
    },
  },
]

export const lesson08Spec: VariableSpec = {
  kind: 'embedding',
  fields: [
    {
      type: 'select',
      name: 'model',
      label: '임베딩 모델',
      description: 'small(1536d, 빠름) vs large(3072d, 정확). 같은 query로 두 모델 비교 권장.',
      options: [
        { value: 'text-embedding-3-small', label: 'text-embedding-3-small (1536 dim)' },
        { value: 'text-embedding-3-large', label: 'text-embedding-3-large (3072 dim)' },
      ],
      defaultValue: 'text-embedding-3-small',
    },
    {
      type: 'number',
      name: 'topK',
      label: 'Top-K (반환할 결과 개수)',
      min: 1,
      max: 20,
      step: 1,
      defaultValue: 3,
    },
    {
      type: 'textarea',
      name: 'query',
      label: '검색 쿼리',
      description: '한 문장의 자연어 질문',
      placeholder: 'RAG가 뭐야?',
      rows: 2,
      defaultValue: 'RAG가 뭐야? 왜 사용해?',
    },
    {
      type: 'textarea',
      name: 'corpus',
      label: 'Corpus (한 줄에 한 문장/문서)',
      description: '검색 대상 문장들. 빈 줄은 무시됨.',
      placeholder: '문장 1\n문장 2\n...',
      rows: 12,
      defaultValue: CORPUS_MICROSOFT_LEARN,
    },
  ],
  buildRequest: (values): SearchRequest => ({
    provider: 'github-models',
    model: String(values.model ?? 'text-embedding-3-small'),
    query: String(values.query ?? ''),
    corpus: parseCorpus(String(values.corpus ?? '')),
    topK: Number(values.topK ?? 3),
  }),
  presets: LESSON_08_PRESETS,
  typescriptSnippet: `// 08번에서 호출하는 임베딩 검색 등가 코드
const response = await fetch('https://models.inference.ai.azure.com/embeddings', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${githubToken}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'text-embedding-3-small',
    input: [query, ...corpus],   // 한 번의 호출로 query + corpus 전부
  }),
})

const { data } = await response.json()
const [queryVec, ...docVecs] = data.map((d) => d.embedding)

// 코사인 유사도 → 정렬 → top-K
const hits = docVecs
  .map((vec, i) => ({ index: i, score: cosineSimilarity(queryVec, vec), text: corpus[i] }))
  .sort((a, b) => b.score - a.score)
  .slice(0, topK)
`,
}
