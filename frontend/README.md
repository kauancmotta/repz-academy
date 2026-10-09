# Repz — Frontend

Interface web do Repz (Next.js 15 + React 19 + TypeScript estrito + Tailwind CSS + Recharts), mobile-first e em português do Brasil. Consome a API do backend em `../backend`.

## Como rodar

Pré-requisito: backend e banco no ar (veja o README da raiz).

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm install
npm run dev                  # http://localhost:8080
```

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento na porta 8080 |
| `npm run build` | build de produção (também checa os tipos) |
| `npm run start` | serve o build na porta 8080 |
| `npm run typecheck` | `tsc --noEmit` |

O backend só aceita requisições do `FRONTEND_URL` (padrão `http://localhost:8080`). Não mude a porta sem mudar essa variável no `.env` do backend.

## Contas de demonstração

Depois de `npm run prisma:seed` e `npx tsx prisma/seed-demo.ts` no backend (senha `senha12345`):
`carlos@demo.repz.app` (personal), `maria@demo.repz.app` (aluna com personal), `ana@demo.repz.app` (aluna sem personal).

## Estrutura

```
src/
  app/                      rotas (App Router)
    login, register         telas públicas
    (app)/                  telas autenticadas (layout com guarda de rota + navegação)
      hoje, sessao, resumo/[id]       aluno: treino do dia, execução, resumo
      evolucao, evolucao/[exerciseId] gráficos de carga e frequência
      treinos, treinos/novo, treinos/[id]   lista, editor, arquivar
      alunos, alunos/[id]             personal: alunos, convites, visão geral
      exercicios                      catálogo
      conta                           vínculo/desvínculo e sair
  components/               ui.tsx (botões, campos, cartões), AppShell, WorkoutEditor, charts
  lib/
    api.ts                  ÚNICO ponto de acesso HTTP (token, erro tipado, 401 → logout)
    auth.tsx                contexto de autenticação
    types.ts                tipos espelhando docs/api/openapi.json
    format.ts               kg, datas (America/Sao_Paulo), rótulos pt-BR
    useFetch.ts             hook de carregamento
```

## Decisões que valem na apresentação

- **Um único cliente HTTP** (`lib/api.ts`): nenhuma tela chama `fetch` direto. Erros viram `ApiError` com `code` e `message` do backend; 401 derruba a sessão e volta ao login.
- **Navegação por perfil**: Aluno vê Hoje / Treinos / Evolução; Personal vê Alunos / Treinos / Exercícios. Rotas autenticadas são protegidas no layout `(app)`.
- **Execução do treino** (`/sessao`): uma sessão aberta por aluno (`GET /sessions/current`), carga e repetições pré-preenchidas com a última performance, correção/exclusão de séries, descanso com contagem regressiva e finalização com resumo de recordes.
- **Treinos arquivados / de personal são somente leitura** na interface, espelhando as regras `readOnly` e `WORKOUT_ARCHIVED` da API.
- **Carga**: aceita `57,5` ou `57.5`, até 2 casas decimais; exibida sempre com vírgula.
- Paleta e tipografia seguem o protótipo (`docs/prototipos/prototipo.md`): fundo `#F4F3EE`, grafite `#14171A`, destaque `#C6F432`, Oswald nos títulos e DM Sans no texto.
