"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { Robot, Sparkle, Check } from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as any


const timeSlots = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]

interface Appointment {
  id: number
  time: string
  patient: string
  type: string
  doctor: string
  color: string
  textColor: string
}

export function DemoCalendar() {
  const { t } = useLanguage()
  const doctors = [
    { id: "marina", name: t.demo.doctorMarina, color: "bg-accent text-accent-foreground" },
    { id: "carlos", name: t.demo.doctorCarlos, color: "bg-blue-500 text-white" },
  ]
  const aptTypes = t.demo.aptTypes
  const appointmentSequence: (Appointment & { delay: number })[] = [
    { id: 1, time: "08:00", patient: "Ana Costa", type: aptTypes[0], doctor: "marina", color: "bg-accent/10 border-accent/20", textColor: "text-accent", delay: 1200 },
    { id: 2, time: "10:00", patient: "Pedro Lima", type: aptTypes[1], doctor: "carlos", color: "bg-blue-500/10 border-blue-500/20", textColor: "text-blue-600", delay: 3000 },
    { id: 3, time: "14:00", patient: "Julia Santos", type: aptTypes[2], doctor: "marina", color: "bg-accent/10 border-accent/20", textColor: "text-accent", delay: 5000 },
    { id: 4, time: "11:00", patient: "Rafael Dias", type: aptTypes[3], doctor: "carlos", color: "bg-blue-500/10 border-blue-500/20", textColor: "text-blue-600", delay: 7000 },
    { id: 5, time: "16:00", patient: "Maria Oliveira", type: aptTypes[4], doctor: "marina", color: "bg-accent/10 border-accent/20", textColor: "text-accent", delay: 9000 },
  ]
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [visibleAppointments, setVisibleAppointments] = useState<number[]>([])
  const [activeDoctor, setActiveDoctor] = useState("todos")
  const [creatingId, setCreatingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isInView) return
    let cancelled = false

    async function runSequence() {
      for (const apt of appointmentSequence) {
        // Pause between appointments
        await new Promise((r) => setTimeout(r, 1600))
        if (cancelled) return

        // Show "creating" state with spinner
        setCreatingId(apt.id)
        await new Promise((r) => setTimeout(r, 1400))
        if (cancelled) return

        // Reveal the appointment
        setVisibleAppointments((prev) => [...prev, apt.id])
        setCreatingId(null)
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    const t = setTimeout(runSequence, 600)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [isInView])

  const filteredAppointments = appointmentSequence.filter(
    (apt) => activeDoctor === "todos" || apt.doctor === activeDoctor
  )

  const days = t.demo.calDays
  const dates = [10, 11, 12, 13, 14]

  return (
    <div ref={ref} className="w-full">
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-foreground/[0.03]">
        {/* Calendar header */}
        <div className="flex flex-col gap-2 border-b border-border px-3 py-3 sm:px-5 sm:py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-medium text-foreground">{t.demo.calMonth}</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:overflow-visible md:pb-0">
            <button
              onClick={() => setActiveDoctor("todos")}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-medium transition-all duration-300 ${activeDoctor === "todos"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.demo.calAll}
            </button>
            {doctors.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDoctor(doc.id)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-medium transition-all duration-300 ${activeDoctor === doc.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {doc.name}
              </button>
            ))}
          </div>
        </div>

        {/* AI creating toast */}
        <div className="relative min-h-8 border-b border-border bg-muted/30">
          <AnimatePresence mode="wait">
            {creatingId ? (
              <motion.div
                key={creatingId}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.3, ease }}
                className="absolute inset-0 flex items-center justify-center gap-1.5 px-2 text-center"
              >
                <Sparkle className="h-3 w-3 text-accent animate-pulse" />
                <span className="text-[9px] text-muted-foreground sm:text-[10px]">
                  {t.demo.calPixFrom}{" "}
                  <span className="font-medium text-foreground">
                    {appointmentSequence.find((a) => a.id === creatingId)?.patient}
                  </span>
                  {" — "}
                  <span className="text-accent">{t.demo.calScheduling}</span>
                </span>
                <Check className="h-3 w-3 text-emerald-500" />
              </motion.div>
            ) : visibleAppointments.length > 0 ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center gap-1.5 px-2 text-center"
              >
                <Robot className="h-3 w-3 text-accent" />
                <span className="text-[9px] text-muted-foreground sm:text-[10px]">
                  {visibleAppointments.length} {visibleAppointments.length === 1 ? t.demo.calConfirmed : t.demo.calConfirmedPlural} {t.demo.calToday}
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Day headers */}
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            {/* Day headers */}
            <div className="grid grid-cols-5 border-b border-border">
              {days.map((day, i) => (
                <div key={day} className={`flex flex-col items-center py-2.5 ${i === 2 ? "bg-accent/[0.04]" : ""}`}>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{day}</span>
                  <span className={`text-sm font-medium mt-0.5 ${i === 2 ? "text-accent" : "text-foreground"}`}>
                    {dates[i]}
                  </span>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="flex flex-col">
              {timeSlots.map((time) => {
                const apt = filteredAppointments.find((a) => a.time === time)
                return (
                  <div key={time} className="grid grid-cols-5 border-b border-border/50 last:border-b-0">
                    {days.map((_, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`relative h-11 px-1 py-0.5 ${dayIndex === 2 ? "bg-accent/[0.02]" : ""} ${dayIndex === 0 ? "flex items-center" : ""}`}
                      >
                        {dayIndex === 0 && (
                          <span className="text-[9px] text-muted-foreground/85 pl-1 tabular-nums">{time}</span>
                        )}
                        {dayIndex === 2 && apt && (
                          <AnimatePresence>
                            {visibleAppointments.includes(apt.id) && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.6, ease }}
                                className={`absolute inset-x-0.5 inset-y-0.5 rounded-lg border ${apt.color} flex flex-col justify-center px-2`}
                              >
                                <span className={`text-[9px] font-medium truncate ${apt.textColor}`}>{apt.patient}</span>
                                <span className={`text-[7px] truncate ${apt.textColor} opacity-60`}>{apt.type}</span>
                              </motion.div>
                            )}
                            {creatingId === apt.id && !visibleAppointments.includes(apt.id) && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-x-0.5 inset-y-0.5 rounded-lg border border-dashed border-accent/30 bg-accent/[0.04] flex items-center justify-center"
                              >
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                >
                                  <Sparkle className="h-3 w-3 text-accent/50" />
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
