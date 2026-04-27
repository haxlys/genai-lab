/**
 * 서버 사이드 .env 키 주입.
 *
 * 로컬 dev 사용성을 위해, .env 파일에 키가 있으면 사용자가 Settings에서 직접
 * 입력하지 않아도 자동으로 사용할 수 있게 한다. 프로덕션 배포 시는 .env가
 * 비어 있을 가능성이 높으므로 BYOK 흐름으로 fallback.
 *
 * 보안 노트:
 * - 이 함수는 .env 키를 클라이언트로 전송한다 (BYOK과 동일하게 사용자 자신만 보는 페이지).
 * - 다중 사용자 공개 배포에는 적합하지 않다 — 각자의 키를 직접 입력하도록 안내해야 한다.
 */

import { createServerFn } from '@tanstack/react-start'

type EnvPayload = {
  githubModels: string
  openai: string
  azureApiKey: string
  azureEndpoint: string
  azureDeployment: string
  huggingface: string
  /** 클라이언트가 어떤 키가 .env에서 왔는지 표시할 수 있도록 */
  injectedFlags: {
    githubModels: boolean
    openai: boolean
    azureApiKey: boolean
    azureEndpoint: boolean
    azureDeployment: boolean
    huggingface: boolean
  }
}

export const getEnvKeys = createServerFn({ method: 'GET' }).handler(
  async (): Promise<EnvPayload> => {
    const githubModels = process.env.GITHUB_TOKEN ?? ''
    const openai = process.env.OPENAI_API_KEY ?? ''
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY ?? ''
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT ?? ''
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? ''
    const huggingface = process.env.HUGGING_FACE_API_KEY ?? ''

    return {
      githubModels,
      openai,
      azureApiKey,
      azureEndpoint,
      azureDeployment,
      huggingface,
      injectedFlags: {
        githubModels: githubModels.length > 0,
        openai: openai.length > 0,
        azureApiKey: azureApiKey.length > 0,
        azureEndpoint: azureEndpoint.length > 0,
        azureDeployment: azureDeployment.length > 0,
        huggingface: huggingface.length > 0,
      },
    }
  },
)
