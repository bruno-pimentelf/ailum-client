# Playground — Frontend

## O que mudou no backend

- **Tenant:** campo `isAgentEnabledForWhatsApp` (default `false`). IA no WhatsApp só responde quando `true`. Toggle via `PATCH /v1/tenant` com `{ "isAgentEnabledForWhatsApp": true }`.
- **Agent:** `POST /v1/agent/message` aceita `testMode: true` — em modo teste não envia nada no WhatsApp.
- **Novo endpoint:** `GET /v1/agent/playground-contact` — retorna ou cria o contato de teste.
- Contato playground (`phone: "__playground__"`) não aparece em `GET /v1/contacts`.

---

## Implementar no front

1. **Obter contato de playground**
   ```
   GET /v1/agent/playground-contact
   → { id, phone, name, currentStageId, currentFunnelId }
   ```

2. **Enviar mensagem**
   ```
   POST /v1/agent/message
   { "contactId": "<id>", "message": "texto", "testMode": true }
   → 202 { jobId }
   ```

3. **Exibir chat em tempo real**
   - Firestore: `tenants/{tenantId}/contacts/{contactId}` → `onSnapshot`
   - Mensagens do contato e do agente entram ali.

4. **Confirmação (quando houver)**
   ```
   POST /v1/agent/confirm
   { "contactId": "<id>" }
   ```

5. **Opcional — poll do job**
   ```
   GET /v1/agent/job/:jobId
   → { state, result, failedReason }
   ```
