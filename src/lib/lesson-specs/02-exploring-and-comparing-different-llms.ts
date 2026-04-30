import { buildTeacherSpec } from './_teacher-mode'

export const lesson02Spec = buildTeacherSpec({
  lessonContext: '02. 다양한 LLM 탐색과 비교 (Exploring and Comparing Different LLMs)',
  presets: [
    {
      id: 'gpt-vs-claude-vs-llama',
      label: 'gpt-4o vs Claude Opus vs Llama 70B',
      question:
        'gpt-4o, Claude Opus, Llama 70B의 강점/약점을 추론력, 코드, 한국어, 비용, 컨텍스트 길이 측면에서 비교해줘.',
    },
    {
      id: 'open-vs-closed',
      label: '오픈소스 vs 폐쇄형 trade-off',
      question:
        '오픈소스 모델(Llama, Mistral)과 폐쇄형 API 모델(GPT, Claude)을 선택할 때 trade-off는 무엇인지, 어떤 use case에서 어느 쪽이 유리한지 설명해줘.',
    },
    {
      id: 'choose-for-usecase',
      label: '내 use case면 어떤 모델?',
      question:
        '다음 use case들에서 어떤 모델을 추천할지 이유와 함께 알려줘: 1) 한국어 코딩 어시스턴트 2) 사내 문서 RAG 3) 모바일 앱의 대화 챗봇 4) 이미지 캡셔닝',
    },
    {
      id: 'foundation-vs-finetuned',
      label: 'Foundation 모델 vs Fine-tuned',
      question:
        'foundation model과 fine-tuned 모델의 차이, 그리고 instruction-tuned/chat-tuned가 정확히 어떤 변형인지 설명해줘.',
    },
  ],
})
