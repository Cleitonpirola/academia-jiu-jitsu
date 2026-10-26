# Ponto de retomada do Tatame

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

Editar o nome de uma aula individual foi solicitado depois da autorização de commit. Ainda não implementado neste ponto. Codex comunicou que concluiria primeiro o commit já autorizado e que esse incremento ficaria separado para validação. Próximos passos: adicionar edição individual do título sem renomear turma/grade/outras aulas, testar preservação de presença/check-in/débitos, atualizar docs e apresentar para validação antes de novo commit. Não tratar a autorização anterior como aprovação automática desse comportamento novo.

## Ambiente

Aplicação local usual: frontend 127.0.0.1:5173, API 127.0.0.1:3333, Python 127.0.0.1:8000. Conferir processos antes de reiniciar; não confiar em PID antigo. QA em memória costuma usar 3336 e é encerrado após conferir.

Configurações reais em .env/.env.homologacao são privadas e ignoradas pelo Git. Não mostrar seu conteúdo nem copiar senhas/URLs com credenciais para esta documentação. Não publicar/implantar, criar tag ou fazer merge por implicação da aprovação de testes.
