# Processo

## Graduações configuráveis, retirada de avulsas e autorização de envio — 26/10/2026

Usuário solicitou cadastro de faixas e graus, esclareceu a retirada de páginas/funções de avulsas em favor de turmas coringa e pediu ícone $ em Mensalidades. À pergunta sobre cobrança por excesso de aulas, respondeu “Sim, manter a cobrança de aula adicional”. Implementados catálogo/modelos/validações, migração 10, tela administrativa, selects/exibição do aluno, compatibilidade do Python, retirada dos endpoints/formulários/métodos específicos de avulsas e ícones nos dois portais. Histórico não apagado nem convertido; reservas antigas confirmadas preservadas. Cadastro familiar valida graduação na mesma transação. Retomada salva a pedido do usuário.

Verificação nova: 206 testes TypeScript, 15 Python, 3 de configuração aprovados; build/typecheck, Prisma gerado e validado. Migração SQLite local com backup e hashes dos campos anteriores das 20 tabelas iguais; Supabase migrado com TLS verificado e mesma preservação. Prova sintética externa de concorrência de graus, coerência relacional, renomeação e turma coringa/rotas removidas passou; limpeza restrita com hashes das 22 tabelas iguais ao início. Sem login/ativação nessa prova externa. Navegador em memória confirmou criar faixa/grau, atribuir ao aluno, exibir e publicar 15h pela turma. Capturas somente fictícias. Testes antigos de criação/exclusão removida foram substituídos por cobertura do novo fluxo e preservação, sem fingir que o comportamento antigo continua válido.

O usuário autorizou “depois de testar e der certo os testes, pode commitar”. Codex comunicou revisão das pendências integradas e envio à branch codex/evolucao-tatame. Depois dessa autorização, pediu edição individual do nome da aula; Codex informou que esse incremento ficaria separado para validação após concluir o commit já autorizado. Não há autorização implícita para tag/release, merge ou publicação online. O resultado efetivo de Git deve ser conferido no histórico/remoto e informado ao usuário.

## Edição de nome, telefone e e-mail pelo aluno — 26/10/2026

Usuário pediu edição dos dados básicos pelo próprio aluno. Consultados Git/instruções, portal, autenticação e persistência; pendências anteriores preservadas. Codex comunicou que e-mail também é login e precisa de confirmação com senha atual. Implementados contratos de perfil próprio, validação estrita, atualização Aluno/Usuario atômica, revalidação sob trava, limite de tentativas, invalidação de convites/outras sessões na troca de e-mail, auditoria sem segredos e formulário com cancelar/salvar. Perfil acessível durante bloqueio financeiro, sem alteração do bloqueio de aulas. Detalhes em ACESSO_ALUNO.md. Nenhuma migração ou alteração de conta real foi necessária.

Validação nova: 12 testes específicos e suíte completa com 195 testes TypeScript aprovados; build/typecheck aprovados após correção de tipo da fixture de teste. Navegador fictício confirmou nome/telefone salvos, cancelamento e edição de contato durante atraso. Troca de e-mail/senha foi verificada na API, sem digitar credencial de usuário real no navegador. Supabase sintético confirmou transação, exclusividade concorrente, login e revogação. Primeira comparação integral diferiu em Sessao devido à limpeza de sessões expiradas já existente no login; demais 19 tabelas iguais. Repetição desse fluxo foi rejeitada pela revisão automática. Foi preparada alternativa sem login/ativação/limpeza global, somente IDs sintéticos; execução aprovada e concluída, limpeza com hashes das 20 tabelas iguais ao início dessa prova. Não se repetiu Python por não haver alteração em analytics. Aguardando validação antes de commit/push.

## Opção Incluir mais horários — 26/10/2026

Usuário pediu checkbox desmarcado por padrão para manter um único horário e ocultar os botões extras até marcar. Consultados Git/instruções, formulário e documentação; alterações pendentes anteriores preservadas. Codex manteve seleção de vários dias, condicionou controles/combinações extras ao checkbox e definiu grade ativa para contagem, nome automático e salvamento. Desmarcar guarda o rascunho, mas informa que somente o primeiro intervalo da primeira combinação será salvo. Edição múltipla começa marcada para evitar redução involuntária. Sem mudança na API/banco.

Verificações novas: build/typecheck e oito testes existentes do helper aprovados. Navegador isolado em memória confirmou os estados, restauração do rascunho, edição múltipla, salvamento sem mudança com cinco IDs/vínculo preservados e redução explícita ao primeiro intervalo com campo extra vazio oculto fora do envio/validação. Reabertura confirmou modo simples. Captura fictícia em TURMAS.md. Não se repetiram suíte completa, Python ou Supabase porque o incremento está no formulário/CSS. Sem cadastros reais alterados; aguardando validação antes de commit/push.

## Planejamento de envio de e-mail — 25/10/2026

Pedido: fazer funcionar o envio ou, sendo complexo, registrar nas opções complexas futuras. Consultados Git/instruções, código da API, dependências e exemplo de configuração; encontrados convites temporários, sem serviço de entrega integrado. Codex adotou a alternativa autorizada e registrou a etapa em PLANO_FUNCIONAL.md, com referências no README, PLANO_EVOLUCAO.md e ACESSO_ALUNO.md. Escopo proposto inclui convites, avisos e lembretes; depende de provedor/remetente, endereço público, credenciais privadas e controle de destinatário/falhas/duplicidade. Não foi contratado serviço, conectada conta, criada automação ou enviada mensagem. Alteração documental: verificar links/diff, sem apresentar as suítes funcionais anteriores como testes novos. Pendências anteriores preservadas; sem commit/push antes da validação.

## Responsáveis e controle de acesso de menores — 25/10/2026

Usuário solicitou acesso pelo responsável quando menor não tem celular, acompanhamento com acesso próprio quando tem, ativação futura e transferência aos 18 sem perda de histórico. À pergunta se o responsável poderia fazer check-in pelo menor sem celular, respondeu: “Sim, poderá fazer check-in”. Git/instruções foram consultados; alterações pendentes anteriores preservadas. Implementados novo perfil, cadastro/vínculo atômicos, portal por dependente, controle de permissões no servidor/gravação, convites, revogação, transferências auditadas e avisos/autorizações internos. Decisões e caminhos em RESPONSAVEIS.md.

Nova verificação final: 183 testes TypeScript, 13 Python e 3 de configuração aprovados; build/typecheck e Prisma gerado/validado. SQLite real migrou para v9 com backup e hashes das 17 tabelas anteriores preservados. Supabase migrou com TLS verificado e preservação; QA concorrente/isolamento/ativação/check-in/respostas/transferências sintética foi executada, repetida após reforço da resposta e removida, com hashes das 20 tabelas iguais ao início. Navegador em memória confirmou cadastro sem contato próprio, vínculo compartilhado, seleção de filho, check-in/cota, débito imediato, resposta e transferência. Sem teste físico de celular ou envio externo. Conjunto aguarda validação antes de commit/push.

## Planejamento de parabéns por WhatsApp — 25/10/2026

Usuário pediu envio de parabéns no WhatsApp e autorizou deixar nas adições complexas futuras se não fosse viável agora. Conferidos estado do Git/instruções e código de aniversários: a seleção/texto existem para exibição interna, sem módulo de envio externo. Registrado escopo futuro em PLANO_FUNCIONAL.md e referência em PLANO_EVOLUCAO.md/README, com configuração da academia, preferência de recebimento, fuso, execução agendada, prevenção de duplicação e critérios de teste. Nenhuma conta/provedor conectado, mensagem enviada, automação criada ou custo contratado. Mudança apenas documental; conferir links/diff, sem repetir suítes funcionais. Mantidas alterações pendentes anteriores; sem commit/push antes da validação.

## Aula adicional com débito automático — 25/10/2026

Usuário ampliou pedido do saldo mensal: oferta de aula por valor configurável, escolha de dia/aula, confirmação, débito automático e menu próprio, prazo 3 editável e baixa administrativa. Confirmou explicitamente bloquear novos check-ins com débito vencido, mantendo login/lista. Codex comunicou reserva distinta de presença e prazo a partir da confirmação. Implementados migração 8, configuração/valor sem padrão inventado, reserva idempotente com aceite e preço congelados, débito auditado, baixa e cancelamentos, cotas/financeiro integrados e menus nas duas áreas.

Nova suíte completa: 166 testes TypeScript aprovados (13 novos de débitos e uma prova de migração), 13 Python, Prisma gerado/validado e build/typecheck aprovados. Um fechamento JSX, tipo da fixture e comparação de protótipo SQLite foram corrigidos durante as verificações; sucesso reportado somente após repetição. Conjunto direcionado de 13 testes passou novamente com aula já incluída/passada/cancelada. SQLite real migrado com backup, hashes das 15 tabelas anteriores preservados e FK check vazio. Supabase migrado, prova concorrente/financeira feita com dados sintéticos, removidos ao final, hashes anteriores preservados.

Navegador isolado: configuração fictícia R$25/3 dias; aula futura escolhida; consulta confirmou zero cobranças antes do aceite; confirmação criou um débito completo e abriu Débitos; baixa administrativa refletida como Pago para ambos os perfis. Capturas fictícias. Nenhuma cobrança ou preço de teste aplicado a alunos reais. Mensalidades/relatórios anteriores mantidos separados, pagamento automático futuro. Alterações prévias preservadas; aguardando validação antes de commit/push.

## Saldo mensal por aluno — 25/10/2026

Usuário pediu campo de aulas restantes no mês, débito por check-in e aviso ao esgotar. Confirmou explicitamente renovação no dia 1, sem débito duplicado e devolução em cancelamento. Implementados três campos opcionais no Aluno, migração 7 aditiva SQLite/Prisma, configuração administrativa, coluna na listagem, resumo/aviso no portal e débito atômico. Mantidos limite semanal e financeiro; liberação semanal não ignora cota mensal. Regras e defesa em SALDO_MENSAL.md.

Validações novas: 152 testes TypeScript (11 novos), 13 Python, geração/validação Prisma e build/typecheck aprovados. Testes históricos de migração passaram a projetar as colunas anteriores e esperar versão 7, preservando a comparação do conteúdo original; novo teste verifica as colunas novas nulas, backup e persistência do saldo. SQLite real migrado com backup e hashes anteriores das 15 tabelas preservados, nenhuma FK inválida. Supabase de homologação recebeu migração 7; prova externa de concorrência/idempotência/cancelamento/configuração com dados sintéticos, removidos ao final; hashes anteriores das 15 tabelas preservados.

Navegador isolado: configuradas duas aulas; aluno fez dois check-ins, saldo 2→1→0, aviso e bloqueio da terceira aula; listagem administrativa exibiu zero. Nenhum aluno real teve limite alterado para testar. Capturas com dados fictícios. Suíte/contagens antigas continuam identificadas como históricas. Conjuntos prévios preservados. Entrega pronta para validação; sem commit/push, merge, tag ou hospedagem pública.

## Remoção de Alunos habituais do formulário — 25/10/2026

Usuário pediu “remover alunos habituais” durante os ajustes de turmas. Codex comunicou remoção da seção do formulário, preservando vínculos existentes. Retirados seleção, busca e estados associados de TurmaForm; mantido envio dos vínculos originais na edição e lista vazia na criação. Descrição do modal atualizada. Build/typecheck aprovados; navegador isolado com SQLite em memória confirmou criação/edição sem a seção e edição salva mantendo o vínculo fictício anterior. Sem migração, escrita em dados reais, repetição da suíte completa ou commit/push. Alterações pendentes anteriores preservadas.

## Acesso administrativo local sem senha — 25/10/2026

Usuário solicitou retirar a digitação de senha temporariamente para entrar como administrador. Codex informou que limitaria a conveniência a este computador. Implementada flag privada com padrão false no exemplo, guardas de loopback/ambiente/origem e prioridade para sessões normais de aluno. Senhas e cadastros não foram apagados. O .env local estava ausente; criado com HOST de loopback e flag ativa. A flag foi definida explicitamente como false em .env.homologacao para impedir herança do .env por dotenv; conexões e credenciais privadas foram conferidas como preservadas.

Primeira execução de testes na sandbox teve EACCES ao conectar às portas efêmeras do Supertest; não foi apresentada como resultado funcional. Reexecução com acesso às conexões locais: suíte completa, 141 aprovados, zero falhas. Build/typecheck aprovados. API local reiniciada com SQLite preservado; frontend e Python recolocados em execução após encerramento dos filhos pelo supervisor anterior. Conferência real sem cookie nas portas 3333 e 5173: admin/estado e turmas 200; encaminhamento simulado bloqueado 401; Python /health 200. Nenhuma migração ou teste funcional externo Supabase nesta alteração. Documentação de reversão atualizada. Conjuntos anteriores pendentes preservados; sem commit/push e aguardando validação.

## Nome automático de turmas — 25/10/2026

Pedido: checkbox Nome automático ao lado do nome das turmas, selecionado por padrão, preenchendo Turma das: conforme a hora escolhida. Estado inicial da branch codex/evolucao-tatame já continha o conjunto pendente de homologação; ele foi preservado. Implementado no formulário/helper/CSS, com sugestão derivada do início mais cedo da grade, minutos quando necessários e modo manual. Nova turma começa automática; edição preserva nomes personalizados e reconhece nomes calculados, sem migração ou alteração de rotas.

Executados build/typecheck (aprovados), oito testes existentes do helper de horários (aprovados) e criação/edição no navegador usando servidor descartável, identidade fictícia e SQLite em memória. Conferidos horas/minutos, vários intervalos, mudança e remoção do mais cedo, nome manual preservado e nomes salvos/reabertos. Evidência em screenshots/turma-nome-automatico.png. Build atualizado para a tela normal; servidores locais existentes em 3333/5173 conferidos. Sem nova execução de Python/Prisma ou suíte completa, pois esta alteração afeta somente o preenchimento do frontend. Aguardando validação; sem commit/push para este incremento nem para o conjunto prévio pendente.

## Usuário comum no ambiente de testes — 23/10/2026

Usuário pediu uma conta sem permissão de administrador. Conferidos administrador existente e configuração inicial encerrada; criados Aluno de Teste e Usuario/perfil aluno no Supabase de homologação, sem alterar administrador ou SQLite. Teste real: login/portal próprios 200, 13 acessos/escritas administrativas bloqueados com 403, logout 204. Removidas senha e sessões temporárias; convite de ativação de 24h gerado para escolha pessoal da senha, guardado em arquivo ignorado. Nenhum convite/senha versionado ou enviado por e-mail. Ativação humana, hospedagem pública e commit/push pendentes.

## Autenticação e migrações externas concluídas — 23/10/2026

Após nova entrada da senha pelo usuário, autenticação Supabase aceita e socket TLS cliente autorizado com a CA oficial. Confirmado novamente destino e banco vazio; Prisma migrate deploy aplicou as seis migrações existentes com saída 0. Conferidos seis registros concluídos, 16 tabelas públicas e nenhum usuário. Sem reset, seed ou transferência do SQLite. API local alternada para homologação sem modificar .env; tela e estado de configuração retornaram 200 em 127.0.0.1:3333, aguardando criação pessoal do administrador. Porta 5173 não acessível nessa etapa; Python não revalidado. Ainda sem hospedagem pública ou novo commit/push.

## Instalação do certificado — 23/10/2026

Após o usuário baixar a CA oficial, Codex a copiou para data/certificados, conferiu que é uma CA válida e configurou sslrootcert na URI de homologação. Arquivos privados continuam ignorados. Nova tentativa confirmou TLS, mas retornou 28P01 (credenciais recusadas). Próximo passo humano: informar novamente a senha do banco no configurador local. Ainda sem migrações externas, conta inicial, hospedagem ou novo commit/push.

## Tentativa de conexão externa — 23/10/2026

Usuário concluiu a entrada privada da senha pelo configurador. A tentativa real com TLS completo retornou SELF_SIGNED_CERT_IN_CHAIN. Autenticação e estrutura do banco ainda não comprovadas; nenhuma migração ou escrita executada. Orientado download da CA oficial em Database Settings > SSL Configuration para configurar a confiança do cliente e repetir o teste. Mantida a verificação TLS.

## Início da homologação — 23/10/2026

Usuário autorizou começar o ambiente online para Gabriel testar; informou não possuir contas Render/Supabase. Criou pessoalmente o projeto Supabase tatame-homologacao gratuito, North Virginia, e copiou a URI do Session pooler para .env.homologacao. Esse arquivo foi preparado separado do .env e confirmado como ignorado pelo Git; a URI foi conferida por indicadores, sem imprimir conexão/senha. Na conferência ainda havia marcador YOUR-PASSWORD, sem teste externo de autenticação.

Preparado utilitário de senha oculta no terminal, codificação de símbolos e TLS verify-full, sem rede nem alterações no banco local. Guia em HOMOLOGACAO.md. Não foi criada conta ou senha pelo agente. Render, migrações externas, administrador e implantação continuam pendentes; nenhuma etapa foi presumida como concluída. Novo conjunto ainda precisa de validação antes de commit/push.

## Aprovação dos planos para commit/envio — 22/10/2026

Após a apresentação da entrega de planos, o usuário autorizou “testa e commita”. Foram repetidos `npm test` (136 aprovados, zero falhas/cancelamentos/ignorados), `npm run test:analytics` (13 aprovados), `npm run build` (typecheck/Vite aprovados), `npm run db:generate` e `prisma validate` (aprovados). Revisão de arquivos modificados/novos e links documentais antes da seleção. A autorização atual supera a pendência de aprovação registrada na implementação abaixo.

Escopo aprovado: plano individual ilimitado/semanal, cota transacional de check-in, resumo na ficha/portal, liberação extra nominal, proteção de vínculos, migração SQLite 6/Prisma, testes e documentação. Nenhuma nova mudança de comportamento nesta etapa. As conferências de navegador e treze hashes do banco real são evidências anteriores, não novas execuções. Supabase/IA externos não foram executados; hospedagem, e-mail e pagamento continuam para depois.

Procedimento: selecionar somente os arquivos aprovados, criar commit descritivo em português e fazer push normal para codex/evolucao-tatame; conferir o hash remoto e comunicar o resultado real. Sem alterar main, tag v1.0.0 ou versão dos manifests. Este registro é anterior ao envio e não substitui a confirmação do GitHub.

## Planos de treino — nova entrega em 22/10/2026

O usuário pediu deixar hospedagem para outra ocasião e autorizou implementar agora plano ilimitado/limite semanal, resumo de uso e autorização administrativa de aula extra; integrações complexas ficaram para depois. Estado inicial limpo em codex/evolucao-tatame, commit 32dcd35. Antes do código, foram registrados o desenho em PLANOS.md e as regras comunicadas: semana segunda/domingo, pendente ocupa uma vaga, confirmação não duplica, ausência/cancelamento libera, aluno atual segue ilimitado até configuração.

Implementados módulo de planos, tabelas/migração 6 aditivas SQLite/Prisma, verificação transacional de novo check-in e editor/resumo nas duas áreas. Autorização por aluno/aula inclui motivo/administrador, sem cobrar nem quitar mensalidades. Planos são individuais, sem catálogo compartilhado ou preço de excedente. Mudança de plano preserva uso; presença real continua registrável pelo administrador. Documentação e defesa oral em PLANOS.md.

Verificação final: 136 testes TypeScript, 13 Python, build/typecheck e geração/validação Prisma aprovados. Navegador fictício confirmou edição sem zerar uso, autorização e check-in de extra, restrição nas outras aulas e tela estreita sem transbordamento. Banco real migrou 5→6 com backup automático; treze tabelas mantiveram contagens/hashes e duas novas permaneceram vazias. Inicialmente um segundo npm run dev encontrou porta 5173 ocupada; a sessão anterior foi identificada/encerrada e os servidores próprios reiniciados corretamente. Não foi alterado outro projeto.

Falhas de desenvolvimento: teste de aula cancelada omitiu os campos obrigatórios de motivo/data; a fixture foi corrigida sem relaxar o CHECK. Na nova fixture de migração, escape incorreto no filtro de nomes e conexão aberta mascararam a falha com EPERM na limpeza Windows; consulta e fechamento em finally foram corrigidos, e a suíte completa passou. Tentativas de patch com contexto inexato foram recusadas sem gravar; trechos reais conferidos antes de repetir. Nenhuma tentativa com falha foi apresentada como teste aprovado.

Entrega local para validação. Não criar commit/push antes de nova aprovação explícita para este conjunto. Main, tag v1.0.0 e versão dos manifests preservadas. Sem execução externa de Supabase, IA, hospedagem, e-mail ou pagamento nesta etapa.

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
