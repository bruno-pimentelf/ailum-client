"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Trash,
  Check,
  Spinner,
  Microphone,
  SpeakerHigh,
  Warning,
  X,
  Stop,
  Waveform,
  Play,
  Plus,
  Lightning,
} from "@phosphor-icons/react"
import { voicesApi, type Voice } from "@/lib/api/voices"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Preset voices ───────────────────────────────────────────────────────────

const PRESET_VOICES = [
  { name: "Dani", voiceId: "PznTnBc8X6pvixs9UkQm", description: "Feminina, natural" },
  { name: "Lucas", voiceId: "7lu3ze7orhWaNeSPowWx", description: "Masculina, jovem" },
  { name: "Roberta", voiceId: "ohZOfA9iwlZ5nOsoY7LB", description: "Feminina, profissional" },
] as const

// ─── Recording bars animation ─────────────────────────────────────────────────

function RecordingBars({ active, compact = false }: { active: boolean; compact?: boolean }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.65, 0.75, 0.45, 0.8, 0.55]
  const h = compact ? 18 : 24
  return (
    <div className="flex items-end gap-[1px]" style={{ height: h }}>
      {bars.map((b, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-full bg-accent/70 min-w-[3px]"
          animate={
            active
              ? { height: [`${b * 20}%`, `${b * 100}%`, `${b * 40}%`, `${b * 90}%`], opacity: [0.5, 1, 0.7, 1] }
              : { height: "8%", opacity: 0.2 }
          }
          transition={{ duration: 1.2, repeat: active ? Infinity : 0, delay: i * 0.06, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

// ─── Voice card ───────────────────────────────────────────────────────────────

function VoiceCard({
  voice,
  onDelete,
  onSetDefault,
  deleting,
  index,
}: {
  voice: Voice
  onDelete: () => void
  onSetDefault: () => void
  deleting: boolean
  index: number
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease }}
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
        voice.isDefault
          ? "border-accent/30 bg-accent/[0.06]"
          : "border-border/50 bg-card/30 hover:border-border/70"
      }`}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/50 bg-muted/20 shrink-0 overflow-hidden px-1">
        <RecordingBars active={voice.isDefault} compact />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-foreground truncate">{voice.name}</p>
        <p className="text-[10px] text-muted-foreground/70 font-mono">
          {voice.providerVoiceId.slice(0, 16)}...
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {voice.isDefault ? (
          <span className="flex items-center gap-1 rounded-md border border-accent/25 bg-accent/10 px-2 py-0.5">
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
            <span className="text-[9px] font-bold text-accent">Ativa</span>
          </span>
        ) : (
          <button
            onClick={onSetDefault}
            className="cursor-pointer text-[10px] font-medium text-muted-foreground/70 hover:text-accent px-2 py-1 rounded-md hover:bg-accent/10 transition-colors"
          >
            Ativar
          </button>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onDelete(); setConfirmDelete(false) }}
              disabled={deleting}
              className="cursor-pointer text-[10px] font-bold text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            >
              {deleting ? <Spinner className="h-3 w-3 animate-spin" /> : "Excluir"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="cursor-pointer text-[10px] text-muted-foreground/70 hover:text-foreground px-1 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="cursor-pointer flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Add voice by ID section ─────────────────────────────────────────────────

function AddByVoiceIdSection() {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [voiceId, setVoiceId] = useState("")

  const createMutation = useMutation({
    mutationFn: (body: { name: string; provider: "ELEVENLABS"; providerVoiceId: string }) =>
      voicesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voices"] })
      setName("")
      setVoiceId("")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !voiceId.trim()) return
    createMutation.mutate({ name: name.trim(), provider: "ELEVENLABS", providerVoiceId: voiceId.trim() })
  }

  function handleAddPreset(preset: typeof PRESET_VOICES[number]) {
    createMutation.mutate({ name: preset.name, provider: "ELEVENLABS", providerVoiceId: preset.voiceId })
  }

  // Check which presets are already added
  const { data: voices = [] } = useQuery({ queryKey: ["voices"], queryFn: voicesApi.list })
  const addedVoiceIds = new Set(voices.map((v) => v.providerVoiceId))

  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-accent" weight="bold" />
        <span className="text-[12px] font-semibold text-foreground">Adicionar por Voice ID</span>
      </div>

      {/* Preset voices */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-2">Vozes prontas</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_VOICES.map((preset) => {
            const alreadyAdded = addedVoiceIds.has(preset.voiceId)
            return (
              <button
                key={preset.voiceId}
                type="button"
                onClick={() => !alreadyAdded && handleAddPreset(preset)}
                disabled={createMutation.isPending || alreadyAdded}
                className={`cursor-pointer flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  alreadyAdded
                    ? "border-emerald-500/20 bg-emerald-500/[0.04] cursor-default"
                    : "border-border/50 bg-card/20 hover:border-accent/30 hover:bg-accent/[0.04]"
                } disabled:opacity-60`}
              >
                <div className={`h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center ${
                  alreadyAdded
                    ? "border-emerald-500/25 bg-emerald-500/10"
                    : "border-border/40 bg-muted/20"
                }`}>
                  {alreadyAdded
                    ? <Check className="h-3.5 w-3.5 text-emerald-400" weight="bold" />
                    : <SpeakerHigh className="h-3.5 w-3.5 text-muted-foreground/60" weight="duotone" />
                  }
                </div>
                <div className="min-w-0">
                  <p className={`text-[12px] font-semibold ${alreadyAdded ? "text-emerald-400" : "text-foreground/90"}`}>{preset.name}</p>
                  <p className="text-[10px] text-muted-foreground/50">{preset.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom voice ID form */}
      <div className="border-t border-border/30 pt-4">
        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-2">Voice ID customizado</p>
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da voz"
              className="h-9 rounded-lg border border-border/50 bg-muted/20 px-3 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <input
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              placeholder="ElevenLabs Voice ID"
              className="h-9 rounded-lg border border-border/50 bg-muted/20 px-3 text-[12px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !voiceId.trim() || createMutation.isPending}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent/15 border border-accent/25 px-3.5 py-2 text-[11px] font-bold text-accent hover:bg-accent/25 transition-all disabled:opacity-40"
          >
            {createMutation.isPending
              ? <Spinner className="h-3 w-3 animate-spin" />
              : <Plus className="h-3 w-3" weight="bold" />
            }
            Adicionar voz
          </button>
        </form>

        <AnimatePresence>
          {createMutation.error && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 mt-2">
              <Warning className="h-3.5 w-3.5 text-rose-400 shrink-0" weight="fill" />
              <p className="text-[11px] text-rose-400">{(createMutation.error as Error).message}</p>
            </motion.div>
          )}
          {createMutation.isSuccess && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 mt-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" weight="bold" />
              <p className="text-[11px] text-emerald-400">Voz adicionada! Selecione-a no funil.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Record + clone section ───────────────────────────────────────────────────

function RecordAndCloneSection() {
  const queryClient = useQueryClient()
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [voiceName, setVoiceName] = useState("")
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cloneMutation = useMutation({
    mutationFn: ({ name, blob }: { name: string; blob: Blob }) => voicesApi.clone(name, blob),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voices"] })
      setAudioBlob(null)
      setAudioUrl(null)
      setVoiceName("")
      setDuration(0)
    },
  })

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" })
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
      }
      mediaRecorderRef.current = mr
      mr.start(250)
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch {
      // Mic access denied
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
  }, [audioUrl])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Microphone className="h-4 w-4 text-accent" weight="duotone" />
        <span className="text-[12px] font-semibold text-foreground">Clonar voz por gravação</span>
      </div>

      <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
        Grave pelo menos 30 segundos falando naturalmente. A IA vai aprender essa voz.
      </p>

      <div className="flex items-center gap-4">
        <motion.button
          onClick={recording ? stopRecording : audioBlob ? resetRecording : startRecording}
          className={`cursor-pointer relative flex items-center justify-center w-14 h-14 rounded-2xl border-2 transition-all duration-300 overflow-hidden shrink-0 ${
            recording
              ? "border-rose-500/50 bg-rose-500/15"
              : audioBlob
              ? "border-border/50 bg-muted/20 hover:border-border"
              : "border-accent/40 bg-accent/10 hover:bg-accent/20 hover:border-accent/60"
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {recording && (
            <motion.div
              className="absolute inset-0 bg-rose-500/15"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
          {recording ? (
            <Stop className="h-5 w-5 text-rose-400 relative z-10" weight="fill" />
          ) : audioBlob ? (
            <X className="h-5 w-5 text-muted-foreground relative z-10" />
          ) : (
            <Microphone className="h-5 w-5 text-accent relative z-10" weight="fill" />
          )}
        </motion.button>

        <div className="flex-1 min-w-0 space-y-1.5">
          <RecordingBars active={recording} />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground/60">
              {formatTime(duration)}
            </span>
            <span className="text-[10px] text-muted-foreground/40">
              {recording ? "Gravando..." : audioBlob ? "Gravação pronta" : "Clique pra gravar"}
            </span>
          </div>
        </div>
      </div>

      {audioUrl && !recording && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg bg-muted/10 border border-border/30 px-3 py-2.5">
          <button onClick={() => new Audio(audioUrl).play()}
            className="cursor-pointer flex items-center justify-center h-7 w-7 rounded-full bg-accent/15 text-accent hover:bg-accent/25 transition-colors shrink-0">
            <Play className="h-3 w-3 ml-0.5" weight="fill" />
          </button>
          <Waveform className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          <span className="text-[11px] text-muted-foreground/50 flex-1">Ouvir gravação</span>
          <span className="text-[10px] text-muted-foreground/40 tabular-nums">{formatTime(duration)}</span>
        </motion.div>
      )}

      {audioBlob && !recording && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">Nome da voz</label>
            <input value={voiceName} onChange={(e) => setVoiceName(e.target.value)} placeholder="Ex: Recepção, Dra. Marina"
              className="mt-1 w-full rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <motion.button
            onClick={() => { if (audioBlob && voiceName.trim().length >= 2) cloneMutation.mutate({ name: voiceName.trim(), blob: audioBlob }) }}
            disabled={voiceName.trim().length < 2 || cloneMutation.isPending}
            className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/15 px-4 py-2.5 text-[12px] font-semibold text-accent hover:bg-accent/25 transition-all disabled:opacity-40"
            whileTap={{ scale: 0.98 }}
          >
            {cloneMutation.isPending ? <><Spinner className="h-3.5 w-3.5 animate-spin" />Clonando voz...</> : <><Waveform className="h-3.5 w-3.5" weight="fill" />Clonar esta voz</>}
          </motion.button>

          <AnimatePresence>
            {cloneMutation.error && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2">
                <Warning className="h-3.5 w-3.5 text-rose-400 shrink-0" weight="fill" />
                <p className="text-[11px] text-rose-400">{(cloneMutation.error as Error).message}</p>
              </motion.div>
            )}
            {cloneMutation.isSuccess && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" weight="bold" />
                <p className="text-[11px] text-emerald-400">Voz clonada com sucesso!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VozTab() {
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: voices = [], isLoading } = useQuery({
    queryKey: ["voices"],
    queryFn: voicesApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => voicesApi.delete(id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["voices"] }),
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => voicesApi.setDefault(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["voices"] }),
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 w-full"
    >
      {/* Voices list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-bold text-foreground/85">Vozes</p>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
              {isLoading ? "Carregando..." : `${voices.length} voz${voices.length !== 1 ? "es" : ""} configurada${voices.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-5 w-5 text-accent animate-spin" />
            </div>
          ) : voices.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8 px-4 rounded-xl border border-dashed border-border/40">
              <SpeakerHigh className="h-8 w-8 text-muted-foreground/20 mb-3" weight="duotone" />
              <p className="text-[12px] text-muted-foreground/50">Nenhuma voz configurada</p>
              <p className="text-[10px] text-muted-foreground/35 mt-1">Adicione uma voz abaixo pra ativar respostas por áudio</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
              <AnimatePresence mode="popLayout">
                {voices.map((v, i) => (
                  <VoiceCard
                    key={v.id}
                    voice={v}
                    index={i}
                    deleting={deletingId === v.id}
                    onDelete={() => deleteMutation.mutate(v.id)}
                    onSetDefault={() => setDefaultMutation.mutate(v.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence>
            {deleteMutation.error && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2">
                <Warning className="h-3.5 w-3.5 text-rose-400 shrink-0" weight="fill" />
                <p className="text-[11px] text-rose-400">{(deleteMutation.error as Error)?.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-[10px] text-muted-foreground/40 mt-3">
          Após adicionar, selecione a voz no funil desejado para ativar respostas por áudio.
        </p>
      </div>

      {/* Add methods */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AddByVoiceIdSection />
        <RecordAndCloneSection />
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightning className="h-4 w-4 text-accent" weight="fill" />
          <span className="text-[12px] font-semibold text-foreground">Como funciona</span>
        </div>
        <div className="space-y-2 text-[12px] text-muted-foreground/70 leading-relaxed">
          <p>
            Você pode adicionar vozes de duas formas: usando um <span className="text-foreground font-medium">Voice ID do ElevenLabs</span> (rápido, usa vozes prontas)
            ou <span className="text-foreground font-medium">clonando uma voz</span> a partir de uma gravação de áudio (mínimo 30 segundos).
          </p>
          <p className="text-[11px] text-muted-foreground/50">
            Após adicionar, vá em <span className="text-foreground/70 font-medium">Boards &rarr; Configurações do stage &rarr; Voz</span> e selecione a voz que o assistente deve usar naquele estágio.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
