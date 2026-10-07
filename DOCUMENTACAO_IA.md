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

> Adicionar uma linha por funcionalidade conforme forem implementadas (000 a 006).
