# Stage Agent Config — allowedTools (Integração Frontend)

As tools disponíveis para o agente de IA são configuradas por **stage** em `agentConfig.allowedTools`. O frontend precisa exibir e permitir editar essa lista.

---

## UX implementada: @ para referenciar tools nas instruções

Nos campos "Tom e personalidade" e "Instruções do estágio", ao digitar `@` abre um dropdown com as tools **habilitadas** em "Ferramentas permitidas".

- Dropdown mostra label amigável e `id` entre parênteses (ex: `Agendar consulta (create_appointment)`)
- Seleção (clique ou Enter) insere o `id` da tool no texto
- Apenas tools habilitadas aparecem no menu
- ↑↓ navegar · Enter inserir · Escape fechar

---

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/funnels/stages/:stageId/agent-config` | Obtém config do agente (inclui allowedTools) |
| PUT | `/v1/funnels/stages/:stageId/agent-config` | Atualiza config (inclui allowedTools) |

Base: `/v1` | Auth: `credentials: 'include'`

---

## allowedTools — lista completa

| Tool | Descrição | Quando habilitar |
|------|-----------|------------------|
| `search_availability` | Busca horários disponíveis para agendamento | Stage de qualificação/agendamento |
| `create_appointment` | Cria consulta após confirmação do paciente | Stage de agendamento |
| `cancel_appointment` | Cancela consulta (solicitação do paciente) | Stage "Consulta Agendada" — permite cancelar |
| `reschedule_appointment` | Remarca consulta para nova data/horário | Stage "Consulta Agendada" — permite remarcar |
| `generate_pix` | Gera cobrança PIX | Stage de cobrança |
| `move_stage` | Move contato para outro stage do funil | Stages intermediários |
| `notify_operator` | Transfere para atendimento humano | Qualquer stage (recomendado manter) |
| `send_message` | Envia mensagem WhatsApp | Qualquer stage |

---

## Sugestão de UI

### Multi-select ou checkboxes

Exibir cada tool com label legível:

```ts
const TOOL_LABELS: Record<string, string> = {
  search_availability: 'Buscar horários',
  create_appointment: 'Criar agendamento',
  cancel_appointment: 'Cancelar consulta',
  reschedule_appointment: 'Remarcar consulta',
  generate_pix: 'Gerar PIX',
  move_stage: 'Mover no funil',
  notify_operator: 'Notificar operador',
  send_message: 'Enviar mensagem',
}
```

### Exemplo de PUT

```json
{
  "allowedTools": ["search_availability", "create_appointment", "cancel_appointment", "reschedule_appointment", "move_stage", "send_message", "notify_operator"]
}
```

### Onde colocar cancel/remarca

- **Consulta Agendada**: stages que exibem consultas do contato — habilitar `cancel_appointment` e `reschedule_appointment` para a IA poder cancelar/remarcar quando o paciente pedir.
- **Novo Lead / Qualificado**: geralmente só `search_availability`, `create_appointment`, `move_stage`, `send_message`, `notify_operator`.

---

## Fluxo de confirmação

`cancel_appointment` e `reschedule_appointment` exigem **confirmação do operador** (igual a `create_appointment` e `generate_pix`). O backend retorna `requiresConfirmation: true` e a mensagem não é enviada ao contato até o operador confirmar na fila de pendentes.

---

## Obter config atual

O `GET /v1/funnels` (ou `GET /v1/funnels/:id/stages`) já retorna stages com `agentConfig`:

```json
{
  "stages": [
    {
      "id": "uuid",
      "name": "Consulta Agendada",
      "agentConfig": {
        "allowedTools": ["cancel_appointment", "reschedule_appointment", "send_message", "notify_operator"],
        ...
      }
    }
  ]
}
```

Para editar apenas as tools, fazer PUT com o body contendo `allowedTools` (e demais campos se quiser manter).
