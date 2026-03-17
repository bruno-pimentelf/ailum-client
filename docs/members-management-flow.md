# Members Management (Backend)

Este documento resume o fluxo de gestão de membros no Ailum:
- criação direta de conta (sem convite),
- listagem de membros/perfis,
- edição de role.

Base: `/v1/members`  
Auth: sessão ativa + organização ativa  
Permissão mínima: `members:write` para criar/editar, `members:read` para listar

---

## 1) Criação direta de conta (sem invite)

## Endpoint

`POST /v1/members/create-account`

## Body

```json
{
  "name": "Maria Souza",
  "email": "maria@clinica.com",
  "password": "SenhaForte123",
  "role": "PROFESSIONAL",
  "professionalId": "uuid-opcional"
}
```

`role` aceitas:
- `ADMIN`
- `PROFESSIONAL`
- `SECRETARY`

## O que o backend faz

1. Busca o tenant atual.
2. Verifica se já existe usuário com esse email no Better Auth (`user`).
3. Se não existir, cria usuário via `auth.api.signUpEmail`.
4. Garante vínculo na organização do Better Auth (`member`):
   - `ADMIN` -> role `admin`
   - `PROFESSIONAL` / `SECRETARY` -> role `member`
5. Garante espelho no domínio Ailum (`tenant_members`):
   - cria ou atualiza com role da Ailum,
   - ativa `isActive = true`,
   - salva `professionalId` quando informado.

## Response (201)

```json
{
  "id": "tenant-member-uuid",
  "userId": "better-auth-user-id",
  "email": "maria@clinica.com",
  "name": "Maria Souza",
  "role": "PROFESSIONAL",
  "professionalId": "uuid-opcional-ou-null",
  "isActive": true,
  "created": true
}
```

`created = false` quando já existia `tenant_member` e foi apenas atualizado/reativado.

---

## 2) Listagem de membros

## Endpoint

`GET /v1/members`

Retorna membros ativos do tenant (`tenant_members`) com:
- dados do usuário (`user`: nome/email/imagem),
- vínculo profissional (`professional`: id/fullName/specialty).

Esse endpoint é a fonte principal para tela de gestão de equipe no front.

---

## 3) Listagem de convites (fluxo legado)

## Endpoint

`GET /v1/members/invitations`

Mantido para compatibilidade com o fluxo antigo por convite.

---

## 4) Edição de role e vínculo profissional

## Endpoint

`PATCH /v1/members/:id/role`

## Body

```json
{
  "role": "ADMIN",
  "professionalId": "uuid-ou-null"
}
```

Campos opcionais:
- `role`
- `professionalId`

Atualiza o registro em `tenant_members`.

---

## 5) Remoção de membro

## Endpoint

`DELETE /v1/members/:id`

Faz soft delete no tenant:
- `isActive = false` em `tenant_members`.

---

## Regras importantes

- Pode existir **mais de um ADMIN** no tenant.
- O controle de permissões da API usa **`tenant_members.role`**.
- Better Auth é usado para autenticação e membership de organização; Ailum usa `tenant_members` como camada de autorização de negócio.

---

## Fluxo recomendado no front

1. Tela de equipe chama `GET /v1/members`.
2. Admin cria conta via `POST /v1/members/create-account`.
3. Após criar, recarrega `GET /v1/members`.
4. Alteração de role via `PATCH /v1/members/:id/role`.
5. Remoção via `DELETE /v1/members/:id`.
