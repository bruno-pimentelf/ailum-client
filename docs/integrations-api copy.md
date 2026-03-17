# Integrations API

> Base: `POST /v1/integrations`  
> Auth: cookie de sessão (`credentials: 'include'`) + organização ativa na sessão  
> Role mínima: **ADMIN**

---

## GET /v1/integrations

Lista todas as integrações. API keys nunca são retornadas.

**Response 200**
```json
[
  {
    "provider": "zapi",
    "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
    "webhookToken": null,
    "isActive": true,
    "hasApiKey": true
  },
  {
    "provider": "asaas",
    "instanceId": null,
    "webhookToken": null,
    "isActive": true,
    "hasApiKey": true
  }
]
```

---

## PUT /v1/integrations/zapi

Salva credenciais Z-API **e auto-configura os webhooks** na instância.

**Body**
```json
{
  "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "instanceToken": "DDF6170F74BC3D70AD91CBE5"
}
```

**Response 200**
```json
{
  "provider": "zapi",
  "instanceId": "3EE8E4989B1AF28A1F35E28BEEFEC97F",
  "webhookToken": null,
  "isActive": true,
  "hasApiKey": true,
  "webhooksConfigured": true,
  "webhooksError": null
}
```

> `webhooksConfigured: false` + `webhooksError: "..."` = credenciais inválidas ou instância offline

---

## GET /v1/integrations/zapi/status

Status da conexão da instância com o WhatsApp.

**Response 200**
```json
{ "connected": true, "smartphoneConnected": true, "error": null }
```
```json
{ "connected": false, "smartphoneConnected": false, "error": "You are not connected." }
```

---

## GET /v1/integrations/zapi/qrcode

Retorna o QR code em base64 para escanear com o WhatsApp.  
⚠️ O QR code expira a cada 20s — fazer polling a cada 10-15s até `connected: true` no status.  
Retorna `404` se a instância já estiver conectada ou não configurada.

**Response 200**
```json
{ "value": "data:image/png;base64,iVBORw0KGgo..." }
```

---

## POST /v1/integrations/zapi/disconnect

Desconecta o WhatsApp da instância. Para reconectar é necessário escanear o QR code novamente.

**Response 200**
```json
{ "disconnected": true }
```

---

## POST /v1/integrations/zapi/restart

Reinicia a instância Z-API (equivale a um CTRL+ALT+DEL — não desconecta o número).

**Response 200**
```json
{ "restarted": true }
```

---

## PUT /v1/integrations/asaas

Salva a API key do Asaas.

**Body**
```json
{ "apiKey": "$aact_MzkwODA..." }
```

**Response 200**
```json
{
  "provider": "asaas",
  "instanceId": null,
  "webhookToken": null,
  "isActive": true,
  "hasApiKey": true
}
```

---

## PUT /v1/integrations/infinitepay

Salva a InfiniteTag da conta InfinitePay (sem `$`).

**Body**
```json
{ "handle": "ailum-solucoes" }
```

**Response 200**
```json
{
  "provider": "infinitepay",
  "instanceId": null,
  "webhookToken": null,
  "isActive": true,
  "hasApiKey": true,
  "handle": "ailum-solucoes"
}
```

---

## GET /v1/integrations/infinitepay/plans

Retorna o catálogo de planos disponíveis para checkout.

**Response 200**
```json
{
  "currency": "BRL",
  "plans": [
    {
      "id": "ailum-anual",
      "name": "Plano Anual Ailum",
      "amountCents": 1800000,
      "amountFormatted": "R$ 18.000,00",
      "interval": "yearly",
      "quantity": 1,
      "description": "Plano Anual Ailum"
    }
  ]
}
```

---

## GET /v1/integrations/infinitepay/customers

Lista clientes da aplicação (contatos ativos do tenant) para uso no checkout.

**Query params opcionais**
- `search`: busca por nome, email ou telefone
- `limit`: padrão `50` (máx `200`)

---

## POST /v1/integrations/infinitepay/checkout-links

Gera um checkout link para o front redirecionar/embutir.

Se `planId` não for enviado, usa o plano padrão anual da Ailum (`R$ 18.000,00`).
Se a integração não estiver configurada para o tenant, o backend usa a handle padrão `ailum-solucoes`.

**Body (exemplo com cliente do sistema)**
```json
{
  "planId": "ailum-anual",
  "contactId": "uuid-do-contato",
  "orderNsu": "order-123",
  "redirectUrl": "https://app.ailum.com/pagamento/sucesso",
  "webhookUrl": "https://api.ailum.com/webhooks/infinitepay"
}
```

**Body (exemplo custom)**
```json
{
  "amountCents": 1800000,
  "description": "Plano Anual Ailum",
  "quantity": 1,
  "customer": {
    "name": "Clínica Exemplo",
    "email": "financeiro@clinica.com",
    "phoneNumber": "+5511999998888"
  }
}
```

---

## POST /v1/integrations/infinitepay/payment-check

Consulta o status de pagamento de um checkout.
Se a integração não estiver configurada para o tenant, o backend usa a handle padrão `ailum-solucoes`.

**Body**
```json
{
  "orderNsu": "order-123",
  "transactionNsu": "uuid-da-transacao",
  "slug": "slug-da-fatura"
}
```

---

## DELETE /v1/integrations/:provider

Desativa uma integração. `provider` = `zapi` | `asaas` | `infinitepay` | `elevenlabs`

**Response 204** — sem body
