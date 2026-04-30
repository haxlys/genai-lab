/**
 * sync-content — 원본 generative-ai-for-beginners 레포에서 한국어 강의 본문과
 * Python/TypeScript 코드를 읽어 content/lessons/<id>.json으로 스냅샷한다.
 *
 * 사용:
 *   pnpm sync-content
 *
 * 환경 변수:
 *   SOURCE_REPO_PATH (기본값: ../generative-ai-for-beginners)
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// ESM __dirname 대체
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// ---- 경로 설정 ----
const ROOT = resolve(__dirname, '..')
const SOURCE_REPO = resolve(
  ROOT,
  process.env.SOURCE_REPO_PATH ?? '../generative-ai-for-beginners',
)
const OUTPUT_DIR = join(ROOT, 'content', 'lessons')

// ---- 22개 레슨 메타데이터 매핑 ----
// LEARNING_GUIDE.ko.md의 4주 학습 경로 + 사용자 분석 보고서 기반.
type LessonType = 'Setup' | 'Learn' | 'Build'
type ApiCallType = 'chat' | 'image' | 'embedding' | 'function-call' | 'none'

type LessonMeta = {
  id: string
  number: number
  title: string
  titleEn: string
  type: LessonType
  weekRecommended: 1 | 2 | 3 | 4 | null
  apiCallType: ApiCallType
}

const LESSONS: LessonMeta[] = [
  { id: '00-course-setup', number: 0, title: '환경 설정', titleEn: 'Course Setup', type: 'Setup', weekRecommended: null, apiCallType: 'none' },
  { id: '01-introduction-to-genai', number: 1, title: '생성형 AI와 LLM 입문', titleEn: 'Introduction to Generative AI and LLMs', type: 'Learn', weekRecommended: 1, apiCallType: 'none' },
  { id: '02-exploring-and-comparing-different-llms', number: 2, title: '다양한 LLM 탐색과 비교', titleEn: 'Exploring and Comparing Different LLMs', type: 'Learn', weekRecommended: null, apiCallType: 'none' },
  { id: '03-using-generative-ai-responsibly', number: 3, title: '책임 있는 생성형 AI 사용', titleEn: 'Using Generative AI Responsibly', type: 'Learn', weekRecommended: 4, apiCallType: 'none' },
  { id: '04-prompt-engineering-fundamentals', number: 4, title: '프롬프트 엔지니어링 기초', titleEn: 'Prompt Engineering Fundamentals', type: 'Learn', weekRecommended: 1, apiCallType: 'chat' },
  { id: '05-advanced-prompts', number: 5, title: '고급 프롬프트 (Chain-of-Thought)', titleEn: 'Creating Advanced Prompts', type: 'Learn', weekRecommended: 1, apiCallType: 'chat' },
  { id: '06-text-generation-apps', number: 6, title: '텍스트 생성 앱 만들기', titleEn: 'Building Text Generation Applications', type: 'Build', weekRecommended: 1, apiCallType: 'chat' },
  { id: '07-building-chat-applications', number: 7, title: '챗 애플리케이션 만들기', titleEn: 'Building Chat Applications', type: 'Build', weekRecommended: 2, apiCallType: 'chat' },
  { id: '08-building-search-applications', number: 8, title: '시맨틱 검색 앱 만들기', titleEn: 'Building Search Applications', type: 'Build', weekRecommended: 3, apiCallType: 'embedding' },
  { id: '09-building-image-applications', number: 9, title: '이미지 생성 앱 만들기', titleEn: 'Building Image Generation Applications', type: 'Build', weekRecommended: 2, apiCallType: 'image' },
  { id: '10-building-low-code-ai-applications', number: 10, title: '로우코드 AI 앱', titleEn: 'Building Low Code AI Applications', type: 'Build', weekRecommended: null, apiCallType: 'none' },
  { id: '11-integrating-with-function-calling', number: 11, title: '함수 호출(Function Calling) 통합', titleEn: 'Integrating with Function Calling', type: 'Build', weekRecommended: 2, apiCallType: 'function-call' },
  { id: '12-designing-ux-for-ai-applications', number: 12, title: 'AI 앱 UX 설계', titleEn: 'Designing UX for AI Applications', type: 'Learn', weekRecommended: 2, apiCallType: 'none' },
  { id: '13-securing-ai-applications', number: 13, title: 'AI 앱 보안', titleEn: 'Securing Your Generative AI Applications', type: 'Learn', weekRecommended: 4, apiCallType: 'none' },
  { id: '14-the-generative-ai-application-lifecycle', number: 14, title: '생성형 AI 앱 라이프사이클', titleEn: 'The Generative AI Application Lifecycle', type: 'Learn', weekRecommended: 4, apiCallType: 'none' },
  { id: '15-rag-and-vector-databases', number: 15, title: 'RAG와 벡터 데이터베이스', titleEn: 'Retrieval Augmented Generation (RAG) and Vector Databases', type: 'Build', weekRecommended: 3, apiCallType: 'chat' },
  { id: '16-open-source-models', number: 16, title: '오픈소스 모델', titleEn: 'Open Source Models', type: 'Build', weekRecommended: null, apiCallType: 'chat' },
  { id: '17-ai-agents', number: 17, title: 'AI 에이전트', titleEn: 'AI Agents', type: 'Build', weekRecommended: 3, apiCallType: 'function-call' },
  { id: '18-fine-tuning', number: 18, title: '파인튜닝', titleEn: 'Fine-tuning Your LLM', type: 'Learn', weekRecommended: 4, apiCallType: 'none' },
  { id: '19-slm', number: 19, title: 'SLM (소형 언어 모델)', titleEn: 'Building with SLMs', type: 'Learn', weekRecommended: null, apiCallType: 'chat' },
  { id: '20-mistral', number: 20, title: 'Mistral 모델', titleEn: 'Building with Mistral Models', type: 'Learn', weekRecommended: null, apiCallType: 'chat' },
  { id: '21-meta', number: 21, title: 'Meta 모델 (Llama)', titleEn: 'Building with Meta Models', type: 'Learn', weekRecommended: null, apiCallType: 'chat' },
]

// ---- 어떤 lesson-spec이 존재하는지(=hasVariableSpec) 확인 ----
async function hasLessonSpec(lessonId: string): Promise<boolean> {
  const specPath = join(ROOT, 'src', 'lib', 'lesson-specs', `${lessonId}.ts`)
  try {
    await stat(specPath)
    return true
  } catch {
    return false
  }
}

/**
 * 마크다운 cleanup:
 * 1. HTML 주석 제거 (<!-- ... -->) — 원본에 LESSON TEMPLATE / CO-OP TRANSLATOR
 *    DISCLAIMER START/END 같은 편집용 메타가 그대로 노출됨. 학습자에게 무가치.
 * 2. 연속 빈 줄을 1개로 압축.
 */
function cleanupMarkdown(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ---- 한국어 본문 읽기 (없으면 영문 원본 README로 폴백) ----
async function readKoreanReadme(lessonId: string): Promise<string> {
  const koPath = join(SOURCE_REPO, 'translations', 'ko', lessonId, 'README.md')
  if (existsSync(koPath)) {
    return cleanupMarkdown(await readFile(koPath, 'utf-8'))
  }
  const enPath = join(SOURCE_REPO, lessonId, 'README.md')
  if (existsSync(enPath)) {
    console.warn(`  ⚠ ${lessonId}: 한국어 번역 없음, 영문 원본 사용`)
    return cleanupMarkdown(await readFile(enPath, 'utf-8'))
  }
  console.warn(`  ⚠ ${lessonId}: README.md 없음`)
  return ''
}

/**
 * 검색 인덱스용으로 마크다운에서 코드 펜스/이미지/링크/HTML을 제거하고 본문 텍스트만 남김.
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*#+\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

type SearchEntry = {
  id: string
  number: number
  title: string
  titleEn: string
  body: string
}

/**
 * Jupyter notebook(.ipynb)에서 Python 코드 셀들을 추출해 단일 .py 표현으로 결합.
 * 마크다운 셀은 # 주석 블록으로 변환해 학습 흐름을 유지.
 */
function notebookToPython(raw: string): string {
  let nb: { cells: Array<{ cell_type: string; source: string | string[] }> }
  try {
    nb = JSON.parse(raw)
  } catch {
    return ''
  }
  const out: string[] = []
  for (const cell of nb.cells ?? []) {
    const src = Array.isArray(cell.source) ? cell.source.join('') : cell.source
    if (!src) continue
    if (cell.cell_type === 'markdown') {
      // 마크다운 셀 → # 주석 블록 (학습용 컨텍스트 유지)
      const commented = src
        .split('\n')
        .map((l) => `# ${l}`)
        .join('\n')
      out.push(`# ── markdown ──────────────────────────────\n${commented}\n`)
    } else if (cell.cell_type === 'code') {
      out.push(src.replace(/\n+$/, '') + '\n')
    }
  }
  return out.join('\n')
}

// ---- Python 코드 우선순위: .py 먼저, 없으면 .ipynb 결합 ----
async function readPythonReference(lessonId: string): Promise<string | null> {
  const pythonDir = join(SOURCE_REPO, lessonId, 'python')
  if (!existsSync(pythonDir)) return null

  const files = await readdir(pythonDir)
  const pyFiles = files.filter((f) => f.endsWith('.py'))
  const nbFiles = files.filter((f) => f.endsWith('.ipynb'))

  // 1) .py가 있으면 우선순위로 선택
  if (pyFiles.length > 0) {
    const priorities = ['githubmodels-app.py', 'oai-app.py', 'aoai-app.py']
    for (const name of priorities) {
      if (pyFiles.includes(name)) {
        return await readFile(join(pythonDir, name), 'utf-8')
      }
    }
    pyFiles.sort()
    return await readFile(join(pythonDir, pyFiles[0]), 'utf-8')
  }

  // 2) .py가 없으면 .ipynb를 파싱해서 코드 셀 결합
  if (nbFiles.length > 0) {
    const priorities = [
      'githubmodels-assignment.ipynb',
      'githubmodels-assignment-simple.ipynb',
      'oai-assignment.ipynb',
      'aoai-assignment.ipynb',
    ]
    let chosen: string | undefined
    for (const name of priorities) {
      if (nbFiles.includes(name)) {
        chosen = name
        break
      }
    }
    if (!chosen) {
      nbFiles.sort()
      chosen = nbFiles[0]
    }
    const raw = await readFile(join(pythonDir, chosen), 'utf-8')
    return notebookToPython(raw)
  }

  return null
}

// ---- TypeScript 코드 (있으면 첫 main.ts/index.ts) ----
async function readTypescriptReference(lessonId: string): Promise<string | null> {
  const tsDir = join(SOURCE_REPO, lessonId, 'typescript')
  if (!existsSync(tsDir)) return null

  const apps = await readdir(tsDir)
  for (const app of apps) {
    const srcDir = join(tsDir, app, 'src')
    if (!existsSync(srcDir)) continue
    const files = await readdir(srcDir)
    const candidates = ['main.ts', 'index.ts', 'app.ts']
    for (const name of candidates) {
      if (files.includes(name)) {
        return await readFile(join(srcDir, name), 'utf-8')
      }
    }
    // fallback: first .ts
    const tsFiles = files.filter((f) => f.endsWith('.ts'))
    if (tsFiles.length > 0) {
      tsFiles.sort()
      return await readFile(join(srcDir, tsFiles[0]), 'utf-8')
    }
  }
  return null
}

// ---- 메인 ----
async function main() {
  console.log(`📚 genai-lab content sync`)
  console.log(`   소스: ${SOURCE_REPO}`)
  console.log(`   출력: ${OUTPUT_DIR}`)

  if (!existsSync(SOURCE_REPO)) {
    console.error(
      `\n❌ 원본 레포를 찾을 수 없음: ${SOURCE_REPO}\n` +
        `   ../generative-ai-for-beginners 가 sibling 디렉토리에 있어야 합니다.\n` +
        `   또는 SOURCE_REPO_PATH 환경 변수로 다른 경로를 지정하세요.\n`,
    )
    process.exit(1)
  }

  await mkdir(OUTPUT_DIR, { recursive: true })

  let okCount = 0
  const searchIndex: SearchEntry[] = []
  for (const meta of LESSONS) {
    process.stdout.write(`  • ${meta.id}: `)
    const lessonDir = join(SOURCE_REPO, meta.id)
    if (!existsSync(lessonDir)) {
      console.log('❌ 폴더 없음')
      continue
    }

    const [contentMarkdown, pythonReference, typescriptReference, hasVariableSpec] =
      await Promise.all([
        readKoreanReadme(meta.id),
        readPythonReference(meta.id),
        readTypescriptReference(meta.id),
        hasLessonSpec(meta.id),
      ])

    const lesson = {
      ...meta,
      contentMarkdown,
      pythonReference,
      typescriptReference,
      hasVariableSpec,
    }

    await writeFile(
      join(OUTPUT_DIR, `${meta.id}.json`),
      JSON.stringify(lesson, null, 2),
      'utf-8',
    )

    if (contentMarkdown) {
      searchIndex.push({
        id: meta.id,
        number: meta.number,
        title: meta.title,
        titleEn: meta.titleEn,
        body: stripMarkdown(contentMarkdown),
      })
    }

    const tags: string[] = []
    if (contentMarkdown) tags.push('md')
    if (pythonReference) tags.push('py')
    if (typescriptReference) tags.push('ts')
    if (hasVariableSpec) tags.push('spec')
    console.log(`✓ [${tags.join(',') || 'empty'}]`)
    okCount += 1
  }

  await writeFile(
    join(OUTPUT_DIR, '..', 'search-index.json'),
    JSON.stringify(searchIndex),
    'utf-8',
  )

  // 인덱스 파일도 함께 작성
  const summaries = await Promise.all(
    LESSONS.map(async (meta) => {
      const hasSpec = await hasLessonSpec(meta.id)
      return { ...meta, hasVariableSpec: hasSpec }
    }),
  )
  await writeFile(
    join(OUTPUT_DIR, '_index.json'),
    JSON.stringify(summaries, null, 2),
    'utf-8',
  )

  console.log(`\n✅ ${okCount}/${LESSONS.length} 레슨 동기화 완료`)
  console.log(`   인덱스: ${relative(ROOT, join(OUTPUT_DIR, '_index.json'))}`)
}

main().catch((err) => {
  console.error('💥 sync-content failed:', err)
  process.exit(1)
})
