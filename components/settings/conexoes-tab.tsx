"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
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
  Plus,
  Phone,
  Robot,
  Flask,
  Gear,
  WifiHigh,
  WifiSlash,
  CaretRight,
} from "@phosphor-icons/react"
import {
  useIntegrations,
  useSaveZapi,
  useSyncZapiContactRouting,
  useZapiStatus,
  useZapiQrCode,
  useZapiDisconnect,
  useZapiRestart,
  useSaveAsaas,
  useRemoveIntegration,
  useDeleteZapiInstance,
} from "@/hooks/use-integrations"
import { integrationsApi } from "@/lib/api/integrations"
import { useMe } from "@/hooks/use-me"
import type { Integration } from "@/lib/api/integrations"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls = "w-full h-10 rounded-xl border border-border/70 bg-foreground/[0.03] px-3.5 text-[12px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all"

function Spinner({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className={`rounded-full border-2 border-border border-t-white/70 ${className}`}
    />
  )
}

function SectionHeader({ icon: Icon, title, subtitle, badge, action, color = "text-accent" }: {
  icon: React.ElementType
  title: string
  subtitle: string
  badge?: React.ReactNode
  action?: React.ReactNode
  color?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-foreground/[0.03]`}>
          <Icon className={`h-5 w-5 ${color}`} weight="fill" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-foreground">{title}</p>
            {badge}
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

// ── Instance Row (expandable) ─────────────────────────────────────────────────

function InstanceRow({ instance, isExpanded, onToggle }: {
  instance: Integration
  isExpanded: boolean
  onToggle: () => void
}) {
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useZapiStatus({
    enabled: true,
    refetchInterval: 15_000,
    instanceId: instance.instanceId ?? undefined,
  })
  const connected = status?.connected === true
  const deleteInstance = useDeleteZapiInstance()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: qrData, isFetching: qrFetching, isError: qrError, refetch: refetchQr } = useZapiQrCode({
    enabled: isExpanded && !connected,
    instanceId: instance.instanceId ?? undefined,
  })

  useEffect(() => {
    if (!isExpanded || connected) return
    const id = setInterval(() => refetchQr(), 12_000)
    return () => clearInterval(id)
  }, [isExpanded, connected, refetchQr])

  const disconnect = useZapiDisconnect()
  const restart = useZapiRestart()
  const syncRouting = useSyncZapiContactRouting()
  const [syncOnlyUnknown, setSyncOnlyUnknown] = useState(true)

  const aiLabel = instance.isAiEnabled ? "IA ativa" : instance.isAiTestMode ? "Teste" : "IA off"
  const aiColor = instance.isAiEnabled
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : instance.isAiTestMode
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-muted-foreground/60 bg-foreground/[0.03] border-foreground/[0.06]"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease }}
    >
      {/* Row header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle() } }}
        className={`cursor-pointer group w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
          isExpanded ? "bg-foreground/[0.03]" : "hover:bg-foreground/[0.02]"
        }`}
      >
        {/* Status dot */}
        <span className={`h-2 w-2 rounded-full shrink-0 ${
          statusLoading ? "bg-foreground/20" : connected ? "bg-emerald-400" : "bg-rose-400"
        }`} />

        {/* Label */}
        <p className="text-[13px] font-semibold text-foreground truncate flex-1 min-w-0">
          {instance.label || `Instância ${(instance.instanceId ?? "").slice(0, 8)}...`}
        </p>

        {/* Badges */}
        <span className={`flex items-center gap-1 text-[10px] font-medium shrink-0 ${connected ? "text-emerald-400" : "text-muted-foreground/50"}`}>
          {connected ? <WifiHigh className="h-3 w-3" /> : <WifiSlash className="h-3 w-3" />}
          {statusLoading ? "..." : connected ? "Online" : "Offline"}
        </span>
        <span className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold shrink-0 ${aiColor}`}>
          {instance.isAiTestMode && !instance.isAiEnabled && <Flask className="h-2.5 w-2.5" weight="fill" />}
          {instance.isAiEnabled && <Robot className="h-2.5 w-2.5" weight="fill" />}
          {aiLabel}
        </span>

        {/* Delete */}
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => confirmDelete ? deleteInstance.mutate(instance.instanceId ?? "") : setConfirmDelete(true)}
            onBlur={() => setConfirmDelete(false)}
            disabled={deleteInstance.isPending}
            className={`cursor-pointer flex h-7 items-center justify-center rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 ${
              confirmDelete
                ? "gap-1 px-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 w-auto"
                : "w-7 text-muted-foreground/40 hover:text-rose-400 hover:bg-rose-500/[0.08]"
            }`}
          >
            {deleteInstance.isPending ? <Spinner /> : confirmDelete ? <><Check className="h-3 w-3" weight="bold" /> Excluir</> : <Trash className="h-3 w-3" />}
          </button>
        </div>

        {/* Chevron */}
        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }} className="shrink-0">
          <CaretRight className="h-3 w-3 text-muted-foreground/40" weight="bold" />
        </motion.div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-foreground/[0.04]">
              {/* QR Code — only when disconnected */}
              {!connected && (
                <div className="flex flex-col items-center gap-3 py-3">
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-xl border border-border/60 bg-white overflow-hidden">
                    {qrFetching && !qrData && <Spinner className="h-6 w-6" />}
                    {qrError && (
                      <div className="flex flex-col items-center gap-1 px-3 text-center">
                        <Warning className="h-5 w-5 text-amber-500/70" />
                        <p className="text-[10px] text-slate-500">Não foi possível gerar o QR</p>
                      </div>
                    )}
                    {qrData?.value && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrData.value} alt="QR Code WhatsApp" className="h-full w-full object-contain" />
                    )}
                    {qrFetching && qrData && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl"><Spinner className="h-5 w-5" /></div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">WhatsApp &rarr; Aparelhos conectados &rarr; Conectar</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => refetchQr()} disabled={qrFetching}
                      className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-border/70 bg-foreground/[0.03] px-3 py-1.5 text-[10px] font-bold text-muted-foreground/70 hover:text-foreground/85 transition-all disabled:opacity-40">
                      <ArrowsClockwise className={`h-3 w-3 ${qrFetching ? "animate-spin" : ""}`} /> Atualizar QR
                    </button>
                    <button onClick={() => refetchStatus()} disabled={statusLoading}
                      className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[10px] font-bold text-emerald-400/70 hover:text-emerald-400 transition-all disabled:opacity-40">
                      {statusLoading ? <Spinner /> : <Check className="h-3 w-3" weight="bold" />} Verificar
                    </button>
                  </div>
                </div>
              )}

              {/* Actions when connected */}
              {connected && (
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => disconnect.mutate(undefined, { onSuccess: () => refetchQr() })} disabled={disconnect.isPending}
                    className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-1.5 text-[10px] font-bold text-amber-400/70 hover:text-amber-400 transition-all disabled:opacity-40">
                    {disconnect.isPending ? <Spinner /> : <LinkBreak className="h-3 w-3" />} Desconectar
                  </button>
                  <button onClick={() => restart.mutate(undefined, { onSuccess: () => refetchStatus() })} disabled={restart.isPending}
                    className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-border/70 bg-foreground/[0.03] px-3 py-1.5 text-[10px] font-bold text-muted-foreground/70 hover:text-foreground/85 transition-all disabled:opacity-40">
                    {restart.isPending ? <Spinner /> : <ArrowsClockwise className="h-3 w-3" />} Reiniciar
                  </button>
                </div>
              )}

              {status?.smartphoneConnected === false && connected && (
                <p className="text-[10px] text-amber-400/60 flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> Smartphone offline — mantenha o WhatsApp aberto
                </p>
              )}

              {/* Sync routing */}
              {connected && (
                <details className="group/sync">
                  <summary className="cursor-pointer text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider hover:text-muted-foreground/70 transition-colors list-none flex items-center gap-1.5">
                    <Gear className="h-3 w-3" /> Sincronizar roteamento
                  </summary>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={syncOnlyUnknown} onChange={(e) => setSyncOnlyUnknown(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-border bg-foreground/[0.04] text-accent focus:ring-accent/30" />
                      <span className="text-[11px] text-muted-foreground/70">Apenas contatos sem instância</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => syncRouting.mutate({ instanceId: instance.instanceId ?? undefined, page: 1, pageSize: 100, maxPages: 3, onlyUnknown: syncOnlyUnknown, upsertMissingContacts: false })}
                        disabled={syncRouting.isPending}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent/15 border border-accent/25 px-3 py-1.5 text-[10px] font-bold text-accent hover:bg-accent/25 transition-all disabled:opacity-40">
                        {syncRouting.isPending ? <Spinner /> : <ArrowsClockwise className="h-3 w-3" />} Sincronizar
                      </button>
                      {syncRouting.data && <p className="text-[10px] text-muted-foreground/60">{syncRouting.data.syncedContacts} contatos de {syncRouting.data.scannedChats} chats</p>}
                    </div>
                  </div>
                </details>
              )}

              {(disconnect.isSuccess || restart.isSuccess) && (
                <p className="text-[10px] text-emerald-400/70">{disconnect.isSuccess ? "Desconectado." : "Reiniciada."}</p>
              )}

              <p className="text-[9px] font-mono text-muted-foreground/20">{instance.instanceId}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── New Instance Modal ────────────────────────────────────────────────────────

function NewInstanceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [instanceId, setInstanceId] = useState("")
  const [instanceToken, setInstanceToken] = useState("")
  const [label, setLabel] = useState("")
  const [instanceCheck, setInstanceCheck] = useState<{ inUse: boolean; sameAccount?: boolean } | null>(null)
  const saveZapi = useSaveZapi()

  useEffect(() => {
    const id = instanceId.trim()
    if (!id || id.length < 10) { setInstanceCheck(null); return }
    const timer = setTimeout(async () => {
      try {
        const result = await integrationsApi.checkZapiInstance(id)
        setInstanceCheck(result)
      } catch { setInstanceCheck(null) }
    }, 500)
    return () => clearTimeout(timer)
  }, [instanceId])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!instanceId.trim() || !instanceToken.trim()) return
    saveZapi.mutate(
      { instanceId: instanceId.trim(), instanceToken: instanceToken.trim(), label: label.trim() || undefined },
      { onSuccess: () => { onSaved(); onClose() } },
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border/80 bg-overlay shadow-2xl shadow-foreground/10 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <WhatsappLogo className="h-4 w-4 text-emerald-400" weight="fill" />
            </div>
            <h2 className="text-[14px] font-semibold text-foreground">Nova instância WhatsApp</h2>
          </div>
          <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/70 hover:text-foreground/85 hover:bg-foreground/[0.06] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
          <AnimatePresence>
            {saveZapi.isError && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5 text-[11px] text-rose-400">
                <Warning className="h-3.5 w-3.5 shrink-0" weight="fill" /> Não foi possível salvar. Verifique as credenciais.
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Rótulo</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex: Recepção, Comercial, Dr. João..." className={inputCls} autoFocus />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Instance ID *</label>
            <input value={instanceId} onChange={(e) => setInstanceId(e.target.value)} placeholder="3EE8E4989B..." className={inputCls} />
            {instanceCheck?.inUse && !instanceCheck.sameAccount && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-rose-400">
                <Warning className="h-3 w-3 shrink-0" weight="fill" /> Instância vinculada a outra conta
              </p>
            )}
            {instanceCheck?.inUse && instanceCheck.sameAccount && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-400">
                <Warning className="h-3 w-3 shrink-0" weight="fill" /> Já cadastrada — credenciais serão atualizadas
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Instance Token *</label>
            <input type="password" value={instanceToken} onChange={(e) => setInstanceToken(e.target.value)} placeholder="••••••••••••••••" className={inputCls} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="cursor-pointer flex-1 rounded-xl border border-border/70 py-2.5 text-[12px] text-muted-foreground/70 hover:text-foreground/85 hover:bg-foreground/[0.04] transition-colors">
              Cancelar
            </button>
            <button type="submit"
              disabled={saveZapi.isPending || !instanceId.trim() || !instanceToken.trim() || (instanceCheck?.inUse === true && !instanceCheck.sameAccount)}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
              {saveZapi.isPending ? <Spinner /> : <Check className="h-3.5 w-3.5" weight="bold" />}
              Adicionar instância
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── Asaas Section ─────────────────────────────────────────────────────────────

function AsaasSection({ integration }: { integration: Integration | null }) {
  const [apiKey, setApiKey] = useState("")
  const saveAsaas = useSaveAsaas()
  const removeIntegration = useRemoveIntegration()
  const isConnected = !!(integration?.isActive && integration?.hasApiKey)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey.trim()) return
    saveAsaas.mutate({ apiKey: apiKey.trim() }, { onSuccess: () => setApiKey("") })
  }

  return (
    <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-4 space-y-3">
      <AnimatePresence>
        {saveAsaas.isSuccess && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2 text-[11px] text-emerald-400">
            <Check className="h-3 w-3 shrink-0" weight="bold" /> API key salva com sucesso.
          </motion.div>
        )}
        {saveAsaas.isError && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/[0.08] px-3 py-2 text-[11px] text-rose-400">
            <Warning className="h-3 w-3 shrink-0" weight="fill" /> Erro ao salvar. Verifique a API key.
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">
            {isConnected ? "Nova API Key (substituir)" : "API Key"}
          </label>
          <input type="password" value={apiKey} onChange={(e) => { setApiKey(e.target.value); saveAsaas.reset() }} placeholder="$aact_MzkwODA..." className={inputCls} />
          <p className="text-[10px] text-muted-foreground/40 mt-1">Sandbox: asaas.com &rarr; Integrações &rarr; Chave da API</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" disabled={saveAsaas.isPending || !apiKey.trim()}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent/15 border border-accent/25 px-3.5 py-2 text-[10px] font-bold text-accent hover:bg-accent/25 transition-all disabled:opacity-40">
            {saveAsaas.isPending ? <Spinner /> : <Check className="h-3 w-3" weight="bold" />}
            {isConnected ? "Atualizar" : "Salvar e ativar"}
          </button>
          {isConnected && (
            <button type="button" onClick={() => removeIntegration.mutate("asaas")} disabled={removeIntegration.isPending}
              className="cursor-pointer ml-auto flex items-center gap-1.5 rounded-lg border border-rose-500/15 bg-rose-500/[0.04] px-3 py-2 text-[10px] font-bold text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40">
              {removeIntegration.isPending ? <Spinner /> : <Trash className="h-3 w-3" />} Remover
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// ── ConexoesTab ───────────────────────────────────────────────────────────────

export function ConexoesTab() {
  const { data: me } = useMe()
  const isAdmin = me?.role === "ADMIN"
  const { data: integrations, isLoading, isError, refetch } = useIntegrations()
  const [expandedInstanceId, setExpandedInstanceId] = useState<string | null>(null)
  const [showNewInstance, setShowNewInstance] = useState(false)

  const zapiInstances = (integrations ?? []).filter((i) => i.provider === "zapi" && i.instanceId)
  const asaasIntegration = (integrations ?? []).find((i) => i.provider === "asaas") ?? null
  const hasAsaas = !!(asaasIntegration?.isActive && asaasIntegration?.hasApiKey)

  if (me && !isAdmin) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-background/50">
          <PlugsConnected className="h-7 w-7 text-muted-foreground/60" weight="duotone" />
        </div>
        <p className="text-[14px] font-semibold text-foreground/80">Sem permissão</p>
        <p className="text-[13px] text-muted-foreground max-w-xs">Apenas administradores podem gerenciar integrações.</p>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Sparkle className="h-5 w-5 text-accent" />
          </motion.div>
          <p className="text-[11px] text-muted-foreground/70">Carregando integrações...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-border/50 gap-3">
        <PlugsConnected className="h-7 w-7 text-muted-foreground/30" weight="duotone" />
        <p className="text-[12px] text-muted-foreground/70">Erro ao carregar integrações</p>
        <button onClick={() => refetch()} className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3.5 py-2 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-8 w-full">

      {/* ── WhatsApp Section ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={WhatsappLogo}
          title="WhatsApp"
          subtitle="Instâncias conectadas via Z-API"
          color="text-emerald-400"
          badge={
            zapiInstances.length > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/15 px-1.5 text-[10px] font-bold text-emerald-400">
                {zapiInstances.length}
              </span>
            ) : null
          }
          action={
            <button
              onClick={() => setShowNewInstance(true)}
              className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all"
            >
              <Plus className="h-3 w-3" weight="bold" /> Nova instância
            </button>
          }
        />

        {zapiInstances.length > 0 ? (
          <div className="rounded-xl border border-border/60 bg-foreground/[0.01] overflow-hidden divide-y divide-white/[0.05]">
            <AnimatePresence initial={false}>
              {zapiInstances.map((inst) => (
                <InstanceRow
                  key={inst.instanceId}
                  instance={inst}
                  isExpanded={expandedInstanceId === inst.instanceId}
                  onToggle={() => setExpandedInstanceId((v) => v === inst.instanceId ? null : inst.instanceId)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/50 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-foreground/[0.02]">
              <WhatsappLogo className="h-5 w-5 text-muted-foreground/40" weight="fill" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-bold text-foreground/85">Nenhuma instância WhatsApp</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">Adicione uma instância Z-API para começar a receber mensagens</p>
            </div>
            <button onClick={() => setShowNewInstance(true)}
              className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3.5 py-2 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
              <Plus className="h-3 w-3" weight="bold" /> Adicionar instância
            </button>
          </motion.div>
        )}
      </section>

      {/* ── Asaas Section ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={({ className, ...p }: { className?: string }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/images/asaas-logo.png" alt="Asaas" className={`h-5 w-5 object-contain ${className}`} {...p} />
          )}
          title="Asaas"
          subtitle="Cobrança PIX e pagamentos"
          color=""
          badge={hasAsaas ? (
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
              <Check className="h-2.5 w-2.5" weight="bold" /> Ativa
            </span>
          ) : null}
        />
        <AsaasSection integration={asaasIntegration} />
      </section>

      {/* ── New Instance Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewInstance && (
          <NewInstanceModal
            onClose={() => setShowNewInstance(false)}
            onSaved={() => refetch()}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
