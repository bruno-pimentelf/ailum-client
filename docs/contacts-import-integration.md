# Importacao de contatos por planilha (CSV)

Este guia descreve a integracao frontend para importacao de contatos via planilha CSV, com foco em experiencia simples para o usuario:

1. baixar template
2. selecionar arquivo
3. ver preview (sem gravar)
4. confirmar importacao

---

## Fluxo recomendado (UX)

1) Usuario clica em "Baixar template"  
2) Preenche a planilha no formato CSV (UTF-8)  
3) Front envia arquivo para preview  
4) Front mostra resumo: validos, invalidos, novos, existentes  
5) Usuario escolhe modo de importacao  
6) Front confirma commit  
7) Lista de contatos atualiza por `onSnapshot` (Firestore) ou refresh da listagem

---

## Endpoints

### 1) Baixar template

`GET /v1/contacts/import-template.csv`

- Auth: sim (`CONTACTS_READ`)
- Response: arquivo CSV com cabecalho e exemplo

Template atual:

```csv
nome;telefone;email;status;observacoes
Maria Silva;5511999999999;maria@exemplo.com;NEW_LEAD;Contato vindo de campanha
```

---

### 2) Preview da importacao (dry run)

`POST /v1/contacts/imports/preview`

- Auth: sim (`CONTACTS_WRITE`)
- Objetivo: validar e simular importacao sem gravar no banco

Body:

```json
{
  "fileName": "contatos.csv",
  "contentBase64": "<arquivo_em_base64>",
  "delimiter": ";"
}
```

- `delimiter` opcional: `";"` (padrao) ou `","`

Response 200:

```json
{
  "previewId": "f8f1f4a9-8f5b-4f34-9c95-88af35cb12f4",
  "expiresInSec": 1800,
  "totalRows": 120,
  "validRows": 110,
  "invalidRows": 10,
  "wouldCreate": 85,
  "wouldMatchExisting": 25,
  "issues": [
    {
      "rowNumber": 8,
      "reason": "Telefone invalido (use DDI+DDD+numero, apenas digitos)"
    }
  ],
  "sample": [
    {
      "rowNumber": 2,
      "phone": "5511999999999",
      "name": "Maria Silva",
      "email": "maria@exemplo.com",
      "notes": "Contato vindo de campanha",
      "status": "NEW_LEAD"
    }
  ]
}
```

Observacoes:

- `previewId` expira em 30 minutos
- telefone e deduplicacao sao normalizados por digitos
- linhas invalidas nao entram no commit

---

### 3) Commit da importacao

`POST /v1/contacts/imports/commit`

- Auth: sim (`CONTACTS_WRITE`)
- Objetivo: executar gravacao com base no `previewId`

Body:

```json
{
  "previewId": "f8f1f4a9-8f5b-4f34-9c95-88af35cb12f4",
  "mode": "skip_existing"
}
```

`mode` (opcional):

- `create_only`: cria novos e ignora existentes
- `skip_existing` (padrao): igual ao create_only
- `upsert`: cria novos e atualiza existentes

Response 200:

```json
{
  "previewId": "f8f1f4a9-8f5b-4f34-9c95-88af35cb12f4",
  "mode": "skip_existing",
  "totalProcessed": 110,
  "created": 85,
  "updated": 0,
  "skippedExisting": 25,
  "failed": 0,
  "changedContactIds": [
    "c1f2b3d4-...."
  ],
  "errors": []
}
```

---

## Colunas aceitas no CSV

Minimo obrigatorio:

- `telefone` (ou `phone`, `celular`, `whatsapp`, `numero`)

Opcionais:

- `nome` (ou `name`)
- `email`
- `status`
- `observacoes` (ou `obs`, `notes`, `nota`)

Status aceitos:

- `NEW_LEAD`
- `QUALIFIED`
- `APPOINTMENT_SCHEDULED`
- `AWAITING_PAYMENT`
- `PAYMENT_CONFIRMED`
- `ATTENDED`
- `NO_INTEREST`
- `RECURRING`
- `IN_HUMAN_SERVICE`

---

## Regras importantes

- Chave de deduplicacao: `tenantId + phone`
- Telefone salvo sempre normalizado (somente digitos)
- Emails invalidos sao rejeitados no preview
- Linhas duplicadas no mesmo arquivo sao rejeitadas (a segunda em diante)
- No commit, contatos alterados sao sincronizados no Firestore (`syncContact`)

---

## Exemplo de implementacao no frontend

1. Ler arquivo CSV como `ArrayBuffer`
2. Converter para base64
3. Chamar `/imports/preview`
4. Exibir resumo e erros por linha
5. Chamar `/imports/commit` com `previewId` e `mode`
6. Mostrar resultado final

