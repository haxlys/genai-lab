import { buildTeacherSpec } from './_teacher-mode'

export const lesson12Spec = buildTeacherSpec({
  lessonContext: '12. AI 앱 UX 설계 (Designing UX for AI Applications)',
  presets: [
    {
      id: 'slow-response-ux',
      label: 'AI 응답이 느릴 때 UX 패턴',
      question:
        'LLM 응답이 5-30초 걸릴 때 사용자가 답답하지 않게 만드는 UX 패턴 5가지를 구체적 예시와 함께 알려줘 (스켈레톤, 스트리밍, 단계별 표시 등).',
    },
    {
      id: 'uncertainty-ux',
      label: '불확실한 답변을 어떻게 알리지?',
      question:
        'AI가 확신이 없는 답변을 사용자에게 어떻게 표시하는 게 좋은지(citation, confidence bar, "잘 모르겠습니다" 톤 등) 패턴을 정리해줘.',
    },
    {
      id: 'recovery-flow',
      label: 'AI 실수에 대한 복구 흐름',
      question:
        'AI가 실수했을 때 사용자가 쉽게 정정하고 다시 시도할 수 있는 UI 흐름을 설계하는 방법(undo, regenerate, edit prompt, feedback button)을 예시로 설명해줘.',
    },
    {
      id: 'discovery',
      label: 'AI 기능을 사용자가 발견하게',
      question:
        '신규 사용자가 AI 기능의 능력과 한계를 빠르게 이해하도록 돕는 onboarding/discovery 패턴(예시 프롬프트, capability cards, hint 등)을 알려줘.',
    },
  ],
})
