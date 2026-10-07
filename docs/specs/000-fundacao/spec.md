# 000 · Fundação

## Objetivo

Preparar a infraestrutura que permite as demais funcionalidades: repositório organizado, banco em Docker, API Express no ar com Swagger e frontend Next.js com layout base.

## User stories

- Como desenvolvedor, quero subir o banco com um comando (`docker compose up -d`) para trabalhar sem instalar PostgreSQL.
- Como desenvolvedor, quero a API reiniciando sozinha ao salvar (nodemon) para ganhar tempo.
- Como desenvolvedor frontend, quero consultar o Swagger para saber os contratos da API.
- Como avaliador, quero rodar o projeto seguindo o README.

## Requisitos funcionais

- RF-01: `GET /api/health` retorna `{ "status": "ok" }` e confirma conexão com o banco.
- RF-02: Swagger UI disponível em `/api/docs`.
- RF-03: Tratamento de erros padronizado (ver constituição).
- RF-04: CORS liberado para a origem do frontend (`FRONTEND_URL`).
- RF-05: Frontend com layout base responsivo, em português, e página inicial.

## Requisitos não funcionais

- Node.js 22.x, PostgreSQL 16 via Docker Compose com volume nomeado.
- Variáveis de ambiente documentadas em `.env.example` (backend e frontend).
- TypeScript estrito.

## Critérios de aceitação

- [ ] `docker compose up -d` sobe o PostgreSQL 16 com dados persistidos em volume.
- [ ] `npm run dev` no backend sobe a API em `http://localhost:3001` com nodemon.
- [ ] `GET /api/health` responde 200 com o banco conectado.
- [ ] `/api/docs` abre o Swagger.
- [ ] Rota inexistente retorna 404 no formato padrão de erro.
- [ ] `npm run dev` no frontend abre a página inicial em `http://localhost:8080`.
- [ ] README descreve os passos e eles funcionam em máquina limpa.

## Fora de escopo

Autenticação, regras de negócio, telas além do layout base.
