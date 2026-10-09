# 006 · Conferência manual dos cálculos de evolução

Tarefa 006.7. Os números abaixo foram calculados **à mão** antes de consultar a API. Os dados foram inseridos direto no banco com datas controladas e comparados com a resposta das rotas `/api/progress/*` e `/api/students/:id/overview`. Todos os valores bateram.

Aluna de exemplo: Maria. Horários no fuso America/Sao_Paulo (UTC-3).

## Dados

Exercício **E1** (ex.: Supino reto com barra), carga × repetições por série:

| Sessão | Finalizada em | Séries do E1 |
|---|---|---|
| a | seg 14/09 10:00 | 40×10, 40×10, 40×8 |
| b | seg 21/09 10:00 | 42,5×8, 42,5×8, 40×10 |
| c | seg 28/09 10:00 | 42,5×10, 40×10 |
| d | seg 05/10 10:00 | 45×6, 42,5×8 |

Exercício **E2**:

| Sessão | Finalizada em | Séries do E2 |
|---|---|---|
| e | ter 22/09 10:00 | 20×10 |
| f | **dom 27/09 23:30** | 20×10 |
| d | seg 05/10 10:00 | 22,5×10 |

Também existem, e **devem ser ignoradas**: uma sessão em andamento com 100 kg no E1 e uma sessão de outro aluno com 80 kg.

## Cálculo manual do E1

| Sessão | Carga máx. | Reps na carga máx. | Volume (carga × reps somadas) | Recorde (PR)? |
|---|---|---|---|---|
| a | 40 | 10 | 400 + 400 + 320 = **1120** | Não (primeira sessão) |
| b | 42,5 | 8 | 340 + 340 + 400 = **1080** | **Sim** (42,5 > 40) |
| c | 42,5 | 10 | 425 + 400 = **825** | Não (igual a 42,5) |
| d | 45 | 6 | 270 + 340 = **610** | **Sim** (45 > 42,5) |

- Recorde atual: **45 kg × 6** (sessão d).
- Variação da carga (d vs. c): (45 − 42,5) ÷ 42,5 = 5,88 % → **+5,9 %**.
- Variação do volume (d vs. c): (610 − 825) ÷ 825 = −26,06 % → **−26,1 %**.

## Cálculo manual do E2

| Sessão | Carga máx. | Volume | PR? |
|---|---|---|---|
| e | 20 | 200 | Não (primeira) |
| f | 20 | 200 | Não (igual) |
| d | 22,5 | 225 | **Sim** (22,5 > 20) |

Variação (d vs. f): carga +12,5 %, volume +12,5 %.

## Sessões (histórico) e volume da sessão d

Ordem da mais recente para a mais antiga: d, c, f, e, b, a (**6 sessões**).
Volume da sessão d = 270 + 340 + 225 = **835 kg**, com 3 séries. Recordes da sessão d: E1 (45 > 42,5) e E2 (22,5 > 20).

## Frequência semanal (8 semanas, a semana começa na segunda)

Hoje é quinta 08/10, então a semana atual começa em 05/10.

| Semana (segunda) | 17/08 | 24/08 | 31/08 | 07/09 | 14/09 | 21/09 | 28/09 | 05/10 |
|---|---|---|---|---|---|---|---|---|
| Sessões | 0 | 0 | 0 | 0 | 1 (a) | **3** (b, e, f) | 1 (c) | 1 (d) |

A sessão **f** foi finalizada no domingo 27/09 às 23:30 (horário de Brasília), que em UTC já é segunda 28/09 02:30. Ela conta na semana de **21/09**, por causa do fuso. Se o cálculo usasse UTC, daria 2 e 2 nas semanas de 21/09 e 28/09.

## Resultado da conferência

| Item | Esperado (à mão) | API |
|---|---|---|
| E1: cargas máximas | 40, 42,5, 42,5, 45 | igual |
| E1: repetições na carga máxima | 10, 8, 10, 6 | igual |
| E1: volumes | 1120, 1080, 825, 610 | igual |
| E1: PRs | não, sim, não, sim | igual |
| E1: variação carga / volume | +5,9 % / −26,1 % | igual |
| E2: cargas, volumes, PRs | 20, 20, 22,5 / 200, 200, 225 / não, não, sim | igual |
| Sessão em andamento e de outro aluno | ignoradas | ignoradas |
| Histórico | 6 sessões, ordem d, c, f, e, b, a | igual |
| Volume da sessão d | 835 | igual |
| Frequência | 0, 0, 0, 0, 1, 3, 1, 1 | igual |
| Visão geral do personal | 6 sessões nos últimos 30 dias; 3 recordes recentes | igual |

As funções que fazem esses cálculos estão em `backend/src/modules/progress/calculations.ts` (puras, sem acesso ao banco).
