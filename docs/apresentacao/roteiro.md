# Roteiro da apresentação (10 minutos)

Data: 04/11/2026 (quarta-feira). Slides: artefato "Repz · Apresentação" (10 slides). Falantes: Kauan (K) e Gustavo (G).

## Antes de começar

- Banco e API no ar; rodar `npm run prisma:seed:demo` na manhã da apresentação (as datas são relativas a hoje).
- Quarta-feira é dia de treino da Maria (costas e bíceps): o "treino de hoje" já vem preenchido.
- Abas abertas: slides, frontend logado como Carlos, janela anônima para a Maria, Swagger.
- Plano B se a demo falhar: Swagger (`/api/docs`) com as mesmas contas e os prints do manual.
- Contas (senha `senha12345`): carlos@demo.repz.app, maria@demo.repz.app, joao@demo.repz.app, ana@demo.repz.app.

## Tempo e fala

| Min | Slide | Quem | O que dizer |
|---|---|---|---|
| 0:00–0:30 | 1. Capa | K | Apresentar a dupla e o Repz em uma frase: registrar treinos e ver a evolução. |
| 0:30–1:30 | 2. Problema | G | Papel e planilha se perdem; personal sem visão; aluno sem referência da última carga. |
| 1:30–2:30 | 3. Solução | G | Montar, executar, evoluir. |
| 2:30–3:30 | 4. Perfis | K | Personal, aluno com personal, aluno sem personal. Convite por código de 8 caracteres, uso único, 7 dias. |
| 3:30–6:30 | 5. Demo | G (tela) e K (narra) | Ver roteiro da demo abaixo. |
| 6:30–7:30 | 6. Arquitetura | K | Monorepo; API Express/TypeScript/Prisma/PostgreSQL; Swagger; frontend consome a API. |
| 7:30–8:30 | 7. Processo SDD | K | Spec, plano, tarefas, código, commit; 7 features e 18 regras de negócio. |
| 8:30–9:15 | 8. Uso de IA | K | IA rascunha; nós decidimos, revisamos, rodamos e commitamos; prompts em DOCUMENTACAO_IA.md. |
| 9:15–9:45 | 9. Resultados | G | O que foi entregue e o estado do frontend. |
| 9:45–10:00 | 10. Encerramento | K e G | Próximos passos e perguntas. |

## Roteiro da demo (3 minutos)

1. **Personal (45 s).** Login como Carlos. Lista de alunos: Maria treina em dia, João está parado há semanas. Abrir a evolução da Maria: frequência semanal, volume e recordes.
2. **Aluno (1 min 45 s).** Login como Maria. Treino de hoje (costas e bíceps). Iniciar, registrar 2 ou 3 séries com cargas um pouco acima da última vez (o app mostra o desempenho anterior), finalizar. Mostrar o resumo com volume e recorde (PR).
3. **Sem personal (30 s).** Login como Ana: treino próprio. Mencionar que ela pode resgatar o convite `REPZDEMO` da Beatriz.

## Perguntas prováveis

- **Como o personal só vê os próprios alunos?** Recursos fora do escopo retornam 404 (regra RN-18).
- **O que é o recorde (PR)?** Maior carga do exercício no treino acima de todos os treinos finalizados anteriores; primeira vez ou carga igual não conta.
- **Como a IA foi usada?** Ver slide 8 e `DOCUMENTACAO_IA.md`.
- **Por que dois treinos abertos não são possíveis?** Há uma trava no banco para garantir um treino em andamento por aluno.
