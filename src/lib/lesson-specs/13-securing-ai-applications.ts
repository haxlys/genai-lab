import { buildTeacherSpec } from './_teacher-mode'

export const lesson13Spec = buildTeacherSpec({
  lessonContext: '13. AI 앱 보안 (Securing AI Applications)',
  presets: [
    {
      id: 'prompt-injection',
      label: '프롬프트 인젝션이 뭐야?',
      question:
        '프롬프트 인젝션(direct, indirect)을 구체적인 예시 두 개와 함께 설명하고, 각각 어떤 흐름으로 system prompt를 무시시킬 수 있는지 보여줘.',
    },
    {
      id: 'system-leak',
      label: 'system 메시지 누출 위험',
      question:
        'system prompt가 사용자에게 누출되는 위험과 그 영향, 누출을 줄이는 방어 기법(스코프 제한, output filtering, 별도 모델 검증 등)을 설명해줘.',
    },
    {
      id: 'pii-masking',
      label: '민감 정보 마스킹 패턴',
      question:
        'LLM에 보내는 입력에서 PII(개인 식별 정보)를 마스킹하는 패턴 3가지(regex 사전 처리, 별도 NER 모델, 로컬 ditto 등)를 비교해줘.',
    },
    {
      id: 'output-validation',
      label: '출력 검증/sanitization',
      question:
        'LLM 출력을 그대로 UI에 렌더하면 안 되는 이유(XSS, 명령어 주입)와 안전하게 검증/sanitize하는 방법을 코드 예시와 함께 알려줘.',
    },
  ],
})
