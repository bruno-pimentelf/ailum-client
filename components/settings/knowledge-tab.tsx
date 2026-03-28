"use client"

import { useState, useRef, useCallback } from "react"
import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Books,
  Plus,
  Pencil,
  Trash,
  Check,
  X,
  Warning,
  ArrowsClockwise,
  Eye,
  EyeSlash,
  FileText,
  Question,
  Lightning,
  Image as ImageIcon,
  FilePdf,
  SpeakerHigh,
  VideoCamera,
  UploadSimple,
  CloudArrowUp,
  File,
} from "@phosphor-icons/react"
import {
  useKnowledgeDocuments,
  useCreateKnowledgeDocument,
  useUploadKnowledgeDocument,
  useUpdateKnowledgeDocument,
  useReprocessKnowledgeDocument,
  useRemoveKnowledgeDocument,
} from "@/hooks/use-knowledge"
import type { KnowledgeDocument, KnowledgeDocumentInput } from "@/lib/api/knowledge"
import { ACCEPTED_EXTENSIONS } from "@/lib/api/knowledge"

const ease = [0.33, 1, 0.68, 1] as const

const SOURCE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  TEXT:  { label: "Texto",  icon: FileText,     color: "text-sky-400" },
  FAQ:   { label: "FAQ",    icon: Question,      color: "text-amber-400" },
  IMAGE: { label: "Imagem", icon: ImageIcon,     color: "text-violet-400" },
  PDF:   { label: "PDF",    icon: FilePdf,       color: "text-rose-400" },
  AUDIO: { label: "Áudio",  icon: SpeakerHigh,   color: "text-emerald-400" },
  VIDEO: { label: "Vídeo",  icon: VideoCamera,   color: "text-orange-400" },
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Document Card ───────────────────────────────────────────────────────────

function DocumentCard({
  doc,
  index,
  onEdit,
  onView,
}: {
  doc: KnowledgeDocument
  index: number
  onEdit: () => void
  onView: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const remove = useRemoveKnowledgeDocument()
  const update = useUpdateKnowledgeDocument()

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try { await remove.mutateAsync(doc.id) } catch { /* refetch handles */ }
  }

  async function toggleActive() {
    try { await update.mutateAsync({ id: doc.id, body: { isActive: !doc.isActive } }) } catch { /* */ }
  }

  const meta = SOURCE_META[doc.sourceType] ?? SOURCE_META.TEXT!
  const SourceIcon = meta.icon
  const isFile = ["IMAGE", "PDF", "AUDIO", "VIDEO"].includes(doc.sourceType)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.28, delay: index * 0.03, ease }}
      className={`group flex items-start gap-4 rounded-xl border p-4 transition-all ${
        doc.isActive
          ? "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.035]"
          : "border-white/[0.05] bg-white/[0.01] opacity-60"
      }`}
    >
      <div className="h-12 w-12 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
        <SourceIcon className={`h-5 w-5 ${meta.color}`} weight="duotone" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-white/90 truncate leading-tight">{doc.title}</p>
          {!doc.isActive && (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-white/40 bg-white/[0.06] px-1.5 py-0.5 rounded">Inativo</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className={`flex items-center gap-1 text-[11px] font-bold ${meta.color}`}>
            <SourceIcon className="h-3 w-3" weight="fill" />
            {meta.label}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/50">
            <Lightning className="h-3 w-3" weight="fill" />
            {doc._count.chunks} chunk{doc._count.chunks !== 1 ? "s" : ""}
          </span>
          {isFile && doc.fileName && (
            <span className="text-[10px] text-white/30 truncate max-w-[120px]" title={doc.fileName}>
              {doc.fileName}
            </span>
          )}
          {isFile && doc.fileSize && (
            <span className="text-[10px] text-white/30">{formatFileSize(doc.fileSize)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button onClick={onView} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:text-white/85 hover:bg-white/[0.06] transition-all" title="Ver conteúdo">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button onClick={toggleActive} disabled={update.isPending} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:text-white/85 hover:bg-white/[0.06] transition-all disabled:opacity-50" title={doc.isActive ? "Desativar" : "Ativar"}>
          {doc.isActive ? <EyeSlash className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button onClick={onEdit} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:text-white/85 hover:bg-white/[0.06] transition-all" title="Editar">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={remove.isPending}
          onBlur={() => setConfirmDelete(false)}
          className={`cursor-pointer flex h-7 items-center justify-center rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 ${
            confirmDelete
              ? "gap-1 px-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 w-auto"
              : "w-7 text-white/50 hover:text-rose-400 hover:bg-rose-500/[0.08]"
          }`}
          title={confirmDelete ? "Confirmar exclusão" : "Excluir"}
        >
          {remove.isPending
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-3 w-3 rounded-full border-2 border-rose-400/30 border-t-rose-400" />
            : confirmDelete
              ? <><Check className="h-3 w-3" weight="bold" /> Confirmar</>
              : <Trash className="h-3.5 w-3.5" />
          }
        </button>
      </div>
    </motion.div>
  )
}

// ─── Create Mode Selector ────────────────────────────────────────────────────

function CreateModeSelector({ onSelectText, onSelectFile, onClose }: {
  onSelectText: () => void
  onSelectFile: () => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-white/[0.10] bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <h2 className="text-[14px] font-semibold text-white/90">Adicionar documento</h2>
          <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:text-white/85 hover:bg-white/[0.06] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-2">
          <button
            onClick={onSelectText}
            className="cursor-pointer w-full flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all text-left"
          >
            <div className="h-10 w-10 shrink-0 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-sky-400" weight="duotone" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white/90">Texto ou FAQ</p>
              <p className="text-[10px] text-white/40 mt-0.5">Escreva conteúdo de texto ou perguntas e respostas</p>
            </div>
          </button>
          <button
            onClick={onSelectFile}
            className="cursor-pointer w-full flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all text-left"
          >
            <div className="h-10 w-10 shrink-0 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <UploadSimple className="h-5 w-5 text-violet-400" weight="duotone" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white/90">Upload de arquivo</p>
              <p className="text-[10px] text-white/40 mt-0.5">Imagem, PDF, áudio ou vídeo ({ACCEPTED_EXTENSIONS})</p>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Text Document Editor Modal ──────────────────────────────────────────────

function TextEditorModal({
  doc,
  onClose,
}: {
  doc: KnowledgeDocument | null
  onClose: () => void
}) {
  const isNew = doc === null
  const create = useCreateKnowledgeDocument()
  const reprocess = useReprocessKnowledgeDocument()
  const update = useUpdateKnowledgeDocument()
  const isPending = create.isPending || reprocess.isPending || update.isPending

  const [form, setForm] = useState({
    title:      doc?.title ?? "",
    sourceType: (doc?.sourceType as "TEXT" | "FAQ") ?? "TEXT",
    content:    doc?.rawContent ?? "",
  })
  const [error, setError] = useState<string | null>(null)

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const title = form.title.trim()
    const content = form.content.trim()
    if (!title)   { setError("Título é obrigatório."); return }
    if (!content) { setError("Conteúdo é obrigatório."); return }

    try {
      if (isNew) {
        await create.mutateAsync({ title, sourceType: form.sourceType, content })
      } else {
        if (title !== doc.title) await update.mutateAsync({ id: doc.id, body: { title } })
        if (content !== (doc.rawContent ?? "")) await reprocess.mutateAsync({ id: doc.id, content })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar documento")
    }
  }

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length
  const estimatedChunks = Math.max(1, Math.ceil(wordCount / 500))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-white/[0.10] bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
              <Books className="h-4 w-4 text-accent" weight="duotone" />
            </div>
            <h2 className="text-[14px] font-semibold text-white/90">{isNew ? "Novo documento" : "Editar documento"}</h2>
          </div>
          <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:text-white/85 hover:bg-white/[0.06] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5">Título *</label>
            <input value={form.title} onChange={set("title")} placeholder="ex: FAQ da Clínica, Procedimentos..." autoFocus
              className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {(["TEXT", "FAQ"] as const).map((type) => {
                const info = SOURCE_META[type]!
                const Icon = info.icon
                const active = form.sourceType === type
                return (
                  <button key={type} type="button" onClick={() => setForm((p) => ({ ...p, sourceType: type }))} disabled={!isNew}
                    className={`cursor-pointer flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all ${active ? "border-accent/30 bg-accent/8 text-accent" : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:border-white/[0.12] hover:text-white/70"} ${!isNew ? "opacity-60 cursor-not-allowed" : ""}`}>
                    <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
                    <div className="text-left">
                      <p className="text-[12px] font-bold">{info.label}</p>
                      <p className="text-[10px] opacity-70">{type === "TEXT" ? "Texto corrido livre" : "Perguntas e respostas"}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider">Conteúdo *</label>
              <span className="text-[10px] text-white/30">~{wordCount} palavras / ~{estimatedChunks} chunk{estimatedChunks !== 1 ? "s" : ""}</span>
            </div>
            <textarea value={form.content} onChange={set("content")} rows={12}
              placeholder={form.sourceType === "FAQ"
                ? "P: Qual o endereço da clínica?\nR: Av. Nossa Sra. da Penha, 235 - Santa Helena, Vitória/ES\n\nP: Aceita convênio?\nR: Não, somos apenas particular."
                : "Escreva o conteúdo que a IA deve usar como referência..."}
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none transition-all leading-relaxed font-mono" />
            {form.sourceType === "FAQ" && (
              <p className="text-[10px] text-white/30 mt-1.5">Use P: (pergunta) e R: (resposta) para cada par.</p>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5">
                <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
                <p className="text-[12px] text-rose-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={onClose} className="cursor-pointer flex-1 rounded-xl border border-white/[0.09] py-2 text-[13px] text-white/50 hover:text-white/85 hover:bg-white/[0.04] transition-colors">Cancelar</button>
            <button type="submit" disabled={isPending}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60">
              {isPending
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                : <Check className="h-3.5 w-3.5" weight="bold" />}
              {isPending ? "Salvando..." : isNew ? "Criar documento" : "Salvar"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── File Upload Modal ───────────────────────────────────────────────────────

function FileUploadModal({ onClose }: { onClose: () => void }) {
  const upload = useUploadKnowledgeDocument()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)
    if (file.size > 20 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo: 20MB")
      return
    }
    setSelectedFile(file)
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""))
  }, [title])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) { setError("Selecione um arquivo."); return }
    if (!title.trim()) { setError("Título é obrigatório."); return }

    try {
      await upload.mutateAsync({ file: selectedFile, title: title.trim() })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload")
    }
  }

  const fileMeta = selectedFile ? SOURCE_META[
    selectedFile.type.startsWith("image/") ? "IMAGE"
    : selectedFile.type === "application/pdf" ? "PDF"
    : selectedFile.type.startsWith("audio/") ? "AUDIO"
    : selectedFile.type.startsWith("video/") ? "VIDEO"
    : "TEXT"
  ] : null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
              <UploadSimple className="h-4 w-4 text-violet-400" weight="duotone" />
            </div>
            <h2 className="text-[14px] font-semibold text-white/90">Upload de arquivo</h2>
          </div>
          <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:text-white/85 hover:bg-white/[0.06] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 px-4 transition-all ${
              dragOver
                ? "border-accent/50 bg-accent/[0.06]"
                : selectedFile
                  ? "border-white/[0.12] bg-white/[0.03]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.035]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.mp3,.wav,.mp4,.mov"
              onChange={handleFileInput}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 shrink-0 rounded-lg ${fileMeta ? `bg-white/[0.04]` : "bg-white/[0.04]"} border border-white/[0.08] flex items-center justify-center`}>
                  {fileMeta ? <fileMeta.icon className={`h-5 w-5 ${fileMeta.color}`} weight="duotone" /> : <File className="h-5 w-5 text-white/50" weight="duotone" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white/90 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-white/40">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setTitle("") }}
                  className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <>
                <CloudArrowUp className={`h-8 w-8 mb-2 ${dragOver ? "text-accent/70" : "text-white/20"}`} weight="duotone" />
                <p className="text-[12px] font-semibold text-white/60">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-[10px] text-white/30 mt-1">{ACCEPTED_EXTENSIONS} (máx. 20MB)</p>
              </>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5">Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do documento..."
              className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all" />
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <Lightning className="h-3.5 w-3.5 text-accent/50 shrink-0 mt-0.5" weight="fill" />
            <p className="text-[10px] text-white/40 leading-relaxed">
              O conteúdo do arquivo será automaticamente extraído e indexado pela IA.
              PDFs têm o texto extraído, imagens são descritas, e áudios são transcritos.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5">
                <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
                <p className="text-[12px] text-rose-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={onClose} className="cursor-pointer flex-1 rounded-xl border border-white/[0.09] py-2 text-[13px] text-white/50 hover:text-white/85 hover:bg-white/[0.04] transition-colors">Cancelar</button>
            <button type="submit" disabled={upload.isPending || !selectedFile}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60">
              {upload.isPending
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                : <UploadSimple className="h-3.5 w-3.5" weight="bold" />}
              {upload.isPending ? "Processando..." : "Upload e indexar"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Content Viewer Modal ────────────────────────────────────────────────────

function ContentViewerModal({ doc, onClose, onEdit }: { doc: KnowledgeDocument; onClose: () => void; onEdit: () => void }) {
  const meta = SOURCE_META[doc.sourceType] ?? SOURCE_META.TEXT!
  const SourceIcon = meta.icon

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-white/[0.10] bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <SourceIcon className={`h-4 w-4 ${meta.color}`} weight="duotone" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-white/90">{doc.title}</h2>
              <p className="text-[10px] text-white/40 mt-0.5">
                {meta.label} / {doc._count.chunks} chunk{doc._count.chunks !== 1 ? "s" : ""}
                {doc.fileName && ` / ${doc.fileName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!["IMAGE", "PDF", "AUDIO", "VIDEO"].includes(doc.sourceType) && (
              <button onClick={onEdit} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:text-white/85 hover:bg-white/[0.06] transition-colors" title="Editar">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:text-white/85 hover:bg-white/[0.06] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {["IMAGE", "PDF", "AUDIO", "VIDEO"].includes(doc.sourceType) && (
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 mb-3">
              <SourceIcon className={`h-4 w-4 ${meta.color}`} weight="fill" />
              <p className="text-[11px] text-white/40">Conteúdo extraído automaticamente do arquivo {doc.fileName ? `"${doc.fileName}"` : ""}</p>
            </div>
          )}
          <pre className="text-[12px] text-white/70 whitespace-pre-wrap leading-relaxed font-mono">
            {doc.rawContent || "Sem conteúdo"}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── KnowledgeTab ────────────────────────────────────────────────────────────

export function KnowledgeTab() {
  const { data: documents, isLoading, error, refetch } = useKnowledgeDocuments()
  const [modal, setModal] = useState<"select" | "text" | "file" | null>(null)
  const [editing, setEditing] = useState<KnowledgeDocument | null>(null)
  const [viewing, setViewing] = useState<KnowledgeDocument | null>(null)

  const list = documents ?? []
  const activeCount = list.filter((d) => d.isActive).length

  function handleEdit(doc: KnowledgeDocument) {
    if (["IMAGE", "PDF", "AUDIO", "VIDEO"].includes(doc.sourceType)) {
      setViewing(doc)
    } else {
      setEditing(doc)
    }
  }

  return (
    <>
      <AnimatePresence>
        {modal === "select" && (
          <CreateModeSelector
            onSelectText={() => { setModal("text") }}
            onSelectFile={() => { setModal("file") }}
            onClose={() => setModal(null)}
          />
        )}
        {modal === "text" && <TextEditorModal doc={null} onClose={() => setModal(null)} />}
        {modal === "file" && <FileUploadModal onClose={() => setModal(null)} />}
        {editing && <TextEditorModal doc={editing} onClose={() => setEditing(null)} />}
        {viewing && (
          <ContentViewerModal
            doc={viewing}
            onClose={() => setViewing(null)}
            onEdit={() => { setEditing(viewing); setViewing(null) }}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-white/85">Base de Conhecimento</p>
            <p className="text-[11px] text-white/50 mt-0.5">
              {isLoading ? "Carregando..." : `${list.length} documento${list.length !== 1 ? "s" : ""} (${activeCount} ativo${activeCount !== 1 ? "s" : ""})`}
            </p>
          </div>
          <button onClick={() => setModal("select")}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
            <Plus className="h-3 w-3" weight="bold" /> Novo documento
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-accent/15 bg-accent/[0.04] px-4 py-3">
          <Books className="h-5 w-5 text-accent/60 shrink-0 mt-0.5" weight="duotone" />
          <div>
            <p className="text-[12px] font-semibold text-accent/80">Como funciona</p>
            <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
              Adicione textos, FAQs, imagens, PDFs, áudios ou vídeos. A IA indexa tudo automaticamente e usa como referência
              ao responder dúvidas dos pacientes. PDFs têm o texto extraído, imagens são descritas e áudios são transcritos.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 rounded-xl border border-dashed border-white/[0.07]">
            <Warning className="h-7 w-7 text-rose-400/40" weight="duotone" />
            <p className="text-[12px] text-white/50">Erro ao carregar documentos</p>
            <button onClick={() => refetch()}
              className="cursor-pointer flex items-center gap-1.5 text-[11px] text-accent/60 hover:text-accent transition-colors">
              <ArrowsClockwise className="h-3.5 w-3.5" /> Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {list.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <AnimatePresence initial={false}>
                  {list.map((doc, i) => (
                    <DocumentCard key={doc.id} doc={doc} index={i} onEdit={() => handleEdit(doc)} onView={() => setViewing(doc)} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/[0.07] gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02]">
                  <Books className="h-5 w-5 text-white/30" weight="duotone" />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-white/90">Nenhum documento na base</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Adicione FAQs, textos, imagens ou PDFs para a IA usar</p>
                </div>
                <button onClick={() => setModal("select")}
                  className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3.5 py-2 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
                  <Plus className="h-3 w-3" weight="bold" /> Criar primeiro documento
                </button>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </>
  )
}
