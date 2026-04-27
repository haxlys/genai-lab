/**
 * 레슨 09: 이미지 생성 앱 — DALL-E 2/3.
 *
 * GitHub Models는 DALL-E를 지원하지 않으므로 OpenAI direct API 사용.
 * Settings에 OPENAI_API_KEY 필요. (Azure는 v2.)
 *
 * 원본: 09-building-image-applications/python/aoai-app.py — Bunny on horse,
 * holding a lollipop, on a foggy meadow...
 */

import type { Preset, VariableSpec } from '#/types/lesson'
import type { ImageRequest } from '#/types/image'

const PROMPT_DEFAULT =
  'Bunny on horse, holding a lollipop, on a foggy meadow where it grows daffodils. It says "hello"'

export const LESSON_09_PRESETS: Preset[] = [
  {
    id: 'original-bunny',
    label: '원본 노트북: Bunny on horse',
    description: 'aoai-app.py의 기본 프롬프트 — 동화풍 디테일 풍부',
    values: {
      model: 'dall-e-3',
      prompt: PROMPT_DEFAULT,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
      n: 1,
    },
  },
  {
    id: 'photo-realism',
    label: 'Photo-realism (style=natural)',
    description: 'natural 스타일 + hd quality로 사실적 이미지',
    values: {
      model: 'dall-e-3',
      prompt:
        'A close-up portrait of a Korean tabby cat sitting on a windowsill, soft morning light, shallow depth of field, photorealistic',
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
      n: 1,
    },
  },
  {
    id: 'illustration',
    label: '일러스트 / 동화책 스타일',
    description: 'vivid 스타일이 만화·일러스트에 강함',
    values: {
      model: 'dall-e-3',
      prompt:
        '한복을 입은 어린 아이가 보름달 아래 토끼와 함께 떡을 빚는 모습, 한국 전통 동화책 일러스트 스타일, 따뜻한 색감',
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
      n: 1,
    },
  },
  {
    id: 'wide-aspect',
    label: 'Wide aspect (1792x1024)',
    description: 'DALL-E 3는 와이드/세로 비율 지원. 풍경 사진 같은 출력에 유용',
    values: {
      model: 'dall-e-3',
      prompt:
        'A panoramic view of Seoul at sunset from Namsan tower, cinematic lighting, hazy atmosphere',
      size: '1792x1024',
      quality: 'standard',
      style: 'vivid',
      n: 1,
    },
  },
]

export const lesson09Spec: VariableSpec = {
  kind: 'image',
  fields: [
    {
      type: 'select',
      name: 'model',
      label: '모델',
      description: 'DALL-E 3 권장 (DALL-E 2는 더 저렴하지만 품질 떨어짐). gpt-image-1은 OpenAI 신모델 (조직 verified 필요).',
      options: [
        { value: 'dall-e-3', label: 'DALL-E 3 (권장)' },
        { value: 'dall-e-2', label: 'DALL-E 2 (저렴)' },
        { value: 'gpt-image-1', label: 'gpt-image-1 (OpenAI 신모델)' },
      ],
      defaultValue: 'dall-e-3',
    },
    {
      type: 'select',
      name: 'size',
      label: 'Size',
      description: 'DALL-E 3는 1024² 정사각 + 와이드/세로 지원. DALL-E 2는 256/512/1024² 정사각만.',
      options: [
        { value: '1024x1024', label: '1024 × 1024 (정사각)' },
        { value: '1024x1792', label: '1024 × 1792 (세로)' },
        { value: '1792x1024', label: '1792 × 1024 (가로)' },
        { value: '512x512', label: '512 × 512 (DALL-E 2)' },
        { value: '256x256', label: '256 × 256 (DALL-E 2)' },
      ],
      defaultValue: '1024x1024',
    },
    {
      type: 'select',
      name: 'quality',
      label: 'Quality',
      description: 'hd는 더 정교하지만 ~2배 비용 (DALL-E 3 only)',
      options: [
        { value: 'standard', label: 'standard' },
        { value: 'hd', label: 'hd' },
      ],
      defaultValue: 'standard',
    },
    {
      type: 'select',
      name: 'style',
      label: 'Style',
      description: 'vivid: 만화/일러스트적, 강렬한 색감. natural: 사진적, 자연스러움 (DALL-E 3 only)',
      options: [
        { value: 'vivid', label: 'vivid (선명·일러스트)' },
        { value: 'natural', label: 'natural (사실적·사진)' },
      ],
      defaultValue: 'vivid',
    },
    {
      type: 'number',
      name: 'n',
      label: '생성 개수 (n)',
      description: 'DALL-E 3는 1만 가능. DALL-E 2는 1~10.',
      min: 1,
      max: 10,
      step: 1,
      defaultValue: 1,
    },
    {
      type: 'textarea',
      name: 'prompt',
      label: '이미지 프롬프트',
      description: '구체적일수록 결과가 좋음 — 피사체 + 환경 + 조명/각도 + 스타일 단서.',
      placeholder: PROMPT_DEFAULT,
      rows: 6,
      defaultValue: PROMPT_DEFAULT,
    },
  ],
  buildRequest: (values): ImageRequest => ({
    provider: 'openai',
    model: String(values.model ?? 'dall-e-3'),
    prompt: String(values.prompt ?? PROMPT_DEFAULT),
    size: (values.size as ImageRequest['size']) ?? '1024x1024',
    quality: (values.quality as ImageRequest['quality']) ?? 'standard',
    style: (values.style as ImageRequest['style']) ?? 'vivid',
    n: Number(values.n ?? 1),
    response_format: 'url',
  }),
  presets: LESSON_09_PRESETS,
  typescriptSnippet: `// genai-lab이 09번에서 호출하는 OpenAI Images API 등가 코드
const response = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${openaiKey}\`,    // ← Settings의 OPENAI_API_KEY
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'dall-e-3',
    prompt: 'Bunny on horse, holding a lollipop...',
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
    n: 1,
    response_format: 'url',
  }),
})

const json = await response.json()
// json.data = [{ url, revised_prompt }]
// DALL-E 3는 사용자 프롬프트를 자체적으로 다듬어 revised_prompt로 알려줌
`,
}
