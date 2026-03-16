# Roteamento por Funil e Coleta Estruturada de Dados

Documentação das duas novas funcionalidades: roteamento automático de contatos para funis diferentes na primeira mensagem, e coleta estruturada de dados via tool `collect_info`.

---

## 1. Roteamento automático por funil (`entryKeywords`)

### O que é

Cada funil pode ter uma lista de palavras-chave (`entryKeywords`). Quando um novo contato envia a **primeira mensagem**, o sistema verifica se ela contém alguma dessas palavras e roteia o contato para o funil correspondente. Se nenhuma keyword bater, o contato vai para o funil padrão (`isDefault: true`).

### Casos de uso

| Funil | Keywords |
|-------|----------|
| Plano de Saúde | `["plano", "convênio", "unimed", "amil", "bradesco", "sulamerica"]` |
| Estética | `["botox", "preenchimento", "limpeza de pele", "estética", "harmonização"]` |
| Urgência | `["urgente", "dor", "emergência", "hoje mesmo", "agora"]` |
| Retorno | `["retorno", "já fui paciente", "já sou paciente"] ` |

### API

#### Configurar keywords de um funil

```http
PATCH /v1/funnels/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "entryKeywords": ["plano de saúde", "convênio", "unimed", "amil"]
}
```

Retorna o funil atualizado.

#### Remover keywords (limpar)

```http
PATCH /v1/funnels/:id

{
  "entryKeywords": []
}
```

#### Listar funis (já inclui entryKeywords)

```http
GET /v1/funnels
```

**Resposta:**
```json
[
  {
    "id": "uuid-funil-plano",
    "name": "Plano de Saúde",
    "isDefault": false,
    "entryKeywords": ["plano", "convênio", "unimed"],
    "stages": [...]
  },
  {
    "id": "uuid-funil-principal",
    "name": "Funil Principal",
    "isDefault": true,
    "entryKeywords": [],
    "stages": [...]
  }
]
```

### Comportamento

- Matching é **case-insensitive** e **ignora acentos** (`plano de saúde` = `Plano de Saude` = `PLANO DE SAÚDE`)
- Verifica se a mensagem **contém** a keyword (não precisa ser exata)
- Avalia os funis em ordem: primeiro os com `isDefault: true`, depois por `order` crescente
- O **primeiro funil** cujo keyword bater é o escolhido
- Se **nenhum** keyword bater → funil padrão (`isDefault: true` ou primeiro por `order`)
- Só se aplica à **primeira mensagem** (quando o contato ainda não tem stage)

### Sugestão de UI

Na tela de configuração do funil, adicionar um campo de tags/chips:

```
Keywords de entrada
[ plano de saúde × ] [ convênio × ] [ unimed × ] [ + adicionar ]

Quando um novo contato mencionar alguma dessas palavras na primeira mensagem,
ele será automaticamente direcionado para este funil.
```

---

## 2. Tool `collect_info`

### O que é

Tool disponível para o agente salvar campos estruturados coletados durante a conversa: CPF, plano de saúde, data de nascimento, telefone, e-mail e observações.

### Onde os dados são salvos

| Campo | Onde |
|-------|------|
| `email` | `contact.email` (campo direto do contato) |
| `phone` | `contact.phone` (campo direto do contato) |
| `cpf` | `AgentMemory` com key `cpf` |
| `birth_date` | `AgentMemory` com key `birth_date` |
| `insurance` | `AgentMemory` com key `insurance` |
| `notes` | `AgentMemory` com key `notes` |

CPF é salvo sem formatação (só dígitos).

### Como ativar

Adicionar `collect_info` em `allowedTools` do stage desejado:

```http
PUT /v1/funnels/stages/:id/agent-config
Content-Type: application/json

{
  "allowedTools": ["search_availability", "create_appointment", "collect_info", "move_stage", "send_message", "notify_operator"]
}
```

### Como instruir o agente

No campo `stageContext` do stage, orientar quando e o que coletar:

```
Antes de agendar, colete o CPF e o plano de saúde do paciente.
Pergunte de forma natural: "Para finalizar o cadastro, pode me informar seu CPF e plano de saúde?"
Quando o paciente informar, use collect_info para salvar imediatamente.
```

Ou para coleta completa:

```
Colete as seguintes informações antes de agendar:
1. CPF (obrigatório para gerar cobrança)
2. Data de nascimento
3. Plano de saúde (ou "particular" se não tiver)
4. E-mail para envio de confirmação

Use collect_info assim que o paciente informar cada dado.
```

### Casos de uso

**Clínica com plano de saúde:**
```
Pergunte o plano de saúde logo no início.
Se tiver plano, salve com collect_info (campo insurance) e mova para @stage:Triagem Plano
Se for particular, mova para @stage:Triagem Particular
```

**Coleta de CPF para PIX:**
```
Antes de gerar o PIX, colete o CPF com collect_info.
O CPF salvo fica disponível para uso em generate_pix.
```

**Observações clínicas:**
```
Se o paciente mencionar condições relevantes (alergia, gravidez, medicamentos),
salve em collect_info no campo notes.
```

### Leitura dos dados no frontend

Os dados salvos em `AgentMemory` aparecem na conversa do contato. Para ler via API:

```http
GET /v1/contacts/:id/memories
```

**Resposta:**
```json
[
  { "key": "cpf", "value": "12345678901", "confidence": 1 },
  { "key": "insurance", "value": "Unimed", "confidence": 1 },
  { "key": "birth_date", "value": "15/03/1990", "confidence": 1 },
  { "key": "notes", "value": "Alergia a dipirona", "confidence": 1 }
]
```

`email` e `phone` ficam diretamente no objeto do contato (`GET /v1/contacts/:id`).

---

## Migrations

Aplicar antes de usar:

```bash
npx prisma migrate deploy
```

Migration adicionada: `20260313100000_add_funnel_entry_keywords`

---

## Arquivos relevantes

| Arquivo | O que mudou |
|---------|-------------|
| `prisma/schema.prisma` | Campo `entryKeywords String[]` no model `Funnel` |
| `src/modules/funnels/funnels.service.ts` | Função `resolveEntryFunnel()` + `updateFunnel` aceita `entryKeywords` |
| `src/modules/funnels/funnels.schema.ts` | `UpdateFunnelSchema` aceita `entryKeywords` |
| `src/jobs/agent.job.ts` | Usa `resolveEntryFunnel` em vez de `getEntryFunnelFirstStage` |
| `src/constants/agent-tools.ts` | Nova tool `collect_info` |
| `src/modules/agent/tool-executor.ts` | Executor da tool `collect_info` |
