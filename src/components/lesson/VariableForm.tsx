import { useEffect, useMemo, useState } from 'react'
import { Label } from '#/components/ui/label'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Slider } from '#/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { Field, VariableSpec } from '#/types/lesson'

/**
 * VariableSpec.fields를 폼으로 렌더링.
 * 컨트롤드 상태를 자체 관리하며, 변경 시마다 onChange로 전체 values를 통보.
 */
export function VariableForm({
  spec,
  initialValues,
  onChange,
}: {
  spec: VariableSpec
  initialValues?: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
}) {
  const defaults = useMemo(() => {
    const acc: Record<string, unknown> = {}
    for (const field of spec.fields) acc[field.name] = field.defaultValue
    return acc
  }, [spec])

  const [values, setValues] = useState<Record<string, unknown>>(
    () => ({ ...defaults, ...(initialValues ?? {}) }),
  )

  // initialValues가 변경되면 (history에서 Run 복원 등) 폼을 리셋
  useEffect(() => {
    if (initialValues) {
      setValues({ ...defaults, ...initialValues })
    }
  }, [initialValues, defaults])

  // 변경 사항을 부모로 전달
  useEffect(() => {
    onChange(values)
  }, [values, onChange])

  const setValue = (name: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [name]: v }))
  }

  return (
    <div className="space-y-4">
      {spec.fields.map((field) => (
        <FieldRenderer
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={(v) => setValue(field.name, v)}
        />
      ))}
    </div>
  )
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: Field
  value: unknown
  onChange: (v: unknown) => void
}) {
  const id = `field-${field.name}`
  switch (field.type) {
    case 'select':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Select value={String(value ?? field.defaultValue)} onValueChange={(v) => onChange(v)}>
            <SelectTrigger id={id} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      )
    case 'slider': {
      const num = typeof value === 'number' ? value : field.defaultValue
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={id}>{field.label}</Label>
            <span className="font-mono text-xs text-muted-foreground">{num.toFixed(2)}</span>
          </div>
          <Slider
            id={id}
            min={field.min}
            max={field.max}
            step={field.step}
            value={[num]}
            onValueChange={(arr) => onChange(arr[0])}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      )
    }
    case 'number':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="number"
            value={typeof value === 'number' ? value : field.defaultValue}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      )
    case 'textarea':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Textarea
            id={id}
            value={typeof value === 'string' ? value : field.defaultValue}
            placeholder={field.placeholder}
            rows={field.rows ?? 4}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-xs"
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      )
    case 'json':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Textarea
            id={id}
            value={typeof value === 'string' ? value : field.defaultValue}
            placeholder={field.schemaHint}
            rows={6}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-xs"
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          {field.schemaHint && (
            <p className="text-[10px] text-muted-foreground/70">스키마: {field.schemaHint}</p>
          )}
        </div>
      )
  }
}
