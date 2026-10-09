# Protótipo das telas

Protótipo navegável de 6 telas mobile (390×844), feito antes do frontend para definir o fluxo e o layout. O frontend segue estas telas e usa a API descrita em `docs/api/openapi.json`.

- Protótipo: privado; (o dono precisa compartilhar o link)
- Prints: `docs/prototipos/01-login.png`, `02-treino-de-hoje.png`, `03-execucao-da-serie.png`, `04-resumo-e-recorde.png`, `05-evolucao.png` e `06-painel-personal.png`

Os dados do protótipo são de exemplo, inspirados nas contas de demonstração (`npm run prisma:seed:demo`). Nomes de exercícios e cargas são ilustrativos.

## Fluxo

```
Login -> Treino de hoje -> Execução da série -> Resumo e recorde -> Evolução
Painel do personal (fluxo separado, perfil PERSONAL)
```

## Telas

| # | Tela | Perfil | Rotas da API | Objetivo |
|---|---|---|---|---|
| 1 | Login e cadastro | Todos | `POST /auth/login`, `POST /auth/register` | Entrar ou criar conta, escolhendo personal ou aluno |
| 2 | Treino de hoje | Aluno | `GET /workouts/today`, `GET /exercises/{id}/last-performance` | Mostrar o treino do dia e a carga da última vez |
| 3 | Execução da série | Aluno | `POST /sessions`, `POST /sessions/{id}/sets` | Registrar carga e repetições série a série |
| 4 | Resumo e recorde | Aluno | `POST /sessions/{id}/finish` | Mostrar duração, volume total e recordes batidos |
| 5 | Evolução | Aluno | `GET /progress/exercises/{exerciseId}`, `GET /progress/frequency` | Gráfico de carga com recordes e frequência semanal |
| 6 | Painel do personal | Personal | `GET /students`, `GET /students/{id}/overview`, `POST /invites` | Ver quem treina, quem parou e convidar novos alunos |

## Decisões de layout

1. **Mobile-first.** O aluno usa o app na academia, em pé e com uma mão. Telas de 390 px, botões com no mínimo 44 px de altura e uma ação principal por tela.
2. **Ação principal sempre embaixo.** "Iniciar treino", "Registrar série" e "Finalizar treino" ficam ao alcance do polegar.
3. **"Da última vez" antes de registrar.** A carga anterior aparece no topo da execução, em destaque, porque a progressão de carga é o centro do produto.
4. **Uma série por vez.** O formulário de registro mostra só a série atual, com carga e repetições pré-preenchidas com o valor anterior; as séries já feitas ficam listadas acima e podem ser corrigidas.
5. **Recorde destacado.** O verde-limão marca recordes no resumo e no gráfico, e só serve para isso. O recorde sempre aparece também em texto ("Recorde pessoal"), nunca só pela cor.
6. **Resumo como recompensa.** Ao finalizar, o fundo escuro e os números grandes (duração, volume, recorde) dão um fechamento claro ao treino.
7. **Painel do personal orientado a quem parou.** A lista de alunos mostra o estado (em dia ou parado há N semanas) e as últimas 6 semanas de frequência, para o personal agir sem abrir cada aluno.
8. **Navegação por perfil.** Aluno: Hoje, Treinos, Evolução. Personal: Alunos, Treinos, Exercícios. O perfil é fixo desde o cadastro (RN-01).
9. **Identidade visual.** Fundo claro e cartões brancos para consulta; fundo escuro para login e resumo. Títulos em Oswald e texto em DM Sans, com contraste mínimo de 4,5:1.

## Fora do protótipo

Telas de montagem de treino, catálogo de exercícios, convites (lista e cancelamento) e histórico de sessões seguem os mesmos padrões e serão desenhadas no próprio frontend.
