# 002 · Vínculo personal-aluno

## Objetivo

Permitir que um aluno se vincule a um personal por **código de convite**, e que ambos possam encerrar o vínculo.

## User stories

- Como personal, quero gerar um código de convite para enviar ao meu aluno.
- Como personal, quero ver e cancelar meus convites pendentes.
- Como aluno, quero informar o código recebido para me vincular ao meu personal.
- Como aluno, quero trocar de personal ou sair do vínculo.
- Como personal, quero ver minha lista de alunos e remover um aluno.

## Regras de negócio

RN-03, RN-04, RN-05, RN-06, RN-09, RN-18 (ver `docs/arquitetura.md`).

## Requisitos funcionais

- RF-01: Personal gera convite (código único, expira em 7 dias, uso único).
- RF-02: Personal lista seus convites com status (`ACTIVE`, `USED`, `EXPIRED`).
- RF-03: Personal cancela convite ainda ativo.
- RF-04: Aluno resgata convite: cria o vínculo; se já tinha personal, o anterior é encerrado.
- RF-05: Ao vincular, os treinos próprios do aluno ficam somente leitura (RN-09). Regra aplicada na funcionalidade 004, a partir do `personalId`.
- RF-06: Aluno ou personal encerra o vínculo (`personalId` volta a nulo); os treinos próprios voltam a ser editáveis (RN-09, aplicado na 004).
- RF-07: Personal lista seus alunos.

## Critérios de aceitação

- [ ] Só `PERSONAL` gera convites; `STUDENT` recebe 403.
- [ ] Só `STUDENT` resgata convites; `PERSONAL` recebe 403.
- [ ] Código inválido retorna 404 `INVITE_NOT_FOUND`.
- [ ] Código expirado retorna 422 `INVITE_EXPIRED`.
- [ ] Código já usado retorna 422 `INVITE_ALREADY_USED`.
- [ ] Aluno que resgata convite do personal ao qual já está vinculado recebe 422 `ALREADY_LINKED`, sem consumir o convite.
- [ ] Dois resgates simultâneos do mesmo código: só um tem sucesso.
- [ ] Resgate bem-sucedido define `personalId` do aluno e marca o convite como usado.
- [ ] Aluno já vinculado a outro personal troca de vínculo ao resgatar um novo convite.
- [ ] Vincular e desvincular apenas alteram `personalId` (o efeito sobre os treinos próprios é verificado na 004).
- [ ] Aluno sem personal que chama `DELETE /link` recebe 422 `NO_PERSONAL`.
- [ ] Ao desvincular, o personal antigo deixa de acessar o aluno (403/404).
- [ ] Personal só vê alunos vinculados a ele.

## Fora de escopo

Notificações, e-mail do convite, vínculo com várias pessoas.
