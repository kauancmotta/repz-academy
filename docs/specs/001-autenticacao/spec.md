# 001 · Autenticação

## Objetivo

Permitir que personais e alunos criem conta e entrem no sistema com e-mail e senha.

## User stories

- Como visitante, quero me cadastrar informando nome, e-mail, senha e se sou **personal** ou **aluno**.
- Como usuário, quero entrar com e-mail e senha e permanecer autenticado.
- Como usuário, quero ver meus dados e meu perfil após o login.

## Regras de negócio

RN-01, RN-02 (ver `docs/arquitetura.md`).

## Requisitos funcionais

- RF-01: Cadastro com `name`, `email`, `password`, `role` (`PERSONAL` | `STUDENT`).
- RF-02: Login retorna token JWT e dados do usuário.
- RF-03: `GET /auth/me` retorna o usuário autenticado (e o personal vinculado, se aluno).
- RF-04: Middleware `authenticate` e `requireRole(...)` reutilizáveis nas demais rotas.
- RF-05: Frontend guarda o token e protege rotas conforme o perfil.

## Critérios de aceitação

- [ ] Cadastro válido retorna 201 sem expor `passwordHash`.
- [ ] E-mail já cadastrado retorna 409.
- [ ] Senha com menos de 8 caracteres retorna 400.
- [ ] `role` diferente de `PERSONAL`/`STUDENT` retorna 400.
- [ ] Login com credenciais corretas retorna 200 com token.
- [ ] Login com credenciais erradas retorna 401 com mensagem genérica (sem revelar qual campo errou).
- [ ] `/auth/me` sem token retorna 401; com token válido retorna 200.
- [ ] E-mail é tratado sem diferenciar maiúsculas de minúsculas.

## Fora de escopo

Recuperação de senha, login social, refresh token, verificação de e-mail.
