"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  UploadSimple,
  DownloadSimple,
  FileXls,
  FileCsv,
  WarningCircle,
  X,
  ArrowsClockwise,
  CheckCircle,
  ArrowRight,
  Trash,
  File,
} from "@phosphor-icons/react"
import { contactsApi, type ContactImportDelimiter, type ContactImportMode, type ContactImportPreviewResponse } from "@/lib/api/contacts"
import { useContactsImportCommit, useContactsImportPreview } from "@/hooks/use-contacts-list"

const ease = [0.33, 1, 0.68, 1] as const

const IMPORT_MODES: Array<{ id: ContactImportMode; title: string; desc: string }> = [
  { id: "skip_existing", title: "Ignorar existentes", desc: "Cria apenas contatos novos." },
  { id: "upsert", title: "Atualizar existentes", desc: "Cria novos e atualiza dados dos existentes." },
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
    <div className={`rounded-xl border px-3 py-2.5 ${toneCls}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-0.5 text-[18px] font-bold tabular-nums">{value}</p>
    </div>
  )
}

function FileIcon({ name }: { name: string }) {
  const isXlsx = /\.xlsx?$/i.test(name)
  return isXlsx
    ? <FileXls className="h-5 w-5 text-emerald-400" weight="duotone" />
    : <FileCsv className="h-5 w-5 text-accent" weight="duotone" />
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
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewMutation = useContactsImportPreview()
  const commitMutation = useContactsImportCommit()

  useEffect(() => {
    if (!open) return
    setFile(null)
    setDelimiter(";")
    setMode("skip_existing")
    setPreview(null)
    setResultError(null)
    setDragOver(false)
    previewMutation.reset()
    commitMutation.reset()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const issuesToShow = useMemo(() => (preview?.issues ?? []).slice(0, 6), [preview?.issues])
  const isCsv = file ? /\.csv$/i.test(file.name) : false
  const isXlsx = file ? /\.xlsx?$/i.test(file.name) : false

  const handleFile = useCallback((f: File | null) => {
    if (!f) return
    setFile(f)
    setPreview(null)
    setResultError(null)
    previewMutation.reset()
    commitMutation.reset()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && /\.(csv|xlsx?)$/i.test(f.name)) handleFile(f)
  }

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
    if (!file) return
    setResultError(null)
    try {
      const ab = await file.arrayBuffer()
      const contentBase64 = arrayBufferToBase64(ab)
      const response = await previewMutation.mutateAsync({
        fileName: file.name,
        contentBase64,
        delimiter: isCsv ? delimiter : undefined,
      })
      setPreview(response)
    } catch (err) {
      setResultError(err instanceof Error ? err.message : "Falha ao processar o arquivo")
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
            className="fixed inset-x-4 top-[8vh] z-50 mx-auto max-h-[84vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-overlay shadow-2xl shadow-foreground/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
                  <UploadSimple className="h-4.5 w-4.5 text-accent" weight="bold" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Importar contatos</h2>
                  <p className="text-[11px] text-muted-foreground/90">CSV ou Excel (.xlsx)</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(84vh-72px)] overflow-y-auto px-5 py-4 space-y-4">

              {/* ─── Step 1: Upload ─── */}
              {!imported && !preview && (
                <>
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-all duration-200 ${
                      dragOver
                        ? "border-accent bg-accent/10"
                        : file
                          ? "border-accent/30 bg-accent/5"
                          : "border-border/50 bg-muted/10 hover:border-border hover:bg-muted/20"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />

                    {file ? (
                      <>
                        <FileIcon name={file.name} />
                        <div className="text-center">
                          <p className="text-[13px] font-medium text-foreground">{file.name}</p>
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                            {(file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFile(null) }}
                          className="cursor-pointer flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-destructive transition-colors"
                        >
                          <Trash className="h-3 w-3" /> Remover
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/30">
                          <UploadSimple className="h-5 w-5 text-muted-foreground/60" weight="bold" />
                        </div>
                        <div className="text-center">
                          <p className="text-[13px] font-medium text-foreground/80">
                            Arraste o arquivo aqui ou clique para selecionar
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            Formatos aceitos: .csv, .xlsx, .xls
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* CSV delimiter (only for .csv) */}
                  {file && isCsv && (
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90">
                        Delimitador do CSV
                      </label>
                      <div className="flex gap-2">
                        {([";", ","] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDelimiter(d)}
                            className={`cursor-pointer flex-1 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${
                              delimiter === d
                                ? "border-accent/30 bg-accent/10 text-foreground"
                                : "border-border/50 text-muted-foreground hover:bg-muted/20"
                            }`}
                          >
                            {d === ";" ? "Ponto e vírgula (;)" : "Vírgula (,)"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      disabled={templateLoading}
                      className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors disabled:opacity-50"
                    >
                      {templateLoading ? <ArrowsClockwise className="h-3.5 w-3.5 animate-spin" /> : <DownloadSimple className="h-3.5 w-3.5" />}
                      Baixar modelo
                    </button>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={!file || previewMutation.isPending}
                      className="cursor-pointer flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {previewMutation.isPending ? (
                        <ArrowsClockwise className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                      Continuar
                    </button>
                  </div>
                </>
              )}

              {/* ─── Step 2: Preview ─── */}
              {!imported && preview && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatCard label="Total" value={preview.totalRows} />
                    <StatCard label="Válidas" value={preview.validRows} tone="good" />
                    <StatCard label="Inválidas" value={preview.invalidRows} tone={preview.invalidRows > 0 ? "warn" : "default"} />
                    <StatCard label="Novos" value={preview.wouldCreate} tone="good" />
                  </div>

                  {/* Sample */}
                  {preview.sample.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90">
                        Pré-visualização
                      </p>
                      <div className="rounded-xl border border-border/40 overflow-hidden">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="border-b border-border/30 bg-muted/15">
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground/80">Nome</th>
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground/80">Telefone</th>
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground/80 hidden sm:table-cell">E-mail</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.sample.slice(0, 5).map((row) => (
                              <tr key={row.rowNumber} className="border-b border-border/20 last:border-0">
                                <td className="px-3 py-2 text-foreground/85 truncate max-w-[140px]">{row.name || "—"}</td>
                                <td className="px-3 py-2 text-foreground/85 font-mono text-[11px]">{row.phone}</td>
                                <td className="px-3 py-2 text-muted-foreground/70 truncate max-w-[140px] hidden sm:table-cell">{row.email || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {preview.sample.length > 5 && (
                          <p className="text-center text-[10px] text-muted-foreground/50 py-1.5 border-t border-border/20">
                            + {preview.sample.length - 5} linhas
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {issuesToShow.length > 0 && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 mb-1.5">
                        <WarningCircle className="h-3.5 w-3.5" weight="fill" />
                        {preview!.issues.length} problema{preview!.issues.length > 1 ? "s" : ""} encontrado{preview!.issues.length > 1 ? "s" : ""}
                      </p>
                      <div className="space-y-0.5">
                        {issuesToShow.map((issue, idx) => (
                          <p key={`${issue.rowNumber}-${idx}`} className="text-[11px] text-amber-200/80">
                            Linha {issue.rowNumber}: {issue.reason}
                          </p>
                        ))}
                        {preview!.issues.length > issuesToShow.length && (
                          <p className="text-[10px] text-amber-200/50">+ {preview!.issues.length - issuesToShow.length} outros</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Import mode */}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Se o contato já existir
                    </p>
                    <div className="flex gap-2">
                      {IMPORT_MODES.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMode(m.id)}
                          className={`cursor-pointer flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                            mode === m.id
                              ? "border-accent/30 bg-accent/10"
                              : "border-border/50 hover:bg-muted/20"
                          }`}
                        >
                          <p className="text-[12px] font-semibold text-foreground/90">{m.title}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground/80">{m.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setPreview(null); previewMutation.reset() }}
                      className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                    >
                      Voltar
                    </button>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={handleCommit}
                      disabled={preview.validRows === 0 || commitMutation.isPending}
                      className="cursor-pointer flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {commitMutation.isPending && <ArrowsClockwise className="h-3.5 w-3.5 animate-spin" />}
                      Importar {preview.validRows} contato{preview.validRows !== 1 ? "s" : ""}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Step 3: Done ─── */}
              {imported && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3 py-4">
                    <CheckCircle className="h-10 w-10 text-emerald-400" weight="fill" />
                    <div className="text-center">
                      <p className="text-[15px] font-semibold text-foreground">Importação concluída</p>
                      <p className="text-[12px] text-muted-foreground/80 mt-0.5">
                        {imported.created} criado{imported.created !== 1 ? "s" : ""}
                        {imported.updated > 0 && `, ${imported.updated} atualizado${imported.updated !== 1 ? "s" : ""}`}
                        {imported.skippedExisting > 0 && `, ${imported.skippedExisting} ignorado${imported.skippedExisting !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatCard label="Processados" value={imported.totalProcessed} />
                    <StatCard label="Criados" value={imported.created} tone="good" />
                    <StatCard label="Atualizados" value={imported.updated} tone={imported.updated > 0 ? "good" : "default"} />
                    <StatCard label="Falhas" value={imported.failed} tone={imported.failed > 0 ? "warn" : "default"} />
                  </div>

                  {imported.errors.length > 0 && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
                      <p className="text-[11px] font-semibold text-amber-300 mb-1">Erros</p>
                      {imported.errors.slice(0, 6).map((err, idx) => (
                        <p key={idx} className="text-[11px] text-amber-200/80">
                          {typeof err.rowNumber === "number" ? `Linha ${err.rowNumber}: ` : ""}{err.reason}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {(resultError || previewMutation.isError || commitMutation.isError) && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5">
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
