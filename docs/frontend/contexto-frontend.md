# Contexto do frontend (para o Gustavo e para a IA dele)

O backend está completo (funcionalidades 000 a 006). Este arquivo é o ponto de partida do frontend. Contrato exato de cada rota: `docs/api/openapi.json` (ou Swagger em `http://localhost:3001/api/docs`, JSON em `http://localhost:3001/api/openapi.json`).

## 1. O que anexar na conversa com a IA

**Base (uma vez, no início da conversa):**

- `docs/specs/constitution.md`, `docs/arquitetura.md`, `docs/plano-do-projeto.md`
- `docs/frontend/contexto-frontend.md` (este arquivo)
- `docs/api/openapi.json`
- `DOCUMENTACAO_IA.md` e o PDF de diretrizes do professor

**Por tela:** o `spec.md` e o `plan.md` da funcionalidade correspondente (tabela da seção 5). Uma tela por vez.

**Se o backend mudar:** rode o backend, baixe `/api/openapi.json` de novo, substitua `docs/api/openapi.json` e reanexe.

## 2. Prompt inicial (colar uma vez)

```text
Você vai me ajudar a construir o FRONTEND do "Repz", um app de acompanhamento de treinos de academia (trabalho acadêmico, feito em dupla). Sigo Spec-Driven Development: os arquivos anexados são a fonte da verdade.

O backend já está pronto. Não invente rotas, campos ou regras: use apenas o docs/api/openapi.json e o docs/frontend/contexto-frontend.md. Se algo faltar ou parecer errado no contrato, pare e me avise em vez de adivinhar.

Stack: Next.js (App Router) + React + TypeScript strict + Tailwind CSS (mobile-first) + Recharts. Frontend em http://localhost:8080, API em http://localhost:3001/api (variável NEXT_PUBLIC_API_URL).

Trabalhe uma tela por vez, na ordem: 1) mostre o plano curto (arquivos, rotas usadas, estados de carregando/vazio/erro), 2) espere meu OK, 3) implemente, 4) me diga como testar com as contas de demonstração, 5) sugira a mensagem de commit semântico. Não faça commit. Todo texto da interface em português do Brasil.
```

## 3. Como falar com a API

- Base: `http://localhost:3001/api`. CORS liberado só para `FRONTEND_URL` (padrão `http://localhost:8080`).
- Autenticação: `POST /auth/login` devolve o token. Enviar `Authorization: Bearer <token>` em todas as rotas, exceto `/health`, `/auth/register` e `/auth/login`. O token vale 7 dias. `GET /auth/me` devolve o usuário e o perfil (`PERSONAL` ou `STUDENT`).
- Erros: sempre `{ "error": { "code": "...", "message": "pt-BR", "details"?: ... } }`. A tela deve decidir pelo `code` e pode mostrar o `message`. Erro de validação (`VALIDATION_ERROR`) traz `details` por campo.
- Token expirado ou inválido: status 401. Limpar a sessão e ir para o login.
- Recurso de outro usuário ou inexistente: 404 (nunca 403). Tratar como "não encontrado".
- Um cliente HTTP único (`lib/api.ts`) deve anexar o token, converter o erro em um tipo e tratar o 401 num só lugar.

### Códigos de erro que a interface precisa tratar

| Código | Quando | O que fazer na tela |
|---|---|---|
| `INVALID_CREDENTIALS` | Login errado | Mensagem no formulário |
| `EMAIL_ALREADY_USED` | Cadastro | Erro no campo e-mail |
| `VALIDATION_ERROR` | Qualquer formulário | Erro por campo (`details`) |
| `INVITE_NOT_FOUND`, `INVITE_EXPIRED`, `INVITE_ALREADY_USED` | Resgatar convite | Mensagem pedindo novo código |
| `ALREADY_LINKED`, `STUDENT_HAS_PERSONAL` | Vínculo | Mensagem explicativa |
| `SESSION_IN_PROGRESS` | Iniciar treino | Já há treino aberto: o `details.sessionId` leva a ele |
| `NO_ACTIVE_SESSION`, `SESSION_FINISHED` | Registrar série | Voltar ao treino de hoje |
| `NO_ITEMS_FOR_WEEKDAY` | Iniciar treino em dia sem exercícios | Avisar |
| `EMPTY_SESSION` | Finalizar sem séries | Pedir ao menos uma série |
| `SET_ALREADY_LOGGED` | Série duplicada | Atualizar a lista |
| `WORKOUT_ARCHIVED` | Editar treino arquivado | Treino somente leitura |
| `WORKOUT_HAS_SESSIONS` | Excluir treino usado | Sugerir arquivar |
| `EXERCISE_IN_USE`, `EXERCISE_ALREADY_EXISTS` | Exercícios | Mensagem |
| `STUDENT_ID_REQUIRED` | Personal chamando rota de evolução sem aluno | Bug de tela: sempre enviar `studentId` |

## 4. Regras que mudam a interface

- Perfil escolhido no cadastro e fixo. O menu e as telas mudam por perfil.
- Aluno **com** personal só visualiza os treinos (não cria, não edita). Aluno **sem** personal cria e edita. Treinos próprios ficam somente leitura enquanto há vínculo.
- Treino arquivado é somente leitura (editar devolve 422 `WORKOUT_ARCHIVED`). `archive` e `unarchive` são idempotentes.
- `PUT /workouts/{id}` **substitui** nome e todos os itens; os ids dos itens mudam a cada salvamento. A tela deve sempre reenviar a lista completa.
- Só pode haver **uma sessão aberta** por aluno. Na abertura do app, chamar `GET /sessions/current` e, se houver, oferecer "Retomar treino".
- Carga em kg com até 2 casas decimais; repetições inteiras. Cada série é registrada individualmente e pode ser corrigida ou removida enquanto a sessão estiver aberta.
- `GET /workouts/today` devolve o treino do dia da semana atual (fuso America/Sao_Paulo). Em outros dias, o aluno pode iniciar qualquer dia da semana a partir da lista de treinos.
- Recorde (PR): maior carga do exercício na sessão acima da maior de todas as sessões finalizadas anteriores. Primeira vez ou carga igual não conta. A informação vem pronta no resumo (`finish`) e nas rotas de evolução.
- Semana começa na segunda-feira. A frequência (`/progress/frequency`) já vem agrupada por semana.
- Personal acessando evolução de um aluno: enviar `?studentId=<id>` nas rotas `/progress/*`. O aluno não envia.
- Exercícios globais (seed) são somente leitura; só os do próprio usuário podem ser editados ou removidos. `videoUrl` aceita só link do YouTube.

## 5. Mapa de telas e rotas

| Tela | Perfil | Rotas | Specs |
|---|---|---|---|
| Cadastro e login | todos | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | 001 |
| Convites (gerar, listar, cancelar) | Personal | `POST /invites`, `GET /invites`, `DELETE /invites/{id}` | 002 |
| Meus alunos | Personal | `GET /students` (inclui `lastSessionAt`), `DELETE /students/{studentId}` | 002 |
| Informar código de convite / sair do vínculo | Aluno | `POST /invites/redeem`, `DELETE /link` | 002 |
| Catálogo de exercícios (filtro por grupo muscular, criar, editar, excluir) | todos | `GET/POST /exercises`, `PATCH/DELETE /exercises/{id}` | 003 |
| Lista de treinos | todos | `GET /workouts` | 004 |
| Montar ou editar treino (itens por dia da semana) | Personal; Aluno sem personal | `POST /workouts`, `GET/PUT/DELETE /workouts/{id}`, `PATCH /workouts/{id}/archive`, `.../unarchive` | 004 |
| Treino de hoje | Aluno | `GET /workouts/today` | 004, 005 |
| Execução do treino (série a série) | Aluno | `GET /sessions/current`, `POST /sessions`, `POST /sessions/{id}/sets`, `PATCH/DELETE /sessions/{id}/sets/{setId}`, `POST /sessions/{id}/finish`, `DELETE /sessions/{id}`, `GET /exercises/{id}/last-performance` | 005 |
| Resumo do treino finalizado | Aluno | resposta de `POST /sessions/{id}/finish` | 005 |
| Evolução (gráfico de carga e volume por exercício) | Aluno; Personal (por aluno) | `GET /progress/exercises`, `GET /progress/exercises/{exerciseId}` | 006 |
| Frequência semanal | Aluno; Personal (por aluno) | `GET /progress/frequency` | 006 |
| Histórico de treinos | Aluno; Personal (por aluno) | `GET /progress/sessions`, `GET /progress/sessions/{id}` | 006 |
| Painel do aluno (visão do personal) | Personal | `GET /students/{studentId}/overview` | 006 |

## 6. Ordem sugerida de desenvolvimento

1. Base: layout, `lib/api.ts`, contexto de autenticação, rotas protegidas por perfil.
2. Cadastro e login.
3. Vínculo (convite e lista de alunos).
4. Catálogo de exercícios.
5. Treinos (lista, montar, editar, arquivar) e treino de hoje.
6. Execução do treino. É a tela mais importante da demonstração.
7. Evolução, frequência e painel do personal.

## 7. Dados para desenvolver e demonstrar

Depois de `npm run prisma:seed` e `npm run prisma:seed:demo` (em `backend/`), use as contas abaixo. Senha de todas: `senha12345`.

| Conta | Para testar |
|---|---|
| `carlos@demo.repz.app` (Personal) | Lista de alunos, painel, montar treino. João parado há semanas |
| `beatriz@demo.repz.app` (Personal) | Convite `REPZDEMO` pronto |
| `maria@demo.repz.app` (Aluno) | Treino ABC seg/qua/sex, 17 sessões, recordes, gráficos |
| `joao@demo.repz.app` (Aluno) | Poucas sessões, frequência caindo |
| `ana@demo.repz.app` (Aluno sem personal) | Criar e editar treino próprio; resgatar `REPZDEMO` |

Rodar o seed demo de novo restaura o estado inicial.

## 8. Convenções

- TypeScript `strict`, componentes funcionais, estilos só com Tailwind, mobile-first.
- Tipos da API em `frontend/src/types/` espelhando o OpenAPI (nada de `any`).
- Todo estado de tela tem: carregando, vazio e erro.
- Textos em pt-BR. Commits semânticos (`feat:`, `fix:`, `docs:`...), um por tela.
- Mudança de contrato com o backend: avisar o Kauan, atualizar o `plan.md` e o `openapi.json`.
