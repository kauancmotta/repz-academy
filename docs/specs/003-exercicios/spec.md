# 003 · Exercícios

## Objetivo

Disponibilizar um catálogo de exercícios pré-cadastrados (seed) e permitir que personais e alunos criem exercícios próprios, com vídeo opcional do YouTube.

## User stories

- Como usuário, quero buscar exercícios por nome e grupo muscular ao montar um treino.
- Como personal ou aluno, quero cadastrar um exercício que não existe no catálogo.
- Como usuário, quero assistir ao vídeo de demonstração do exercício dentro do app.

## Regras de negócio

RN-11, RN-12 (ver `docs/arquitetura.md`).

## Requisitos funcionais

- RF-01: Seed com catálogo inicial (mínimo de 40 exercícios, cobrindo todos os grupos musculares) em português.
- RF-02: Listagem com busca (`search`) e filtro (`muscleGroup`). Mostra exercícios globais e os criados pelo próprio usuário.
- RF-03: Criar exercício com nome, grupo muscular, descrição (opcional) e link do YouTube (opcional).
- RF-04: Editar e remover apenas exercícios criados pelo próprio usuário.
- RF-05: O backend valida o link do YouTube e devolve `videoEmbedUrl`.

## Critérios de aceitação

- [ ] Após `npx prisma db seed`, o catálogo aparece na listagem.
- [ ] Rodar o seed duas vezes não duplica exercícios.
- [ ] Busca ignora acentos e maiúsculas/minúsculas.
- [ ] Link válido (`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`) vira `https://www.youtube.com/embed/<id>`.
- [ ] Link que não é do YouTube retorna 400.
- [ ] Editar ou remover exercício global retorna 403.
- [ ] Editar ou remover exercício de outro usuário retorna 403.
- [ ] Remover exercício usado em treino ou sessão retorna 409 `EXERCISE_IN_USE`.
- [ ] Exercício criado por um usuário não aparece para os outros.

## Fora de escopo

Upload de imagem ou vídeo, avaliação de exercícios, exercícios compartilhados entre usuários.
