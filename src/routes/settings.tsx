import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Check, Eye, EyeOff, Loader2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

import { type ApiKeyMap, getSettings, updateSettings } from '#/lib/storage/settings'
import {
  validateGitHubModels,
  validateHuggingFace,
  validateOpenAi,
  type ValidateResult,
} from '#/lib/llm/validate-key'
import type { Provider } from '#/types/llm'

export const Route = createFileRoute('/settings')({ component: Settings })

const PROVIDER_LABELS: Record<Provider, string> = {
  'github-models': 'GitHub Models',
  openai: 'OpenAI direct',
  azure: 'Azure OpenAI',
  huggingface: 'Hugging Face',
}

type ValidatableField = 'githubModels' | 'openai' | 'huggingface'

const VALIDATORS: Record<ValidatableField, (key: string) => Promise<ValidateResult>> = {
  githubModels: validateGitHubModels,
  openai: validateOpenAi,
  huggingface: validateHuggingFace,
}

type ValidationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; message?: string }
  | { status: 'fail'; message: string; raw?: string }


const KEY_FIELDS: Array<{
  name: keyof ApiKeyMap
  label: string
  description: string
  placeholder: string
  recommended?: boolean
}> = [
  {
    name: 'githubModels',
    label: 'GitHub Models PAT',
    description:
      'GitHub Models 무료 티어. fine-grained PAT를 만들고 Account permissions → Models를 read로 설정하세요.',
    placeholder: 'github_pat_...',
    recommended: true,
  },
  {
    name: 'openai',
    label: 'OpenAI API Key',
    description: 'platform.openai.com 에서 발급. 유료, 다양한 모델 + 이미지/임베딩.',
    placeholder: 'sk-...',
  },
  {
    name: 'azureApiKey',
    label: 'Azure OpenAI API Key',
    description: 'Azure 구독 + Azure OpenAI 리소스가 있어야 함. 엔드포인트와 deployment 이름도 함께 필요.',
    placeholder: '...',
  },
  {
    name: 'azureEndpoint',
    label: 'Azure OpenAI Endpoint',
    description: 'https://<your-resource>.openai.azure.com',
    placeholder: 'https://...openai.azure.com',
  },
  {
    name: 'azureDeployment',
    label: 'Azure OpenAI Deployment',
    description: 'Azure 포털에서 만든 deployment 이름',
    placeholder: 'gpt-4o-deployment',
  },
  {
    name: 'huggingface',
    label: 'Hugging Face API Key',
    description: '오픈소스 모델 (16번 레슨용)',
    placeholder: 'hf_...',
  },
]

function Settings() {
  const [settings, setSettings] = useState(getSettings)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [dirty, setDirty] = useState<Partial<ApiKeyMap>>({})
  const [validation, setValidation] = useState<Record<string, ValidationState>>({})

  const handleValidate = async (name: ValidatableField) => {
    const key = (dirty[name] ?? settings.apiKeys[name]) as string
    if (!key) {
      setValidation((p) => ({ ...p, [name]: { status: 'fail', message: 'API 키가 비어 있습니다.' } }))
      return
    }
    setValidation((p) => ({ ...p, [name]: { status: 'loading' } }))
    const result = await VALIDATORS[name](key)
    if (result.ok) {
      setValidation((p) => ({ ...p, [name]: { status: 'ok', message: result.message } }))
    } else {
      setValidation((p) => ({
        ...p,
        [name]: { status: 'fail', message: result.message, raw: result.raw },
      }))
    }
  }

  // localStorage 변경 사항을 감지 (EnvBootstrap이 비동기로 채우므로)
  useEffect(() => {
    const interval = setInterval(() => {
      const next = getSettings()
      setSettings((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const handleChange = (name: keyof ApiKeyMap, value: string) => {
    setDirty((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    if (Object.keys(dirty).length === 0) {
      toast.info('변경된 항목이 없습니다.')
      return
    }
    const next = updateSettings({
      apiKeys: { ...settings.apiKeys, ...dirty },
      // 사용자가 직접 입력한 키는 envInjected에서 제외
      envInjected: Object.keys(dirty).reduce(
        (acc, k) => ({ ...acc, [k]: false }),
        { ...settings.envInjected },
      ),
    })
    setSettings(next)
    setDirty({})
    toast.success('설정이 저장되었습니다.')
  }

  const handleProviderChange = (provider: Provider) => {
    const next = updateSettings({ defaultProvider: provider })
    setSettings(next)
    toast.success(`기본 chat provider: ${PROVIDER_LABELS[provider]}`)
  }

  return (
    <div className="container mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          API 키는 BYOK 정책에 따라 사용자 브라우저(localStorage)에만 저장됩니다.
          서버나 다른 사용자에게 전송되지 않습니다.
        </p>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>기본 Chat Provider</CardTitle>
          <CardDescription>
            chat completions(레슨 04~07, 교사 모드 등)를 어느 provider로 보낼지 결정합니다.
            image/embedding/rag/agent는 spec이 결정한 provider 그대로 사용됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.defaultProvider}
            onValueChange={(v) => handleProviderChange(v as Provider)}
          >
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="github-models">GitHub Models (무료, 권장)</SelectItem>
              <SelectItem value="openai">OpenAI direct (유료)</SelectItem>
              <SelectItem value="azure">Azure OpenAI (기업 환경)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API 키</CardTitle>
          <CardDescription>
            로컬 dev에서 <code className="rounded bg-muted px-1">.env</code>에 키가 있으면
            첫 페이지 로드 시 자동으로 채워집니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {KEY_FIELDS.map((field) => {
            const current = dirty[field.name] ?? settings.apiKeys[field.name]
            const injected = settings.envInjected[field.name]
            const isRevealed = revealed[field.name] === true
            const validatable = field.name in VALIDATORS
            const v = validation[field.name] ?? { status: 'idle' as const }
            return (
              <div key={field.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`key-${field.name}`}>
                    {field.label}
                    {field.recommended && (
                      <Badge variant="secondary" className="ml-2">
                        권장
                      </Badge>
                    )}
                    {injected && current && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        .env 자동 주입
                      </Badge>
                    )}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() =>
                      setRevealed((prev) => ({ ...prev, [field.name]: !prev[field.name] }))
                    }
                  >
                    {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-stretch gap-2">
                  <Input
                    id={`key-${field.name}`}
                    type={isRevealed ? 'text' : 'password'}
                    value={current}
                    placeholder={field.placeholder}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="font-mono text-xs"
                    autoComplete="off"
                  />
                  {validatable && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => handleValidate(field.name as ValidatableField)}
                      disabled={!current || v.status === 'loading'}
                      aria-label="검증"
                    >
                      {v.status === 'loading' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : v.status === 'ok' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : v.status === 'fail' ? (
                        <X className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <span className="text-xs">검증</span>
                      )}
                    </Button>
                  )}
                </div>
                {v.status === 'ok' && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    ✓ {v.message ?? '키가 유효합니다.'}
                  </p>
                )}
                {v.status === 'fail' && (
                  <div className="space-y-1">
                    <p className="text-xs text-destructive">{v.message}</p>
                    {v.raw && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          raw 응답 보기
                        </summary>
                        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-[11px] text-muted-foreground">
                          {v.raw}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <div className="flex items-center justify-end gap-3">
        <span className="text-xs text-muted-foreground">
          {Object.keys(dirty).length > 0
            ? `${Object.keys(dirty).length}개 변경 사항 미저장`
            : '저장됨'}
        </span>
        <Button onClick={handleSave} disabled={Object.keys(dirty).length === 0}>
          <Save className="mr-2 h-4 w-4" /> 저장
        </Button>
      </div>
    </div>
  )
}
