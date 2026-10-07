# 002 · Vínculo — Plano técnico

## Modelo (Prisma)

```prisma
model Invite {
  id               String    @id @default(uuid())
  code             String    @unique
  personalId       String
  personal         User      @relation("PersonalInvites", fields: [personalId], references: [id])
  expiresAt        DateTime
  usedAt           DateTime?
  usedByStudentId  String?
  createdAt        DateTime  @default(now())
}
```

Status do convite é derivado: `USED` se `usedAt`, `EXPIRED` se `expiresAt < agora`, senão `ACTIVE`.

## Contrato da API

### POST `/api/invites` (PERSONAL)

- 201: `{ "id", "code": "AB12CD34", "expiresAt", "status": "ACTIVE" }`

### GET `/api/invites` (PERSONAL)

- 200: lista dos convites do personal com `status`.

### DELETE `/api/invites/:id` (PERSONAL)

- 204 · 404 se não for dele · 422 se já usado.

### POST `/api/invites/redeem` (STUDENT)

Body: `{ "code": "AB12CD34" }`

- 200: `{ "personal": { "id", "name" } }`
- 404 `INVITE_NOT_FOUND` · 422 `INVITE_EXPIRED` · 422 `INVITE_ALREADY_USED`

### DELETE `/api/link` (STUDENT)

Encerra o vínculo do próprio aluno. 204 · 422 `NO_PERSONAL` se não tiver personal.

### GET `/api/students` (PERSONAL)

- 200: `[{ "id", "name", "email", "lastSessionAt" | null }]`

### DELETE `/api/students/:studentId` (PERSONAL)

Remove o aluno do personal. 204 · 404 se não for aluno dele.

## Implementação

- Código: 8 caracteres alfanuméricos maiúsculos gerados com `crypto.randomBytes`, sem caracteres ambíguos (0, O, 1, I).
- Resgate em **transação** Prisma: valida convite, marca como usado, atualiza `personalId`, arquiva treinos próprios (`archivedAt = now()` onde `authorId = studentId` e `archivedAt` nulo).
- Desvincular em transação: `personalId = null`, treinos próprios com `archivedAt = null`.
- Helper `assertStudentOfPersonal(personalId, studentId)` reutilizado por treinos, histórico e evolução (RN-18).
- Módulo: `src/modules/links/`.

## Frontend

- Personal: tela "Meus alunos" com lista, botão "Gerar convite" (exibe o código com botão copiar) e convites pendentes.
- Aluno: campo "Tenho um código de convite" e cartão "Meu personal" com opção de sair.
