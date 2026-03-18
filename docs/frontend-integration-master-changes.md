# Frontend Guide — Z-API, Instâncias e Firestore (onSnapshot)

Este guia foca somente no que mudou para WhatsApp/Z-API, multi-instância, chats e sincronização em Firestore.

---

## 1) Regra principal do front

Para a tela de conversa:
- **não usar GET para montar timeline/chats**
- usar **`onSnapshot`** como fonte de verdade

O backend continua recebendo/salvando e sincronizando no Firestore.

---

## 2) O que mudou no Firestore (mensagens e contatos)

### Mensagens (`tenants/{tenantId}/contacts/{contactId}/messages/{messageId}`)

Novos campos úteis:
- `zapiMessageId` -> usar para reply/reaction
- `referenceMessageId` -> identifica mensagem respondida

### Contatos (`tenants/{tenantId}/contacts/{contactId}`)

Novo campo:
- `zapiInstanceId` -> instância WhatsApp vinculada ao contato (roteamento sticky)

---

## 3) Contratos de API (body/query/response)

## 3.1 Listar integrações (instâncias incluídas)

### `GET /v1/integrations`

Sem body/query.

**Response 200 (exemplo):**
```json
[
  {
    "id": "uuid-zapi-row",
    "provider": "zapi",
    "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
    "label": "Recepção Principal",
    "isDefault": true,
    "webhookToken": null,
    "isActive": true,
    "hasApiKey": true
  },
  {
    "provider": "asaas",
    "instanceId": null,
    "label": null,
    "webhookToken": null,
    "isActive": true,
    "hasApiKey": true
  }
]
```

---

## 3.2 Cadastrar/atualizar instância Z-API

### `PUT /v1/integrations/zapi`

**Body:**
```json
{
  "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "instanceToken": "DDF6170F74BC3D70AD91CBE5",
  "label": "Recepção Principal"
}
```

**Response 200 (exemplo):**
```json
{
  "id": "uuid-zapi-row",
  "provider": "zapi",
  "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "label": "Recepção Principal",
  "isDefault": true,
  "webhookToken": null,
  "isActive": true,
  "hasApiKey": true,
  "webhooksConfigured": true,
  "webhooksError": null
}
```

---

## 3.3 Definir instância padrão

### `PATCH /v1/integrations/zapi/default`

**Body:**
```json
{ "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F" }
```

**Response 200:**
```json
{ "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F", "isDefault": true }
```

---

## 3.4 Status da instância

### `GET /v1/integrations/zapi/status?instanceId=...`

`instanceId` é opcional.

**Response 200:**
```json
{ "connected": true, "smartphoneConnected": true, "error": null }
```

---

## 3.5 Dados da instância (`/me`)

### `GET /v1/integrations/zapi/me?instanceId=...`

`instanceId` é opcional.

**Response 200:** payload bruto da Z-API.

---

## 3.6 Listar chats da instância

### `GET /v1/integrations/zapi/chats?page=1&pageSize=20&instanceId=...`

**Query:**
- `page` opcional (default 1)
- `pageSize` opcional (default 20, max 100)
- `instanceId` opcional

**Response 200:** payload bruto da Z-API (`chats`/`data` etc., dependendo da versão).

---

## 3.7 Marcar chat lido/não lido

### `POST /v1/integrations/zapi/chats/modify`

**Body:**
```json
{
  "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "phone": "5511999999999",
  "action": "read"
}
```

`action`: `read` | `unread`

**Response 200:** payload bruto da Z-API.

---

## 3.8 Foto de perfil (single/batch)

### `GET /v1/integrations/zapi/profile-picture?phone=551199...&instanceId=...`

**Response 200:** payload bruto da Z-API (normalmente contém `link`).

### `POST /v1/integrations/zapi/profile-pictures/batch`

**Body:**
```json
{
  "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "phones": ["5511999999999", "5511888888888"]
}
```

**Response 200 (exemplo):**
```json
{
  "results": [
    { "phone": "5511999999999", "link": "https://..." },
    { "phone": "5511888888888", "link": null, "error": "..." }
  ]
}
```

---

## 3.9 Sync de roteamento por snapshot de chats

### `POST /v1/integrations/zapi/chats/sync-contact-routing`

**Body:**
```json
{
  "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "page": 1,
  "pageSize": 100,
  "maxPages": 5,
  "onlyUnknown": true,
  "upsertMissingContacts": false
}
```

**Response 200 (exemplo):**
```json
{
  "scannedChats": 320,
  "matchedContacts": 210,
  "updatedContacts": 45,
  "updatedContactIds": ["..."],
  "createdContacts": 0,
  "createdContactIds": [],
  "skippedAlreadyRouted": 160,
  "unmatchedPhones": ["5511..."],
  "syncedContacts": 45
}
```

---

## 3.10 Override manual de contato -> instância

### `PATCH /v1/integrations/zapi/contacts/:contactId/routing`

**Body para definir:**
```json
{ "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F" }
```

**Body para limpar:**
```json
{ "instanceId": null }
```

**Response 200 (exemplo):**
```json
{
  "id": "contact-uuid",
  "phone": "5511999999999",
  "zapiInstanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "updatedAt": "2026-03-16T20:00:00.000Z"
}
```

---

## 3.11 Enviar mensagem com override de instância

### `POST /v1/conversations/:contactId/messages`

**Body (texto):**
```json
{
  "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "type": "TEXT",
  "text": "Olá!"
}
```

**Body (reply):**
```json
{
  "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "type": "TEXT",
  "text": "Respondendo aqui",
  "replyToZapiMessageId": "D241XXXX732339502B68"
}
```

**Body (reaction):**
```json
{
  "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "type": "REACTION",
  "reaction": "❤️",
  "replyToZapiMessageId": "D241XXXX732339502B68"
}
```

**Response 201:**
```json
{ "id": "message-uuid" }
```

---

## 4) Regras de roteamento (como o backend decide a instância)

Ordem de prioridade:
1. `body.instanceId` no envio
2. `contact.zapiInstanceId`
3. instância com `isDefault = true`
4. primeira instância ativa do tenant

Webhook Z-API atualiza `contact.zapiInstanceId` automaticamente.

---

## 5) Como consumir no front via onSnapshot (sem GET para timeline)

### 5.1 Lista de chats

Escute:
- `tenants/{tenantId}/contacts`

Campos relevantes na UI:
- `lastMessage`, `lastMessageAt`, `unreadCount`
- `zapiInstanceId` (debug/admin)

### 5.2 Mensagens do chat aberto

Escute:
- `tenants/{tenantId}/contacts/{contactId}/messages`

Campos relevantes:
- `zapiMessageId` (ações de reply/reaction)
- `referenceMessageId` (render quote)
- `status` (`SENT`, `READ`, etc.)

### 5.3 Importante

- O POST de envio não deve inserir bolha manual.
- A UI deve esperar o documento chegar pelo snapshot.

---

## 6) Checklist de tela admin (recomendado)

1. Tela “Instâncias WhatsApp”:
   - listar instâncias (`GET /v1/integrations`)
   - cadastrar (`PUT /v1/integrations/zapi`)
   - definir padrão (`PATCH /v1/integrations/zapi/default`)
2. Ação “Sincronizar roteamento por chats”:
   - `POST /v1/integrations/zapi/chats/sync-contact-routing`
3. Drawer do contato:
   - mostrar `zapiInstanceId`
   - botão “trocar instância” (override manual)

---

## 7) Migrações necessárias

- `20260316120000_add_zapi_instances_table`
- `20260316132000_add_contact_zapi_instance_id`
- `20260316143000_add_zapi_default_instance`

Comandos:
- dev: `pnpm db:migrate`
- prod: `pnpm db:migrate:prod`
