/**
 * GitHub Models에서 사용 가능한 chat 모델들. 카탈로그가 자주 바뀌므로 정기 업데이트 필요.
 * https://github.com/marketplace/models 참고.
 */
export const GITHUB_MODELS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'gpt-4o', label: 'OpenAI gpt-4o (전반적으로 강력)' },
  { value: 'gpt-4o-mini', label: 'OpenAI gpt-4o-mini (빠르고 저렴)' },
  { value: 'Mistral-large-2411', label: 'Mistral Large (2024.11)' },
  { value: 'Mistral-Nemo', label: 'Mistral Nemo (12B)' },
  { value: 'Mistral-small', label: 'Mistral Small' },
  { value: 'Meta-Llama-3.1-70B-Instruct', label: 'Llama 3.1 70B Instruct' },
  { value: 'Meta-Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B Instruct (가장 빠름)' },
  { value: 'Phi-3.5-mini-instruct', label: 'Phi-3.5 Mini Instruct' },
  { value: 'Cohere-command-r-plus', label: 'Cohere Command R+' },
  { value: 'AI21-Jamba-1.5-Large', label: 'AI21 Jamba 1.5 Large' },
]
