# Documentação do Uso de IA

Projeto **Repz**. Registro de como a IA foi usada, dos critérios de aceitação do código gerado e dos prompts principais.

## 1. Ferramentas de IA

| Ferramenta | Uso |
|---|---|
| Claude (Anthropic) | Planejamento SDD, especificações, geração de código e documentação |

## 2. Postura de trabalho

A dupla atua como **revisora de código** da IA. Nada é commitado sem leitura e entendimento. Cada funcionalidade segue: spec → plan → tasks → código → revisão.

## 3. Critérios de aceitação do código gerado

Um trecho gerado por IA só entra no repositório se:

1. Atende aos critérios de aceitação da `spec.md` da funcionalidade.
2. Respeita a [constituição](docs/specs/constitution.md) (camadas, validação com Zod, erros padronizados, TypeScript estrito).
3. Não contém segredos nem dados reais; usa variáveis de ambiente.
4. Aplica as regras de negócio de [`docs/arquitetura.md`](docs/arquitetura.md) (RN-xx), incluindo autorização por perfil.
5. Foi executado e testado manualmente (Thunder Client ou interface) nos cenários da spec.
6. Foi lido por quem commita, que consegue explicar o que o código faz.

## 4. Registro por funcionalidade

| Problema / Requisito | Prompts Utilizados | Refinamento (Iterações) | Decisão de Engenharia |
|---|---|---|---|
| **Planejamento e especificação (SDD)**: definir escopo, stack, regras de negócio, modelo de dados e specs antes de codar | Prompt inicial: "Ideia: Um aplicativo de academia, onde o personal cria o treino para o aluno. E o aluno consegue visualizar o treino. Tambem caso o aluno nao tenha personal podera montar seu proprio treino. Este app guardara as informações sobre o treino realizado anteriormente, assim o aluno e o personal saberão como esta sendo a evolução de repetições e progressao de cargas. [...] Preciso que antes de você gerar você crie um plano. [...] Qualquer informação necessária me pergunte, não deduza nada." Seguido de 3 rodadas de respostas da dupla sobre perfis, vínculo, exercícios, execução e métricas. | A IA não gerou nada de imediato: devolveu um esboço e 17 perguntas, depois mais 8 e 6. Apontou o conflito entre a stack pedida (NestJS/TypeORM) e a stack obrigatória do PDF (Express/Prisma); a dupla decidiu seguir o PDF. | Perguntas antes de especificar evitam retrabalho. Regras de negócio consolidadas num único arquivo (RN-xx) para backend e frontend não divergirem. Convite de uso único com expiração de 7 dias escolhido em vez de busca pública, por privacidade dos personals. |
| **000 · Fundação do backend**: Docker Compose com PostgreSQL 16, API Express + TypeScript com nodemon, Prisma, tratamento de erros padronizado, `/api/health` e Swagger (tarefas 000.2 a 000.6) | Pedido: gerar a fundação do backend conforme `spec.md` e `plan.md` da 000, seguindo a constituição. Decisões informadas por mim à IA: porta do backend 3001, do frontend 8080, do PostgreSQL 5432, npm como gerenciador, Node 22. *(Kauan: complemente com os prompts exatos que usar ao revisar o código.)* | A IA testou a API antes de entregar (health, 404, JSON inválido, CORS, Swagger, banco fora do ar com retorno 503, build de produção) e identificou que a versão atual do Prisma (7.x) exige `prisma.config.ts`, adaptador `pg` e client gerado em pasta própria, diferente do Prisma 6 que muitos tutoriais mostram. Também ajustou o `plan.md` (dependências de autenticação ficam para a 001) e acrescentou o campo opcional `details` ao formato de erro. | Express 5 (erros em rotas assíncronas chegam ao `errorHandler` sem `try/catch`), projeto em ESM com `NodeNext`, mensagens do Zod em pt-BR, `postinstall` gera o client do Prisma, `.env` validado com Zod na subida (falha rápida com mensagem clara). Não foi possível testar `docker compose up` e `prisma migrate` no ambiente da IA (sem Docker e sem acesso aos binários do Prisma): devem ser validados na máquina do Kauan. |
| **001 · Autenticação (backend)**: cadastro como personal ou aluno, login com JWT, `/auth/me` e middlewares `authenticate` e `requireRole` (tarefas 001.1 a 001.8) | Pedido: gerar o backend da 001 conforme `spec.md` e `plan.md`. Regras já definidas na spec: e-mail e senha, perfil escolhido no cadastro, e-mail único, senha mínima de 8 caracteres, mensagem genérica no login inválido. *(Kauan: complemente com os prompts exatos que usar.)* | A IA testou os critérios de aceitação contra um PostgreSQL real (cadastro, e-mail repetido em outra caixa, senha curta, perfil inválido, login certo e errado, token ausente, adulterado, expirado e com segredo errado, `/auth/me` com e sem personal, `requireRole`). Encontrou duas lacunas na spec e as corrigiu: o bcrypt ignora o que passa de 72 bytes da senha (limite de 72 caracteres adicionado) e o cadastro simultâneo do mesmo e-mail (tratado com a restrição de unicidade do banco, retornando 409). | JWT com `sub` e `role`, expiração configurável por `JWT_EXPIRES_IN`; e-mail normalizado (minúsculas e sem espaços); login compara com um hash fictício quando o e-mail não existe, para não revelar quais e-mails estão cadastrados pelo tempo de resposta; cada módulo tem o seu arquivo `*.docs.ts` com o Swagger. A migration (`prisma migrate dev`) não pôde ser executada no ambiente da IA: deve ser gerada na máquina do Kauan e commitada. |

> Adicionar uma linha por funcionalidade conforme forem implementadas (000 a 006).
