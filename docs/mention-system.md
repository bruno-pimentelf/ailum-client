# Sistema de @mentions nos Prompts do Agente

Permite referenciar entidades do tenant (stages, profissionais, serviços) e tools diretamente nos campos de texto do agente, usando a sintaxe `@tipo:Nome`. As referências são resolvidas automaticamente para IDs reais antes de ir para o LLM.

---

## Sintaxe

| Sintaxe | Resolve para |
|---------|-------------|
| `@stage:Nome do Stage` | `"Nome do Stage" [id=<uuid>] (funil: Nome do Funil)` |
| `@professional:Nome` | `"Nome" [id=<uuid>]` |
| `@service:Nome` | `"Nome" [id=<uuid>]` |
| `@tool:nome_da_tool` | Instrução completa da tool injetada no prompt |

**Referências não resolvidas** (nome errado, entidade deletada) são mantidas como estão (`@stage:NomeInexistente`) para que o autor perceba e corrija.

---

## Onde pode ser usado

| Campo | Onde configurar |
|-------|----------------|
| `stageContext` | `PUT /v1/funnels/stages/:id/agent-config` |
| `funnelAgentPersonality` | `PUT /v1/funnels/stages/:id/agent-config` |
| `agentBasePrompt` | `PATCH /v1/tenant` |
| `guardrailRules` | `PATCH /v1/tenant` |

---

## Exemplos práticos

### Transição entre funis

```
Se o paciente mencionar plano de saúde, mova para @stage:Plano de Saúde
Se quiser procedimento estético, mova para @stage:Estética
Se demonstrar interesse em pacote, mova para @stage:Qualificado Pacote
```

O agente receberá no prompt:
```
Se o paciente mencionar plano de saúde, mova para "Plano de Saúde" [id=abc-123] (funil: Plano de Saúde)
```

### Referenciar profissional específico

```
Profissional padrão para novos pacientes: @professional:Dra. Ana Lima
Para urgências, direcione para @professional:Dr. Carlos Souza
```

### Referenciar serviço

```
O serviço de entrada é sempre @service:Consulta de Avaliação
Para retornos, use @service:Retorno
```

### Injetar instrução de tool

```
Quando o paciente confirmar o horário, use @tool:create_appointment
Após agendar, gere o pagamento com @tool:generate_pix
```

Isso injeta no prompt a instrução completa da tool, reforçando o comportamento esperado.

### Combinado — stage de triagem

```
Colete o motivo da consulta e o plano de saúde do paciente.

Se tiver plano, mova para @stage:Triagem Plano
Se for particular, mova para @stage:Triagem Particular
Se for urgência, use @tool:notify_operator imediatamente

Profissional de triagem: @professional:Enf. Mariana Costa
```

---

## API

### GET /v1/agent/mentions

Retorna todos os mencionáveis do tenant. Use para montar autocomplete no editor.

**Auth:** Bearer token (qualquer membro autenticado)

**Resposta:**
```json
{
  "stages": [
    {
      "mention": "@stage:Qualificado",
      "label": "Qualificado",
      "sublabel": "Funil Principal",
      "id": "uuid-do-stage"
    },
    {
      "mention": "@stage:Plano de Saúde",
      "label": "Plano de Saúde",
      "sublabel": "Funil Plano",
      "id": "uuid-do-stage"
    }
  ],
  "professionals": [
    {
      "mention": "@professional:Dra. Ana Lima",
      "label": "Dra. Ana Lima",
      "id": "uuid-do-profissional"
    }
  ],
  "services": [
    {
      "mention": "@service:Consulta de Avaliação",
      "label": "Consulta de Avaliação",
      "id": "uuid-do-servico"
    }
  ],
  "tools": [
    {
      "mention": "@tool:create_appointment",
      "label": "create_appointment",
      "description": "create_appointment: cria o agendamento após o contato confirmar..."
    },
    {
      "mention": "@tool:generate_pix",
      "label": "generate_pix",
      "description": "generate_pix: gera cobrança PIX via Asaas..."
    },
    {
      "mention": "@tool:move_stage",
      "label": "move_stage",
      "description": "move_stage: move o contato para outro stage do funil..."
    },
    {
      "mention": "@tool:notify_operator",
      "label": "notify_operator",
      "description": "notify_operator: transfere a conversa para um operador humano..."
    },
    {
      "mention": "@tool:cancel_appointment",
      "label": "cancel_appointment",
      "description": "cancel_appointment: cancela uma consulta PENDING ou CONFIRMED..."
    },
    {
      "mention": "@tool:reschedule_appointment",
      "label": "reschedule_appointment",
      "description": "reschedule_appointment: remarca uma consulta para nova data/horário..."
    },
    {
      "mention": "@tool:search_availability",
      "label": "search_availability",
      "description": "search_availability: busca horários disponíveis para uma data..."
    },
    {
      "mention": "@tool:send_message",
      "label": "send_message",
      "description": "send_message: envia mensagem WhatsApp para o contato..."
    }
  ]
}
```

---

## Comportamento de resolução

### Matching de nomes

- **Stages:** match exato (normalizado — sem acentos, case-insensitive)
- **Profissionais:** match exato ou parcial (nome contém ou é contido)
- **Serviços:** match exato ou parcial
- **Tools:** match exato pelo nome da tool

### Normalização

Acentos e maiúsculas são ignorados no matching:
- `@stage:Consulta Agendada` = `@stage:consulta agendada` = `@stage:CONSULTA AGENDADA`
- `@professional:Dr. João` = `@professional:dr. joao`

### Não resolvido

Se a entidade não for encontrada, a mention é mantida como está:
```
@stage:NomeQueNaoExiste  →  @stage:NomeQueNaoExiste  (inalterado)
```

---

## Implementação no frontend

### Autocomplete ao digitar `@`

1. Ao detectar `@` no editor de texto, chamar `GET /v1/agent/mentions`
2. Filtrar os resultados conforme o usuário digita (ex: `@stage:Qual` filtra stages com "qual")
3. Ao selecionar, inserir a mention completa (ex: `@stage:Qualificado`)
4. Exibir as mentions com destaque visual (chip/badge) no editor

### Validação visual

Ao salvar ou renderizar o campo, pode-se chamar `GET /v1/agent/mentions` e verificar se todas as mentions no texto existem na lista — destacar em vermelho as não resolvidas.

---

## Arquivos relevantes

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/modules/agent/mention-resolver.ts` | Parser, resolver e listagem de mencionáveis |
| `src/modules/agent/context-builder.ts` | Aplica `resolveMentions()` nos campos antes de montar o contexto |
| `src/modules/agent/agent.routes.ts` | Endpoint `GET /v1/agent/mentions` |
