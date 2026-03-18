"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  UploadSimple,
  DownloadSimple,
  FileCsv,
  WarningCircle,
  X,
  ArrowsClockwise,
  CheckCircle,
} from "@phosphor-icons/react"
import { contactsApi, type ContactImportDelimiter, type ContactImportMode, type ContactImportPreviewResponse } from "@/lib/api/contacts"
import { useContactsImportCommit, useContactsImportPreview } from "@/hooks/use-contacts-list"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "w-full h-10 rounded-xl border border-border/60 bg-muted/20 px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"

const IMPORT_MODES: Array<{ id: ContactImportMode; title: string; desc: string }> = [
  { id: "skip_existing", title: "Ignorar existentes", desc: "Cria apenas contatos novos (padrão recomendado)." },
  { id: "create_only", title: "Somente criar", desc: "Equivalente ao modo acima para criação de novos." },
  { id: "upsert", title: "Atualizar existentes", desc: "Cria novos e atualiza os contatos já existentes." },
]

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ""
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function StatCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "good" | "warn" }) {
  const toneCls = tone === "good"
    ? "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300"
    : tone === "warn"
      ? "border-amber-500/25 bg-amber-500/[0.08] text-amber-300"
      : "border-border/60 bg-muted/20 text-foreground/85"

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneCls}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-0.5 text-[16px] font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export function ContactImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean
  onClose: () => void
  onImported?: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [delimiter, setDelimiter] = useState<ContactImportDelimiter>(";")
  const [mode, setMode] = useState<ContactImportMode>("skip_existing")
  const [preview, setPreview] = useState<ContactImportPreviewResponse | null>(null)
  const [resultError, setResultError] = useState<string | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)

  const previewMutation = useContactsImportPreview()
  const commitMutation = useContactsImportCommit()

  useEffect(() => {
    if (!open) return
    setFile(null)
    setDelimiter(";")
    setMode("skip_existing")
    setPreview(null)
    setResultError(null)
    previewMutation.reset()
    commitMutation.reset()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const issuesToShow = useMemo(() => (preview?.issues ?? []).slice(0, 8), [preview?.issues])

  async function handleDownloadTemplate() {
    setTemplateLoading(true)
    setResultError(null)
    try {
      const result = await contactsApi.downloadImportTemplate()
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setResultError(err instanceof Error ? err.message : "Falha ao baixar template")
    } finally {
      setTemplateLoading(false)
    }
  }

  async function handlePreview() {
    if (!file) {
      setResultError("Selecione um arquivo CSV para continuar.")
      return
    }
    setResultError(null)
    try {
      const ab = await file.arrayBuffer()
      const contentBase64 = arrayBufferToBase64(ab)
      const response = await previewMutation.mutateAsync({
        fileName: file.name,
        contentBase64,
        delimiter,
      })
      setPreview(response)
    } catch (err) {
      setResultError(err instanceof Error ? err.message : "Falha ao gerar preview da importação")
    }
  }

  async function handleCommit() {
    if (!preview?.previewId) return
    setResultError(null)
    try {
      await commitMutation.mutateAsync({
        previewId: preview.previewId,
        mode,
      })
      onImported?.()
    } catch (err) {
      setResultError(err instanceof Error ? err.message : "Falha ao confirmar importação")
    }
  }

  const imported = commitMutation.data

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease }}
            className="fixed inset-x-4 top-[8vh] z-50 mx-auto max-h-[84vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border/60 bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
                  <UploadSimple className="h-4.5 w-4.5 text-accent" weight="bold" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Importar contatos por CSV</h2>
                  <p className="text-[11px] text-muted-foreground/60">Template, preview e commit em fluxo guiado</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(84vh-72px)] overflow-y-auto px-5 py-4">
              {!imported && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      disabled={templateLoading}
                      className="cursor-pointer flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-[12px] font-semibold text-foreground/80 hover:bg-muted/35 transition-colors disabled:opacity-60"
                    >
                      {templateLoading ? <ArrowsClockwise className="h-4 w-4 animate-spin" /> : <DownloadSimple className="h-4 w-4" />}
                      Baixar template CSV
                    </button>
                    <label className="cursor-pointer flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-[12px] font-semibold text-foreground/80 hover:bg-muted/35 transition-colors">
                      <FileCsv className="h-4 w-4" />
                      {file ? file.name : "Selecionar arquivo CSV"}
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Delimitador</label>
                      <select value={delimiter} onChange={(e) => setDelimiter(e.target.value as ContactImportDelimiter)} className={inputCls}>
                        <option value=";">Ponto e vírgula (;)</option>
                        <option value=",">Vírgula (,)</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handlePreview}
                        disabled={!file || previewMutation.isPending}
                        className="cursor-pointer flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60"
                      >
                        {previewMutation.isPending && <ArrowsClockwise className="h-4 w-4 animate-spin" />}
                        Gerar preview
                      </button>
                    </div>
                  </div>

                  {preview && (
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/15 p-4">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <StatCard label="Total" value={preview.totalRows} />
                        <StatCard label="Válidas" value={preview.validRows} tone="good" />
                        <StatCard label="Inválidas" value={preview.invalidRows} tone={preview.invalidRows > 0 ? "warn" : "default"} />
                        <StatCard label="Novos" value={preview.wouldCreate} tone="good" />
                        <StatCard label="Existentes" value={preview.wouldMatchExisting} />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Modo de importação</label>
                          <div className="space-y-1.5">
                            {IMPORT_MODES.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setMode(m.id)}
                                className={`cursor-pointer w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                                  mode === m.id
                                    ? "border-accent/30 bg-accent/10"
                                    : "border-border/60 bg-card/30 hover:bg-muted/30"
                                }`}
                              >
                                <p className="text-[12px] font-semibold text-foreground/90">{m.title}</p>
                                <p className="mt-0.5 text-[10px] text-muted-foreground/60">{m.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-border/60 bg-card/30 p-3">
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Amostra</p>
                          {preview.sample.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground/55">Sem linhas válidas no preview.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {preview.sample.slice(0, 4).map((row) => (
                                <div key={row.rowNumber} className="rounded-md border border-border/50 bg-muted/20 px-2 py-1.5">
                                  <p className="truncate text-[11px] text-foreground/85">{row.name || "Sem nome"} · {row.phone}</p>
                                  {row.email && <p className="truncate text-[10px] text-muted-foreground/60">{row.email}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {issuesToShow.length > 0 && (
                        <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.08] p-3">
                          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
                            <WarningCircle className="h-4 w-4" weight="fill" />
                            Problemas encontrados ({preview.issues.length})
                          </p>
                          <div className="space-y-1">
                            {issuesToShow.map((issue, idx) => (
                              <p key={`${issue.rowNumber}-${idx}`} className="text-[11px] text-amber-200/90">
                                Linha {issue.rowNumber}: {issue.reason}
                              </p>
                            ))}
                            {preview.issues.length > issuesToShow.length && (
                              <p className="text-[10px] text-amber-200/70">+ {preview.issues.length - issuesToShow.length} itens adicionais</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCommit}
                          disabled={preview.validRows === 0 || commitMutation.isPending}
                          className="cursor-pointer flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60"
                        >
                          {commitMutation.isPending && <ArrowsClockwise className="h-4 w-4 animate-spin" />}
                          Confirmar importação
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {imported && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-3.5 py-3">
                    <CheckCircle className="h-5 w-5 text-emerald-300" weight="fill" />
                    <div>
                      <p className="text-[13px] font-semibold text-emerald-200">Importação concluída</p>
                      <p className="text-[11px] text-emerald-200/80">Modo aplicado: {imported.mode}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <StatCard label="Processadas" value={imported.totalProcessed} />
                    <StatCard label="Criadas" value={imported.created} tone="good" />
                    <StatCard label="Atualizadas" value={imported.updated} tone="good" />
                    <StatCard label="Ignoradas" value={imported.skippedExisting} />
                    <StatCard label="Falhas" value={imported.failed} tone={imported.failed > 0 ? "warn" : "default"} />
                  </div>
                  {imported.errors.length > 0 && (
                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.08] p-3">
                      <p className="text-[11px] font-semibold text-amber-200">Erros no commit</p>
                      <div className="mt-1 space-y-1">
                        {imported.errors.slice(0, 8).map((err, idx) => (
                          <p key={idx} className="text-[11px] text-amber-200/90">
                            {typeof err.rowNumber === "number" ? `Linha ${err.rowNumber}: ` : ""}{err.reason}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}

              {(resultError || previewMutation.isError || commitMutation.isError) && (
                <div className="mt-4 rounded-lg border border-rose-500/25 bg-rose-500/[0.08] px-3 py-2.5">
                  <p className="text-[11px] text-rose-300">
                    {resultError
                      ?? (previewMutation.error instanceof Error ? previewMutation.error.message : null)
                      ?? (commitMutation.error instanceof Error ? commitMutation.error.message : "Falha na importação")}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

