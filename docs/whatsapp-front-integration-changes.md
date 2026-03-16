# WhatsApp Front Integration — mudanças no backend

## Objetivo

Habilitar no front:
- Responder mensagem específica (quote/reply)
- Reagir a mensagem

Sem depender de `GET` extra: tudo via `onSnapshot` do Firestore.

---

## O que mudou

### 1) Endpoint de envio (`POST /v1/conversations/:contactId/messages`)

Agora aceita **reply para texto**:

```json
{
  "type": "TEXT",
  "text": "Respondendo aqui",
  "replyToZapiMessageId": "D241XXXX732339502B68"
}
```

Reação continua no mesmo endpoint:

```json
{
  "type": "REACTION",
  "reaction": "❤️",
  "replyToZapiMessageId": "D241XXXX732339502B68"
}
```

---

### 2) Firestore `messages/{messageId}` (snapshot)

Cada mensagem agora pode trazer:

- `zapiMessageId?: string` → usar como alvo para `replyToZapiMessageId`
- `referenceMessageId?: string` → quando a mensagem é uma resposta/quote

Exemplo:

```json
{
  "id": "local-message-uuid",
  "role": "CONTACT",
  "type": "TEXT",
  "content": "Oi",
  "createdAt": "timestamp",
  "zapiMessageId": "D241XXXX732339502B68",
  "referenceMessageId": "ABC123..."
}
```

---

## Como integrar no front

1. No item de mensagem do snapshot, leia `message.zapiMessageId`.
2. Ao clicar em **Responder**, envie `TEXT + replyToZapiMessageId`.
3. Ao clicar em **Reagir**, envie `REACTION + replyToZapiMessageId`.
4. Não faça update otimista manual da timeline; continue usando `onSnapshot` como fonte de verdade.

---

## Observações

- Reação **não cria nova mensagem** na timeline (comportamento esperado).
- Para mensagens antigas que não tinham `zapiMessageId` sincronizado, pode não ser possível reagir/responder até novas mensagens chegarem.
