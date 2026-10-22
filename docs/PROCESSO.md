# Processo

## Aprovação para envio e verificação final — 22/10/2026

Após a apresentação das entregas locais, o usuário autorizou: “testa e se tudo estiver ok, pode commitar”. A autorização contempla chamada por aula, horários combinados, aniversários, autenticação/portal, bloqueio financeiro, migrações, testes e documentação correspondente. Supera as pendências de aprovação nos registros anteriores. Não autoriza merge na main, release, nova tag ou implantação.

Nova execução nesta etapa: `npm test` com 121 aprovados, zero falhas; `npm run test:analytics` com 13 aprovados; `npm run build` com typecheck e Vite aprovados; `npm run db:generate` e `prisma validate` aprovados. Conferência de 16 documentos e 82 links locais sem destino ausente. As evidências de navegador e preservação da base abaixo são execuções anteriores, não foram repetidas nesta etapa. PostgreSQL/Supabase e provedor de IA não foram executados externamente; e-mail e pagamento automático continuam planejados.

Procedimento autorizado: revisar o diff, selecionar somente os arquivos deste conjunto, criar commit descritivo em português e realizar push normal para `codex/evolucao-tatame`. Conferir o hash remoto após envio e informar o resultado ao usuário. Credenciais, banco local, dependências e build ficam fora do commit. O registro descreve a autorização e verificações anteriores ao envio; a confirmação do push deve usar o resultado real do Git.

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

## Renomeação da branch de trabalho — 21/10/2026

O usuário pediu um nome mais adequado para `codex/reestruturacao` e escolheu `codex/evolucao-tatame` entre as opções apresentadas. Essa escolha autorizou a renomeação. Antes da operação, Codex conferiu Git limpo, remoto, ausência do nome novo e de PRs abertos associados, além das referências da main e da tag inicial.

A renomeação foi realizada pelo recurso nativo do GitHub (HTTP 201), preservando o commit `dd3212ea3df57c01ac268d1ebd04509b111b0bbf`. O nome local e o acompanhamento remoto foram atualizados para `codex/evolucao-tatame` e `origin/codex/evolucao-tatame`. A referência local de acompanhamento do nome antigo foi removida com conferência do SHA esperado; o histórico não foi reescrito.

Verificação antes/depois: mesmo HEAD e árvore de arquivos, main local/remota em `618c1b3`, tag v1.0.0 preservada e nenhum arquivo do projeto alterado pela renomeação. O GitHub passou a responder com redirecionamento para a consulta do nome anterior. Não houve novo commit, push de arquivos, PR, merge, release ou execução dos testes da aplicação.

Após a operação, foram preparados ajustes nas orientações atuais do README, guia GitHub, plano de evolução e versionamento, além dos registros de prompts/revisão/processo. Os nomes usados em entregas anteriores e os pacotes de estudo exportados permanecem como histórico. O usuário recebe o novo nome para atualizar a conversa de estudo. Esses ajustes de documentação ainda aguardam sua validação antes de commit/push; a escolha do nome não foi tratada como aprovação antecipada desse conjunto de arquivos.

### Aprovação dos ajustes documentais — 21/10/2026

Após a apresentação dos sete documentos e das verificações, o usuário autorizou com “pode commitar”. Codex revisou o conjunto aprovado para registrar e enviar somente README, GITHUB, PLANO_EVOLUCAO, PROCESSO, PROMPTS, REVISAO_IA e VERSIONAMENTO na branch `codex/evolucao-tatame`. Atualizar este registro de aprovação não muda o comportamento da aplicação. O envio deve ser confirmado pelo resultado real do push; as menções anteriores à validação pendente são históricas.

## Entrega 1C — chamada por aula — 21/10/2026

1. Após sugestões de funcionalidades e discussão da prioridade de chamada por aula, o usuário autorizou começar as alterações. Codex delimitou esse primeiro incremento e avisou que apresentaria mudanças/testes antes de commit. Não tratou a autorização de desenvolvimento como aprovação antecipada para envio ou implementação de todas as ideias.
2. Git consultado: branch `codex/evolucao-tatame`, HEAD `1778e67`, árvore limpa. AGENTS.md e este processo consultados. Desenho registrado em ARQUITETURA.md antes do código.
3. Implementados PresencaAula, migração SQLite 4 aditiva/equivalente Prisma, unicidade aula/aluno, marcação/correção/limpeza explícitas e transações com proteção contra cancelamento/exclusão. Presenças antigas preservadas sem aula presumida; aluno com chamada deve ser inativado, não excluído.
4. Interface: Chamada na agenda e em Presenças, seleção por data/aula, previstos sem marcação, inclusão pontual, busca, contagens, correção e confirmação para limpar. Registro por modalidade mantido em aba própria; aviso para não lançar o mesmo evento nas duas formas. Falha de aulas não transforma agenda em lista vazia válida nem bloqueia o formato anterior.
5. Analytics projeta ambas as fontes para o contrato do Python; cada aula frequentada é um treino, sem agrupar por dia. Sem alteração da fórmula de risco, regras financeiras, planos ou contas de acesso.
6. Nova execução final: 81 testes TypeScript, 13 Python, build/typecheck e Prisma generate/validate aprovados. Na primeira compilação, dois erros de nulabilidade foram corrigidos antes da execução aprovada. A revisão final acrescentou um teste e erro controlado para consultas inconsistentes de aula/chamada durante limpeza/exclusão concorrente; testes TypeScript e build foram repetidos após essa mudança. Python não mudou nessa revisão; os 13 aprovados pertencem à execução desta entrega, anterior a esse ajuste Node. Nenhum teste externo PostgreSQL/Supabase/IA foi executado.
7. Navegador com processo fictício em memória: presenças de Ana às 12h/15h/18h, Bruno ausente e Carla participante pontual às 12h, busca, escolha de aula/data, bloqueio futuro/cancelado, histórico por modalidade e confirmação/Voltar na limpeza. Limpeza efetiva exercitada por HTTP/SQL automatizado. Não foram inseridos/excluídos registros de teste na base do usuário. Tela estreita conferida e override restaurado; capturas fictícias em CHAMADA.md. Os campos nativos de data exigiram eventos de teclado na automação.
8. Verificação adicional Node → Python local real, só com dados fictícios: cinco presenças, sendo quatro novas por aula e uma antiga; Ana com quatro treinos no mês, três deles no mesmo dia. Ausência não contada. Não houve chamada de IA.
9. Antes/depois do reinício, nove tabelas com contagens e hashes idênticos: 20 alunos, 110 mensalidades, 433 presenças antigas e zero nas demais seis tabelas. Runner criou backup antes-v4; nova PresencaAula vazia, sem vínculos inválidos. Os zeros já existiam antes da migração e não foram produzidos pelos testes. Oito consultas API e interface responderam 200; servidor local atualizado para validação.
10. README, arquitetura, guia de chamada, migrações, planos, guias afetados e registros de prompts/revisão/processo atualizados. Produto segue 1.0.0, tag preservada. **Conjunto local aguarda validação do usuário antes de commit/push.** Sem PR, merge, release ou implantação.

Participação: o usuário forneceu as regras da academia e autorizou começar; Codex escreveu implementação, testes e documentação e executou as verificações. Não atribuir programação ou testes manuais ao usuário sem relato. O nome do professor continua cadastral e a operação é administrativa local; autenticação/perfis constituem o próximo conjunto proposto.

## Incremento — selecionar vários dias no mesmo horário — 21/10/2026

O usuário pediu para selecionar dias como segunda, quarta e sexta e preencher 12h–13h uma única vez. Codex consultou Git/instruções e preservou todas as alterações da chamada 1C ainda não aprovadas para commit. Adaptou somente o formulário, estilos e helper de agrupamento/expansão, mantendo contrato, validações e persistência já existentes.

Nova execução: 87 testes TypeScript e build/typecheck aprovados; seis casos novos verificam expansão, agrupamento de dados existentes, edição sem mutação dos dados de origem, nenhum dia, limite por intervalos expandidos e dias inválidos/repetidos. Python e Prisma não foram alterados nem reexecutados neste incremento; seus resultados anteriores continuam associados à entrega 1C.

Navegador com banco separado em memória: editar/salvar turma existente com quatro horários em dois blocos preservou todos os IDs e o aluno vinculado; cadastro Seg/Qua/Sex 12h–13h mais segunda 18h–19h; erro por nenhum dia; rejeição de sobreposição e correção; edição removendo sexta e acrescentando terça preservou os outros IDs e o intervalo das 18h. Tela estreita sem transbordamento horizontal. Não foram gravadas turmas de teste na base do usuário. Documentação e capturas fictícias atualizadas; incremento aguarda validação antes de commit/push, assim como o conjunto 1C.


## Horários combinados, aniversários e área do aluno — 21–22/10/2026

O usuário ampliou o pedido de vários dias para vários intervalos na mesma combinação, pediu homenagem aos aniversariantes do dia e autorizou iniciar login/portal depois dessas ações. A construção usa as tabelas e chamadas já existentes. A arquitetura de acesso foi registrada em ACESSO_ALUNO.md antes do código; decidiu-se identificar a conta primeiro para nunca fazer check-in em nome de um aluno escolhido livremente no navegador.

Implementação: helper de combinações dias × intervalos; agrupamento por conjunto completo para não inventar horários ao editar; aniversário por data atual/ativos; identidade/sessão/convite temporário; proteção administrativa e portal com cadastro, mensalidades, agenda e histórico próprios; check-in separado da presença confirmada. Autenticação não foi deixada apenas na interface. As telas e a API mantêm os cálculos Python dependentes da chamada confirmada.

A migração 005 e o equivalente PostgreSQL foram criados sem alterar migrações anteriores já aplicadas. O primeiro administrador não foi inventado nem recebeu senha padrão: o usuário deverá concluir a configuração local pessoalmente. Convites de aluno e redefinição foram testados por HTTP com dados fictícios, sem transmitir credenciais reais. O teste auxiliar de sessão dos casos antigos não é carregado pelo servidor.

Uma tentativa de testes foi interrompida porque a revisão automática de aprovação não pôde prosseguir com o limite de uso esgotado. Essa tentativa não executou a suíte. Após o usuário solicitar continuidade em 22/10, a execução autorizada passou: 112 testes TypeScript, 13 Python, typecheck/build; Prisma Client gerado e schema verificado. Testes prévios de 93/109 casos pertencem a estados intermediários, não substituem esta execução.

Navegador de teste/SQLite em memória: Ana fez check-in às 12h e às 15h; a aula futura ficou indisponível. A gestão mostrou os avisos, e a confirmação de uma presença apareceu no portal e resultou em um treino no Python real local. A grade de quatro horários e vínculo habitual preservou IDs ao salvar; nova combinação Seg/Qua/Sex 12h–13h e 18h–19h salvou seis horários. Aniversariante do dia ativo foi exibido, enquanto amanhã e inativo não apareceram. Tela estreita conferida sem transbordamento; não é teste em aparelho físico.

Na retomada, a base real já estava no schema 5, aplicado ao iniciar o servidor com o novo código. Conferimos o backup anterior v4 e o estado atual: dez conjuntos de linhas iguais por SHA-256, nenhum vínculo inválido, 20 alunos, 110 mensalidades, 433 registros antigos, uma turma com três horários, demais tabelas anteriores vazias. Usuario, Sessao e CheckinAula permaneceram vazias. Reinício posterior preservou os dados; não foi criado usuário fictício na base real. A tela de configuração inicial está disponível para validação.

O limite de uso interrompeu o trabalho, sem descartar os arquivos. Código e documentação foram retomados na mesma branch codex/evolucao-tatame. Nenhum commit/push, merge, release, tag ou implantação foi realizado. As alterações aguardam a validação explícita do usuário, conforme AGENTS.md.


## Bloqueio financeiro e planejamento de pagamentos — 22/10/2026

O usuário pediu restringir o acesso após o vencimento da mensalidade e mostrar orientação para regularizar com o professor. Implementação autorizada: vencimento hoje permite; dia seguinte com cobrança não paga restringe o portal e check-in. Identificação continua permitida para exibir aviso privado. Administração registra pagamento, e quitar todos os vencidos libera na próxima consulta da mesma sessão. A arquitetura foi registrada antes do código. Não houve mudança de plano, multa, envio externo ou flag de bloqueio no banco.

Durante a execução, o usuário pediu também reconhecimento automático do pagamento e aviso destacado de paga/a vencer junto à jornada de acesso/check-in, e determinou que ficassem para a etapa final. Esse incremento futuro foi registrado em PLANO_FUNCIONAL.md; não foi implementado agora nem confundido com envio de e-mail. O status local já usa os pagamentos registrados pelo responsável.

Verificações reais: 121 testes TypeScript aprovados, zero falhas; build/typecheck aprovados. Primeiro teste de reversão enviou null ao PATCH de pagamento, que aceita somente data; corrigimos o teste para usar a edição PUT já existente, sem alterar a regra da API. Navegador/SQLite em memória verificou aviso, áreas ocultas, largura móvel e liberação após pagamento fictício via API; a mesma sessão voltou a fazer check-in. Não foi movimentado dinheiro nem alterada mensalidade real. Python não foi reexecutado neste incremento; seus 13 testes anteriores estão registrados separadamente.

Reinício com schema 5 mantido, sem migração. Treze tabelas reais comparadas antes/depois por hash/contagem, sem alteração ou violação de FK: 21 alunos, 110 mensalidades, 433 presenças antigas, uma turma, três horários, uma conta, uma sessão e demais tabelas vazias. O aluno/conta/sessão adicionais já existiam antes do reinício; não foram criados por este teste. A aplicação atualizada está disponível localmente. Sem commit/push até validação explícita do usuário.
