# Processo

1. Leitura do desafio técnico e definição da stack com o usuário.
2. O usuário criou docs/ARQUITETURA.md, corrigiu a extensão .md.txt e registrou entidades, relações e campos de aluno.
3. Mudança autorizada de prioridade: entregar MVP e revisar explicações depois.
4. Revisão arquitetural, definição de contratos e persistência SQL; implementação das telas, API, analytics e integração configurável.
5. Validação automatizada e manual registrada em REVISAO_IA.md.

Resultado do MVP: cinco áreas da interface (Visão geral, Alunos, Mensalidades, Presenças, Inteligência), API HTTP real, banco SQL persistente, 20 alunos fictícios no seed e analytics FastAPI/Pandas conectado. Comandos de execução, configuração e testes estão no README. O usuário valida as telas antes da retomada da mentoria por módulos.

Dados de demonstração são fictícios e são gerados somente no banco local vazio. Para Supabase, o seed precisa ser executado explicitamente. A aplicação não publica dados ou código em serviços externos automaticamente.

## Fluxo permanente de alterações e atualização do GitHub — 19/10/2026

O usuário definiu que toda alteração deve ser validada por ele antes de commit e envio. Após essa aprovação, o próprio Codex fica responsável por registrar e subir as mudanças aprovadas, sem transferir a execução dos comandos ao usuário ou pedir outra autorização para o mesmo envio.

### Antes da aprovação

1. Conferir branch, remoto e alterações já existentes.
2. Implementar o pedido e atualizar a documentação relacionada.
3. Executar as verificações proporcionais à mudança. Para documentação, revisar conteúdo e diff; testes de aplicação só são necessários se houver uma razão concreta.
4. Apresentar o que mudou, os arquivos envolvidos, a justificativa, os resultados das verificações e uma forma de validação pelo usuário.
5. Aguardar a aprovação explícita desse conjunto. A permissão geral para testes não permite antecipar commit ou push.

### Depois da aprovação

1. Revisar o diff final e conferir se corresponde ao conjunto aprovado.
2. Selecionar somente os arquivos e trechos aprovados, preservando pendências de outros trabalhos.
3. Criar um commit coeso com título claro e descrição de mudanças relevantes, motivo e validação.
4. Fazer push normal para a branch de trabalho no remoto correspondente.
5. Confirmar o envio e informar ao usuário o hash, a branch e o link para o commit no GitHub.

Se o envio falhar, registrar claramente o que ficou salvo localmente e o que ainda não chegou ao GitHub. Não apresentar uma sincronização como concluída sem confirmação. Não usar force push para resolver uma divergência.

Nova mudança de comportamento ou escopo depois da aprovação precisa ser apresentada para validação antes de entrar no commit. A aprovação de commit/push não autoriza automaticamente merge em outra branch, release ou implantação.

### Documentação e versões

README, arquitetura, prompts, revisão de IA e processo devem acompanhar as mudanças que afetarem seu conteúdo. Os registros devem distinguir execução atual de evidência histórica e implementação de integração efetivamente validada.

A tag v1.0.0 continua preservada. Não é necessário criar uma nova versão a cada commit; uma nova tag ou release depende do escopo combinado. Banco local, segredos e dependências instaladas continuam excluídos do Git.

As instruções operacionais desse fluxo também estão em AGENTS.md, na raiz, para serem consultadas nas próximas sessões de trabalho.

## Correções após a revisão arquitetural — 19/10/2026

1. O usuário solicitou debate antes das correções. Foram esclarecidas as diferenças entre migração de estrutura e transferência de registros, e entre SQL obrigatório e Supabase recomendado no desafio.
2. Após a autorização “pode começar as correções”, Codex implementou proteção da evolução SQLite, isolamento de carregamentos e validação do contrato de analytics. O banco local foi mantido; não foram alteradas as fórmulas de risco ou regras de cobrança.
3. Foram acrescentados testes dos cenários reproduzidos na auditoria. Resultado: 30 TypeScript e 12 Python aprovados, typecheck e build concluídos.
4. O banco existente recebeu o histórico de versão e gerou backup. Contagens e hashes das quatro tabelas de negócio foram iguais antes/depois; a API real e o Python responderam corretamente.
5. Um ambiente separado em memória permitiu conferir no navegador erros isolados, recuperação e cadastro preservando o filtro, sem inserir registros de teste no banco do usuário.
6. Documentação atualizada para refletir código, verificações e limites. A tag v1.0.0 foi preservada.
7. Após a apresentação do resultado e dos testes, o usuário aprovou a finalização com “pode finalizar as alterações”. Essa aprovação autoriza registrar o conjunto e enviar a branch `codex/reestruturacao` ao GitHub, seguindo o fluxo definido acima. O commit correspondente pode ser consultado no histórico Git da branch.

Participação: o usuário definiu a prioridade, autorizou o escopo e aprovou a finalização; Codex escreveu implementação, testes e registros desta etapa. A aprovação não detalhou testes manuais executados pelo usuário; as verificações descritas foram realizadas pelo Codex. Não atribuir esses trechos a programação manual do candidato.

## Proposta de evolução funcional — 19/10/2026

Após conversar com Matheus, o usuário pediu um planejamento para ampliar as funcionalidades. Codex consultou o código, o Git e os requisitos do enunciado completo e preparou PLANO_FUNCIONAL.md, referenciado em PLANO_EVOLUCAO.md.

A proposta organiza turmas/aulas, permissões, planos/cobranças, evolução do aluno, portal, relatórios e automação opcional. Distingue funcionalidades planejadas das já implementadas e das integrações externas ainda não validadas. O usuário confirmou começar por turmas, horários e chamada dos professores e informou que há turmas fixas com participação em outras. O plano passou a detalhar vínculo habitual e participação pontual, dividido em cadastro de turmas, aulas e chamada. As etapas posteriores continuam propostas.

Em seguida, o usuário esclareceu que o aluno pode participar de várias aulas no mesmo dia e que o responsável pode criar um treino extra fora da grade, como às 15h entre aulas fixas das 12h e 18h. O plano foi ajustado para preservar a grade e registrar cada aula e presença separadamente, permitindo aula extra avulsa. Foi documentada a mudança futura de unicidade por aluno/data/tipo para aluno/aula; a migração ainda não foi implementada ou executada.

O usuário acrescentou a intenção futura de vender a outras equipes, com planos editáveis de treinos ilimitados, limite semanal ou turma contratada e adicionais por participação além do plano. Codex ampliou o planejamento financeiro, distinguindo aula extra de adicional e prevendo histórico das condições, tratamento de consumo e cobrança sem duplicidades. Registrou que a academia atual continua sendo o caso ilimitado e que o isolamento de vários clientes ainda exige uma etapa arquitetural própria. As opções detalhadas são propostas, não políticas comerciais já aprovadas ou implementadas.

O usuário detalhou o fluxo desejado: professor/mestre define o plano, aluno consulta e se registra nas aulas, cota limitada bloqueia novas inscrições incluídas e participação adicional pode ser paga. O plano foi atualizado para esse acesso do aluno, gestão mediante permissão e liberação da aula adicional após pagamento confirmado. Foi distinguida inscrição de presença efetiva, mantendo em aberto a confirmação de participação e os efeitos de cancelamento e falta no consumo. O portal continua dependendo de autenticação e autorização e não foi implementado nesta discussão.

Esta etapa altera apenas documentação. Não modifica a lógica, o banco ou as telas. A conferência é de conteúdo, referências e diff, sem nova execução dos testes da aplicação. Não houve commit/push deste conjunto nem autorização para implementar todas as funções propostas. A documentação de arquitetura vigente continua descrevendo o sistema implementado; os modelos futuros serão definidos antes de cada implementação aprovada.

## Execução da entrega 1A — turmas e grade fixa — 19/10/2026

1. O usuário autorizou começar as entregas, solicitando destaques do trabalho e testes. Foi delimitado o primeiro conjunto: cadastro/edição de turmas, grade fixa, alunos habituais e desativação/reativação. Aulas extras e nova chamada permanecem seguintes.
2. Consultados Git, AGENTS.md e código; preservados os documentos de planejamento ainda não aprovados para commit. O desenho foi registrado em ARQUITETURA.md antes da implementação.
3. Codex implementou os contratos, três tabelas, migração SQLite 2 e equivalente Prisma, módulo de turmas, transação nos repositórios, nova tela e carregamento independente. A restrição de exclusão de aluno foi estendida aos vínculos de turma, com mensagem específica.
4. Nova execução: 42 testes TypeScript e 12 Python aprovados, build/typecheck e Prisma validate aprovados. Não houve teste externo de PostgreSQL ou IA.
5. No navegador, um processo separado em memória com seed fictício permitiu cadastrar duas turmas, editar, conferir sobreposição, manter filtro, desativar/reativar e conferir grade e formulário estreito. Os dados de teste não foram gravados na base do usuário. O override de viewport foi removido após a conferência.
6. O servidor local foi atualizado; o runner criou backup antes da migração 2. As quatro tabelas anteriores mantiveram contagens e hashes: 20 alunos, 110 mensalidades, 432 presenças e zero análises. As três novas ficaram vazias. Oito rotas HTTP responderam 200; Python disponível e IA sem chave.
7. README, arquitetura, guia de migrações, plano, prompts e revisão foram atualizados; TURMAS.md descreve uso, contratos, testes e defesa oral. A área Turmas foi deixada aberta para validação do usuário.
8. O usuário perguntou sobre versões e envio ao Matheus durante a execução. VERSIONAMENTO.md registra a recomendação de push após cada pequena entrega aprovada e de marcar versões por escopo, não por número de commits. v1.1.0 é apenas candidata para a entrega de turmas; nenhuma tag ou versão de pacote foi alterada.

Situação na apresentação: implementação e testes concluídos; aprovação do usuário, commit e push deste conjunto ainda pendentes naquele momento. A participação descrita foi real: Codex escreveu e testou; o usuário definiu regras. A aprovação posterior está registrada abaixo, sem atribuir ao usuário testes manuais não relatados.

### Incremento solicitado durante a validação: exclusão definitiva

O usuário viu a opção de desativar e pediu também excluir permanentemente para não acumular turmas inativas. Codex acrescentou o botão nos cartões e detalhes, confirmação explicativa, rota DELETE e remoção transacional de turma/horários/vínculos, preservando alunos, mensalidades e presenças. Dois testes adicionais e casos de 404 foram incluídos. A nova execução terminou com 44 testes TypeScript e build/typecheck aprovados; os 12 testes Python já haviam passado nesta mesma entrega, antes do incremento, e não foram reexecutados porque Python e fórmulas não mudaram.

O navegador em ambiente fictício foi usado para conferir botões, confirmação, cancelamento e adaptação estreita. A remoção efetiva foi exercitada nos testes HTTP/SQL, com proteção dos demais registros e rollback. Ao atualizar o servidor real, a comparação das sete tabelas preservou também a turma que já havia sido cadastrada na base local: uma turma, três horários e três vínculos. Nenhuma exclusão foi executada na base do usuário. Na apresentação desse incremento, a aprovação para commit/push do conjunto atualizado ainda estava pendente.

### Aprovação para registrar e enviar a entrega 1A

Após perguntar se os testes terminaram sem erros e receber os resultados e limites, o usuário autorizou com “pode commitar”. Conforme o fluxo permanente, essa aprovação autoriza Codex a revisar o diff, registrar o conjunto apresentado e enviá-lo à branch `codex/reestruturacao`, sem nova pergunta para o mesmo envio. Inclui código, migrações, testes, capturas fictícias e documentação de turmas/planejamento/versionamento. Não inclui tag, release, merge ou implantação.

Nesta etapa de registro, não houve nova alteração de comportamento nem reexecução dos testes da aplicação; foram revisados os diffs e o estado do Git/remoto. Os resultados de 44 testes TypeScript, build/typecheck e os 12 Python anteriores continuam sendo as execuções identificadas acima. Credenciais, base local, backups e arquivos temporários de teste permanecem excluídos do Git. A confirmação de envio deve consultar o resultado real do push; a aprovação não é prova de publicação.

Resultado confirmado: commit `507d2602a50a0f03ccf7c47a7af4aa8cb02f16fd`, enviado por push normal à branch `codex/reestruturacao` e conferido no remoto. Estado local limpo ao encerrar essa entrega. Tag v1.0.0 preservada, sem merge ou nova release.

## Execução da entrega 1B — aulas datadas — 19/10/2026

1. O usuário perguntou o próximo passo e respondeu “bora” à proposta de aulas fixas/extras e cancelamento. Essa autorização inicia a implementação, sem aprovar antecipadamente o commit/push.
2. Consultados Git limpo em `507d260`, AGENTS.md e os contratos existentes. O desenho foi registrado em ARQUITETURA.md antes de implementar: dados próprios da aula, lista histórica de previstos, turma opcional, origem única por horário/data e cancelamento com motivo.
3. Codex acrescentou duas tabelas, migração SQLite 3 e equivalente PostgreSQL, contratos, módulo próprio, criação transacional e cancelamento condicional. A interface ganhou agenda por dia, criação da grade/extra, filtros, detalhes e cancelamento. A confirmação de excluir turma agora informa a preservação de aulas históricas. Navegação móvel com sete áreas foi adaptada para duas linhas.
4. Executados testes e build. Após acrescentar cenários de histórico e concorrência, o resultado final foi 61 testes TypeScript e 12 Python aprovados, build/typecheck, geração e validação do schema Prisma aprovados. Houve bloqueio EACCES das conexões locais numa execução restrita; a repetição com acesso necessário passou, sem mudança de regra para esconder a falha. PostgreSQL/Supabase e IA externa não foram executados.
5. Navegador em processo isolado em memória: criadas aulas 12h/18h da grade e extra 15h; erro de horário corrigido no formulário; filtros, busca, previstos, mudança de data e cancelamento conferidos. Capturas fictícias e responsividade registradas em AULAS.md. Nenhuma aula de teste foi inserida no banco do usuário.
6. Antes de reiniciar, identificados os processos do próprio projeto. Comparadas as sete tabelas antes/depois: contagens e hashes preservados; backup antes-v3 criado, novas tabelas vazias, sem vínculos inválidos. Nove rotas HTTP locais e interface responderam 200; Python disponível, IA sem chave.
7. README, arquitetura, migrações, guias e documentos de processo atualizados. A aplicação principal foi deixada em Aulas para validação. Não houve commit/push ou nova tag desta entrega.

Participação real: o usuário definiu a prioridade e autorizou começar; Codex escreveu código, testes e documentação e executou as verificações descritas. Não atribuir programação ou testes manuais ao usuário sem relato dele. Presenças por aula, modalidades finais, planos e acessos permanecem etapas seguintes.

### Incremento da entrega 1B — exclusão de aulas extras

O usuário pediu “adicione um botão de exclusão das aulas extras também”. Codex preservou o conjunto 1B ainda pendente no Git e registrou o desenho antes de implementar. Acrescentou Excluir nos cartões/detalhes das extras, confirmação com opção de voltar, DELETE na API e remoção transacional de aula/previstos nos dois repositórios. Origem grade fica protegida na API e no repositório. Não houve nova migração.

Nova execução: 65 testes TypeScript aprovados (quatro adicionais, com casos de agendada/cancelada, avulsa/vinculada, preservação, recriação, bloqueio de fixa, rollback e concorrência) e build/typecheck aprovados. Python não mudou; os 12 testes Python aprovados são da execução anterior desta entrega, sem repetição no incremento. Não houve execução PostgreSQL/IA externa.

Navegador isolado: três aulas fictícias; botão somente nas duas extras, entrada pelos cartões e detalhes, confirmação de agendada/cancelada e Voltar mantendo os registros. Tela estreita e quebra de linha dos três botões conferidas, viewport restaurado. Exclusão efetiva testada por HTTP/SQL automatizado; não foi confirmada remoção pelo navegador nem enviada exclusão à base do usuário.

Ao atualizar os servidores, contagens e hashes das nove tabelas foram iguais antes/depois, preservando inclusive a aula que já existia na base local. Seis rotas de consulta e interface 200; versão SQLite permanece 3. Documentação e capturas fictícias atualizadas, aplicação principal aberta em Aulas. O conjunto 1B com esse incremento continua aguardando validação antes de commit/push.

### Aprovação para commit/envio da entrega 1B — 20/10/2026

Após consultar novamente se o botão Excluir funcionava e receber os resultados e limites, o usuário autorizou com “pode commitar”. A aprovação abrange o conjunto apresentado: agenda de aulas da grade e extras, previstos, cancelamento, exclusão de extras, migrações, testes, capturas fictícias e documentação. Conforme o fluxo permanente, Codex revisa o diff e envia à branch `codex/reestruturacao`, sem nova pergunta para esse mesmo envio. Não inclui tag/release, merge, implantação ou implementação da chamada 1C.

Na revisão para registro, foram conferidos Git e remoto em `507d260`, mantendo v1.0.0 na referência inicial; as alterações correspondiam ao conjunto apresentado. Atualizados os registros de aprovação sem mudar comportamento. Não houve nova execução de testes da aplicação nesta etapa: os 65 TypeScript e build são da última execução do incremento; os 12 Python foram executados antes desse incremento. Não atribuir aprovação de integração externa ou testes manuais ao usuário. A confirmação do envio depende do resultado real do push.
