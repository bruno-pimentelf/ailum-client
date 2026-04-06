"use client"

import type { FormFieldDefinition } from "@/lib/api/forms"

const inputCls = "w-full h-10 rounded-xl border border-border/70 bg-foreground/[0.03] px-3.5 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all"

function cleanDigits(v: string) { return v.replace(/\D/g, "") }
function formatCpf(v: string) {
  const d = cleanDigits(v).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
function formatPhone(v: string) {
  const d = cleanDigits(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function FieldRenderer({ field, value, onChange, readOnly }: {
  field: FormFieldDefinition
  value: unknown
  onChange: (val: unknown) => void
  readOnly?: boolean
}) {
  const label = (
    <label className="block text-[11px] font-semibold text-muted-foreground/70 mb-1.5">
      {field.label} {field.required && <span className="text-rose-400">*</span>}
    </label>
  )
  const helpText = field.helpText && <p className="text-[10px] text-muted-foreground/40 mt-1">{field.helpText}</p>

  switch (field.type) {
    case "TEXT":
    case "EMAIL":
      return <div>{label}<input type={field.type === "EMAIL" ? "email" : "text"} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={inputCls} readOnly={readOnly} />{helpText}</div>
    case "PHONE":
      return <div>{label}<input value={formatPhone((value as string) ?? "")} onChange={(e) => onChange(cleanDigits(e.target.value))} placeholder={field.placeholder ?? "(00) 00000-0000"} className={inputCls} readOnly={readOnly} />{helpText}</div>
    case "CPF":
      return <div>{label}<input value={formatCpf((value as string) ?? "")} onChange={(e) => onChange(cleanDigits(e.target.value))} placeholder={field.placeholder ?? "000.000.000-00"} className={inputCls} readOnly={readOnly} />{helpText}</div>
    case "TEXTAREA":
      return <div>{label}<textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={4} className={`${inputCls} h-auto py-2.5 resize-y`} readOnly={readOnly} />{helpText}</div>
    case "NUMBER":
      return <div>{label}<input type="number" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} min={field.validation?.min} max={field.validation?.max} placeholder={field.placeholder} className={inputCls} readOnly={readOnly} />{helpText}</div>
    case "DATE":
      return <div>{label}<input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls} readOnly={readOnly} />{helpText}</div>
    case "SELECT":
      return (
        <div>{label}
          <select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls} disabled={readOnly}>
            <option value="">{field.placeholder ?? "Selecione..."}</option>
            {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {helpText}
        </div>
      )
    case "RADIO":
      return (
        <div>{label}
          <div className="flex flex-wrap gap-2 mt-1">
            {(field.options ?? []).map((o) => (
              <label key={o} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name={field.id} value={o} checked={value === o} onChange={() => onChange(o)} disabled={readOnly}
                  className="h-3.5 w-3.5 border-border text-accent focus:ring-accent/30" />
                <span className="text-[12px] text-foreground">{o}</span>
              </label>
            ))}
          </div>
          {helpText}
        </div>
      )
    case "CHECKBOX":
      if (field.options && field.options.length > 0) {
        const selected = Array.isArray(value) ? value as string[] : []
        return (
          <div>{label}
            <div className="flex flex-wrap gap-2 mt-1">
              {field.options.map((o) => (
                <label key={o} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(o)} disabled={readOnly}
                    onChange={(e) => onChange(e.target.checked ? [...selected, o] : selected.filter((s) => s !== o))}
                    className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent/30" />
                  <span className="text-[12px] text-foreground">{o}</span>
                </label>
              ))}
            </div>
            {helpText}
          </div>
        )
      }
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} disabled={readOnly}
            className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent/30" />
          <span className="text-[12px] text-foreground">{field.label}</span>
        </label>
      )
    case "MULTI_SELECT": {
      const sel = Array.isArray(value) ? value as string[] : []
      return (
        <div>{label}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(field.options ?? []).map((o) => {
              const active = sel.includes(o)
              return (
                <button key={o} type="button" disabled={readOnly}
                  onClick={() => onChange(active ? sel.filter((s) => s !== o) : [...sel, o])}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
                    active ? "border-accent/40 bg-accent/10 text-accent" : "border-border/60 bg-foreground/[0.02] text-muted-foreground/60"
                  }`}>{o}</button>
              )
            })}
          </div>
          {helpText}
        </div>
      )
    }
    case "SCALE": {
      const min = field.validation?.min ?? 1
      const max = field.validation?.max ?? 10
      const range = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      return (
        <div>{label}
          <div className="flex gap-1 mt-1">
            {range.map((n) => (
              <button key={n} type="button" disabled={readOnly}
                onClick={() => onChange(n)}
                className={`cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-bold transition-all ${
                  value === n ? "border-accent/40 bg-accent/10 text-accent" : "border-border/60 bg-foreground/[0.02] text-muted-foreground/50"
                }`}>{n}</button>
            ))}
          </div>
          {helpText}
        </div>
      )
    }
    case "FILE":
      return (
        <div>{label}
          {readOnly
            ? <p className="text-[11px] text-muted-foreground/60">{value ? String(value) : "Nenhum arquivo"}</p>
            : <input type="file" onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")} className="text-[11px] text-muted-foreground" />
          }
          {helpText}
        </div>
      )
    case "SIGNATURE":
      return <div>{label}<p className="text-[11px] text-muted-foreground/50 italic">Assinatura será coletada na consulta</p></div>
    default:
      return <div>{label}<input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls} readOnly={readOnly} /></div>
  }
}

export function FormFiller({ fields, answers, onChange, readOnly }: {
  fields: FormFieldDefinition[]
  answers: Record<string, unknown>
  onChange: (answers: Record<string, unknown>) => void
  readOnly?: boolean
}) {
  const sorted = [...fields].sort((a, b) => a.order - b.order)
  const sections = new Map<string, FormFieldDefinition[]>()
  for (const f of sorted) {
    const sec = f.section ?? ""
    if (!sections.has(sec)) sections.set(sec, [])
    sections.get(sec)!.push(f)
  }

  return (
    <div className="space-y-5">
      {Array.from(sections.entries()).map(([section, sectionFields]) => (
        <div key={section}>
          {section && <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-3">{section}</p>}
          <div className="space-y-3">
            {sectionFields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={answers[field.id]}
                onChange={(val) => onChange({ ...answers, [field.id]: val })}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
