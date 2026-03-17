# Public Checkout Ailum (InfinitePay)

Fluxo para vender a plataforma Ailum para clínicas novas (sem conta/logado).

Base: `/v1/public`

---

## GET `/ailum/plans`

Retorna o plano público disponível.

Plano padrão:
- `id`: `ailum-anual`
- `amountCents`: `1800000` (R$ 18.000,00)
- `sellerHandle`: `ailum-solucoes`

---

## POST `/ailum/checkout-links`

Cria checkout link na InfinitePay para clínica nova.

### Body

```json
{
  "clinicName": "Clínica Exemplo",
  "email": "financeiro@clinica.com.br",
  "phoneNumber": "+5511999998888",
  "redirectUrl": "https://app.ailum.com/checkout/sucesso"
}
```

Campos opcionais:
- `amountCents`
- `description`
- `quantity`
- `redirectUrl`

Se não enviar opcionais, usa o plano anual padrão da Ailum.

### Response (201)

```json
{
  "orderNsu": "ailum-1710770000000-ab12cd34",
  "plan": {
    "id": "ailum-anual",
    "name": "Plano Anual Ailum",
    "amountCents": 1800000,
    "description": "Plano Anual Ailum",
    "quantity": 1
  },
  "checkout": {
    "...": "payload da InfinitePay"
  }
}
```

---

## POST `/ailum/payment-check`

Confere status do pagamento na InfinitePay.

### Body

```json
{
  "orderNsu": "ailum-1710770000000-ab12cd34",
  "transactionNsu": "uuid-transacao",
  "slug": "slug-da-fatura"
}
```

### Response

Retorna o payload da InfinitePay (`paid`, `amount`, `capture_method`, etc).
