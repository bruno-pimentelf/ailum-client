"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gear,
  CaretRight,
  Check,
  Trash,
  WhatsappLogo,
  PlugsConnected,
  X,
  Sparkle,
  ArrowsClockwise,
  QrCode,
  LinkBreak,
  Warning,
} from "@phosphor-icons/react"
import {
  useIntegrations,
  useSaveZapi,
  useSetZapiDefault,
  useSyncZapiContactRouting,
  useZapiStatus,
  useZapiQrCode,
  useZapiDisconnect,
  useZapiRestart,
  useSaveAsaas,
  useRemoveIntegration,
} from "@/hooks/use-integrations"
import type { Integration } from "@/lib/api/integrations"

const ease = [0.33, 1, 0.68, 1] as const

type ZapiView = "status" | "qrcode" | "credentials"

const inputCls = "w-full h-10 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 text-[12px] font-mono text-white/80 placeholder:text-white/18 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all duration-200"

function Spinner({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className={`rounded-full border-2 border-white/20 border-t-white/70 ${className}`}
    />
  )
}

function StatusBadge({ connected, label }: { connected: boolean; label?: string }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/[0.08] bg-white/[0.03] text-white/30"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
      {label ?? (connected ? "Conectado" : "Não configurado")}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

// ── Z-API Card ─────────────────────────────────────────────────────────────────

function ZapiCard({ integrations, open, onToggle }: { integrations: Integration[]; open: boolean; onToggle: () => void }) {
  const defaultIntegration = integrations.find((i) => i.isDefault) ?? integrations[0] ?? null
  const integration = defaultIntegration
  const isConfigured = integrations.some((i) => i.isActive && i.hasApiKey && i.instanceId)
  const [view, setView] = useState<ZapiView>(isConfigured ? "status" : "credentials")
  const [instanceId, setInstanceId] = useState(integration?.instanceId ?? "")
  const [instanceToken, setInstanceToken] = useState("")
  const [label, setLabel] = useState(integration?.label ?? "")
  const [syncOnlyUnknown, setSyncOnlyUnknown] = useState(true)
  const [syncPageSize, setSyncPageSize] = useState(100)
  const [syncMaxPages, setSyncMaxPages] = useState(3)

  useEffect(() => {
    if (isConfigured && view === "credentials" && !instanceToken) {
      setView("status")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured])

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useZapiStatus({
    enabled: isConfigured,
    refetchInterval: isConfigured ? 15_000 : undefined,
    instanceId: integration?.instanceId ?? undefined,
  })

  const whatsappConnected = status?.connected === true

  const { data: qrData, isFetching: qrFetching, isError: qrError, refetch: refetchQr } = useZapiQrCode({ enabled: open && view === "qrcode", instanceId: integration?.instanceId ?? undefined })

  useEffect(() => {
    if (!open || view !== "qrcode" || whatsappConnected) return
    const id = setInterval(() => refetchQr(), 12_000)
    return () => clearInterval(id)
  }, [open, view, whatsappConnected, refetchQr])

  useEffect(() => {
    if (whatsappConnected && view === "qrcode") setView("status")
  }, [whatsappConnected, view])

  const saveZapi = useSaveZapi()
  const setDefault = useSetZapiDefault()
  const syncRouting = useSyncZapiContactRouting()
  const disconnect = useZapiDisconnect()
  const restart = useZapiRestart()
  const removeIntegration = useRemoveIntegration()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!instanceId.trim() || !instanceToken.trim()) return
    saveZapi.mutate(
      { instanceId: instanceId.trim(), instanceToken: instanceToken.trim(), label: label.trim() || undefined },
      { onSuccess: () => { setInstanceToken(""); setView("status") } }
    )
  }

  const handleDisconnect = () => {
    disconnect.mutate(undefined, { onSuccess: () => { setView("qrcode"); refetchQr() } })
  }

  const handleRestart = () => {
    restart.mutate(undefined, { onSuccess: () => refetchStatus() })
  }

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isConfigured ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-white/[0.07] bg-white/[0.015]"}`}>
      <button type="button" onClick={onToggle} className="cursor-pointer w-full flex items-center gap-4 p-5 text-left group">
        <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${isConfigured ? "border-emerald-500/30 bg-emerald-500/15" : "border-white/[0.09] bg-white/[0.04]"}`}>
          <WhatsappLogo className={`h-6 w-6 transition-colors duration-300 ${isConfigured ? "text-emerald-400" : "text-white/35"}`} weight="fill" />
          {isConfigured && (
            <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[oklch(0.17_0.025_263)] ${whatsappConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[14px] font-bold text-white/90">WhatsApp</p>
            <span className="text-[10px] text-white/25 font-medium">via Z-API</span>
          </div>
          <p className="text-[11px] text-white/40 truncate">
            {isConfigured
              ? whatsappConnected
                ? `Conectado — ${integration?.label || integration?.instanceId}`
                : statusLoading ? "Verificando status..." : `${integrations.length} instância(s) configuradas`
              : "Integre o WhatsApp para atendimentos automáticos"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isConfigured
            ? <StatusBadge connected={whatsappConnected} label={statusLoading ? "..." : whatsappConnected ? "Online" : "Offline"} />
            : <StatusBadge connected={false} />}
          <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2, ease }}>
            <CaretRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 transition-colors" weight="bold" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.28, ease }} className="overflow-hidden">
            <div className="mx-5 mb-5 space-y-3">
              {isConfigured && (
                <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                  {([
                    { id: "status" as ZapiView, label: "Status", icon: PlugsConnected },
                    ...(!whatsappConnected ? [{ id: "qrcode" as ZapiView, label: "QR Code", icon: QrCode }] : []),
                    { id: "credentials" as ZapiView, label: "Credenciais", icon: Gear },
                  ] as const).map(({ id, label, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => setView(id)}
                      className={`cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-all duration-200 ${view === id ? "bg-white/[0.07] text-white/80" : "text-white/30 hover:text-white/55"}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {view === "status" && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Instâncias</p>
                    <div className="space-y-1.5">
                      {integrations.length === 0 ? (
                        <p className="text-[11px] text-white/30">Nenhuma instância cadastrada.</p>
                      ) : integrations.map((inst, idx) => (
                        <div key={`${inst.instanceId}-${idx}`} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                          <span className={`h-2 w-2 rounded-full ${(inst.isActive && inst.hasApiKey) ? "bg-emerald-400" : "bg-white/25"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-semibold text-white/75">{inst.label || inst.instanceId}</p>
                            <p className="truncate text-[10px] font-mono text-white/30">{inst.instanceId}</p>
                          </div>
                          {inst.isDefault && (
                            <span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                              Padrão
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setDefault.mutate({ instanceId: inst.instanceId ?? "" })}
                            disabled={!inst.instanceId || inst.isDefault || setDefault.isPending}
                            className="cursor-pointer rounded-md border border-white/[0.09] bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/55 hover:text-white/80 disabled:cursor-default disabled:opacity-40"
                          >
                            Tornar padrão
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${whatsappConnected ? "border-emerald-500/25 bg-emerald-500/[0.06]" : "border-amber-500/20 bg-amber-500/[0.04]"}`}>
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${whatsappConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-bold ${whatsappConnected ? "text-emerald-400" : "text-amber-400"}`}>
                        {statusLoading ? "Verificando..." : whatsappConnected ? "WhatsApp conectado" : "WhatsApp desconectado"}
                      </p>
                      {status?.error && !whatsappConnected && <p className="text-[10px] text-white/30 mt-0.5">{status.error}</p>}
                      {status?.smartphoneConnected === false && whatsappConnected && (
                        <p className="text-[10px] text-amber-400/60 mt-0.5">Smartphone offline — mantenha o app aberto</p>
                      )}
                    </div>
                    <button type="button" onClick={() => refetchStatus()} disabled={statusLoading}
                      className="cursor-pointer flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold text-white/30 hover:text-white/55 transition-all disabled:opacity-40">
                      <ArrowsClockwise className={`h-3 w-3 ${statusLoading ? "animate-spin" : ""}`} /> Atualizar
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {whatsappConnected ? (
                      <button type="button" onClick={handleDisconnect} disabled={disconnect.isPending}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3.5 py-2 text-[11px] font-bold text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-400 transition-all disabled:opacity-40">
                        {disconnect.isPending ? <Spinner /> : <LinkBreak className="h-3 w-3" />} Desconectar
                      </button>
                    ) : (
                      <button type="button" onClick={() => { setView("qrcode"); refetchQr() }}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[11px] font-bold text-accent-foreground hover:bg-accent/90 transition-all">
                        <QrCode className="h-3 w-3" /> Escanear QR Code
                      </button>
                    )}
                    <button type="button" onClick={handleRestart} disabled={restart.isPending}
                      className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[11px] font-bold text-white/40 hover:text-white/70 hover:border-white/[0.16] transition-all disabled:opacity-40">
                      {restart.isPending ? <Spinner /> : <ArrowsClockwise className="h-3 w-3" />} Reiniciar instância
                    </button>
                    <button type="button" onClick={() => removeIntegration.mutate("zapi", { onSuccess: onToggle })} disabled={removeIntegration.isPending}
                      className="cursor-pointer ml-auto flex items-center gap-1.5 rounded-lg border border-rose-500/15 bg-rose-500/5 px-3 py-2 text-[11px] font-bold text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all disabled:opacity-40">
                      {removeIntegration.isPending ? <Spinner className="h-3 w-3" /> : <Trash className="h-3 w-3" />} Remover
                    </button>
                  </div>
                  {(disconnect.isSuccess || restart.isSuccess) && (
                    <p className="text-[10px] text-white/30">
                      {disconnect.isSuccess ? "Desconectado. Escaneie o QR Code para reconectar." : "Instância reiniciada com sucesso."}
                    </p>
                  )}
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Sincronizar roteamento por chats</p>
                    <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <Field label="Page Size">
                        <input
                          type="number"
                          min={10}
                          max={100}
                          value={syncPageSize}
                          onChange={(e) => setSyncPageSize(Number(e.target.value || 100))}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Max Pages">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={syncMaxPages}
                          onChange={(e) => setSyncMaxPages(Number(e.target.value || 3))}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Filtro">
                        <button
                          type="button"
                          onClick={() => setSyncOnlyUnknown((v) => !v)}
                          className="cursor-pointer h-10 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 text-[12px] font-semibold text-white/70 text-left"
                        >
                          {syncOnlyUnknown ? "Somente desconhecidos" : "Todos os contatos"}
                        </button>
                      </Field>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => syncRouting.mutate({
                          instanceId: integration?.instanceId ?? undefined,
                          page: 1,
                          pageSize: syncPageSize,
                          maxPages: syncMaxPages,
                          onlyUnknown: syncOnlyUnknown,
                          upsertMissingContacts: false,
                        })}
                        disabled={syncRouting.isPending}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[11px] font-bold text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-40"
                      >
                        {syncRouting.isPending ? <Spinner /> : <ArrowsClockwise className="h-3 w-3" />}
                        Sincronizar roteamento
                      </button>
                      {syncRouting.data && (
                        <p className="text-[10px] text-white/45">
                          {syncRouting.data.syncedContacts} contatos roteados de {syncRouting.data.scannedChats} chats lidos
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {view === "qrcode" && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-48 w-48 items-center justify-center rounded-xl border border-white/[0.08] bg-white overflow-hidden">
                      {qrFetching && !qrData && (
                        <div className="flex flex-col items-center gap-2">
                          <Spinner className="h-6 w-6" />
                          <p className="text-[10px] text-white/30">Gerando QR code...</p>
                        </div>
                      )}
                      {qrError && (
                        <div className="flex flex-col items-center gap-1.5 px-3 text-center">
                          <Warning className="h-5 w-5 text-amber-500/70" />
                          <p className="text-[10px] text-slate-500">Instância já conectada ou não configurada</p>
                        </div>
                      )}
                      {qrData?.value && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrData.value} alt="QR Code WhatsApp" className="h-full w-full object-contain" />
                      )}
                      {qrFetching && qrData && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                          <Spinner className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[12px] font-bold text-white/70">Abra o WhatsApp no celular</p>
                      <p className="text-[11px] text-white/35">Toque em <span className="text-white/55 font-medium">⋮ → Aparelhos conectados → Conectar aparelho</span> e escaneie o código</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => refetchQr()} disabled={qrFetching}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[11px] font-bold text-white/45 hover:text-white/70 hover:border-white/[0.16] transition-all disabled:opacity-40">
                        <ArrowsClockwise className={`h-3 w-3 ${qrFetching ? "animate-spin" : ""}`} /> Atualizar QR
                      </button>
                      <button type="button" onClick={() => refetchStatus()} disabled={statusLoading}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-[11px] font-bold text-emerald-400/70 hover:bg-emerald-500/15 hover:text-emerald-400 transition-all disabled:opacity-40">
                        {statusLoading ? <Spinner /> : <Check className="h-3 w-3" weight="bold" />} Verificar conexão
                      </button>
                    </div>
                    <p className="text-[10px] text-white/20">O QR code é atualizado automaticamente a cada 12 segundos</p>
                  </div>
                </div>
              )}

              {view === "credentials" && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                  <AnimatePresence>
                    {saveZapi.isError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/8 px-3 py-2.5 text-[11px] text-rose-400">
                        <X className="h-3.5 w-3.5 shrink-0 mt-px" weight="bold" /> Não foi possível salvar. Verifique as credenciais e tente novamente.
                      </motion.div>
                    )}
                    {saveZapi.isSuccess && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[11px] ${saveZapi.data.webhooksConfigured ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-400" : "border-amber-500/25 bg-amber-500/8 text-amber-400"}`}>
                        {saveZapi.data.webhooksConfigured
                          ? <><Check className="h-3.5 w-3.5 shrink-0 mt-px" weight="bold" /> Credenciais salvas e webhooks configurados.</>
                          : <><X className="h-3.5 w-3.5 shrink-0 mt-px" weight="bold" /> Salvo, mas webhooks falharam: {saveZapi.data.webhooksError}</>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <form onSubmit={handleSave} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Instance ID">
                        <input value={instanceId} onChange={(e) => setInstanceId(e.target.value)} placeholder="3EE8E4989B..." className={inputCls} />
                      </Field>
                      <Field label="Rótulo">
                        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Recepção Principal" className={inputCls} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <Field label="Instance Token">
                        <input type="password" value={instanceToken} onChange={(e) => setInstanceToken(e.target.value)} placeholder="••••••••••••••••" className={inputCls} />
                      </Field>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button type="submit" disabled={saveZapi.isPending || !instanceId.trim() || !instanceToken.trim()}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[11px] font-bold text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-40">
                        {saveZapi.isPending ? <Spinner /> : <Check className="h-3 w-3" weight="bold" />}
                        {isConfigured ? "Atualizar credenciais" : "Salvar e ativar"}
                      </button>
                      {isConfigured && (
                        <button type="button" onClick={() => removeIntegration.mutate("zapi", { onSuccess: onToggle })} disabled={removeIntegration.isPending}
                          className="cursor-pointer ml-auto flex items-center gap-1.5 rounded-lg border border-rose-500/15 bg-rose-500/5 px-3 py-2 text-[11px] font-bold text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all disabled:opacity-40">
                          {removeIntegration.isPending ? <Spinner className="h-3 w-3" /> : <Trash className="h-3 w-3" />} Remover
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Asaas Card ─────────────────────────────────────────────────────────────────

function AsaasCard({ integration, open, onToggle }: { integration: Integration | null; open: boolean; onToggle: () => void }) {
  const [apiKey, setApiKey] = useState("")
  const saveAsaas = useSaveAsaas()
  const removeIntegration = useRemoveIntegration()
  const isConnected = !!(integration?.isActive && integration?.hasApiKey)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return
    saveAsaas.mutate({ apiKey: apiKey.trim() }, { onSuccess: () => setApiKey("") })
  }

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isConnected ? "border-blue-500/25 bg-blue-500/[0.04]" : "border-white/[0.07] bg-white/[0.015]"}`}>
      <button type="button" onClick={onToggle} className="cursor-pointer w-full flex items-center gap-4 p-5 text-left group">
        <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border overflow-hidden transition-all duration-300 ${isConnected ? "border-blue-500/30 bg-white" : "border-white/[0.09] bg-white"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/asaas-logo.png" alt="Asaas" className="h-7 w-7 object-contain" />
          {isConnected && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[oklch(0.17_0.025_263)] bg-blue-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[14px] font-bold text-white/90">Asaas</p>
            <span className="text-[10px] text-white/25 font-medium">Cobrança & Pagamentos</span>
          </div>
          <p className="text-[11px] text-white/40">
            {isConnected ? "API key configurada e ativa" : "Automatize cobranças e receba pagamentos"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge connected={isConnected} />
          <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2, ease }}>
            <CaretRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 transition-colors" weight="bold" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.28, ease }} className="overflow-hidden">
            <div className="mx-5 mb-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
              <AnimatePresence>
                {saveAsaas.isError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/8 px-3 py-2.5 text-[11px] text-rose-400">
                    <X className="h-3.5 w-3.5 shrink-0 mt-px" weight="bold" /> Não foi possível salvar. Verifique a API key e tente novamente.
                  </motion.div>
                )}
                {saveAsaas.isSuccess && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5 text-[11px] text-emerald-400">
                    <Check className="h-3.5 w-3.5 shrink-0" weight="bold" /> API key salva com sucesso.
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={handleSave} className="space-y-3">
                <Field label={isConnected ? "Nova API Key (substituir existente)" : "API Key"}>
                  <div className="relative">
                    <input type="password" value={apiKey} onChange={(e) => { setApiKey(e.target.value); saveAsaas.reset() }} placeholder="$aact_MzkwODA..." className={inputCls} />
                  </div>
                  <p className="text-[10px] text-white/25 mt-0.5">Sandbox: <span className="text-white/40 font-medium">sandbox.asaas.com</span> → Integrações → Chave da API</p>
                </Field>
                <div className="flex items-center gap-2 pt-1">
                  <button type="submit" disabled={saveAsaas.isPending || !apiKey.trim()}
                    className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[11px] font-bold text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-40">
                    {saveAsaas.isPending ? <Spinner /> : <Check className="h-3 w-3" weight="bold" />}
                    {isConnected ? "Atualizar API key" : "Salvar e ativar"}
                  </button>
                  {isConnected && (
                    <button type="button" onClick={() => removeIntegration.mutate("asaas", { onSuccess: onToggle })} disabled={removeIntegration.isPending}
                      className="cursor-pointer ml-auto flex items-center gap-1.5 rounded-lg border border-rose-500/15 bg-rose-500/5 px-3 py-2 text-[11px] font-bold text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all disabled:opacity-40">
                      {removeIntegration.isPending ? <Spinner className="h-3 w-3" /> : <Trash className="h-3 w-3" />} Remover
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── ConexoesTab ────────────────────────────────────────────────────────────────

export function ConexoesTab() {
  const { data: integrations, isLoading, isError, refetch } = useIntegrations()
  const [openCard, setOpenCard] = useState<string | null>(null)

  const toggle = (id: string) => setOpenCard((v) => (v === id ? null : id))
  const get = (provider: string) => integrations?.find((i) => i.provider === provider) ?? null
  const zapiIntegrations = (integrations ?? []).filter((i) => i.provider === "zapi")

  const hasActiveZapi = zapiIntegrations.some((i) => i.isActive && i.hasApiKey)
  const hasActiveAsaas = (integrations ?? []).some((i) => i.provider === "asaas" && i.isActive && i.hasApiKey)
  const activeCount = Number(hasActiveZapi) + Number(hasActiveAsaas)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6 w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-bold text-white/85 mb-1">Integrações</h2>
          <p className="text-[12px] text-white/35">Conecte ferramentas externas para potencializar o atendimento da sua clínica.</p>
        </div>
        {!isLoading && !isError && (
          <div className="shrink-0 flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${activeCount > 0 ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
            <span className="text-[11px] font-bold text-white/45">{activeCount}/2 ativas</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Sparkle className="h-5 w-5 text-accent" />
            </motion.div>
            <p className="text-[11px] text-white/30">Carregando integrações...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-white/[0.07] gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
            <PlugsConnected className="h-5 w-5 text-white/20" weight="duotone" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-bold text-white/50 mb-1">Não foi possível carregar</p>
            <p className="text-[11px] text-white/25">Verifique sua conexão e tente novamente</p>
          </div>
          <button onClick={() => refetch()} className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3.5 py-2 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ZapiCard integrations={zapiIntegrations} open={openCard === "zapi"} onToggle={() => toggle("zapi")} />
          <AsaasCard integration={get("asaas")} open={openCard === "asaas"} onToggle={() => toggle("asaas")} />
        </div>
      )}
    </motion.div>
  )
}
