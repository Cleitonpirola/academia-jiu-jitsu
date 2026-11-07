# Regiões de hospedagem do Tatame

## Endereço principal de testes

O responsável confirmou a validação pelo navegador. O projeto brasileiro `tatame-test`, com a prévia em `gru1` e o banco em `sa-east-1`, passa a ser o endereço principal de testes. Na comparação final das 34 tabelas em comum, os EUA tinham 82 registros e São Paulo tinha 105. As diferenças estavam todas no Brasil, sem registros exclusivos dos EUA a copiar nem conflitos. O resultado inclui mudanças em sessões e fotos de perfil. [Abrir o Tatame Test protegido](https://tatame-homologacao-hqqu2tghr-cleiton-pirola.vercel.app/).

Com autorização do usuário, repetimos a comparação e retiramos de uso o endereço antigo dos EUA com uma regra reversível no firewall da Vercel. O endereço antigo que estava em uso passou a responder HTTP 403, e a prévia de São Paulo continuou redirecionando para a autenticação da Vercel. A regra `Retirar Tatame Test EUA de uso` está ativa apenas no projeto Vercel `tatame-test-eua`. O banco original permanece disponível para retorno. Excluir o projeto Supabase exige autorização própria.

## Preparação para a troca de ambiente

O projeto brasileiro aparece como `tatame-test` na Vercel e no Supabase. A comparação em leitura com TLS conferiu 34 tabelas em comum. Os EUA tinham 82 registros e correspondiam à cópia inicial. São Paulo tinha 105 nas tabelas em comum, contando a migração adicional de recuperação. As diferenças estavam todas no Brasil, sem conflitos nem dados exclusivos dos EUA a copiar. A tabela brasileira de recuperação estava vazia. Não havia usuários do Supabase Auth, buckets ou objetos de Storage em nenhum dos dois projetos.

A API executada localmente com o PostgreSQL brasileiro passou em 24 verificações, incluindo login de professor e aluno e permissões. As contas fictícias foram revertidas e sua remoção foi conferida. Na Vercel, a prévia brasileira estava READY em `gru1` e respondeu com o redirecionamento de autenticação. O endereço antigo dos EUA também respondeu. Falta validar o login pelo navegador na prévia brasileira antes de torná-la o endereço usado nos testes. Repetir a comparação imediatamente antes da troca. [Abrir a prévia protegida de São Paulo](https://tatame-homologacao-hqqu2tghr-cleiton-pirola.vercel.app/).

## Comparação antes da troca — 05/11/2026

As 34 tabelas foram comparadas em leitura com TLS verificado, usando a cópia inicial como referência. Os EUA tinham 82 registros e correspondiam à cópia inicial. O Brasil tinha 109 registros. As diferenças estavam no Brasil, sem alterações exclusivas dos EUA nem conflitos. O resultado vale para o momento da consulta e inclui mudanças de sessões. A conferência deve ser repetida antes da troca para preservar as mudanças já feitas no Brasil.

A API local conectada ao PostgreSQL brasileiro passou em oito verificações de acesso e exclusão de comunicados. O teste usou cadastros fictícios e desfez a transação. Também passaram os 15 testes Python e uma chamada local da API Express ao serviço Python. A prévia protegida está pronta na Vercel. Falta a validação pelo navegador na prévia antes da troca definitiva.

## Decisão e estado em 04/11/2026

**Atualização de 05/11/2026:** a validação do usuário revelou ajustes no acesso familiar. Nova prévia protegida `dpl_F43wMCTdb1PS9pp6NTq8nfgWi6vF`, https://tatame-homologacao-bomdkv0wn-cleiton-pirola.vercel.app, READY em staging/gru1. Somente três fontes mudam em relação à prévia brasileira anterior: familia.ts, ControleParental.tsx e StudentsPage.tsx. 159 fontes remotas conferidas por hash, zero divergências; SSO global preservado. 287 testes e build/typecheck locais aprovados, com QA visual fictícia. Nenhuma migração, sincronização ou mudança definitiva de banco feita por essa atualização. O usuário já interagiu com o destino: comparar também alterações do banco brasileiro antes de qualquer sincronização futura; não restaurar cegamente o snapshot antigo. Commit/push e validação final ainda pendentes.

**Decisão de acesso à prévia:** usuário escolheu “Manter protegido; entro pela Vercel”. Não criar link temporário, token de compartilhamento ou exceção de proteção. Aberta a prévia protegida no navegador integrado para login pessoal do usuário na Vercel; testes visuais aguardam essa autenticação. A aprovação dos quatro passos não substitui a validação da prévia pelo usuário antes da troca definitiva.

**Prévia brasileira criada, ainda sem troca definitiva:** usuário autorizou executar os quatro passos de preparação/testes/sincronização/troca. Criado projeto Vercel separado `tatame-homologacao-br` (`prj_Rh5RqorbXgnj9eo0sczYWYgfUDwh`) para preservar os endereços ativos. Deployment `dpl_H2eZTp9KFGUANKRhrZ9NWwSJjwWK` READY, staging/Preview, região `gru1`, Node 24.x. URL protegida: https://tatame-homologacao-o3csj4b7s-cleiton-pirola.vercel.app. `DATABASE_URL` configurada como Secret somente em Preview, para Transaction pooler do banco brasileiro. Conferidos os hashes das 159 fontes remotas: iguais à versão online anterior, exceto `regions` no vercel.json. Nenhuma funcionalidade local pendente adicionada. Origem relida: 34 tabelas/82 registros, nenhuma diferença em relação ao snapshot, portanto sem dados novos para sincronizar nesse instante.

A Vercel atribuiu automaticamente Production ao primeiro deployment do projeto novo apesar do pedido staging. Ele foi cancelado durante o build (`dpl_Ck44ufv2fYGK7y3cyU3NqdFSm21W`); segundo deployment confirmado staging. Não foi cadastrada credencial em Production e o projeto anterior não foi alterado. SSO global do projeto novo permanece habilitado. O acesso pelo conector foi rejeitado pela revisão automática porque criaria/reutilizaria compartilhamento de até 23 horas sem autorização específica. Solicitada autorização para link temporário de apenas uma hora, com login Tatame preservado. Não contornar esse bloqueio sem resposta. Testes online/visuais e validação do usuário ainda pendentes; não afirmar troca concluída, apagar banco antigo ou enviar Git.

**Cópia e testes da API concluídos:** 34 tabelas, 82 registros e 19 migrações Prisma restaurados no projeto brasileiro. Conexão privada local validada com TLS verify-full. Leitura das 33 tabelas de domínio pelo Prisma e 24 verificações HTTP passaram em cada modo, Session (5432) e Transaction pooler (6543), totalizando 48 verificações. Contas fictícias e alterações de sessão ficaram em transações desfeitas; nova comparação das 34 tabelas após ambos os testes confirmou zero divergências. A aplicação publicada continua usando o banco original dos EUA. Não houve teste visual das telas, teste Python, prévia brasileira, troca definitiva, commit ou push.

O usuário pediu corrigir a escolha da região e justificar a melhor alternativa. O destino recomendado para o público brasileiro é **São Paulo**, mantendo banco e backend próximos entre si. É uma recomendação arquitetural baseada na localização esperada dos usuários, não um benchmark ou garantia de ganho. A configuração atual na região dos EUA também mantém banco e aplicação próximos; ela não foi identificada como defeito funcional.

| Componente | Estado confirmado | Destino preparado |
| --- | --- | --- |
| Banco que a aplicação usa | Supabase `tatame-homologacao`, `fnjcfpztsvnbvrkdbdsj`, `us-east-1` | Novo `tatame-homologacao-br`, `yptdxyjqgvzmkoizavmj`, `sa-east-1` |
| Backend publicado | Deployment `dpl_HzupaAG1JgiEW7KEKkiCZCG5oz2S`, região `iad1`, Preview/staging | Configuração candidata `regions: ["gru1"]`, ainda não publicada |
| E-mails | Resend em configuração; envio não validado | São Paulo (`sa-east-1`), decisão independente do banco |

O Supabase foi consultado pelo plugin: origem ACTIVE_HEALTHY e organização Cleiton Pirola no plano Free, com um projeto antes desta tarefa. A cotação para criar o novo projeto retornou **US$ 0/mês**, e o projeto brasileiro foi criado no mesmo plano/organização. Essa cotação não é garantia de custo ilimitado de toda a aplicação ou de futuras alterações de plano/consumo.

## Por que São Paulo

- É uma região próxima do público brasileiro esperado para o Tatame.
- Banco e backend no mesmo centro regional evitam acrescentar uma comunicação internacional a cada consulta entre eles.
- Mudar apenas a aplicação para o Brasil enquanto o banco continua nos EUA não atende esse desenho.
- Os arquivos estáticos do frontend são distribuídos pela CDN; a região das funções é uma decisão distinta.

Na configuração inicial foi selecionado o agrupamento Américas. A documentação atual do Supabase o mapeia para North Virginia. Isso explica a localização observada; não prova que houve comparação técnica na época. A revisão anterior do assistente não deveria ter classificado a escolha como necessariamente errada sem consultar também o backend. A consulta atual confirmou `us-east-1` no Supabase e `iad1` na aplicação.

## Preparação realizada

1. Criado projeto separado em São Paulo, sem apagar, pausar ou alterar a conexão do projeto original.
2. Origem lida em transação REPEATABLE READ READ ONLY, com TLS `verify-full`. Salvo backup lógico privado das 34 tabelas públicas: 82 registros no instante da leitura, incluindo 19 registros de histórico Prisma.
3. As 19 migrações locais foram conferidas contra os checksums do histórico de origem, admitindo apenas normalização de CRLF/LF. Dependências das tabelas foram ordenadas para a futura restauração.
4. Conferidos zero usuários Supabase Auth, zero buckets/objetos Storage e zero views públicas na origem. A autenticação do Tatame está em suas tabelas próprias e deve ser preservada na cópia.
5. Estrutura equivalente preparada no banco brasileiro a partir das migrações existentes. A plataforma registra uma migração de preparação própria; **isso não significa que o histórico Prisma já foi importado**.
6. Confirmadas 34 tabelas com RLS e nenhuma política pública. Advisors trouxe apenas avisos informativos `rls_enabled_no_policy`, esperados para acesso exclusivo via backend privado; não foram criadas políticas públicas para eliminar esses avisos.
7. Antes da importação, consulta de controle confirmou ausência de alunos, usuários, mensalidades, sessões, fotos e histórico Prisma no destino. Após autorização específica, as sementes do destino foram substituídas e a cópia foi restaurada em uma transação com guarda contra dados de usuário inesperados.
8. A primeira confirmação da ferramenta expirou sem executar; o usuário pediu reenviar. A nova execução foi concluída. A comparação adicional identificou perda de microssegundos apenas nas datas técnicas do histórico Prisma pela conversão Date do driver. O snapshot passou a ler JSON produzido pelo PostgreSQL; essas datas foram corrigidas exclusivamente no destino, por id/checksum/nome da migração. A comparação final das 34 tabelas passou integralmente em ambos os bancos.
9. Advisors manteve apenas o aviso informativo de RLS sem políticas. Nenhuma política de acesso público foi criada. Não foram realizados logins de teste nem modificações no banco original.

## Histórico da autorização da cópia

A primeira tentativa de importar a cópia foi rejeitada antes da execução. Motivo informado: o pedido de corrigir a região não especificava a transferência de dados pessoais, fotos, hashes de senha/sessões nem a limpeza das tabelas do destino. A operação não foi contornada.

Foi solicitada autorização explícita para copiar esse conjunto ao novo projeto na mesma organização e substituir somente os registros iniciais do destino. O usuário respondeu “Sim, autorizo essa cópia para o banco de São Paulo” e depois pediu reenviar a confirmação expirada. A cópia foi então executada e conferida. A troca da conexão publicada não está incluída nessa autorização.

O SQL privado de importação contém TRUNCATE restrito às tabelas públicas do novo destino, seguido da restauração na mesma transação. Esse SQL **nunca pode ser executado no projeto original nem repetido no destino preenchido sem revisão e autorização apropriadas**. Havendo novos registros na origem, reconciliar as diferenças antes da troca final, sem reaproveitar uma cópia desatualizada.

## Verificação da configuração candidata

Preparado arquivo candidato privado da Vercel com apenas a adição `regions: ["gru1"]`. O `vercel.json` ativo e as configurações online não foram alterados. A validação do campo `regions` contra seu subschema oficial passou e os demais campos são idênticos aos atuais.

A validação completa do schema não foi concluída: o schema oficial consultado declara Draft 4 mas contém `exclusiveMinimum` numérico de versões posteriores em gatilhos experimentais, incompatível com o validador Draft 4. A primeira tentativa com Ajv padrão também recusou o metasschema Draft 4; o Python disponível não tinha jsonschema. Instalado validador somente na pasta temporária, sem mudar dependências do produto. Não alegar que houve validação completa ou build remoto da configuração brasileira.

## Testes da conexão e da API — concluídos em 04/11/2026

História verificada: contas fictícias de professor e aluno autenticam pela API Express; o repositório Prisma consulta o PostgreSQL brasileiro; respostas respeitam os perfis e o logout revoga a sessão. O teste chama a aplicação real por HTTP local com Supertest, dentro de transação Prisma revertida intencionalmente. Não usa o atalho de administrador local e não acessa o banco original.

| Verificação nova | Resultado |
| --- | --- |
| Conexão `pg` com senha atual e certificado/hostname verificados | Passou |
| Comparação das 34 tabelas com o snapshot privado | 82 registros, zero divergências |
| Prisma: leitura de cada tabela de domínio | 33 tabelas em cada modo |
| API no Session pooler, porta 5432 | 24 verificações aprovadas |
| API no Transaction pooler, porta 6543 | 24 verificações aprovadas |
| Dados após rollback dos dois ensaios | 34 tabelas comparadas novamente, sem diferenças |

Incluídos: recusa de acesso sem login/senha errada, login professor/aluno, estado da sessão, consultas de alunos/dashboard/turmas/aulas/mensalidades/graduações/ranking mensal e anual, health do banco, portal/perfil/débitos/avisos/graduação próprios, restrição administrativa ao aluno e logout. Não foram testados nesta rodada: navegador/layout, check-in/cobranças por escrita, envio de e-mail, OpenAI, serviço Python ou execução na Vercel em gru1. A opção analytics apontou para porta local fechada para não enviar dados externos; seu funcionamento não é alegado como validado.

O primeiro verificador confundiu `pg_stat_ssl` (trecho de backend PostgreSQL atrás do pooler) com o TLS do cliente. Após autenticar, ele emitiu falha genérica por esse erro de medição. Corrigido para verificar o TLSSocket do cliente (`encrypted`, `authorized`) mantendo `sslmode=verify-full` e sem desativar validação de certificados. Não era uma segunda recusa de senha nem uma alteração de segurança do produto.

### Histórico da configuração e das tentativas

**Primeira tentativa real de conexão privada:** o arquivo de teste foi salvo pelo usuário e validado localmente como Session pooler do projeto brasileiro, porta 5432 e TLS verify-full. A tentativa com o driver `pg` foi recusada pelo servidor com SQLSTATE `28P01` (autenticação por senha recusada). Não houve início de transação, alteração de registros ou teste de login/telas nessa tentativa. Nenhuma senha/URI foi exibida. Conexão recusada movida para arquivo privado de diagnóstico em `.test-output/regiao-br/`, liberando o auxiliar para nova entrada. Após a repetição pelo usuário, a credencial atual foi aceita, e os ensaios descritos acima passaram. Não houve redefinição da senha do banco original pelo agente.

A primeira tentativa do auxiliar foi interrompida porque a área de transferência não continha uma URI PostgreSQL. Ajustado o auxiliar PowerShell para aguardar o usuário copiar a conexão **depois de iniciar o comando**, antes de ler o clipboard. Isso evita substituir a conexão ao copiar o próprio comando. Não houve conexão externa nem alteração do banco nessa tentativa.

Nova consulta ao destino confirmou ACTIVE_HEALTHY em sa-east-1, 19 migrações concluídas, 34 tabelas com RLS, nenhuma política pública e nenhuma restrição não validada. `npm run typecheck` foi executado novamente e passou. Esses resultados não comprovam login ou tráfego Prisma no banco brasileiro.

A conexão privada brasileira de teste foi salva em `.test-output/regiao-br/.env.teste`. Os auxiliares privados `.test-output/configurar-conexao-br.ps1` e `.test-output/configurar-conexao-br.mjs` recebem a URI do Session pooler pelo clipboard e a senha por entrada oculta; verificam projeto/região/porta e configuram TLS verify-full com certificado. Não substituem arquivo existente nem alteram `.env.homologacao` ou Vercel. Sintaxe Node conferida e exclusão dos caminhos pelo Git confirmada. Não solicitar ou exibir a senha pela conversa.

## Pendências para concluir a mudança

1. Cópia e comparação concluídas. Preservar o snapshot privado; não repetir o SQL de limpeza no destino já preenchido.
2. Manter somente a origem como banco ativo até a validação da troca. A cópia representa o instante do snapshot, não sincronização contínua; novas escritas exigirão reconciliação antes da mudança definitiva.
3. Conexão local brasileira e ambos os poolers verificados. Configuração privada na Vercel ainda pendente; nenhuma senha da origem será redefinida por essa migração.
4. Preparar candidato Vercel em São Paulo com Node/Python e conexão ao banco brasileiro; validar login e permissões sem limpeza global de sessões da origem.
5. Antes da troca definitiva, coordenar uma janela de escrita e refazer a sincronização necessária. Manter somente um banco como destino ativo para evitar dados divergentes.
6. Apresentar a prévia e resultados ao usuário. Depois da validação, concluir a troca combinada e manter a origem para retorno controlado. Apagar o banco antigo exige autorização própria; não foi solicitado nem realizado.

O histórico Prisma foi restaurado e conferido: 19 migrações concluídas, sem rollback. Não reaplicar a preparação estrutural nem o SQL de limpeza. Nenhum commit/push, publicação, chave Vercel, acesso de avaliador ou configuração do Resend foi alterado nesta etapa.

## Artefatos privados

Em `.test-output/regiao-br/`, excluído do Git: backup lógico, resumo com hashes, SQL de estrutura/importação, candidato de configuração, conexão privada, scripts e relatórios `conexao-verificada.json`, `api-verificada.json` e `api-transaction-verificada.json`. Esses arquivos não devem ser enviados ao portfólio ou conversa; alguns contêm dados pessoais/de acesso. O backup é lógico da aplicação, não uma imagem física de todo o Supabase. Login e consultas da API com conexão brasileira foram comprovados localmente; navegador e publicação brasileira ainda pendentes.

## Fontes oficiais consultadas

- [Regiões Supabase](https://supabase.com/docs/guides/platform/regions).
- [Migração entre projetos Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase).
- [Backup e restauração](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
- [Região das funções Vercel e proximidade do banco](https://vercel.com/docs/functions/configuring-functions/region).
- [Regiões da Vercel](https://vercel.com/docs/regions).
- [Região de envio do Resend](https://resend.com/docs/dashboard/domains/regions).
- [Aviso informativo de RLS sem políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- [TLS do Node.js: socket autorizado e criptografado](https://github.com/nodejs/node/blob/main/doc/api/tls.md).
- [Escopo da visão pg_stat_ssl](https://www.postgresql.org/docs/17/monitoring-stats.html).
