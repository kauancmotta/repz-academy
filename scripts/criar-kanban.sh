#!/usr/bin/env bash
#
# Cria o Kanban do Repz no GitHub a partir dos arquivos docs/specs/*/tasks.md.
#
# O que o script faz:
#   1. cria os rótulos (backend, frontend, tipos de commit);
#   2. cria um marco (milestone) por funcionalidade, com a data do cronograma;
#   3. cria um projeto no GitHub Projects e o vincula ao repositório;
#   4. cria uma issue para cada tarefa dos tasks.md e a adiciona ao projeto;
#   5. fecha as issues das tarefas já concluídas (o projeto move para "Done" ao fechar).
#
# Pré-requisitos:
#   - GitHub CLI instalado (https://cli.github.com) e logado:  gh auth login
#   - Permissão para projetos:                                  gh auth refresh -s project
#   - Rodar dentro do clone do repositório, com o remoto "origin" apontando para o GitHub.
#
# Uso:
#   GUSTAVO_GH=usuario-do-gustavo bash scripts/criar-kanban.sh
#
# Variáveis opcionais:
#   DRY_RUN=1        apenas mostra o que seria criado, sem chamar o GitHub
#   GUSTAVO_GH       usuário do GitHub do Gustavo (responsável pelas tarefas de frontend)
#   KAUAN_GH         usuário do GitHub do Kauan (padrão: kauancmotta)
#   PROJECT_NUMBER   número de um projeto já criado (se informado, o script não cria outro)
#   PROJECT_TITLE    título do projeto novo (padrão: Repz Academy)
#   DONE_TASKS       ids das tarefas já concluídas, separados por espaço
#   FORCE=1          roda mesmo que o repositório já tenha issues criadas por este script
#
set -euo pipefail

DRY_RUN="${DRY_RUN:-0}"
KAUAN_GH="${KAUAN_GH:-kauancmotta}"
GUSTAVO_GH="${GUSTAVO_GH:-GustavoMadureiraDeSouza}"
PROJECT_TITLE="${PROJECT_TITLE:-Repz Academy}"
PROJECT_NUMBER="${PROJECT_NUMBER:-}"
FORCE="${FORCE:-0}"
DONE_TASKS="${DONE_TASKS:-000.1 000.2 000.3 000.4 000.5 000.6 000.7 001.1 001.2 001.3 001.4 001.5 001.6 001.7 001.8 002.1 002.2 002.3 002.4 002.5 002.6 002.7 002.8 003.1 003.2 003.3 003.4 003.5 003.6 004.1 004.2 004.3 004.4 004.5 004.6 004.7 004.8 004.9 005.1 005.2 005.3 005.4 005.5 005.6 005.7 006.1 006.2 006.3 006.4 006.5 006.6 006.7 006.8 005.11}"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# ---------- funções auxiliares ----------

trim() { sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'; }

run() {
  # Em simulação, só mostra o comando.
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '  [simulação] gh'; printf ' %q' "$@"; printf '\n'
    return 0
  fi
  gh "$@"
}

milestone_info() {
  # Imprime "título|data limite" conforme o cronograma de docs/plano-do-projeto.md
  case "$1" in
    000-fundacao)     echo "000 · Fundação|2026-10-11" ;;
    001-autenticacao) echo "001 · Autenticação|2026-10-11" ;;
    002-vinculo)      echo "002 · Vínculo|2026-10-18" ;;
    003-exercicios)   echo "003 · Exercícios|2026-10-18" ;;
    004-treinos)      echo "004 · Treinos|2026-10-25" ;;
    005-execucao)     echo "005 · Execução|2026-10-25" ;;
    006-evolucao)     echo "006 · Evolução|2026-11-01" ;;
    *)                echo "$1|2026-11-04" ;;
  esac
}

# ---------- verificações ----------

if [[ "$DRY_RUN" != "1" ]]; then
  command -v gh >/dev/null || { echo "Instale o GitHub CLI: https://cli.github.com"; exit 1; }
  gh auth status >/dev/null 2>&1 || { echo "Faça login primeiro: gh auth login"; exit 1; }
  REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
  OWNER="${REPO%%/*}"
else
  REPO="kauancmotta/repz-academy"
  OWNER="kauancmotta"
fi

echo "Repositório: $REPO"
[[ "$DRY_RUN" == "1" ]] && echo "MODO SIMULAÇÃO: nada será criado no GitHub."

# Só é possível atribuir issues a quem já é colaborador do repositório (convite aceito).
if [[ -n "$GUSTAVO_GH" && "$DRY_RUN" != "1" ]]; then
  if ! gh api "repos/$REPO/collaborators/$GUSTAVO_GH" --silent 2>/dev/null; then
    echo "Aviso: $GUSTAVO_GH ainda não é colaborador de $REPO (ou não aceitou o convite)."
    echo "       As tarefas dele serão criadas sem responsável; atribua depois pelo GitHub."
    GUSTAVO_GH=""
  fi
fi
[[ -z "$GUSTAVO_GH" ]] && echo "Aviso: sem usuário do Gustavo; as tarefas dele ficarão sem responsável atribuído."

if [[ "$DRY_RUN" != "1" && "$FORCE" != "1" ]]; then
  existing="$(gh issue list --state all --label sdd --limit 1 --json number --jq 'length')"
  if [[ "$existing" != "0" ]]; then
    echo "Já existem issues criadas por este script (rótulo 'sdd'). Para rodar de novo: FORCE=1 $0"
    exit 1
  fi
fi

# ---------- 1. rótulos ----------

echo
echo "== Rótulos =="
create_label() { run label create "$1" --color "$2" --description "$3" --force; }
create_label sdd      "6f42c1" "Tarefa gerada a partir dos tasks.md (SDD)"
create_label backend  "0e8a16" "Parte do backend (Kauan)"
create_label frontend "1d76db" "Parte do frontend (Gustavo)"
create_label feat     "a2eeef" "Nova funcionalidade"
create_label chore    "cfd3d7" "Configuração e infraestrutura"
create_label docs     "fbca04" "Documentação"
create_label fix      "d93f0b" "Correção"
create_label refactor "c5def5" "Refatoração"

# ---------- 2. marcos ----------

echo
echo "== Marcos (um por funcionalidade) =="
for tasks_file in docs/specs/*/tasks.md; do
  feature="$(basename "$(dirname "$tasks_file")")"
  IFS='|' read -r title due <<<"$(milestone_info "$feature")"
  echo "- $title (até $due)"
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '  [simulação] gh api repos/%s/milestones -f title=%q\n' "$REPO" "$title"
  else
    gh api --method POST "repos/$REPO/milestones" \
      -f title="$title" \
      -f description="Funcionalidade $feature (docs/specs/$feature)" \
      -f due_on="${due}T23:59:59Z" >/dev/null 2>&1 || echo "  (marco já existe, seguindo)"
  fi
done

# ---------- 3. projeto ----------

echo
echo "== Projeto (GitHub Projects) =="
if [[ -z "$PROJECT_NUMBER" ]]; then
  if [[ "$DRY_RUN" == "1" ]]; then
    PROJECT_NUMBER="N"
    echo "  [simulação] gh project create --owner $OWNER --title \"$PROJECT_TITLE\""
  else
    PROJECT_NUMBER="$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json --jq .number)" || {
      echo "Não foi possível criar o projeto. Provavelmente falta a permissão de projetos:"
      echo "  gh auth refresh -s project"
      echo "Depois rode de novo (use FORCE=1 se as issues já tiverem sido criadas)."
      exit 1
    }
    gh project link "$PROJECT_NUMBER" --owner "$OWNER" --repo "$REPO"
  fi
  echo "Projeto criado: nº $PROJECT_NUMBER"
else
  echo "Usando o projeto existente nº $PROJECT_NUMBER"
fi

# ---------- 4 e 5. issues ----------

echo
echo "== Issues =="
created=0
closed=0

for tasks_file in docs/specs/*/tasks.md; do
  feature="$(basename "$(dirname "$tasks_file")")"
  IFS='|' read -r milestone _ <<<"$(milestone_info "$feature")"

  # Linhas de tabela no formato: | 001.3 | Tarefa | Responsável | `commit` |
  while IFS='|' read -r _ id title who commit _; do
    id="$(trim <<<"$id")"; title="$(trim <<<"$title")"
    who="$(trim <<<"$who")"; commit="$(trim <<<"$commit" | tr -d '`')"

    # responsável -> rótulos e usuários
    labels="sdd"; assignees=()
    case "$who" in
      Kauan)   labels+=",backend";          assignees+=("$KAUAN_GH") ;;
      Gustavo) labels+=",frontend";         [[ -n "$GUSTAVO_GH" ]] && assignees+=("$GUSTAVO_GH") ;;
      Dupla)   labels+=",backend,frontend"; assignees+=("$KAUAN_GH"); [[ -n "$GUSTAVO_GH" ]] && assignees+=("$GUSTAVO_GH") ;;
    esac

    # tipo do commit -> rótulo
    ctype="${commit%%:*}"
    case "$ctype" in feat|chore|docs|fix|refactor) labels+=",$ctype" ;; esac

    issue_title="[$id] $title"
    body="$(cat <<EOF
**Funcionalidade:** $feature
**Responsável:** $who
**Commit sugerido:** \`${commit:-—}\`

Especificação: [\`docs/specs/$feature\`](https://github.com/$REPO/tree/main/docs/specs/$feature)

### Definição de pronto
- [ ] Critérios de aceitação da \`spec.md\` atendidos
- [ ] Commit semântico feito com o usuário de quem executou a tarefa
- [ ] Uso de IA registrado no \`DOCUMENTACAO_IA.md\` (quando houver)
EOF
)"

    args=(issue create --title "$issue_title" --body "$body" --label "$labels" --milestone "$milestone")
    for a in "${assignees[@]:-}"; do [[ -n "$a" ]] && args+=(--assignee "$a"); done

    if [[ "$DRY_RUN" == "1" ]]; then
      state="aberta"; [[ " $DONE_TASKS " == *" $id "* ]] && state="CONCLUÍDA (fechada)"
      printf '  %-9s %-60s %-30s %s\n' "[$id]" "${title:0:58}" "$labels" "$state"
      created=$((created + 1))
      [[ "$state" != "aberta" ]] && closed=$((closed + 1))
      continue
    fi

    url="$(gh "${args[@]}")"
    created=$((created + 1))
    gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$url" >/dev/null

    if [[ " $DONE_TASKS " == *" $id "* ]]; then
      gh issue close "$url" --reason completed --comment "Tarefa concluída." >/dev/null
      closed=$((closed + 1))
      echo "  $issue_title  (concluída)"
    else
      echo "  $issue_title"
    fi

    sleep 2   # evita o limite de criação de conteúdo do GitHub
  done < <(grep -E '^\| [0-9]{3}\.[0-9]+ \|' "$tasks_file")
done

echo
echo "Pronto: $created issues ($closed já concluídas, $((created - closed)) abertas)."
if [[ "$DRY_RUN" != "1" ]]; then
  echo "Abra o projeto:  gh project view $PROJECT_NUMBER --owner $OWNER --web"
  echo "Depois siga docs/kanban.md (criar a visão de quadro e tirar o primeiro print)."
fi
