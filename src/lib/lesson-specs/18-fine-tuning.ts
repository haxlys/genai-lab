import { buildTeacherSpec } from './_teacher-mode'

export const lesson18Spec = buildTeacherSpec({
  lessonContext: '18. 파인튜닝 (Fine-tuning)',
  presets: [
    {
      id: 'ft-vs-rag',
      label: 'Fine-tuning vs RAG 결정 기준',
      question:
        '언제 fine-tuning을 하고 언제 RAG로 충분한지 결정 기준을 알려줘. 비용/유지보수/품질 측면에서 비교하고 하이브리드 패턴도 설명해줘.',
    },
    {
      id: 'dataset',
      label: '데이터셋 준비 핵심 원칙',
      question:
        'fine-tuning 데이터셋을 준비할 때 핵심 원칙(분량, 균형, 라벨링 일관성, eval split, deduplication, 형식)을 실용 팁과 함께 알려줘.',
    },
    {
      id: 'eval-metrics',
      label: '평가 지표 (perplexity, BLEU, custom)',
      question:
        'fine-tuned 모델 평가에 쓰이는 자동 지표들(perplexity, BLEU, ROUGE, exact match, LLM-as-judge)의 한계와 어떤 경우에 어떤 걸 쓰는지 설명해줘.',
    },
    {
      id: 'lora-vs-full',
      label: 'LoRA / QLoRA vs full fine-tuning',
      question:
        'LoRA, QLoRA 같은 PEFT(parameter-efficient) 기법이 full fine-tuning과 어떻게 다른지, 비용/품질 trade-off를 알려줘.',
    },
  ],
})
