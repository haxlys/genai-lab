import type { AgentRequest, ChatRequest, RagRequest, SearchRequest } from './llm'
import type { ImageRequest } from './image'

export type LessonType = 'Setup' | 'Learn' | 'Build'

export type ApiCallType = 'chat' | 'image' | 'embedding' | 'function-call' | 'none'

export type Field =
  | {
      type: 'select'
      name: string
      label: string
      description?: string
      options: Array<{ value: string; label: string }>
      defaultValue: string
    }
  | {
      type: 'slider'
      name: string
      label: string
      description?: string
      min: number
      max: number
      step: number
      defaultValue: number
    }
  | {
      type: 'number'
      name: string
      label: string
      description?: string
      min?: number
      max?: number
      step?: number
      defaultValue: number
    }
  | {
      type: 'textarea'
      name: string
      label: string
      description?: string
      placeholder?: string
      rows?: number
      defaultValue: string
    }
  | {
      type: 'json'
      name: string
      label: string
      description?: string
      schemaHint?: string
      defaultValue: string
    }

export type Preset = {
  id: string
  label: string
  description?: string
  values: Record<string, unknown>
}

/** spec.kind에 따라 buildRequest 반환 타입과 RunPanel 분기 결정. 기본값 'chat'. */
export type VariableSpec =
  | {
      kind?: 'chat'
      fields: Field[]
      buildRequest: (values: Record<string, unknown>) => ChatRequest
      typescriptSnippet?: string
      presets?: Preset[]
    }
  | {
      kind: 'image'
      fields: Field[]
      buildRequest: (values: Record<string, unknown>) => ImageRequest
      typescriptSnippet?: string
      presets?: Preset[]
    }
  | {
      kind: 'embedding'
      fields: Field[]
      buildRequest: (values: Record<string, unknown>) => SearchRequest
      typescriptSnippet?: string
      presets?: Preset[]
    }
  | {
      kind: 'rag'
      fields: Field[]
      buildRequest: (values: Record<string, unknown>) => RagRequest
      typescriptSnippet?: string
      presets?: Preset[]
    }
  | {
      kind: 'agent'
      fields: Field[]
      buildRequest: (values: Record<string, unknown>) => AgentRequest
      typescriptSnippet?: string
      presets?: Preset[]
    }

/** Lesson metadata + content. JSON-serializable subset (no functions). */
export type LessonContent = {
  id: string
  number: number
  title: string
  titleEn: string
  type: LessonType
  weekRecommended: 1 | 2 | 3 | 4 | null
  apiCallType: ApiCallType
  contentMarkdown: string
  pythonReference: string | null
  typescriptReference: string | null
  /** Whether `lesson-specs/<id>.ts` exists (i.e. interactive panel available). */
  hasVariableSpec: boolean
  /**
   * 빌드 타임에 산출된 이미지 폴백 매핑. key는 markdown에서 참조된 원본 src
   * (예: `../../../translated_images/ko/foo.webp`), value는 폴백 src
   * (영문 원본 이미지로 대체된 경로). resolveImageSrc가 우선 적용한다.
   */
  imageMap?: Record<string, string>
}

/** Compact entry for the lessons grid — no full markdown body. */
export type LessonSummary = Omit<LessonContent, 'contentMarkdown' | 'pythonReference' | 'typescriptReference'>
