# 006 · Evolução

## Objetivo

Mostrar ao aluno e ao personal a evolução de cargas, repetições e frequência a partir do histórico de treinos.

## User stories

- Como aluno, quero ver a evolução de carga e repetições de cada exercício.
- Como aluno, quero ver meus recordes pessoais (PR) e o volume por sessão.
- Como aluno, quero saber quantas vezes treinei por semana.
- Como personal, quero ver o histórico e a evolução de cada aluno vinculado.
- Como personal, quero identificar quem está treinando e quem parou.

## Regras de negócio

RN-06, RN-15, RN-16, RN-17, RN-18 (ver `docs/arquitetura.md`).

## Métricas

| Métrica | Definição |
|---|---|
| Carga máxima por sessão | Maior `weightKg` do exercício na sessão |
| Repetições na carga máxima | Maior `reps` entre as séries com a carga máxima da sessão |
| Volume por exercício e por sessão | Soma de `weightKg × reps` |
| PR de carga | Série cuja carga supera a maior carga anterior do exercício |
| Variação | Diferença percentual entre a última sessão e a anterior (carga máxima e volume) |
| Frequência semanal | Sessões finalizadas por semana, últimas 8 semanas |
| Última sessão | Data da sessão finalizada mais recente |

## Requisitos funcionais

- RF-01: Série temporal de um exercício (carga máxima, repetições, volume por sessão) com PRs marcados.
- RF-02: Lista de exercícios com histórico, com variação da última sessão.
- RF-03: Histórico de sessões com detalhe das séries.
- RF-04: Frequência semanal.
- RF-05: Painel do personal por aluno (visão geral).
- RF-06: Todas as consultas de aluno aceitam acesso do personal vinculado (RN-18).

## Critérios de aceitação

- [ ] Aluno vê somente os próprios dados; personal vê somente alunos vinculados a ele.
- [ ] Após trocar de personal, o antigo recebe 403/404 e o novo vê todo o histórico (RN-06).
- [ ] A série temporal vem em ordem cronológica e só considera sessões finalizadas.
- [ ] O PR aparece marcado no ponto correto da série; a primeira sessão do exercício não é PR.
- [ ] Volume e variação batem com cálculo manual de um caso de exemplo.
- [ ] Frequência retorna as 8 semanas, com zero nas semanas sem treino.
- [ ] Aluno sem histórico recebe listas vazias (200), não erro.
- [ ] Histórico de sessões é paginado (`limit`, `offset`).

## Fora de escopo

1RM estimado (extra se sobrar tempo), comparação entre alunos, exportação de relatórios, metas.
