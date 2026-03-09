# Recomendações para o agente IA — datas e agendamento

**Frontend:** Todas as datas são tratadas em timezone local via `lib/date-utils.ts` (toYMD, formatTimeLocal). O calendário, o modal de novo agendamento e a API de disponibilidade usam YYYY-MM-DD no fuso do usuário.

## 1. Contexto de data correto

O agente deve receber sempre a **data/hora atual no timezone da clínica** (ex.: America/Sao_Paulo).

**Problema:** Se o backend passar UTC ou data errada, o agente pode dizer "hoje" quando na verdade é outro dia (ex.: usuário às 19:44 de 09/04, agente fala "hoje 09/03").

**Recomendação:** No contexto do stage agent, incluir:
```txt
Data e hora atual (timezone da clínica): 09 de abril de 2026, 19:44.
```

---

## 2. Auto-afirmar datas e horários

O agente deve **sempre** escrever a data completa ao confirmar, em vez de usar "hoje" ou "amanhã".

| Evitar | Preferir |
|--------|----------|
| "hoje às 09:00" | "09 de abril de 2026 às 09:00" |
| "amanhã de manhã" | "10 de abril de 2026, período da manhã" |
| "terça-feira" | "terça, 15 de abril de 2026" |

**Por quê:** Evita ambiguidade e garante que o usuário veja exatamente qual dia/hora foi agendado.

---

## 3. create_appointment e calendário

Quando `create_appointment` falha (ex.: erro no sistema de agendamento), o agente já chama `notify_operator` como fallback. O calendário do front só exibe agendamentos que existem na API. Se o create falhou, não há nada para mostrar.

**Frontend:** Após confirmação no Playground, invalida a query de appointments para forçar refetch ao abrir o calendário.
