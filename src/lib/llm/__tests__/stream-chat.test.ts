/**
 * streamChat 통합 테스트 — fetch를 mock해서 SSE 청크 파싱과 tool_calls
 * 누적 로직을 검증. 직전 픽스(streaming tool_calls index별 누적)의 회귀를 막는다.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockSseResponse } from '../../../../vitest.setup'
import { streamChat } from '../index'

const originalFetch = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = vi.fn()
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('streamChat', () => {
  it('accumulates text deltas into final output', async () => {
    const sseChunks = [
      JSON.stringify({
        id: '1',
        model: 'gpt-4o-mini',
        choices: [{ index: 0, delta: { content: 'Hello, ' }, finish_reason: null }],
      }),
      JSON.stringify({
        id: '1',
        model: 'gpt-4o-mini',
        choices: [{ index: 0, delta: { content: 'world!' }, finish_reason: null }],
      }),
      JSON.stringify({
        id: '1',
        model: 'gpt-4o-mini',
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
      }),
    ]
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockSseResponse(sseChunks))

    const result = await streamChat(
      {
        provider: 'github-models',
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
      },
      { apiKey: 'test', onChunk: () => {} },
    )

    expect(result.output).toBe('Hello, world!')
    expect(result.usage.prompt_tokens).toBe(5)
    expect(result.usage.completion_tokens).toBe(3)
    expect(result.toolCalls).toBeUndefined()
  })

  it('accumulates streaming tool_calls fragments by index (regression for #pr0864e14)', async () => {
    // SSE에서 tool_call의 id, name, arguments는 여러 청크에 걸쳐 fragments로 도착.
    // index를 키로 누적해야 함.
    const sseChunks = [
      JSON.stringify({
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                { index: 0, id: 'call_abc', type: 'function', function: { name: 'add' } },
              ],
            },
            finish_reason: null,
          },
        ],
      }),
      JSON.stringify({
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [{ index: 0, function: { arguments: '{"a":' } }],
            },
            finish_reason: null,
          },
        ],
      }),
      JSON.stringify({
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [{ index: 0, function: { arguments: '1,"b":2}' } }],
            },
            finish_reason: null,
          },
        ],
      }),
      JSON.stringify({
        choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }],
      }),
    ]
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockSseResponse(sseChunks))

    const result = await streamChat(
      {
        provider: 'github-models',
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: '1+2' }],
        tools: [
          {
            type: 'function',
            function: {
              name: 'add',
              description: 'sum of two numbers',
              parameters: {
                type: 'object',
                properties: { a: { type: 'number' }, b: { type: 'number' } },
              },
            },
          },
        ],
      },
      { apiKey: 'test', onChunk: () => {} },
    )

    expect(result.toolCalls).toBeDefined()
    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls?.[0]).toMatchObject({
      id: 'call_abc',
      name: 'add',
      arguments: '{"a":1,"b":2}',
    })
  })
})
