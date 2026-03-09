"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Microphone, Waveform, Stop, CaretRight, Check } from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as const

type Voice = { id: string; name: string; status: "active" | "ready" | "training" }

const VOICES: Voice[] = [
  { id: "1", name: "Clínica Harmonia", status: "active" },
  { id: "2", name: "Dra. Marina", status: "ready" },
  { id: "3", name: "Recepção principal", status: "ready" },
]

function RecordingBars({ active, intensity = 1, compact = false }: { active: boolean; intensity?: number; compact?: boolean }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.65, 0.75, 0.45, 0.8, 0.55]
  const h = compact ? 18 : 24
  return (
    <div className="flex items-end gap-[1px]" style={{ height: h }}>
      {bars.map((b, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-full bg-accent/70 min-w-[3px]"
          animate={active ? { height: [`${b * 20 * intensity}%`, `${b * 100}%`, `${b * 40}%`, `${b * 90}%`, `${b * 30}%`, `${b * 100}%`], opacity: [0.5, 1, 0.7, 1, 0.6, 1] } : { height: "8%", opacity: 0.2 }}
          transition={{ duration: 1.2, repeat: active ? Infinity : 0, delay: i * 0.06, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

function VoiceCard({ voice, isActive, onSetActive, index }: { voice: Voice; isActive: boolean; onSetActive: () => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease }}
      onClick={isActive ? undefined : onSetActive}
      className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-150 cursor-pointer ${isActive ? "border-accent/30 bg-accent/8" : "border-border/50 bg-card/30 hover:border-border hover:bg-muted/20"}`}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/50 bg-muted/20 shrink-0 overflow-hidden px-1">
        <RecordingBars active={isActive} intensity={0.8} compact />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-foreground truncate">{voice.name}</p>
        <p className="text-[10px] text-muted-foreground/70">{isActive ? "Voz ativa" : "Clique para ativar"}</p>
      </div>
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div key="a" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="flex items-center gap-1 rounded-md border border-accent/30 bg-accent/15 px-2 py-0.5">
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
            <span className="text-[9px] font-bold text-accent">Ativo</span>
          </motion.div>
        ) : (
          <motion.div key="b" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="flex items-center justify-center w-6 h-6 rounded border border-border/50 text-muted-foreground/50 group-hover:text-foreground/70 group-hover:border-border transition-all">
            <CaretRight className="h-3 w-3" weight="fill" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function RecordSection() {
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const handleRecord = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      setRecorded(true)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.start()
      mr.ondataavailable = () => {}
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop())
      setRecording(true)
      setRecorded(false)
    } catch {
      setRecording(true)
      setRecorded(false)
    }
  }

  const handleTrain = () => {
    setUploading(true)
    setTimeout(() => { setUploading(false); setRecorded(false) }, 2000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="rounded-xl border border-border/50 bg-card/30 p-5 xl:p-6 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <Waveform className="h-3.5 w-3.5 text-accent" weight="fill" />
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Treinar clone de voz</span>
      </div>
      <p className="text-[12px] text-foreground/80 leading-relaxed mb-4">Grave um áudio para treinar a IA com sua voz. Fale de forma natural, como se estivesse atendendo um paciente.</p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <motion.button onClick={handleRecord} disabled={uploading} className={`cursor-pointer relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${recording ? "border-rose-500/50 bg-rose-500/20" : "border-accent/40 bg-accent/10 hover:bg-accent/20 hover:border-accent/60"} ${uploading ? "opacity-50 pointer-events-none" : ""}`} whileTap={{ scale: 0.95 }} whileHover={!recording && !uploading ? { scale: 1.02 } : {}}>
          {recording && <motion.div className="absolute inset-0 bg-rose-500/20" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />}
          {recording ? <Stop className="h-6 w-6 text-rose-400 relative z-10" weight="fill" /> : <Microphone className="h-6 w-6 text-accent relative z-10" weight="fill" />}
        </motion.button>
        <div className="flex-1 w-full min-w-0 flex flex-col gap-2">
          <div className="h-8 flex items-center"><RecordingBars active={recording || recorded} intensity={recording ? 1 : 0.5} /></div>
          <p className="text-[10px] text-muted-foreground/50">{recording ? "Gravando..." : recorded ? "Áudio gravado." : "Clique no microfone."}</p>
        </div>
        <AnimatePresence mode="wait">
          {recorded && (
            <motion.button key="t" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} onClick={handleTrain} disabled={uploading} className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-[11px] font-bold text-accent hover:bg-accent/20 transition-all disabled:opacity-60">
              {uploading ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-3 w-3 rounded-full border-2 border-accent/40 border-t-accent" />Treinando...</> : <><Check className="h-3 w-3" weight="bold" />Enviar</>}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function VozTab() {
  const [activeVoiceId, setActiveVoiceId] = useState("1")
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_360px] gap-6 xl:gap-8 items-start w-full">
      <RecordSection />
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1 w-1 rounded-full bg-accent" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Vozes treinadas</span>
        </div>
        <div className="space-y-1.5">
          {VOICES.map((v, i) => (
            <VoiceCard key={v.id} voice={v} isActive={activeVoiceId === v.id} onSetActive={() => setActiveVoiceId(v.id)} index={i} />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-3">A voz ativa é usada em todos os atendimentos.</p>
      </div>
    </motion.div>
  )
}
