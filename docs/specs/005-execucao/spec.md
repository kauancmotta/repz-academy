# 005 · Execução do treino

## Objetivo

Permitir que o aluno execute o treino do dia **série a série**, registrando carga e repetições, com referência da última vez.

## User stories

- Como aluno, quero iniciar o treino de um dia e ser guiado exercício por exercício, série por série.
- Como aluno, quero informar a carga (kg) e as repetições de cada série e concluir para passar à próxima.
- Como aluno, quero ver o que fiz da última vez no mesmo exercício.
- Como aluno, quero finalizar o treino e ver um resumo (volume e recordes).
- Como aluno, quero corrigir uma série registrada por engano.

## Regras de negócio

RN-13, RN-14, RN-15, RN-16 (ver `docs/arquitetura.md`).

## Requisitos funcionais

- RF-01: Iniciar sessão a partir de um treino e dia da semana.
- RF-02: Registrar série com `workoutItemId`, `setNumber`, `weightKg` (decimal) e `reps`.
- RF-03: Editar e remover série de sessão em andamento.
- RF-04: Finalizar sessão, devolvendo resumo (volume total, séries, PRs batidos).
- RF-05: Consultar "da última vez" por exercício.
- RF-06: Retomar sessão em andamento (aluno fecha o app e volta).
- RF-07: Cronômetro de descanso no frontend, usando `restSeconds` do item (opcional, sem persistência).

## Critérios de aceitação

- [ ] Só o próprio aluno inicia sessões, e só de treino visível a ele e não arquivado.
- [ ] Aluno não pode ter duas sessões em andamento ao mesmo tempo (409 `SESSION_IN_PROGRESS`, com o id da sessão existente em `details.sessionId`; vale também para inícios simultâneos).
- [ ] `weightKg` aceita decimais (ex.: 7.5) e valores maiores ou iguais a 0; `reps` é inteiro maior que 0.
- [ ] Série só pode ser registrada em sessão em andamento do próprio aluno.
- [ ] `setNumber` não pode se repetir para o mesmo item na mesma sessão.
- [ ] Ao finalizar, a sessão recebe `finishedAt` e não aceita mais alterações.
- [ ] Sessão sem nenhuma série não pode ser finalizada (422 `EMPTY_SESSION`); pode ser cancelada.
- [ ] "Da última vez" devolve as séries da sessão finalizada mais recente com o exercício, ou lista vazia.
- [ ] Resumo marca como PR a série com carga acima da maior carga anterior do exercício (primeira vez do exercício não conta como PR).
- [ ] Mudar o treino depois não apaga o histórico de séries.
- [ ] Treino arquivado (inclusive o treino próprio de aluno que tem personal) não pode ser iniciado (422 `WORKOUT_ARCHIVED`); dia sem exercícios retorna 422 `NO_ITEMS_FOR_WEEKDAY`.
- [ ] Série só aceita item do treino e do dia da sessão (400 `INVALID_WORKOUT_ITEM`).
- [ ] O personal vinculado consulta o "da última vez" do aluno; após a troca de personal, o antigo perde o acesso (404) e o novo vê todo o histórico.
- [ ] `GET /students` informa `lastSessionAt` (sessão finalizada mais recente do aluno).

## Fora de escopo

Notificações de descanso, execução offline, vídeo durante o treino.
