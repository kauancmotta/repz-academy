# 004 · Treinos

## Objetivo

Permitir que o personal monte o treino do aluno, que o aluno sem personal monte o próprio, e que o aluno visualize o treino por dia da semana.

## User stories

- Como personal, quero montar um treino para um aluno vinculado, escolhendo exercícios, séries, repetições e dias da semana.
- Como personal, quero editar e arquivar os treinos que criei.
- Como aluno com personal, quero visualizar o treino montado pelo meu personal, sem poder editar.
- Como aluno sem personal, quero montar, editar e arquivar meus próprios treinos.
- Como aluno, quero ver o treino do dia de hoje rapidamente.

## Regras de negócio

RN-07, RN-08, RN-09, RN-10, RN-18 e a seção 5 de `docs/arquitetura.md`.

## Requisitos funcionais

- RF-01: Criar treino com nome e itens. Cada item: `exerciseId`, `weekday`, `order`, `sets`, `targetReps`, `restSeconds?`, `notes?`.
- RF-02: Personal cria treino informando `studentId` (aluno vinculado a ele). Aluno sem personal cria para si.
- RF-03: Listar treinos visíveis ao usuário, com filtro `archived=true|false`.
- RF-04: Detalhar treino com itens agrupados por dia da semana.
- RF-05: Editar nome e itens (substituição completa da lista de itens).
- RF-06: Arquivar e desarquivar treino (somente autor, e aluno só se não tiver personal).
- RF-07: Remover treino sem sessões registradas. Com sessões, retorna 409 e orienta arquivar.
- RF-08: Endpoint do treino de hoje para o aluno (`GET /workouts/today`).

## Critérios de aceitação

- [ ] Personal só cria treino para aluno vinculado a ele; outro aluno retorna 403.
- [ ] Aluno com personal tenta criar ou editar treino e recebe 403 `STUDENT_HAS_PERSONAL`.
- [ ] Aluno com personal vê apenas treinos do seu personal atual (não vê os do personal anterior).
- [ ] Treinos próprios arquivados ao vincular aparecem somente na lista de arquivados e não podem ser editados.
- [ ] Ao desvincular, treinos próprios voltam a ser editáveis.
- [ ] `sets` e `targetReps` devem ser inteiros positivos; `weekday` deve ser um dia válido.
- [ ] `exerciseId` inexistente ou inacessível ao autor retorna 400.
- [ ] Itens são devolvidos ordenados por `weekday` e `order`.
- [ ] `DELETE` de treino com sessões retorna 409 `WORKOUT_HAS_SESSIONS`.
- [ ] `GET /workouts/today` devolve os itens do dia da semana atual (fuso America/Sao_Paulo) dos treinos ativos do aluno.

## Fora de escopo

Cópia/modelo de treino, múltiplas semanas (periodização), supersets e técnicas avançadas.
