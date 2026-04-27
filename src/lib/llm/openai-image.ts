/**
 * OpenAI image generation 어댑터 — DALL-E 2/3.
 * 호출: POST https://api.openai.com/v1/images/generations
 */

import type { ImageRequest, ImageResult } from '#/types/image'

const OPENAI_IMAGES_ENDPOINT = 'https://api.openai.com/v1/images/generations'

export async function generateImageOpenAi(
  request: ImageRequest,
  options: { apiKey: string; signal?: AbortSignal },
): Promise<ImageResult> {
  if (!options.apiKey) {
    throw new Error(
      'OpenAI API 키가 설정되지 않았습니다. Settings 페이지에서 OPENAI_API_KEY를 입력하세요.',
    )
  }
  const start = performance.now()
  const body: Record<string, unknown> = {
    model: request.model,
    prompt: request.prompt,
    n: request.n ?? 1,
  }
  if (request.size) body.size = request.size
  if (request.quality) body.quality = request.quality
  if (request.style) body.style = request.style
  if (request.response_format) body.response_format = request.response_format

  const response = await fetch(OPENAI_IMAGES_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: options.signal,
  })

  if (!response.ok) {
    const text = await safeText(response)
    throw new Error(
      `OpenAI Images ${response.status}: ${response.statusText}\n${text.slice(0, 500)}`,
    )
  }

  const json = (await response.json()) as {
    created: number
    data: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>
  }
  return {
    images: json.data.map((d) => ({
      url: d.url,
      b64_json: d.b64_json,
      revised_prompt: d.revised_prompt,
    })),
    latencyMs: Math.round(performance.now() - start),
    model: request.model,
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}
