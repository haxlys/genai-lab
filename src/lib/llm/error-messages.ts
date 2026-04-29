/**
 * HTTP 응답 status를 학습자 친화적인 한국어 안내 메시지로 매핑.
 * raw error 메시지는 별도로 보관해 디버깅용으로 함께 노출.
 */

export type LlmProvider = 'github-models' | 'openai' | 'azure' | 'huggingface'

export type LlmErrorInfo = {
  /** 학습자에게 보여줄 친화적 한국어 메시지 */
  friendly: string
  /** 디버깅용 raw 응답 본문 (status code 포함) */
  raw: string
  /** HTTP status code (네트워크 실패 시 0) */
  status: number
}

export class LlmHttpError extends Error {
  readonly info: LlmErrorInfo

  constructor(info: LlmErrorInfo) {
    super(info.friendly)
    this.name = 'LlmHttpError'
    this.info = info
  }
}

/**
 * provider + status에서 친화적 메시지를 산출.
 *
 * raw body는 디버깅용으로 보관하되 친화적 메시지가 우선 노출되도록 한다.
 */
export function buildErrorMessage(
  provider: LlmProvider,
  status: number,
  body: string,
  statusText: string = '',
): LlmErrorInfo {
  const providerLabel = providerName(provider)
  const friendly = friendlyByStatus(provider, status, providerLabel)
  const raw = `${providerLabel} ${status}${statusText ? ' ' + statusText : ''}\n${body.slice(0, 800)}`
  return { friendly, raw, status }
}

function providerName(p: LlmProvider): string {
  switch (p) {
    case 'github-models':
      return 'GitHub Models'
    case 'openai':
      return 'OpenAI'
    case 'azure':
      return 'Azure OpenAI'
    case 'huggingface':
      return 'Hugging Face'
  }
}

function friendlyByStatus(
  provider: LlmProvider,
  status: number,
  providerLabel: string,
): string {
  switch (status) {
    case 401:
      return `${providerLabel} API 키가 유효하지 않습니다. Settings에서 다시 확인하세요. (만료되었거나 회전이 필요할 수 있습니다.)`
    case 403:
      if (provider === 'github-models') {
        return `이 토큰에 Models 권한이 없습니다. GitHub 토큰 설정 → "Account permissions" → "Models"를 read로 변경하세요.`
      }
      return `${providerLabel} 권한이 거부되었습니다. 토큰 권한과 리소스 접근 권한을 확인하세요.`
    case 429:
      if (provider === 'github-models') {
        return `${providerLabel} 무료 티어 레이트 리밋에 도달했습니다. 1분 정도 기다린 뒤 다시 시도하거나, 더 작은 모델(gpt-4o-mini, Phi 등)로 바꿔 보세요.`
      }
      return `${providerLabel} 레이트 리밋에 도달했습니다. 잠시 후 다시 시도하거나 더 가벼운 모델을 선택하세요.`
    case 400:
      return `요청 형식 오류 (400). 모델명/메시지/tools JSON을 확인하세요. 일부 모델은 특정 파라미터(예: tool_choice)를 지원하지 않습니다.`
    case 404:
      return `${providerLabel} 엔드포인트 또는 모델이 없습니다 (404). 모델명 철자를 확인하세요.`
    case 408:
    case 504:
      return `${providerLabel} 응답이 지연되었습니다 (${status}). 잠시 후 재시도하거나 입력을 줄여 보세요.`
    case 500:
    case 502:
    case 503:
      return `${providerLabel} 서버가 일시적으로 응답하지 않습니다 (${status}). 잠시 후 재시도하세요.`
    case 0:
      return `${providerLabel}에 연결하지 못했습니다. 네트워크 또는 CORS 문제일 수 있습니다.`
    default:
      return `${providerLabel} 호출이 실패했습니다 (HTTP ${status}). 아래의 raw 응답을 확인하세요.`
  }
}
