import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

import { type ApiKeyMap, getSettings, updateSettings } from '#/lib/storage/settings'

export const Route = createFileRoute('/settings')({ component: Settings })

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

  return (
    <div className="container mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          API 키는 BYOK 정책에 따라 사용자 브라우저(localStorage)에만 저장됩니다.
          서버나 다른 사용자에게 전송되지 않습니다.
        </p>
      </header>

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
                <Input
                  id={`key-${field.name}`}
                  type={isRevealed ? 'text' : 'password'}
                  value={current}
                  placeholder={field.placeholder}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="font-mono text-xs"
                  autoComplete="off"
                />
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
