/**
 * Azure OpenAI chat completions 어댑터.
 * 호출: POST {endpoint}/openai/deployments/{deployment}/chat/completions?api-version=...
 *
 * Azure는 Bearer 대신 'api-key' 헤더 사용. 모델명은 deployment 이름으로 대체됨
 * (Azure 포털에서 만든 deployment 명칭). request.model은 무시되거나 metadata로만 쓰임.
 */

import type { ChatRequest, ChatResponseChunk } from '#/types/llm'
import { callOpenAiCompat, streamOpenAiCompat } from './_openai-compat'
import { LlmHttpError, buildErrorMessage } from './error-messages'

const DEFAULT_API_VERSION = '2024-08-01-preview'

export type AzureStreamingOptions = {
  apiKey: string
  endpoint: string
  deployment: string
  apiVersion?: string
  signal?: AbortSignal
  onChunk: (chunk: ChatResponseChunk) => void
}

function buildAzureUrl(opts: { endpoint: string; deployment: string; apiVersion?: string }) {
  const base = opts.endpoint.replace(/\/+$/, '')
  const version = opts.apiVersion ?? DEFAULT_API_VERSION
  return `${base}/openai/deployments/${encodeURIComponent(opts.deployment)}/chat/completions?api-version=${version}`
}

export async function streamChatCompletion(
  request: ChatRequest,
  options: AzureStreamingOptions,
): Promise<void> {
  if (!options.apiKey) throw new Error('Azure OpenAI API 키가 설정되지 않았습니다.')
  if (!options.endpoint) throw new Error('Azure OpenAI Endpoint가 설정되지 않았습니다.')
  if (!options.deployment) throw new Error('Azure OpenAI Deployment 이름이 필요합니다.')

  return streamOpenAiCompat(request, {
    endpoint: buildAzureUrl(options),
    buildHeaders: () => ({ 'api-key': options.apiKey }),
    apiKey: options.apiKey,
    signal: options.signal,
    onChunk: options.onChunk,
    buildError: (status, body, statusText) =>
      new LlmHttpError(buildErrorMessage('azure', status, body, statusText)),
  })
}

export async function chatCompletion(
  request: ChatRequest,
  options: Omit<AzureStreamingOptions, 'onChunk'>,
) {
  if (!options.apiKey) throw new Error('Azure OpenAI API 키가 설정되지 않았습니다.')
  if (!options.endpoint) throw new Error('Azure OpenAI Endpoint가 설정되지 않았습니다.')
  if (!options.deployment) throw new Error('Azure OpenAI Deployment 이름이 필요합니다.')

  return callOpenAiCompat(request, {
    endpoint: buildAzureUrl(options),
    buildHeaders: () => ({ 'api-key': options.apiKey }),
    apiKey: options.apiKey,
    signal: options.signal,
    buildError: (status, body, statusText) =>
      new LlmHttpError(buildErrorMessage('azure', status, body, statusText)),
  })
}
