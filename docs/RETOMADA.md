# Ponto de retomada do Tatame

## Estado vigente ao encerrar — 26/10/2026

Usuário aprovou vários professores e autorizou commit/push, solicitou resumo para Matheus e informou que continuará à noite. Implementação e testes concluídos (227 TypeScript, build/typecheck e Prisma); sem alterações de código após essa validação. SQLite local v11, Supabase v10 (migração 11 preparada e pendente). Os conjuntos anteriores estão nos commits db08478 e e58d87d. O último conjunto de professores está autorizado para sincronização: conferir git log/status e origin/codex/evolucao-tatame antes de repetir qualquer commit/push. As notas históricas de falta de aprovação/testes mais abaixo foram superadas. Resumo completo do dia em RESUMO_2026-10-26.md.

Próximos passos ao retomar: conferir Git, ambiente e feedback humano; combinar a aplicação externa da migração 11 antes de usar professores no Supabase. Não fazer merge na main, deploy, tag ou envio de mensagens a terceiros sem solicitação. Credenciais e dados privados continuam ignorados.

Atualizado em 26/10/2026. Este arquivo registra o estado do trabalho e deve ser atualizado antes de interromper por limite ou ao concluir etapas relevantes. Não contém credenciais.

## Fluxo obrigatório

- Ler AGENTS.md e consultar o Git antes de continuar.
- Usuário valida as alterações antes de commit/push. Em 26/10 autorizou sincronizar o conjunto em andamento após os testes; pedidos de comportamento posteriores continuam separados.
- Há muitas alterações pendentes de entregas anteriores: preservar todas, sem reset, limpeza, commit indiscriminado ou reescrita de migração já aplicada.
- Branch de trabalho: codex/evolucao-tatame. Tag v1.0.0 preservada. Conferir HEAD/remoto novamente antes de qualquer envio.

## Entregas integradas e aprovadas para sincronização

- Configuração de homologação, nome automático de turmas, retirada da seleção de alunos habituais no formulário e entrada administrativa local temporária.
- Saldo mensal de aulas, configuração e cobrança de aula adicional, menu Débitos e baixa manual.
- Responsável com vários dependentes, check-in pelo responsável quando menor sem celular, acesso próprio e transferências por maioridade, avisos/autorizações internos.
- Checkbox Incluir mais horários: nova turma começa desmarcada; edição com grade múltipla começa marcada; extras ocultos ficam no rascunho e não entram ao salvar desmarcado.
- Aluno pode editar nome, telefone e e-mail em Meu perfil. Troca de e-mail exige senha atual e atualiza ficha/login em transação, invalidando convites e outras sessões. Sem mudança em dados administrativos.
- E-mail automático e parabéns por WhatsApp estão planejados nas integrações complexas futuras, sem provedor conectado ou envio real.

Referências: ACESSO_ALUNO.md, RESPONSAVEIS.md, SALDO_MENSAL.md, DEBITOS.md, TURMAS.md, HOMOLOGACAO.md, PLANO_FUNCIONAL.md, PROCESSO.md e REVISAO_IA.md.

## Verificações já executadas

- Última suíte completa: 206 testes TypeScript aprovados; build/typecheck aprovados. Inclui perfil, catálogo e nova agenda.
- Último teste de formulário de horários: oito testes existentes e build aprovados, além de navegador isolado com preservação dos horários/IDs/vínculos.
- Python: última execução com 15 testes aprovados, incluindo faixa configurável. Configuração de homologação: três testes aprovados.
- SQLite local e Supabase de homologação estão na migração 10, com 22 tabelas de domínio no Supabase.
- Perfil: prova sintética restrita no Supabase concluiu operações e limpeza com hashes das 20 tabelas iguais ao início. Uma prova anterior de login limpou sessão já expirada pelo comportamento preexistente do login. A revisão automática bloqueou repetir esse fluxo global; alternativa segura retirou chamadas de login/ativação e limitou escritas aos IDs sintéticos. Não repetir o teste global em banco externo.
- Capturas dos testes fictícios estão em docs/screenshots. Fixtures temporárias ficam em .test-output, ignorada pelo Git. Não incluir ambientes, banco, segredos ou artefatos de QA em commits.

## Conjunto concluído nesta rodada

1. Cadastro configurável de faixas e cadastro dos graus dentro de cada faixa, ligados ao cadastro do aluno.
2. Remover páginas/funções de criação e exclusão de aulas avulsas/extras. Usar turmas com horários flexíveis, inclusive turma coringa.
3. Trocar o ícone do menu Mensalidades por $.

### Decisões confirmadas

- O usuário confirmou **manter a cobrança de aula adicional quando o plano esgota**, aplicável a aulas publicadas a partir de turmas. Isso é distinto de criar uma aula avulsa na agenda.
- Preservar aulas, presenças e cobranças já registradas. Retirar criação/exclusão de avulsas não autoriza apagar histórico nem converter registros antigos silenciosamente.
- Preservar faixas atuais ao introduzir o catálogo; permitir que a academia configure os graus de cada faixa, sem presumir regras de uma federação.
- Ícone $ deve identificar Mensalidades nos menus administrativo e do aluno; menu Débitos continua distinto.

### Estado exato desta etapa

Implementação concluída. Migração 10 aplicada no SQLite local (backup e 20 tabelas anteriores preservadas) e no Supabase de homologação (TLS verificado e preservação). Há 22 tabelas de domínio. Catálogo FaixaGraduacao/GrauFaixa, vínculos no Aluno, página/seletor/exibição e Python configurável implementados. Criação/exclusão de avulsas removidas; turma coringa publicada por grade; histórico e reservas legadas mantidos. Ícone DollarSign nos menus de Mensalidades.

Verificações da entrega: 206 testes TypeScript, 15 Python, 3 de configuração, build/typecheck, geração/validação Prisma aprovados. Prova externa restrita passou e foi limpa com hashes das 22 tabelas iguais ao início. Navegador fictício confirmou faixa/grau, atribuição ao aluno e publicação de 15h. Documentação em GRADUACOES.md/AULAS.md e registros de processo/IA.

O usuário autorizou commit/push após testes em 26/10/2026. Ao retomar, consultar Git e upstream para verificar se os comandos finais de sincronização já foram concluídos: o HEAD anterior ao conjunto era ce38de73973e967c0687a528699c30d653eab38d. Não repetir commit se já houver novo commit remoto correspondente. Pendências históricas de aprovação deste conjunto foram superadas por essa autorização.

## Novo pedido, separado da autorização anterior

O conjunto anterior foi enviado com sucesso em 26/10/2026: commit db08478d70f623f702ebb6dfda7d3819d75d6cf9, branch codex/evolucao-tatame; HEAD e ls-remote iguais no envio, tag v1.0.0 preservada. Nenhum merge/deploy/tag realizado.

Editar o nome de uma aula individual foi solicitado depois da autorização de commit. Implementado localmente em Aulas → Detalhes → Editar nome da aula e PATCH /api/aulas/:id/nome, exclusivo administrativo. Atualiza apenas titulo; preserva turma/grade/outras aulas, presença/check-in/débito. Sem migração. 210 testes TypeScript e build/typecheck passaram. Navegador fictício em 3337 confirmou salvar, descartar rascunho e manter outro encontro. API normal 3333 reiniciada com o novo código. Documentação e captura atualizadas. Próximo passo: usuário validar este incremento antes de novo commit/push. Não tratar a autorização anterior como aprovação automática desse comportamento novo. Não repetir as migrações/testes externos por implicação.

## Ambiente

Aplicação local usual: frontend 127.0.0.1:5173, API 127.0.0.1:3333, Python 127.0.0.1:8000. Conferir processos antes de reiniciar; não confiar em PID antigo. QA em memória costuma usar 3336 e é encerrado após conferir.

Configurações reais em .env/.env.homologacao são privadas e ignoradas pelo Git. Não mostrar seu conteúdo nem copiar senhas/URLs com credenciais para esta documentação. Não publicar/implantar, criar tag ou fazer merge por implicação da aprovação de testes.

## Atualização final desta rodada — 26/10/2026

Concluídos lápis no cartão (sem duplicação nos detalhes), confirmados sem previstos, remoção administrativa de check-in com ausência/saldo/financeiro preservado e máscara compartilhada. 222 testes TypeScript e build/typecheck aprovados; UI fictícia validou remoção, chamada e telefone. Usuário autorizou commit/push após testes. Conferir Git para verificar sincronização efetiva antes de repetir comandos. Base anterior db08478d70f623f702ebb6dfda7d3819d75d6cf9. Sem migração nova.

NOVO PEDIDO SEPARADO: mais de um professor por aula. Ainda não implementado neste checkpoint. Próximo passo: modelar lista de professores, tela de edição e herança/publicação conforme o código existente; preservar o professor histórico e explicar o alcance ao usuário. Implementar/testar/documentar e apresentar para validação antes de commit desse novo comportamento.

## Vários professores — implementação em andamento

Base sincronizada: e58d87dc832a81ad046de7df2971cd838ba5ce1a na codex/evolucao-tatame (HEAD/remoto iguais no envio; v1.0.0 preservada). Conjunto de aulas/check-ins/telefone já commitado/enviado, não repetir esse commit.

Novo pedido separado: vários professores em cada aula. Implementados AulaProfessor e migração 11 SQLite/PostgreSQL preparada, lista de nomes em AulaView, transação que atualiza lista e resumo professor, herança do professor da turma ao publicar, formulário em Detalhes → Editar professores com adicionar/remover nomes. Válido apenas no encontro; turma e outras aulas preservadas. Sem cadastrar contas/permissões para esses nomes.

Cinco testes novos passaram após corrigir fixture com horários sobrepostos e comparação de objeto SQLite. Build/typecheck e Prisma generate passaram. Primeira suíte revelou expectativas antigas da versão 10 e campo novo professores nas projeções: ajustadas para 11 sem retirar verificações de preservação. Falta execução final completa, validação de schema, aplicar migração local com backup/preservação e reiniciar API, conferir UI fictícia, atualizar documentação e apresentar para validação. Migração externa PostgreSQL ainda não aplicada. Não commitar esse pedido sem nova aprovação do usuário.

## Estado final para retomar — 26/10/2026

Entrega local de vários professores concluída: API, tabela/lista, migração 11, formulário nos detalhes e documentação em PROFESSORES_AULA.md. 227 testes TypeScript, build/typecheck, Prisma generate/validate aprovados; migração SQLite real 11 com backup, preservação das 22 tabelas anteriores e vínculos válidos. API normal na sessão 57947, porta 3333; frontend 5173 e analytics 8000. Supabase continua na migração 10: script PostgreSQL 11 preparado, sem execução externa. Nenhuma credencial nova ou conta de professor.

QA fictícia atual: porta 3340, sessão 16438, aba 17 com dois professores na aula das 15h; capturas novas na documentação. Portas/abas anteriores 3336–3338 podem conter testes do usuário: não apagar nem reiniciar indiscriminadamente. Conferir processos/estados antes de retomar. O conjunto anterior foi enviado no commit e58d87dc832a81ad046de7df2971cd838ba5ce1a; o incremento de professores permanece SEM COMMIT/SEM PUSH, aguardando validação por ter sido pedido após a aprovação. Não confundir com as notas de pendência de testes acima, já superadas por esta verificação final.
