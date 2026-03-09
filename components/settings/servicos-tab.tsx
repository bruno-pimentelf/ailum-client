"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Storefront,
  Plus,
  Pencil,
  Trash,
  Check,
  X,
  Image as ImageIcon,
} from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as const

type Servico = {
  id: string
  title: string
  price: string
  description: string
  photos: string[]
}

const SERVICOS_INITIAL: Servico[] = [
  { id: "1", title: "Consulta particular", price: "250", description: "Consulta de 50 minutos com especialista.", photos: [] },
  { id: "2", title: "Retorno", price: "120", description: "Retorno para acompanhamento.", photos: [] },
]

function ServiceCard({ servico, index, onEdit, onDelete }: { servico: Servico; index: number; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease }}
      className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="h-14 w-14 shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center overflow-hidden">
        {servico.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={servico.photos[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-6 w-6 text-white/20" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white/90 truncate">{servico.title}</p>
        <p className="text-[11px] text-white/45 line-clamp-1">{servico.description}</p>
        <p className="text-[12px] font-bold text-emerald-400/90 mt-0.5">R$ {servico.price}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-all">
          <Trash className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

function ServiceEditor({ servico, onSave, onClose }: { servico: Servico | null; onSave: (s: Servico) => void; onClose: () => void }) {
  const isNew = servico === null
  const [form, setForm] = useState<Servico>(
    servico ?? { id: `s-${Date.now()}`, title: "", price: "", description: "", photos: [] }
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-white/[0.10] bg-[oklch(0.155_0.022_263)] shadow-2xl p-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-black text-white/95">{isNew ? "Novo serviço" : "Editar serviço"}</h3>
          <button onClick={onClose} className="cursor-pointer p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/[0.06]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Título</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ex: Consulta particular"
              className="cursor-text w-full h-10 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 text-[13px] font-medium text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent/40" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Preço (R$)</label>
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })} placeholder="250"
              className="cursor-text w-full h-10 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 text-[13px] font-medium text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent/40" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o serviço..." rows={3}
              className="cursor-text w-full rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-[12px] text-white/80 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent/40 resize-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Fotos</label>
            <div className="flex gap-2 flex-wrap">
              {form.photos.map((url, i) => (
                <div key={i} className="relative h-16 w-16 rounded-lg border border-white/[0.08] bg-white/[0.04] overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <button onClick={() => setForm({ ...form, photos: form.photos.filter((_, j) => j !== i) })}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded bg-black/60 flex items-center justify-center text-white/80 hover:bg-rose-500/80">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              <label className="cursor-pointer flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-white/[0.15] bg-white/[0.02] hover:border-accent/40 hover:bg-accent/5 transition-all">
                <ImageIcon className="h-6 w-6 text-white/30" />
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => {
                    const files = e.target.files
                    if (!files?.length) return
                    const urls = [...form.photos, ...Array.from(files).map((f) => URL.createObjectURL(f))]
                    setForm({ ...form, photos: urls })
                    e.target.value = ""
                  }} />
              </label>
            </div>
            <p className="text-[10px] text-white/25 mt-1">Clique para adicionar imagens</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="cursor-pointer px-4 py-2 rounded-lg text-[12px] font-semibold text-white/40 hover:text-white/70">
            Cancelar
          </button>
          <button onClick={() => { onSave(form); onClose() }}
            className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-[12px] font-bold text-accent-foreground hover:bg-accent/90">
            <Check className="h-3.5 w-3.5" weight="bold" /> {isNew ? "Criar" : "Salvar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function ServicosTab() {
  const [servicos, setServicos] = useState<Servico[]>(SERVICOS_INITIAL)
  const [editing, setEditing] = useState<Servico | null | "new">(null)

  const handleSave = (s: Servico) => {
    setServicos((prev) => {
      const i = prev.findIndex((x) => x.id === s.id)
      if (i >= 0) return prev.map((x, j) => (j === i ? s : x))
      return [...prev, s]
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-white/40">Cadastre os serviços oferecidos pela clínica</p>
        <button onClick={() => setEditing("new")}
          className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
          <Plus className="h-3 w-3" weight="bold" /> Novo serviço
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 w-full">
        {servicos.map((s, i) => (
          <ServiceCard key={s.id} servico={s} index={i} onEdit={() => setEditing(s)} onDelete={() => setServicos((p) => p.filter((x) => x.id !== s.id))} />
        ))}
        {servicos.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-white/[0.08]">
            <Storefront className="h-8 w-8 text-white/15 mb-3" />
            <p className="text-[12px] font-bold text-white/40">Nenhum serviço cadastrado</p>
            <button onClick={() => setEditing("new")}
              className="mt-3 cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15">
              <Plus className="h-3 w-3" /> Adicionar primeiro serviço
            </button>
          </div>
        )}
      </div>
      <AnimatePresence>
        {editing !== null && (
          <ServiceEditor servico={editing === "new" ? null : editing} onSave={handleSave} onClose={() => setEditing(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
