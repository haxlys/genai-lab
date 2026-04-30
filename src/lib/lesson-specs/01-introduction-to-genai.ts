import { buildTeacherSpec } from './_teacher-mode'

export const lesson01Spec = buildTeacherSpec({
  lessonContext: '01. 생성형 AI와 LLM 입문 (Introduction to Generative AI and LLMs)',
  presets: [
    {
      id: 'token-basics',
      label: '토큰이 뭐야? 한/영 차이는?',
      question:
        '토큰이 정확히 무엇이고, 같은 길이의 한국어와 영어 문장이 토큰 수가 다르게 계산되는 이유를 예시와 함께 설명해줘.',
    },
    {
      id: 'transformer-analogy',
      label: '트랜스포머를 비유로 설명',
      question:
        '트랜스포머 아키텍처의 핵심 동작(self-attention, FFN, residual connection)을 일상 비유로 설명해줘. 비전공자도 이해할 수 있게.',
    },
    {
      id: 'next-word-prediction',
      label: 'GPT가 어떻게 다음 단어를 예측해?',
      question:
        'GPT 같은 자기회귀 LM이 "다음 단어를 예측"한다는 게 구체적으로 어떤 의미인지, 확률 분포에서 단어를 고르는 단계까지 자세히 풀어줘.',
    },
    {
      id: 'embeddings',
      label: '임베딩 벡터가 뭐야?',
      question:
        '단어/문장 임베딩이 정확히 무엇이고, 그 벡터의 차원(예: 1536)이 어떤 의미인지, 코사인 유사도가 왜 중요한지 알려줘.',
    },
  ],
})
