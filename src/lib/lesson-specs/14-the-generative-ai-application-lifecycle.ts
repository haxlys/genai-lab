import { buildTeacherSpec } from './_teacher-mode'

export const lesson14Spec = buildTeacherSpec({
  lessonContext: '14. 생성형 AI 앱 라이프사이클 (LLMOps)',
  presets: [
    {
      id: 'eval-strategy',
      label: 'LLM 앱 평가 방법',
      question:
        'LLM 애플리케이션을 평가하는 방법을 단계별로 알려줘: offline benchmark, golden dataset, human-in-the-loop, A/B test 각각의 역할과 시점.',
    },
    {
      id: 'regression-test',
      label: '프롬프트 변경 시 회귀 테스트',
      question:
        '프롬프트 한 줄을 바꿨을 때 회귀를 잡는 실용적 테스트 전략(고정 입력 세트, LLM-as-judge, 통계 검정)을 어떻게 자동화할 수 있는지 설명해줘.',
    },
    {
      id: 'cost-monitoring',
      label: '비용 모니터링',
      question:
        'LLM API 비용을 모니터링하고 통제하는 실용적 방법(token logging, cost per user, budget alert, semantic cache, 작은 모델 fallback)을 알려줘.',
    },
    {
      id: 'observability',
      label: '관측성(observability) 셋업',
      question:
        'LLM 앱에서 꼭 추적해야 할 시그널(latency, token usage, tool calls, fallback rate, user feedback)과 추적 도구(LangSmith, OpenTelemetry, custom)를 비교해줘.',
    },
  ],
})
