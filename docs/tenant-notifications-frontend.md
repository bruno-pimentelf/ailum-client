# Tenant Notifications — Integração Frontend (Realtime)

Este guia descreve como consumir o feed de notificações do tenant via Firestore (`onSnapshot`) para implementar:

- Bell badge (não lidas)
- Lista/central de notificações
- Toasts com política anti-spam

---

## 1) Pré-requisitos (backend)

O backend já publica eventos em:

`tenants/{tenantId}/notifications/{notificationId}`

Cada documento contém:

```json
{
  "id": "auto-doc-id",
  "type": "payment.paid",
  "severity": "info",
  "title": "Pagamento confirmado",
  "body": "Pagamento PIX confirmado para ...",
  "entityType": "charge",
  "entityId": "uuid",
  "source": "asaas_webhook",
  "dedupeKey": "payment_paid:uuid",
  "metadata": { "chargeId": "uuid" },
  "read": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 2) Tipos de notificação (v1)

- `integration.whatsapp.disconnected`
- `trigger.failed`
- `guardrail.violation`
- `payment.paid`
- `payment.overdue`
- `appointment.created`
- `appointment.cancelled`
- `appointment.rescheduled`
- `slot_recall.sent`

---

## 3) Subscribe realtime (bell + lista)

Exemplo com Firebase Web SDK:

```ts
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  where,
} from 'firebase/firestore'

const q = query(
  collection(db, `tenants/${tenantId}/notifications`),
  orderBy('createdAt', 'desc'),
  limit(100),
)

const unsub = onSnapshot(q, (snap) => {
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const unreadCount = items.filter((n) => !n.read).length

  setNotificationItems(items)
  setUnreadCount(unreadCount)
})
```

---

## 4) Política de toast (sem overnotification)

Recomendação:

- **Sempre toast:** `severity = critical`
- **Toast opcional:** `severity = warning`, exceto quando a tela relacionada estiver aberta
- **Sem toast por padrão:** `severity = info` (apenas entra na central)

Exemplo:

```ts
const shouldToast = (n: NotificationItem, isContextOpen: boolean) => {
  if (n.severity === 'critical') return true
  if (n.severity === 'warning') return !isContextOpen
  return false
}
```

---

## 5) Marcar como lida

Se o frontend tiver permissão de escrita no Firestore:

```ts
import { doc, updateDoc } from 'firebase/firestore'

await updateDoc(
  doc(db, `tenants/${tenantId}/notifications/${notificationId}`),
  { read: true },
)
```

Para “Marcar todas”:

- Buscar não lidas e fazer `batch update` do campo `read: true`.

---

## 6) Filtros da central

Filtros úteis:

- Por `severity` (`critical`, `warning`, `info`)
- Por `type` (pagamentos, agenda, automações, integração)
- Por período (`createdAt`)

Exemplo de abas:

- **Todas**
- **Críticas**
- **Pagamentos**
- **Agenda**
- **Automações**

---

## 7) Configuração via tenant API

A tela de configurações do tenant deve usar:

- `GET /v1/tenant`
- `PATCH /v1/tenant`

Campos:

- `notificationsEnabled: boolean`
- `notificationTypes: string[]`
- `notificationDigestMinutes: number`
- `notificationRoles: string[]` (guardar agora, separar por role depois)

---

## 8) UX recomendada

- Bell no topo com badge de não lidas
- Drawer lateral com lista compacta
- Clique em item navega para entidade relacionada:
  - `entityType = appointment` -> agenda
  - `entityType = charge` -> cobrança
  - `entityType = trigger` -> automações
  - `entityType = contact` -> conversa/contato

---

## 9) Observações

- O backend já aplica dedupe/cooldown por Redis com base em `dedupeKey`.
- O frontend não precisa deduplicar eventos iguais; apenas renderizar o feed.
- `notificationRoles` já existe para preparação de escopo por role, mas ainda não está sendo aplicado no backend.

