import { buildTeacherSpec } from './_teacher-mode'

export const lesson03Spec = buildTeacherSpec({
  lessonContext: '03. 책임 있는 생성형 AI (Using Generative AI Responsibly)',
  presets: [
    {
      id: 'why-hallucinate',
      label: '환각이 왜 일어나?',
      question:
        '왜 LLM이 사실이 아닌 내용을 그럴듯하게 만들어내는지(환각), 학습 단계와 추론 단계에서 각각 어떤 원인이 있는지 설명해줘.',
    },
    {
      id: 'bias-mitigation',
      label: 'AI 편향 사례와 완화',
      question:
        '실제 LLM에서 관찰된 편향 사례(성별, 인종, 직업 등)를 한 가지 예로 들어주고, 완화하기 위한 기법(데이터 선별, RLHF, system prompt 등)을 설명해줘.',
    },
    {
      id: 'content-filter',
      label: '콘텐츠 필터링 동작 원리',
      question:
        'Azure OpenAI나 OpenAI의 콘텐츠 필터(content filtering)가 어떤 카테고리(폭력, 성, 자해 등)를 어떻게 차단하는지, false positive/negative는 어떻게 다루는지 설명해줘.',
    },
    {
      id: 'red-team',
      label: 'AI red team이 뭐야?',
      question:
        'AI red teaming이 정확히 무엇을 하는지, 일반 보안 red team과 어떻게 다른지, 학습자가 가볍게 시도해볼 수 있는 red team 시나리오 예시를 들어줘.',
    },
  ],
})
