# Revisão de IA

## Faixas/graus e fluxo de aulas por turma — 26/10/2026

Revisados vínculos por ID, normalização/unicidade, situação/inativação e proteção de exclusão. Texto de faixa mantido sincronizado para compatibilidade; grau antigo fica não informado. Migração 10 não reescreve anteriores. Validação de estrutura foi antecipada antes de migração consultar colunas legadas, mantendo mensagem clara/backup para schema desconhecido. SQLite protege associação por trigger e PostgreSQL por FK composta/check; renomeação tem transação e rollback testado. Perfil do aluno continua sem permissão de graduação.

Retirada de avulsas removeu criação/exclusão da interface, serviço, schema e repositório. Tipo persistido extra mantido para histórico. Testes de aulas foram reescritos para turma coringa e legado, e fixtures de chamada/analytics publicam por turma. Corrigidos remanescentes de JSX/linhas CRLF, expectativas de rota removida, adaptação da fixture que precisava respeitar turma/vínculos existentes e expectativas da migração 10. Uma substituição inicial também alterou a expectativa de revogar liberação na mesma linha de uma exclusão; foi corrigida para manter a regra 409 de liberação usada. A redução das falhas até a suíte verde foi conferida; não se declarou sucesso na primeira execução parcial.

Validação final: 206 TypeScript, 15 Python, 3 de configuração, build/typecheck e Prisma aprovados. SQLite e Supabase migraram com preservação de campos antigos de 20 tabelas; teste externo restrito, sem login/ativação, passou e foi limpo com hashes das 22 tabelas iguais ao início. Navegador confirmou faixa/grau/atribuição e publicação por turma sem botões de avulsas. Não há validação física em celular, regras de federação ou histórico completo de promoções. Usuário autorizou commit/envio após os testes; edição individual do nome da aula, pedida depois, permanece separada para validação.

## Edição de perfil e coerência do login — 26/10/2026

Revisados campos permitidos, identidade obtida da sessão, exclusividade entre Aluno/Usuario, reautenticação para e-mail, revogação de convites/outras sessões e transação com auditoria. Dados administrativos não são aceitos pelo schema. Permissões e credencial conferidas novamente na gravação para evitar alteração após troca de acesso ou senha. Eventos registram autor/campos, sem senha, token ou contatos anteriores. Nome em check-in/chamada antigo preservado como histórico; novos registros usam o cadastro atualizado. Endpoint/formulário de perfil é exclusivo do aluno com acesso próprio, inclusive menor; responsável permanece em consulta nessa área.

Nova suíte: 12 testes específicos aprovados; 195 TypeScript na suíte completa aprovados. Build detectou unknown passado a send na fixture, corrigido para Record<string,unknown>; build/typecheck depois aprovados. Navegador em memória validou formulário, salvamento de nome/telefone, cancelamento e edição em bloqueio financeiro. Ajustado o texto do bloqueio para não sugerir que todas as áreas de consulta estão indisponíveis. Troca de e-mail verificada pela API; campo de confirmação de senha no navegador permanece para validação humana. Python não repetido neste incremento.

Primeira prova no Supabase passou nas operações de perfil, concorrência, login novo e revogação, mas falhou na comparação integral: login executou sua limpeza preexistente de sessões expiradas, alterando Sessao; demais 19 tabelas permaneceram iguais. Repetição foi bloqueada pela revisão automática pelo risco de escrever fora dos IDs sintéticos. Alternativa realmente restrita retirou chamadas de login/ativação, manteve somente escritas/exclusões nos IDs gerados e foi executada com sucesso; hashes das 20 tabelas iguais ao início dessa nova prova após limpeza. Não foi contornado o bloqueio por execução indireta do mesmo teste, nem restaurada sessão expirada. Essa diferença está registrada em ACESSO_ALUNO.md e PROCESSO.md. Sem alteração de cadastro/histórico real, envio externo, migração ou commit/push. Conjunto aguarda validação humana.

## Horários extras opcionais — 26/10/2026

Revisão do formulário: controles de inclusão e remoção de extras ocultos no modo simples; somente grade visível participa de contagem, nome automático e envio. Rascunho oculto não é apagado ao alternar a opção e não mantém campos required escondidos bloqueando o envio. Edição com grade múltipla começa marcada para não apagar horários ao salvar sem mudança. Vínculos e IDs mantidos conferidos pela API após salvamento na interface. Mudanças de código limitadas a TurmasPage.tsx e CSS, sem migração ou alteração de autorização.

Build/typecheck e oito testes existentes de combinação aprovados nesta execução. Teste visual em memória confirmou criação simples, ativação, segundo intervalo, ocultação/restauração, edição e preservação dos cinco horários/vínculo; redução explícita a Seg/Qua 12h–13h com IDs existentes preservados e campo extra vazio excluído. Captura somente fictícia. Suíte completa/Python/Supabase não repetidos por não haver mudança nesses componentes. Documentação atualizada e pendências anteriores preservadas. Sem commit/push antes de validação.

## Planejamento de e-mail — 25/10/2026

Revisão documental separou três situações: e-mail cadastrado, convite gerado e entrega real ao destinatário. As duas primeiras existem; a terceira exige integração ainda não implementada. Registrados critérios de destinatário, endereço público, credenciais privadas, reenvio/idempotência, expiração/uso único e testes de falha/entrega. Mensagem ao provedor não será confundida com leitura, nem e-mail de pagamento com reconhecimento bancário. Nenhum envio externo foi executado. A primeira tentativa de patch falhou por usar um título diferente do arquivo de acesso; os arquivos foram conferidos, sem alteração parcial, e o patch corrigido. Verificação desta etapa limitada a documentação/links/diff; testes funcionais anteriores não reexecutados por não haver mudança de código. Conjunto aguarda validação; alterações pendentes anteriores preservadas.

## Acesso familiar — 25/10/2026

Revisão concentrou-se em separar identidade de aluno/usuário, evitar perfil administrativo para responsáveis, isolar cada dependente e preservar referências. Regras comuns geram plano aplicado em transação pelos dois repositórios. Check-in e resposta revalidam vínculo/idade dentro da gravação; UI não é a única barreira. Novos convites, revogação por troca de acesso, perda de permissão aos 18 e contato sem privilégio foram verificados. Mensagens mantêm destinatário original e primeira resposta; dados de histórico não são apagados.

Primeira execução da suíte dentro do sandbox encontrou EACCES para conexões HTTP locais e expectativas antigas de versão 8; os testes foram executados com permissão para loopback e as expectativas passaram a 9, conservando as comparações dos campos anteriores. Um teste novo esperava acessoPrincipal explícito, mas o normalizador mantém o formato legado omitindo defaults; a asserção passou a verificar o valor efetivo, sem remover a checagem de acesso. No teste visual, fill de data nativa não disparou mudança de React; a data foi inserida por teclado e o cadastro foi concluído. Corrigida exibição de data de comunicado para o fuso de São Paulo, pois fatiar ISO mostrava o dia UTC seguinte. Nenhum erro inicial foi relatado como sucesso.

Validação final: 183 testes TypeScript, 13 Python, 3 de configuração, build/typecheck e Prisma aprovados. Migração SQLite/Supabase v9 preservou 17 tabelas anteriores; rollback/FKs e todas as tabelas foram testados. Prova externa sintética e concorrente confirmou as operações familiares, foi repetida após checagem transacional da resposta e limpa com hashes de 20 tabelas idênticos. Capturas em RESPONSAVEIS.md contêm somente dados fictícios em memória. Não houve envio externo, teste físico de celular ou publicação pública. Limitações explícitas: um responsável operacional por aluno e um perfil por e-mail. Aguardando validação humana; sem commit/push.

## Registro futuro de WhatsApp — 25/10/2026

Alteração somente documental, conforme alternativa explícita do usuário. Código de aniversários seleciona ativos e gera texto interno; não foi encontrado módulo de envio WhatsApp no código/configuração de exemplo conferidos. Planejamento distingue homenagem já existente de envio externo ainda não implementado e registra preferências, telefone/fuso, prevenção de duplicação, registro de resultados e validação em destino autorizado. Sem executar mensagens ou automatismos e sem afirmar preço, política de provedor ou entrega real não conferidos. Links/diff verificados; testes funcionais anteriores não reexecutados para este registro. Sem commit/push.

## Aulas adicionais e débitos — 25/10/2026

Modelo/migração 8 aditivos: configuração singleton sem preço padrão e prazo 3, débito único por aula/aluno, condições financeiras congeladas, baixa com autor/data. API administrativa separada da consulta própria do aluno. Reserva exige confirmação explícita de preço/prazo vigentes, quota mensal esgotada no mês-alvo e aula válida; não cria presença. Confirmações concorrentes serializadas; check-in adicional excluído de cota regular. Atraso bloqueia novas reservas/check-ins, conforme autorização explícita. Cancelamento cancela pendente e preserva pago com indicação de acerto manual. Exclusão de aula/aluno preserva dívida e auditoria.

Validação nova: 166 testes TypeScript aprovados, 13 Python, Prisma gerado/validado, build/typecheck. A primeira compilação detectou fechamento de componente JSX ausente, corrigido; outra detectou tipo unknown amplo na fixture, corrigido para Record. Primeiro conjunto novo teve comparação de objeto SQLite com protótipo nulo versus objeto literal; comparação normalizada sem retirar conferência dos campos/autor/data, suíte repetida com 166 aprovados. Treze testes direcionados passaram novamente com aulas incluídas/passadas/canceladas. Provas incluem idempotência, prazo/valor preservados, forja, isolamento, baixa, rollback e migração/backup/reabertura.

SQLite local v8: backup anterior v7, 15 tabelas anteriores iguais por hash, FK check vazio, nenhum preço real/debito criado. Supabase: TLS autorizado e migração 8 concluída; fixture externa verificou concorrência sem duplicação, extra sem crédito duplicado, atraso, baixa, cotação alterada, cancelamentos e preço preservado. Removidos configuração/operador sem login/aluno/aulas/check-ins/débitos sintéticos; hashes das 15 tabelas anteriores preservados, oito migrações concluídas.

Conferência visual isolada: menu administrativo e do aluno, configuração 25/3 fictícia, oferta, seleção de aula futura, aceite com valor/prazo, ausência de débito antes do clique final, lista imediata e baixa espelhada. Ajustados seletores a partir do estado visível após atualização; capturas não contêm dados reais. Sem teste físico de celular, integração bancária, emissão de PIX, reembolso automático ou implantação pública. Relatórios de mensalidades/analytics não incorporam adicionais nesta entrega e a UI/documentação explicam a separação. Conjunto aguarda validação antes de commit/push; pendências anteriores preservadas.

## Saldo mensal transacional — 25/10/2026

Revisão: Aluno recebe limite mensal, saldo restante e competência, opcionais para manter alunos atuais ilimitados. Campos de saldo não entram em AlunoInput nem payload comum; somente endpoint administrativo configura limite. Novo check-in verifica saldo/semana/financeiro e grava aviso+saldo atomicamente; repetição retorna existente sem débito. Cancelamento recalcula com histórico preservado. Uso mensal exclui canceladas, mas não devolve por mera ausência após check-in; isso é documentado separadamente da cota semanal. Renovação lógica por mês em São Paulo, com persistência na próxima operação relevante, dispensa cron. Limite reduzido abaixo do uso mantém zero, nunca saldo negativo.

Nova execução: 152 testes TypeScript aprovados (11 novos de saldo, concorrência SQLite, rollback, autorização/forja, cancelamento, confirmação/ausência, configuração, integração de cotas/financeiro, virada de período e migração), 13 Python aprovados, Prisma gerado/validado e build/typecheck final aprovado. Testes de migração antigos foram adaptados para comparar explicitamente as colunas legadas em vez de falhar pela inclusão legítima de colunas; defaults e backup da nova migração têm verificação própria. Nenhuma migração antiga reescrita.

SQLite real: migrador 7 com backup; hashes das colunas antigas das 15 tabelas iguais, todos os alunos anteriores ilimitados, FK check vazio. Supabase: TLS autorizado, migração 7 concluída; aluno/aulas sintéticos verificaram dois check-ins concorrentes em última vaga (somente um aceito), repetição, devolução, novo desconto e edição/remoção de limite. Todos os registros sintéticos removidos, hashes anteriores das 15 tabelas preservados, sete migrações concluídas. Não se extrapola isso para todos os fluxos externos.

Navegador com SQLite em memória: formulário mensal salvou limite 2; portal mostrou 2/2→1/2→0/2, aviso mensal e bloqueio de terceira aula; gestão mostrou coluna zero. Seletor de participação ajustado após nova observação da árvore, sem apresentar tentativa intermediária como resultado final. Capturas somente fictícias. Sem teste em dispositivo físico ou versão publicada. Documentação atualizada; aguardando validação antes de commit/envio, mantendo pendências anteriores.

## Formulário sem Alunos habituais — 25/10/2026

Alteração limitada a TurmaForm e documentação: removidos lista, busca, seleção e estados não utilizados; descrição do modal atualizada. Atenção ao payload: zerar alunoIds na edição apagaria vínculos; a implementação mantém turma.alunoIds e usa lista vazia somente na criação. Modelo e API preservados.

Build/typecheck aprovados. Conferência visual e DOM em servidor exclusivo/SQLite em memória: seção e busca ausentes em Nova turma e Editar turma; professor alterado e salvo em uma turma fictícia com um aluno vinculado. Consulta posterior confirmou professor atualizado e alunoIds exatamente iguais aos anteriores. Não foi executada novamente a suíte completa de 141 testes; esse número pertence à alteração de acesso local anterior. Nenhuma escrita em banco real/Supabase. Evidência em docs/screenshots/turma-sem-alunos-habituais.png. Aguardando validação antes de commit/envio.

## Entrada local sem senha — 25/10/2026

Adicionada exceção temporária explícita em auth.identify, após a sessão normal, com helper de guardas local-admin.ts e configuração passada por server.ts/createApp. Fallback somente para administrador inicial existente com senha já configurada, sem criar conta/sessão/cookie. Caso contrário, fluxo normal. Perfil de aluno autenticado preservado. Proteções verificam configuração HOST, hostname, endereço remoto, APP_ORIGIN, NODE_ENV, origem, cross-site e cabeçalhos de proxy. Exemplo false; flag true somente no novo .env privado local, ignorado. Definido false explicitamente no .env.homologacao para impedir herança por dotenv; DATABASE_URL/DIRECT_URL conferidos como idênticos antes e depois, sem imprimir valores.

Cinco testes novos cobrem habilitação/padrão, bloqueios de origem/host/proxy, ambiente publicado/produção/bind aberto, aluno sem promoção e desligamento retornando ao login por senha. Primeira execução isolada falhou em conexões Supertest por EACCES; repetição com permissão para rede local concluiu suíte completa com 141 aprovados, zero falhas/cancelamentos/ignorados. Build/typecheck aprovados. Conferência real sem cookie: perfil admin e turmas 200 em 3333/5173; X-Forwarded-For recusado com 401. Python /health 200; suíte Python não repetida. Senhas, usuários e migrações não foram alterados nesta etapa. Toda mudança de privilégio foi solicitada pelo usuário, mas o novo conjunto ainda aguarda validação antes de commit/push.

## Nome automático de turmas — 25/10/2026

Alteração em TurmasPage.tsx, turma-horarios.ts e styles.css: nome derivado da grade no modo automático, checkbox inicialmente marcado na criação, nome manual preservado durante alternância e ao editar cadastros personalizados. Referência estável: menor início válido, independentemente de agrupamento ou ordem. Nenhuma migração/rota alterada. Inferência na reabertura por comparação nome/sugestão documentada (não é preferência persistida).

Nova execução: build/typecheck aprovados, oito testes existentes de turma-horarios aprovados. Navegador com servidor exclusivo em 3336, identidade fictícia e SQLite em memória: nova turma marcada/readonly, 13h/13h30, manual independente do horário, texto manual restaurado ao alternar, segundo horário 9h30 tomando referência e remoção retornando 13h, gravação/reabertura automática, edição de nome personalizado sem renomeá-lo ao mudar o horário. Evidência salva com dados fictícios em docs/screenshots/turma-nome-automatico.png. Preenchimento inicial por fill no controle nativo de hora não surtiu efeito; usado teclado e conferido valor visível. Um seletor de botão de edição foi corrigido após inspecionar o cartão. Não são falhas da aplicação apresentadas como sucesso. Sem escrita em dados reais/Supabase nesses testes; Python, Prisma e suíte completa não repetidos. Aprovação de commit/envio ainda pendente.

## Verificação real de permissões de aluno — 23/10/2026

Conta fictícia criada exclusivamente em homologação com perfil aluno e FK para o próprio Aluno; administrador existente preservado. Dezesseis verificações HTTP aprovadas: login 200/perfil aluno, portal 200 com cadastro próprio e sem bloqueio, nove GET administrativos e quatro escritas administrativas recusadas com 403, logout 204. A senha randômica transitória não foi exibida e foi removida após o teste, junto com as sessões geradas. Estado entregue: senha ainda não definida, perfil aluno, convite de uso único válido por 24h, para ativação pessoal. Não houve alteração em regras de autenticação ou bypass administrativo. O convite inicialmente montado com fragmento #convite foi corrigido para #ativar antes da entrega, conforme AuthGate existente. Link completo somente em arquivo ignorado; testes completos da aplicação e ativação visual não repetidos nesta etapa.

## Supabase autenticado e migrado — 23/10/2026

Nova senha informada pessoalmente pelo usuário: autenticação aceita. Preflight e conferência final mostraram socket cliente encrypted/authorized=true. pg_stat_ssl via pooler representa outro trecho da conexão e não foi tratado como comprovação do TLS cliente. Banco público vazio confirmado antes da migração; CLI Prisma existente aplicou seis migrações, saída 0. Consulta posterior confirmou seis entradas concluídas e 16 tabelas (15 domínio + histórico), nenhum usuário. Não houve reset, seed ou cópia do SQLite. Nenhum arquivo de migração ou lógica funcional foi alterado.

API local iniciada com env-file de homologação, sem editar .env. GET / e GET /api/auth/estado retornaram 200 em 3333, com configuração inicial pendente e usuário nulo. Porta 5173 indisponível nessa etapa; frontend servido pelo build existente. Isso comprova leitura do repositório Prisma pela API, mas não substitui testes funcionais completos, Python ou hospedagem pública. Administrador será criado pelo usuário. Sem novo commit/push.

## Certificado e nova tentativa — 23/10/2026

Instalada a CA Supabase baixada pelo usuário em data/certificados (ignorado) e referenciada por sslrootcert na URI privada, com verify-full. Certificado CA e validade conferidos. A nova conexão ultrapassou TLS e foi recusada com 28P01; não se afirmou autenticação bem-sucedida e nenhuma migração/escrita ocorreu. Solicitada nova entrada privada da senha do banco. Teste existente de preservação ampliado para incluir sslrootcert ao alterar a senha; três testes do configurador aprovados nesta execução. Testes funcionais da aplicação não repetidos.

## Teste externo da conexão — 23/10/2026

Após a entrada privada da senha pelo usuário, foi realizada tentativa real com pg.Client e verificação TLS completa. Resultado: SELF_SIGNED_CERT_IN_CHAIN, antes de confirmação de autenticação/consulta. Nenhuma migração ou escrita no banco. Próximo passo: CA oficial do Supabase, mantendo verify-full. Corrigida a mensagem do configurador para “verificação TLS habilitada”, pois o utilitário não faz conexão nem comprova o certificado remoto. Senha e URI não foram impressas.

## Configuração privada da homologação — 23/10/2026

Adicionados comando de configuração, três testes de codificação/validação/preservação e guia HOMOLOGACAO.md. Testes finais: três aprovados, zero falhas; execução interativa Windows com senha fictícia, caracteres mascarados, gravação esperada e saída 0. A primeira fixture trocava uma parte do usuário em vez do nome do banco e foi corrigida. As tentativas de leitura direta de stdin no terminal Windows gravaram a fixture, mas aguardavam entrada adicional; substituídas por Read-Host/AsSecureString nativo, com senha encaminhada por pipe ao Node e memória BSTR liberada no finally. Não se apresentou terminal pendente como execução concluída. Interação não-Windows ainda não conferida.

O script não acessa a rede. Arquivo real .env.homologacao continua ignorado pelo Git, separado de .env e SQLite. Conferência inicial da URI real foi limitada a indicadores de protocolo/host/porta/projeto e marcador de senha, sem imprimir credenciais. Supabase ainda não autenticado/migrado; Render não configurado. Não foram repetidos os 136 testes da aplicação ou 13 Python nesta preparação; os resultados anteriores são históricos. Sem aprovação de commit/push para este novo conjunto.

## Nova verificação dos planos antes de commit — 22/10/2026

Autorização explícita: “testa e commita”. Nova execução concluída com 136 testes TypeScript e 13 Python aprovados, zero falhas; build/typecheck, geração do Prisma Client e validação de schema aprovados. Revisão do diff e arquivos novos: regras, transações, permissões, UI, migrações aditivas, testes e documentação correspondem ao conjunto apresentado. Não houve mudança de lógica nesta etapa de envio.

Pendências de aprovação abaixo passam a ser históricas. Conferências visuais e preservação dos dados da implementação não foram repetidas nesta etapa; PostgreSQL/Supabase, IA e hospedagem externos continuam não validados. Commit/envio autorizado somente à branch de trabalho, sem merge, nova tag ou implantação.

## Planos e liberações — 22/10/2026

Nova entrega local, após commit 32dcd35. **136 testes TypeScript aprovados**, zero falhas; 15 casos novos de regra/HTTP/migração. **13 Python aprovados** em nova execução; build/typecheck, geração de Prisma Client e schema aprovados. Execuções intermediárias tiveram 134/135 (fixture de cancelamento inválida) e 135/136 (consulta/fechamento da fixture de migração); testes corrigidos conforme o banco, sem alterar restrições do produto, e suíte completa repetida com sucesso.

Revisados: cota derivada da semana/data da aula, check-in e chamada unidos por aula, exclusão de ausências/cancelamentos, registros antigos presentes, contagem extra separada, idempotência, disputa HTTP pela última vaga e isolamento de dados/permissões. O servidor valida na transação de check-in; SQLite BEGIN IMMEDIATE sem awaits na gravação; Prisma bloqueia aluno e usa bloqueios compatíveis para configuração/liberação/limpeza. PostgreSQL gerado, mas concorrência/SQL externo não executados.

Navegador com banco em memória verificou cota 1/1, mudança para três preservando uso, retorno para um, autorização administrativa da aula das 15h e check-in do aluno nessa aula; outra aula permaneceu restrita. Resumo mostrou 1/1 mais uma extra. Tela estreita sem overflow: ficha/documento 390/390, diálogo 343/343, cartão 302/302; portal 375/375, cartão 342/342 px. Override restaurado. Capturas fictícias em PLANOS.md; sem telefone físico.

Migração real 5→6 criou backup academia.sqlite.antes-v6-3ae53d88-c3c2-4988-915a-343b777562d8.sqlite. Treze hashes/contagens iguais antes/depois, duas tabelas novas vazias, zero violações de FK. Nenhum plano/cota/cobrança/senha foi atribuído aos alunos reais. Servidores locais reiniciados para carregar backend atualizado após identificar instância anterior na porta 5173.

Limites: administração pode registrar presença real acima da cota; alteração de plano afeta a semana atual sem reset; pendentes antigos da semana ocupam vaga até resolução. Não há catálogo de planos, cobrança/valor de excedente, limite por turma, reserva futura, pagamento/e-mail/hospedagem ou validação externa de Supabase/IA. Consultas ainda percorrem coleções completas. Código e docs aguardam validação do usuário antes de commit/push; aprovação anterior não cobre esta entrega.

## Verificação final autorizada — 22/10/2026

O usuário autorizou commit/envio se os testes passassem. Nova execução concluída: 121 testes TypeScript aprovados, zero falhas/cancelamentos/ignorados; 13 testes Python aprovados; typecheck das duas aplicações e build Vite aprovados; Prisma Client gerado e schema válido. Verificação documental: 16 documentos, 82 links locais, nenhum destino ausente. Escopo: chamada, horários combinados, aniversários, login/portal e bloqueio financeiro. Sem alteração de lógica nesta etapa de envio.

Revisão inclui arquivos modificados e novos, migrações aditivas, isolamento de acesso, restrição financeira no servidor e documentação dos recursos futuros. Evidências de navegador e comparação dos dados reais abaixo são anteriores, sem nova execução nesta etapa. Nenhuma validação externa PostgreSQL/Supabase, IA, e-mail ou serviço de pagamentos foi realizada.

Uma tentativa de patch documental não encontrou o título exato de TURMAS.md e foi recusada antes de gravar; os títulos e arquivos foram conferidos, o patch foi corrigido e aplicado. A falha de edição não foi tratada como validação de produto. Aprovação atual supera as pendências históricas abaixo; envio limitado à branch de trabalho, sem alterar main ou tag v1.0.0.

## Revisão inicial
- Risco: status atrasado armazenado pode ficar incorreto ao virar o dia. Correção: calcular pelas datas.
- Risco: apagar aluno com cobranças elimina rastreabilidade. Correção: restrição de exclusão e opção de inativação.
- Risco: comparar frequência de mês parcial com mês completo. Correção: comparar janelas equivalentes.
- Risco: valores monetários como float. Correção: centavos inteiros.
- Sugestão rejeitada: adicionar XAMPP ao ambiente. Motivo: não integra a stack Node/PostgreSQL escolhida.

## Limites conhecidos
- Supabase e IA precisam das credenciais do usuário; configuração não equivale a teste de integração externa.
- MVP local com administrador único; autenticação e autorização precedem publicação com dados reais.
- O desafio exige SQL e recomenda PostgreSQL/Supabase. PostgreSQL faz parte da stack escolhida, mas sua conexão e as operações externas ainda precisam de validação.

## Erros encontrados e corrigidos durante a execução
- O helper de criação de cobranças nos testes estava marcado async e devolvia Promise em vez do objeto Supertest. Typecheck encontrou o problema; retirado async e executados os testes novamente.
- Preflight do Tailwind zerou a margem padrão do dialog, posicionando o formulário no canto. Detectado na inspeção visual; restaurada margin:auto.
- Auditoria inicial encontrou quatro alertas altos em dependências transitivas do CLI Prisma (deepmerge-ts e mysql2). Overrides para versões corrigidas mantiveram Prisma 7. A reinstalação retornou zero vulnerabilidades.

## Validação final — 09/10/2026
- TypeScript estrito: API e frontend verificados.
- Build Vite: concluído com sucesso.
- 12 testes Node/Supertest aprovados: CRUD, buscas, duplicidades, datas inválidas, valores, vínculos, proteção do histórico, transição de status, presença, IA não configurada e persistência após reabrir o banco.
- 8 testes Python aprovados: banco vazio, limite de vencimento, regras de risco, janelas equivalentes, pagamento posterior à referência, receita por data do pagamento, ausência de divisão por zero e inativos.
- Aplicação local iniciada com Vite, Express e Uvicorn. UI mostrou 20 alunos, 17 ativos e métricas calculadas pelo Python. Conferidas navegação, listagem e formulário de alunos, presenças e indicadores.
- Supabase/PostgreSQL e chamadas externas de OpenAI permanecem sem validação ponta a ponta porque nenhuma credencial foi fornecida. A UI identifica banco local e assistente aguardando ativação.

## Averiguação de arquitetura e migrações — 19/10/2026

Após apontamentos trazidos pelo usuário, foram reproduzidos três cenários isolados: tabela SQLite antiga sem atualização de coluna, falha do histórico independente do cadastro e resposta analytics incompatível aceita sem validação de runtime. O efeito do Promise.all na recarga do frontend foi analisado pelo código; não houve teste de navegador desses cenários.

Nesta execução, typecheck, os 12 testes da API, os 8 testes Python e Prisma validate passaram. Isso confirma a base atual, mas não elimina as lacunas de evolução/integração reproduzidas. A migration inicial PostgreSQL existe; não foram aplicadas migrations em servidor externo e não existe transferência automática de dados SQLite/PostgreSQL.

Evidências, limites dos testes e recomendações estão em [REVISAO_ARQUITETURA_MIGRACOES.md](REVISAO_ARQUITETURA_MIGRACOES.md). Nenhum código da aplicação ou cadastro real foi alterado na averiguação.

## Correções e nova validação — 19/10/2026

Implementadas após autorização do usuário: migrações SQLite, isolamento do carregamento React e validação do contrato Python/Node. Foi extraído o serviço de analytics; as outras rotas permanecem na composição atual. As regras de cobrança, datas e risco foram preservadas.

| Verificação executada | Resultado |
| --- | --- |
| npm test | 30 aprovados: 12 anteriores, 8 de migração, 6 de contrato HTTP com Python substituto e 4 de carregamento |
| npm run test:analytics | 12 aprovados: 8 cálculos anteriores e 4 cenários de entrada inválida |
| npm run build | Typecheck API/frontend e compilação Vite aprovados |
| Banco local após iniciar a API corrigida | Backup criado, versão 1 registrada, mesmas linhas e hashes nas quatro tabelas de negócio; foreign_key_check vazio |
| GET health/alunos/mensalidades/presencas/dashboard/analytics/analises | Sete respostas 200; analytics calculado pelo Python real, com 17 ativos e 7 alunos em risco no mês observado |
| Navegador com falha de histórico e Python incompatível | Dashboard e cadastro carregaram; indicadores e histórico mostraram erros próprios |
| Recuperação dos serviços de teste | Tentar novamente recuperou histórico e indicadores sem recarregar a página |
| Cadastro fictício no navegador de teste | Aluno criado; filtro de busca mantido após a atualização dos dados |

Os testes de falha no navegador usaram um processo separado, SQLite em memória e registros fictícios. Não alteraram o banco local do usuário. Na sua base local, somente o controle de migrações foi acrescentado: 20 alunos, 110 mensalidades, 425 presenças e zero análises permaneceram idênticos por comparação SHA-256 das linhas ordenadas antes/depois. Evidências e capturas desta conversa foram salvas na pasta externa `correcoes_2026-10-19`, sem credenciais.

Escolha revisada: não preencher automaticamente uma faixa ausente em schema desconhecido. Isso inventaria um dado cadastral. O runner interrompe, preserva o backup e exige uma transformação explícita; o teste de evolução de versão 2 usa campo opcional apenas na base temporária de teste.

Durante a validação visual, o preenchimento automatizado de data precisou de eventos de teclado para atualizar o formulário React; a mensagem de data inválida foi conferida antes de repetir o envio. O cadastro posterior foi concluído no ambiente isolado. O controle de atualização da tela foi verificado pelo filtro mantido, não apenas pelo status HTTP.

Limites: não houve chamada a provedor externo de IA nem execução PostgreSQL/Supabase. O teste HTTP real Node/Python é uma conferência manual desta execução; não foi criado um teste automático que inicia os dois processos. As migrações não convertem qualquer schema antigo, e a modularização completa da API permanece futura. O usuário aprovou a finalização do conjunto para commit e envio ao GitHub com “pode finalizar as alterações”.

Na revisão final foi acrescentada invalidação do dashboard ao trocar o mês, conservando os cadastros carregados, e limpeza do contexto dos indicadores durante a consulta. Um teste adicional verifica que a troca exige novos totais sem descartar alunos; por isso o total final é 30 testes TypeScript e 12 Python.

## Entrega 1A — turmas e grade fixa — 19/10/2026

Implementada após o usuário autorizar começar as pequenas entregas. Código, tabelas e fluxo descritos em [TURMAS.md](TURMAS.md). As evidências abaixo são desta execução, posteriores às correções anteriores.

| Verificação | Resultado observado |
| --- | --- |
| npm test | 42 aprovados: base anterior, dez novos de turmas, um de migração/persistência e um de isolamento de carregamento |
| npm run test:analytics | 12 aprovados; fórmulas não modificadas |
| npm run build | Typecheck da API/frontend e build Vite aprovados |
| npm run db:generate e Prisma validate | Cliente gerado e schema válido; não comprovam execução no PostgreSQL |
| Migração sobre arquivo temporário v1 | Atualiza para v2, preserva as quatro tabelas, gera backup e mantém turmas/grade/vínculos após reabrir |
| Falha intencional de FK na gravação transacional | Reverte metadados, horários e vínculos da turma; nenhum estado parcial persistido |
| Banco local antes/depois de aplicar v2 | Mesmos hashes e contagens: 20 alunos, 110 mensalidades, 432 presenças e zero análises; backup anterior criado; foreign_key_check vazio |
| Cadastros de turmas no banco local | Zero turmas, horários e vínculos após a migração; nenhuma turma de teste inserida |
| HTTP local: health/alunos/mensalidades/presencas/dashboard/analytics/analises/turmas | Oito respostas 200; Python real disponível; IA não configurada |
| Navegador com SQLite em memória e seed fictício | Cadastro de duas turmas, aluno em ambas, dois horários no mesmo dia, edição/vínculos, erro de sobreposição e correção, filtro mantido, detalhes, desativação/reativação e grade semanal conferidos |
| Tela estreita | Grade e formulário conferidos, sem transbordamento horizontal; dimensões e limites em TURMAS.md; override removido ao terminar |

Revisão de desenho: grade fixa não gera presenças nem altera a grade antiga de chamada; os vínculos não equivalem a permissões de um plano. A gravação precisa ser atômica e os novos módulos ficam separados da composição principal. Os arquivos já aplicados de migração não foram reescritos.

Na automação visual, preencher os campos de horário sem evento de teclado não mantinha o valor após a renderização seguinte. Foi conferida a validação do formulário e repetido o preenchimento com teclado antes de aceitar o cadastro. Isso é uma limitação do preenchimento automatizado observado; não foi ocultada como um teste de sucesso da primeira tentativa. O servidor inicial ainda executava o código anterior; foram identificados seus processos antes do reinício e usados servidores de teste separados.

Limites: as verificações de navegador são desta sessão, não uma suíte de CI. PostgreSQL/Supabase e IA externa continuam sem validação. Professor é um nome cadastral, sem autenticação; não há aulas datadas, aula extra, nova chamada, limite comercial ou portal implementados. A edição completa ainda usa última gravação sem controle de versão concorrente. Na apresentação, a aprovação do usuário para commit/push ainda estava pendente.

A revisão final encontrou uma orientação ambígua gerada por Codex: a mensagem de exclusão podia sugerir que inativar um aluno permitiria apagá-lo mesmo com vínculos. Foi corrigida para explicar que inativar é uma alternativa de preservação; excluir exige remover os vínculos e não ter cobranças. O teste agora também confere que aluno inativo vinculado continua protegido. A suíte TypeScript foi reexecutada após esse ajuste.

### Incremento de exclusão definitiva, após pedido do usuário

- `npm test` reexecutado: **44 aprovados**. Os dois novos testes conferem exclusão de turma ativa/inativa, preservação de aluno/cobrança/presença, recriação com ID novo e rollback se a remoção da turma falhar. Casos de DELETE inexistente/inválido também conferidos.
- `npm run build` reexecutado após o incremento e ajuste de layout: typecheck e Vite aprovados. Os 12 testes Python anteriores desta entrega não foram apresentados como reexecução após esse incremento; Python não mudou.
- Navegador fictício: botão nos cartões, confirmação explícita e cancelamento mantendo as duas turmas; lista estreita sem transbordamento. A exclusão efetiva foi validada nos testes HTTP/SQL, sem executar exclusão no banco do usuário.
- Reinício do servidor: as sete tabelas permaneceram idênticas por contagens e hashes. A base já continha uma turma, três horários e três vínculos, que foram preservados, além dos 20 alunos, 110 mensalidades, 432 presenças e zero análises.
- Não foi necessária migração adicional; SQLite e Prisma possuem método transacional de remoção. A execução PostgreSQL continua não comprovada. Na apresentação, commit, push e novo marco de versão ainda aguardavam validação/aprovação correspondentes.

### Revisão para commit, após aprovação

O usuário autorizou o conjunto com “pode commitar”. Codex revisou os diffs de implementação, migrações, testes e documentação, conferiu a branch `codex/reestruturacao` e confirmou que o remoto ainda apontava para `fb7600a` antes do envio. A tag remota `v1.0.0` permaneceu na referência inicial. Foram atualizados somente os registros de aprovação, sem mudança adicional de comportamento ou nova execução dos testes da aplicação. A aprovação não inclui novo marco de versão, merge ou implantação.

## Entrega 1B — aulas datadas — 19/10/2026

Autorizada pelo usuário com “bora”, após a proposta da próxima etapa. Desenho registrado antes do código em ARQUITETURA.md; uso e contratos em [AULAS.md](AULAS.md).

| Verificação nova | Resultado observado |
| --- | --- |
| npm test, execução final | 61 aprovados, zero falhas: 44 anteriores, 15 de aulas, um de migração e um de carregamento |
| npm run test:analytics | Nova execução com 12 aprovados; Python/fórmulas não mudaram |
| npm run build | Typecheck e Vite aprovados; repetido após ajuste de textos da interface |
| npm run db:generate e Prisma validate | Cliente gerado e schema válido; não comprovam execução PostgreSQL |
| Grade, extras, filtros, datas | 12h/18h + extra 15h, dia da semana, futuro/bissexto, horários inválidos, turmas inativas e filtros conferidos |
| Repetição/concorrência | Mesma origem/data não duplica; cancelamento conserva o primeiro motivo/timestamp, inclusive em requisições concorrentes |
| Fotografia histórica | Mudar grade, professor, vínculos ou nome do aluno não altera aulas/previstos anteriores; excluir cadastro deixa referência null, conservando nomes |
| Transações | Falha na previsão não deixa aula parcial; falha após DELETE da turma reverte grade, vínculos e desvínculo das aulas |
| Migração v2→v3 em arquivo temporário | Sete tabelas com registros preservadas, backup v2 e reabertura mantendo aula/previstos/cancelamento |
| Banco local | Mesmos hashes/contagens nas sete tabelas anteriores; 20 alunos, 110 cobranças, 432 presenças e zero análises/turmas/horários/vínculos; duas novas vazias; backup antes-v3 e FK check sem inconsistências |
| HTTP real local | Nove rotas da API e frontend 200; analytics disponível; IA sem chave |
| Navegador fictício | Criação de duas fixas + extra, rejeição de intervalo errado, correção, busca/filtros, dia/Hoje, detalhes dos previstos, retorno sem cancelar e cancelamento com motivo |
| Responsividade | Agenda/cartões/formulário/nav sem transbordamento; sete destinos em duas linhas; medidas e capturas em AULAS.md; viewport restaurado |

Uma execução em paralelo ao build no ambiente restrito retornou EACCES nas conexões HTTP de loopback (17 testes locais passaram e 43 dependentes de rede falharam). Após permitir as conexões locais, os 60 testes daquele momento e os 12 Python passaram. Foi acrescentada a conferência de rollback das referências históricas e fortalecida a base do teste de migração; a execução final passou com 61 testes TypeScript. Esse bloqueio de ambiente não foi apresentado como erro de regra corrigido no produto ou como execução aprovada.

Decisão revisada: apontar uma FK diretamente da aula ao horário da grade seria incompatível com a substituição de horários usada pela edição de turmas. A origem ficou como chave histórica, com unicidade por origem/data, e os dados relevantes foram copiados para a aula. Turma/aluno têm referências opcionais SET NULL e nomes históricos próprios. Isso preserva a exclusão definitiva solicitada pelo usuário sem apagar os encontros. A explicação da confirmação de turma foi atualizada para esse comportamento.

Limites na apresentação inicial da entrega 1B, antes do incremento abaixo: não havia PostgreSQL/Supabase/IA externa validados, autenticação, nova chamada, marcação de realização, edição/reativação/exclusão de aula ou cobrança por extras. Agendada não comprova aula realizada. Não há paginação nem bloqueio global de conflito entre professores/locais. A lista prevista não é presença ou inscrição. Os testes de navegador são verificações desta sessão, não suíte automática de CI ou teste em telefone físico. Não foram executadas exclusões, cancelamentos ou criação de aulas de teste na base do usuário. O Git desta entrega permanece aguardando sua validação.

### Incremento: exclusão definitiva de extras, após pedido do usuário

- `npm test` reexecutado: **65 aprovados, zero falhas**, incluindo os quatro testes adicionais de exclusão. Cobrem extras avulsas/vinculadas e agendadas/canceladas, retorno 204 e 404 após remoção, preservação dos demais registros, recriação com ID novo, proteção de grade fixa na API/repositório, falha após remover a aula com rollback dos previstos e duas exclusões simultâneas com uma remoção e um 404.
- `npm run build` reexecutado: typecheck e Vite aprovados. Python não foi modificado nem reexecutado no incremento; os 12 testes citados acima pertencem à execução anterior. PostgreSQL/Supabase e IA externa continuam sem validação.
- A revisão confirmou checagem da origem antes de remover os previstos nos dois repositórios e operação transacional; não foi necessário alterar schema ou SQL aplicado. Nova rota DELETE /api/aulas/:id permite somente extras. Confirmar remoção apaga seu histórico/lista prevista, enquanto cancelar preserva o encontro.
- Navegador em memória: extras agendada/cancelada com Excluir, fixa sem botão; abertura pelos cartões e detalhes, confirmação e Voltar preservando três encontros. Não foi pressionado Excluir definitivamente pelo navegador; a remoção efetiva foi verificada nos testes HTTP/SQL. Capturas fictícias em AULAS.md.
- Tela estreita: documento 341/341 px, cartões 304/304, ações 270/270, diálogo 323/323 (client/scroll); três botões acessíveis com quebra de linha, sem transbordamento. Override removido após conferência.
- Atualização dos servidores: nove tabelas com contagens e hashes iguais, incluindo uma aula existente do usuário, 20 alunos, 110 mensalidades e 432 presenças. Nenhuma aula real foi removida. Seis rotas de consulta e interface responderam 200. SQLite permanece versão 3, sem migração adicional.

Limite para a próxima implementação: as presenças atuais ainda não têm aulaId. Ao implementar 1C, preservar histórico e definir proteção de exclusão para encontros com presenças, antes de permitir remoções nesse novo modelo. A entrega 1B, incluindo este incremento, permanece local aguardando validação para commit/push.

### Revisão para commit da entrega 1B — 20/10/2026

O usuário aprovou com “pode commitar” após os esclarecimentos sobre a exclusão. Revisados os diffs de código, migrações, testes e documentação do conjunto apresentado; Git/remoto conferidos em `507d260` antes do envio, tag v1.0.0 preservada. Apenas registros de aprovação foram atualizados nesta etapa, sem nova mudança de comportamento ou reexecução da aplicação/testes. Os resultados de 65 TypeScript, build e 12 Python permanecem associados às execuções identificadas acima. PostgreSQL/Supabase/IA externa continuam sem validação. A aprovação não inclui tag/release, merge ou implantação; os registros de pendência anteriores são históricos.

## Revisão da renomeação de branch — 21/10/2026

Após o usuário escolher `codex/evolucao-tatame`, Codex conferiu o estado local e remoto e utilizou a renomeação nativa do GitHub (HTTP 201), seguida da atualização da branch/acompanhamento local. As conferências comprovaram HEAD `dd3212e` e árvore de arquivos idênticos, main local/remota em `618c1b3`, mesma tag inicial e ausência de alterações em arquivos ao concluir a renomeação. Não havia PR aberto associado; a consulta do nome antigo passou a retornar redirecionamento HTTP 301.

Revisão documental: as instruções atuais passam a usar o nome novo, enquanto registros datados de entregas anteriores mantêm o nome usado na época. Os pacotes de estudo são fotografias dos commits originais; o usuário precisa informar o novo nome na conversa que consulta o GitHub, sem regenerar o manual. Os ajustes ficam locais para validação antes de commit/push.

Não foram modificados código, dependências, configuração de execução ou banco, nem executados novamente os testes TypeScript/Python/build. Esta conferência verifica a renomeação e a coerência documental; não representa um novo teste funcional ou validação de integrações externas. Não foram criadas develop, PR, release, nova tag ou implantação.

Após a validação do conjunto apresentado, o usuário autorizou seu commit/push com “pode commitar”. A revisão para registro abrange os sete documentos relacionados e os registros dessa aprovação; não altera a aplicação nem reapresenta resultados históricos de testes como execução nova. O resultado remoto será confirmado após o envio.

## Revisão da chamada por aula — 21/10/2026

O conjunto 1C começou após nova autorização do usuário. Git limpo em `1778e67` na branch `codex/evolucao-tatame`; desenho anterior ao código. Nova tabela preserva os registros antigos e evita atribuir horários que não foram informados. A unicidade aula/aluno permite vários treinos no dia e impede repetição dentro da mesma aula. A lista prevista não cria marcações automaticamente.

- **Execuções novas aprovadas:** npm test (81 TypeScript), npm run test:analytics (13 Python), npm run build (inclui typecheck), npm run db:generate e prisma validate. Dezesseis cenários adicionais TypeScript: 13 de chamada, um de migração v3→v4, dois de analytics. Python recebeu um caso de vários treinos no mesmo dia, sem alterar a fórmula. A revisão final identificou possibilidade de consultas separadas de aula/chamada observarem instantes diferentes durante limpeza/exclusão: substituído o acesso presumido à aula por erro 503 controlado e teste que comprova não enviar dados inconsistentes ao Python. TypeScript e build repetidos e aprovados; os 13 Python foram executados antes desse ajuste Node, sem mudança posterior no Python.
- **Correções durante implementação:** dois erros TypeScript de variável possivelmente indefinida foram corrigidos normalizando o valor antes da asserção. Roteiro fictício ajustado de `create` para o método real `save` do serviço de turmas. Nenhuma regra do produto foi enfraquecida para ocultar esses erros. Primeiro processo fictício com rede restrita não respondeu no navegador; reiniciado com acesso local autorizado. Datas nativas exigiram eventos de teclado na automação para atualizar o estado React.
- **Revisão das transações:** criação/correção/limpeza, cancelamento e exclusão se coordenam no SQLite por transações síncronas; no Prisma, bloqueio da linha de aula dentro da transação e bloqueio do aluno na marcação. HTTP/SQL SQLite conferem concorrência com marcação, cancelamento e exclusão, repetição sem duplicação e falha SQL com rollback. O caminho PostgreSQL foi gerado/validado, não executado externamente.
- **Histórico protegido:** presença ou ausência bloqueia excluir/cancelar aula; aluno com marcação não pode ser excluído. Excluir turma preserva os registros. Corrigir/limpar permite lidar com marcação existente após inativação. Limpar é exclusão explícita com confirmação; ainda não há lixeira ou trilha completa de edições/autor autenticado.
- **Navegador isolado:** Ana nas aulas 12h/15h/18h, Bruno ausente às 12h, Carla incluída pontualmente; busca, totais, seletor, agenda/modal e página Presenças, avisos futuro/cancelado e registro legado conferidos. Limpar/Voltar mantém o registro; remoção efetiva validada por HTTP/SQL, não confirmada no navegador. Console dessa conferência sem erros. Nenhuma marcação de teste na base do usuário.
- **Responsividade:** após ajuste do seletor para ocupar uma linha no celular, documento 355/355 e ações 285/285 px (client/scroll). Prévia de computador também conferida em 1280×900, documento 1150/1150 px. Dados fictícios reconstituídos em memória para a captura final, sem tocar na base do usuário. Overrides restaurados. Capturas em CHAMADA.md; não é teste em aparelho físico.
- **Node → FastAPI/Pandas real local:** base fictícia resultou em cinco presenças (quatro novas por aula, uma antiga), Ana com quatro no mês e ausência não contada. Não agrupar por dia é deliberado; lançar o mesmo evento no formato antigo e novo pode contar duas vezes, pois não há horário no histórico antigo para reconciliar automaticamente. A interface e o guia avisam essa limitação.
- **Preservação local v3→v4:** antes/depois com nove hashes/contagens iguais, 20 alunos, 110 mensalidades, 433 presenças antigas e seis tabelas vazias. Backup `academia.sqlite.antes-v4-f5f2789d-8355-4f96-9fe4-db95126efaba.sqlite`; PresencaAula vazia e nenhum vínculo inválido. As tabelas de turmas/aulas já estavam vazias antes da migração. Oito GETs API e interface HTTP 200 após reinício.

Não houve IA externa, PostgreSQL/Supabase real, autenticação, plano, envio automático de mensagem ou implantação. Código, testes e registros foram escritos por Codex; o usuário definiu as regras e validará a entrega. **Aguardando validação antes de commit/push**, sem alteração da main, versão do produto ou tag v1.0.0.

## Revisão do agrupamento de dias em Turmas — 21/10/2026

Estado inicial: branch `codex/evolucao-tatame`, HEAD `1778e67`, conjunto 1C modificado e não aprovado para commit. As pendências foram preservadas. Escopo novo: facilitar seleção de dias no formulário sem mudar API, banco ou regras financeiras/chamada.

- `npm test`: **87 aprovados, zero falhas**. Seis novos testes do helper conferem Seg/Qua/Sex, agrupamento de horários existentes sem enviar IDs extras, edição sem mutar a origem, bloco sem dia, limite de 100 após expansão e dias inválidos/repetidos. Os testes HTTP anteriores também passaram nesta execução.
- `npm run build`: typecheck e Vite aprovados. Python e Prisma não foram modificados nem reexecutados no incremento. Os 13 testes Python e generate/validate anteriores pertencem à entrega 1C.
- Navegador/SQLite em memória: a turma existente com quatro horários abriu em dois blocos e salvar preservou seus quatro IDs e o aluno habitual. Nova turma criada com Seg/Qua/Sex 12h–13h e segunda 18h–19h. Sem dia exibiu erro antes da requisição; sobreposição foi rejeitada pela API, mantendo o formulário, e a correção permitiu salvar. Troca de sexta por terça preservou os três intervalos mantidos e removeu/adicionou apenas os dias escolhidos. Nenhuma turma fictícia foi criada na base local do usuário.
- Responsividade: viewport solicitado 390×844; documento 341/341, modal 309/309, seleção de dias 242/242 px (client/scroll), sete checkboxes disponíveis. Overrides restaurados. Capturas fictícias no guia TURMAS.md; não equivale a teste em telefone físico.
- Não houve nova migração, mudança na main/tag, alteração de versão do produto ou publicação. Incremento e chamada 1C aguardam validação antes de commit/push.


## Horários combinados, aniversário, login e portal — revisão final de 22/10/2026

Estado: branch codex/evolucao-tatame, HEAD 1778e67, chamada 1C e demais incrementos anteriores preservados como pendências locais. Implementação autorizada; nenhuma aprovação de commit/push para este conjunto.

- **TypeScript/HTTP:** npm test executado em 22/10, 112 aprovados, zero falhas. Cobre chamadas/migrações anteriores, oito casos do helper de combinações, quatro de aniversário e autenticação/portal: API sem sessão, separação admin/aluno, dados próprios, tentativa de alunoId alheio, senha inválida, cookies, expiração/logout, convite expirado/usado, redefinição, concorrência e check-in múltiplo sem duplicar.
- **Python:** npm run test:analytics reexecutado na retomada, 13 aprovados. Mantida fórmula de risco. Integração real local Node→FastAPI/Pandas em base fictícia: dois check-ins, uma confirmação de presença, indicador com um treino. O aviso pendente não foi contado como presença/falta.
- **Build e Prisma:** typecheck e Vite aprovados; Prisma Client gerado com Usuario/Sessao/CheckinAula. O SQL PostgreSQL equivalente está preparado, mas não foi aplicado em servidor externo. Nenhuma chamada ao provedor de IA foi validada.
- **Segurança revisada:** sessão em cookie HttpOnly/Strict, token aleatório e somente verificador no banco, validade de oito horas, impressão da credencial para invalidar login tardio com senha antiga; scrypt com sal próprio, erro genérico e limite de tentativas/concorrência. API faz a autorização e deriva alunoId da sessão. Escritas exigem cabeçalho e origem permitida, sem CORS liberado; hospedagem exige APP_ORIGIN HTTPS. Conta inicial só no computador local e sem senha padrão.
- **Concorrência e histórico:** chave única de check-in por aula/aluno e transações; PostgreSQL usa bloqueio de linha, ainda sem execução externa. Extra com aviso não é excluída, pode ser cancelada se não tiver chamada. Qualquer chamada mantém o bloqueio de cancelamento/exclusão. Convite é consumido condicionalmente e redefine a credencial/revoga sessões numa transação. O token de acesso não aparece no JSON do login.
- **Migração e preservação:** teste v4→v5 preenche dez tabelas, compara backup/dados e reabre com acesso/check-in persistidos. Na retomada, o servidor real já havia aplicado v5 e criado academia.sqlite.antes-v5-007fadd2-a0d2-4505-a297-3a14ac28e2df.sqlite. Comparação desse backup v4 com a base atual preservou os dez hashes/contagens: 20 alunos, 110 mensalidades, 433 presenças antigas, uma turma, três horários e demais anteriores vazias. Sem violações de FK; três tabelas novas vazias. Reinício adicional sem alteração desses dados. Não foi criada credencial real pelo agente.
- **Navegador:** contas/alunos fictícios em banco de memória. Ana fez check-in em duas aulas; futura indisponível; gestão mostrou avisos e confirmou presença, portal refletiu a confirmação. Consulta própria de mensalidade/perfil/histórico conferida em 21/10; fluxo principal repetido em 22/10 com o código final. Grade antiga de quatro horários manteve IDs/vínculo ao salvar; nova combinação com três dias e dois intervalos gerou seis itens. Aniversário ativo do dia aparece no dashboard/portal; amanhã e inativo ficam fora. As capturas atuais usam dados fictícios.
- **Responsividade:** viewport solicitado 390×844; portal/documento 341/341 px, modal de turma 309/309 e dias 242/242 px (client/scroll). Visual de computador também conferido; overrides restaurados. Não houve teste em aparelho físico. Uma API de captura recortava o lado direito apesar dos limites DOM corretos; capturas refeitas com getScreenshot e extensão JPEG correspondente.
- **Erros reais durante desenvolvimento:** execução inicial sem permissão de rede falhou com EACCES, depois passou com execução HTTP local autorizada. Teste de cancelamento tentou omitir campos obrigatórios de cancelada; fixture corrigida sem enfraquecer a restrição. Duas aplicações de patch documental foram recusadas por contexto inválido antes de gravar; os arquivos foram conferidos e atualizados de forma explícita. Revisão automática de aprovação de uma tentativa posterior ficou indisponível por limite de uso; aquela suíte não foi executada. Após a retomada, execução completa passou. Nenhuma dessas tentativas é contada como sucesso.

Limites: recuperação automática do administrador, perfil separado de professor, MFA, multiacademia, reservas futuras, planos/cotas, pagamentos online e mensagens externas continuam pendentes. Limitador em memória por processo; consultas ainda percorrem conjuntos inteiros. Autenticação local testada não equivale a implantação pública ou auditoria externa. Conjunto aguarda validação, sem commit/push e sem mudança de versão/tag/main.


## Bloqueio por atraso — 22/10/2026

- Estado inicial: codex/evolucao-tatame em 1778e67, pendências anteriores preservadas. Usuário autorizou implementar bloqueio e, depois, pediu registrar a integração automática de pagamento/banner para uma etapa futura. Nenhum commit/push autorizado neste conjunto.
- npm test: 121 aprovados, zero falhas. Nove casos novos: quatro determinísticos do helper e cinco HTTP de login restrito, payload mínimo próprio, vencimento hoje/futuro/alheio, atraso após abrir agenda, proteção direta do repositório, pagamento de todos os vencidos, mesma sessão, reversão e preservação de histórico/senha/cadastro. A execução anterior deste incremento teve 120/121 por teste que enviava null ao PATCH de pagamento; corrigido para PUT de edição já existente e repetido com sucesso. Nenhuma validação do produto foi relaxada.
- npm run build: typecheck e Vite aprovados. Sem mudança de schema ou migração; Prisma recebe verificação financeira na transação existente, ainda sem execução externa. Não houve mudança no serviço Python ou fórmula de risco; os 13 testes Python anteriores não foram reexecutados nem apresentados como execução nova.
- Navegador com banco em memória e aluna fictícia: aviso de mensalidade vencida em 10/10, dados privados do portal indisponíveis, check-in recusado por HTTP 403. Pagamento fictício via API administrativa; botão de consulta liberou a mesma sessão e um novo check-in funcionou. Mensagem e cartão em tela estreita: documento 375/375 e cartão 342/342 px (client/scroll), sem transbordamento. Viewport restaurado. Capturas em BLOQUEIO_FINANCEIRO.md; não é teste em aparelho físico.
- O servidor calcula a restrição a partir de cobranças existentes, não de uma flag nem de informação do navegador. GET do portal restrito fornece somente mensagem e campos financeiros mínimos próprios; PUT de check-in revalida na transação. Login permanece disponível para orientação e saída, administração para confirmar pagamentos, e qualquer histórico permanece guardado. Dados são descartados da tela se a consulta falhar. Estornos/correções de vencidos podem voltar a restringir.
- Base real antes/depois do reinício: treze tabelas com hashes/contagens iguais, schema 5, zero violações de FK. 21 alunos, 110 cobranças, 433 presenças antigas, uma turma, três horários, uma conta, uma sessão e demais vazias. Novos registros de aluno/acesso já estavam presentes no snapshot anterior ao reinício. Nenhum pagamento, check-in, aluno ou credencial fictícia foi inserido nessa base.
- Não há integração bancária, confirmação de pagamento por provedor, multa, carência configurável, liberação manual de exceção ou novo aviso destacado de paga/a vencer. O usuário deixou integração/banner para etapa final; status financeiro já pode ser consultado no portal quando regular. E-mail permanece separado. O incremento está local para validação antes de commit/push.

## Edição individual de nome — 26/10/2026

Revisado update parcial: somente titulo pode ser enviado; ID inválido/inexistente retorna 404, nome inválido/campos extras retornam 400, sem sessão 401 e aluno 403. Não exige migração; permite correção de nome de cancelada sem apagar motivo/data. Não reescreve turma/grade/outras aulas nem snapshot financeiro. Testes verificam chamada, check-in, débito, republicação e novas datas. Quatro novos testes e suíte completa (210), build/typecheck e UI de salvar/Voltar aprovados. Sem nova prova PostgreSQL/Python deste incremento. Implementação feita pela IA e aguardando validação humana antes de commit; não atribuir autoria manual ao usuário.

## Confirmados, remoção e telefone — 26/10/2026

Revisão: não contar previsão como confirmação; preservar ausência e impedir repetição simples de check-in; saldo recalculado na mesma transação da exclusão; manter financeiro separado; rejeitar não administrador. Repetições concorrentes e rollback testados em SQLite, incluindo proteção de outro encontro e débito pago/pendente. Máscara compartilhada com cursor e exclusão junto à pontuação; validação do formulário sem trocar contrato do backend. Modais receberam IDs únicos para rótulos de confirmações sobrepostas. Resultado: 222 testes TypeScript, build/typecheck e conferência visual fictícia aprovados. Sem nova prova externa Prisma/PostgreSQL nem teste físico no celular. Botão duplicado retirado conforme esclarecimento da posição já pedida; vários professores é novo incremento.

## Lista de professores — 26/10/2026

Revisados migração aditiva sem reescrever histórico, nomes ordenados, rejeição de duplicados normalizados, autorização administrativa e transação de lista/resumo. Cinco testes novos cobrem rollback/concorrência, migração e isolamento do encontro. Ajustes nos testes anteriores consideram nova versão/campo sem apagar assert de preservação. Corrigida fixture de horários sobrepostos e uso de objeto SQLite sem protótipo; regras de produção não foram relaxadas. Resultado: 227 testes TypeScript, build/typecheck, geração/validação Prisma e UI fictícia passaram. SQLite v11 com backup/preservação real, PostgreSQL ainda v10. Não afirmar validação externa por tipagem/configuração. Implementação pela IA, pendente de validação humana/commit.
