export type ImageProvider = 'openai' | 'azure'

export type ImageSize =
  | '256x256'
  | '512x512'
  | '1024x1024'
  | '1024x1792'
  | '1792x1024'

export type ImageRequest = {
  provider: ImageProvider
  /** OpenAI: 'dall-e-3' | 'dall-e-2'. Azure는 deployment 이름. */
  model: string
  prompt: string
  n?: number
  size?: ImageSize
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  /** url(기본)이면 1시간 만료 URL, b64_json은 base64 inline. */
  response_format?: 'url' | 'b64_json'
}

export type GeneratedImage = {
  url?: string
  b64_json?: string
  /** DALL-E 3가 자체적으로 다듬은 프롬프트 (있으면 표시) */
  revised_prompt?: string
}

export type ImageResult = {
  images: GeneratedImage[]
  latencyMs: number
  model: string
}
