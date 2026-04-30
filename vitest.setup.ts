import { beforeEach } from 'vitest'

// 각 테스트 사이에 localStorage 초기화 — storage 테스트 격리
beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})

/**
 * SSE 스트림 응답 객체를 mock하는 헬퍼 — `data: <chunk>\n\n` 포맷으로 인코딩.
 * 마지막에 `data: [DONE]\n\n`을 자동 추가.
 */
export function mockSseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(`data: ${c}\n\n`))
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
  return new Response(body, {
    status: 200,
    statusText: 'OK',
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
