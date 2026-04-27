import type { ChatRequest } from './llm'

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

export type VariableSpec = {
  fields: Field[]
  buildRequest: (values: Record<string, unknown>) => ChatRequest
  /** Optional override of the synthesized TypeScript reference shown to users. */
  typescriptSnippet?: string
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
}

/** Compact entry for the lessons grid — no full markdown body. */
export type LessonSummary = Omit<LessonContent, 'contentMarkdown' | 'pythonReference' | 'typescriptReference'>
