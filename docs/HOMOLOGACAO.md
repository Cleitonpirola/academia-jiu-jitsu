# Ambiente online de testes

## Graduações e migração 10 — 26/10/2026

Dez migrações concluídas e 22 tabelas de domínio. A migração 10 preservou os campos das 20 tabelas anteriores, vinculou faixas e manteve grau não informado. TLS/certificado verificado. QA restrita ao catálogo/aluno/turma sintéticos confirmou concorrência de grau, associação/constraint, renomeação, proteção e publicação coringa; nenhuma chamada de login/ativação. Registros removidos por IDs exclusivos e hashes das 22 tabelas iguais ao início. Guia em [GRADUACOES.md](GRADUACOES.md). Não representa publicação no Render ou liberação de ambiente público.

## Migração e prova de acesso familiar — 25/10/2026

Estado atual: nove migrações concluídas e 20 tabelas de domínio. Migração 9 aplicada com TLS/certificado verificado; comparação das 17 tabelas anteriores confirmou preservação de todos os campos existentes. QA sintética real no Supabase confirmou duas criações concorrentes com o mesmo responsável, ativação de convite de uso único, sessão e isolamento, check-in concorrente único com saldo, impedimento de check-in parental com acesso próprio, resposta de autorização e transferência por maioridade. Teste repetido após reforço transacional da resposta; registros sintéticos removidos e hashes das 20 tabelas iguais ao início de cada prova. Credenciais/configuração privada não foram versionadas. Guia em [RESPONSAVEIS.md](RESPONSAVEIS.md). Render/publicação e validação humana continuam pendentes.

## Migração 8 e teste de débitos — 25/10/2026

SQLite local atualizado para v8 com backup v7 e 15 tabelas anteriores preservadas por hashes, sem FK inválida. Supabase de homologação recebeu migração 8 por Prisma, TLS validado e saída 0. Teste externo de confirmação concorrente sem débito duplicado, check-in adicional, atraso/baixa, preço congelado/aceite desatualizado e cancelamentos aprovado. Todos os registros e configuração sintéticos removidos, oito migrações concluídas e hashes das 15 tabelas anteriores preservados. Preço real continua sem configuração e venda desativada até ação do usuário. Não foi publicada aplicação nem configurado gateway. Evidências em [DEBITOS.md](DEBITOS.md).

## Migração de saldo mensal e verificação externa — 25/10/2026

Aplicada migração aditiva 7 no projeto Supabase de homologação, com verificação TLS e saída 0 do Prisma. Testes com registros inteiramente fictícios verificaram disputa concorrente pelo último crédito, check-in repetido, cancelamento/devolução, novo desconto e mudança/desativação de limite. Registros sintéticos removidos ao final; hashes dos dados anteriores das 15 tabelas preservados e sete migrações concluídas. Não houve reset nem alteração das contas existentes. A API local atual usa SQLite versão 7, com backup e preservação conferidos; publicar a aplicação no Render continua pendente. Evidências e limites de validação em [SALDO_MENSAL.md](SALDO_MENSAL.md).

## Preparação em 23/10/2026

Objetivo autorizado: disponibilizar o Tatame para testes remotos, incluindo Gabriel, que também ajuda na avaliação junto com Matheus. Conta/projeto Supabase criados pelo usuário; Render ainda não configurado. Não há aplicação publicada. A conexão e as migrações foram posteriormente validadas no banco externo, conforme registro abaixo; os fluxos funcionais completos ainda estão pendentes.

Projeto de testes: `tatame-homologacao`, região North Virginia, plano gratuito selecionado pelo usuário. Data API desativada porque a aplicação usa o backend Node/Prisma. A interface do Supabase falhou com aviso de tradução/extensão; voltou ao painel em inglês. O projeto usa seu próprio banco, sem transferência implícita dos dados SQLite.

## Conexão privada e senha

Arquivo local `.env.homologacao`, ignorado pelo Git, separado do `.env` atual. O usuário copia a URI do Session pooler, porta 5432, em DATABASE_URL. DIRECT_URL vazio permite à configuração Prisma usar a mesma conexão em modo de sessão. Nenhuma string real, senha ou chave deve entrar na documentação/Git.

Execute `npm run configurar:homologacao` no terminal do projeto. Informe a senha do banco no prompt oculto e pressione Enter. O utilitário codifica apenas a senha, mantém o destino do Session pooler e exige `sslmode=verify-full`. Não acessa a rede, não modifica `.env`, não aplica migração e não cria conta do Tatame. Se a validação TLS exigir certificado adicional, deve-se configurar a CA correta; não desativar a verificação para contornar erro.

A senha deve ser informada pelo próprio usuário no terminal; não enviar no chat, em comandos com senha como argumento ou em capturas. O script verifica alteração concorrente do arquivo antes de gravar. Arquivo real continua fora do Git e do futuro contexto Docker.

No Windows, o utilitário usa Read-Host/AsSecureString do PowerShell e encaminha o valor ao gravador Node por pipe privado, sem incluí-lo em argumentos ou variáveis de ambiente. A tela pode mostrar asteriscos. Em outros sistemas, usa readline com saída de digitação suprimida; essa interação fora do Windows ainda não foi conferida em terminal real.

Validação desta preparação: três testes determinísticos aprovados (símbolos/porcentagem/Unicode, destino inválido e preservação dos outros campos/TLS), e execução interativa Windows com senha inteiramente fictícia, gravação conferida e saída 0. A implementação inicial de leitura direta do terminal Windows ficava aguardando entrada adicional; foi substituída pela entrada protegida nativa. Uma fixture de caminho de banco também foi corrigida antes da repetição bem-sucedida. Nenhuma dessas tentativas usou a senha real ou acessou a rede. Links documentais conferidos; testes anteriores da aplicação não foram repetidos nesta mudança de configuração.

## Primeira tentativa externa — 23/10/2026

O usuário executou o configurador e informou a senha pessoalmente. A conferência privada confirmou o projeto esperado, Session pooler/5432, senha sem marcador e `sslmode=verify-full`. Uma tentativa real com `pg.Client`, sem imprimir credenciais, foi interrompida por `SELF_SIGNED_CERT_IN_CHAIN`. A autenticação e a consulta de tabelas não foram confirmadas; nenhuma migração ou escrita foi executada. É necessário obter a CA oficial em Database Settings > SSL Configuration > Download Certificate e configurá-la no cliente antes de repetir. Não desativar a validação TLS. Referência: https://supabase.com/docs/guides/platform/ssl-enforcement.

A mensagem do configurador foi ajustada de “TLS verificado” para “verificação TLS habilitada”: ele configura a exigência de verificação, mas não valida um servidor sem realizar uma conexão.

## Certificado instalado e autenticação pendente — 23/10/2026

Usuário baixou `prod-ca-2021.crt` no painel. Certificado identificado como Supabase Root 2021 CA, autoridade certificadora válida até 26/04/2031. Foi copiado para `data/certificados/supabase-homologacao.crt` (ignorado pelo Git) e configurado por `sslrootcert` na URI privada, mantendo `sslmode=verify-full`. O caminho usado localmente é absoluto; uma futura hospedagem precisará de seu próprio caminho/configuração do certificado, sem reutilizar o caminho Windows.

Nova tentativa real ultrapassou a validação TLS e retornou `28P01` (credenciais recusadas). Isso confirma o funcionamento do certificado nesta conexão, mas não autenticação, tabelas ou migrações. O usuário deve repetir `npm run configurar:homologacao` e informar a senha do **banco do projeto Supabase**, não a senha de login do site ou GitHub. O configurador preserva `sslrootcert` ao trocar a senha; essa preservação foi incluída na verificação determinística existente. Nenhuma escrita no banco foi realizada.

## Conexão aceita e migrações aplicadas — 23/10/2026

Após o usuário informar novamente a senha no terminal privado, autenticação aceita. A conexão cliente–Session pooler foi conferida pelo socket TLS (`encrypted=true`, `authorized=true`), com CA oficial e verify-full. A consulta pg_stat_ssl descreve o trecho pooler–Postgres e não comprova a segurança do socket cliente; não foi usada como evidência desse socket.

Antes da escrita, destino de homologação e ausência de tabelas públicas foram novamente conferidos. Executado o CLI existente `prisma migrate deploy` com as variáveis carregadas exclusivamente do arquivo privado de homologação (sem alterar o .env atual); as seis migrações existentes concluíram com saída 0. Conferência posterior: seis registros concluídos no histórico Prisma e 16 tabelas públicas (15 do domínio e o histórico), sem usuários cadastrados. Não houve reset, cópia do SQLite, seed ou criação automática de credenciais.

A API local anterior foi encerrada e iniciada com `node --env-file=.env.homologacao --import tsx apps/api/src/server.ts`, em 127.0.0.1:3333. Ela serve o frontend já compilado existente. A página e /api/auth/estado retornaram 200; configuracaoInicial=true e nenhum usuário autenticado. O servidor de desenvolvimento em 5173 não está acessível nesta etapa; usar 3333. Python não foi revalidado nessa troca. O arquivo .env e o banco SQLite continuam preservados. Essa execução local com banco remoto ainda não disponibiliza um link público para Gabriel.

O usuário deve abrir http://127.0.0.1:3333 e criar pessoalmente nome, e-mail e senha do administrador de testes (mínimo de 15 caracteres, senha própria da plataforma, diferente da credencial do banco). O cadastro inicial permanece restrito ao computador local; nenhuma credencial padrão foi criada ou solicitada no chat.

## Conta comum para teste — 23/10/2026

Pedido do usuário: criar um usuário sem permissão administrativa para testar o acesso comum. Antes da criação, conferidos um administrador existente no Supabase e configuração inicial concluída na API, sem consultar ou modificar a senha do administrador. Criados apenas um cadastro fictício Aluno de Teste (`aluno.teste@tatame.example.com`) e seu Usuario com perfil `aluno`, vinculado ao próprio cadastro, no banco de homologação. Sem mensalidades ou limite configurado: não há bloqueio financeiro e aplica-se o padrão ilimitado. Não foram criadas aulas, planos ou presenças.

Verificação real pela API local conectada ao Supabase: login 200, portal próprio 200, nove leituras administrativas 403, quatro escritas administrativas 403 e logout 204 (16 requisições verificadas). A senha aleatória usada no teste foi removida, as sessões desse teste foram apagadas e ficou somente um convite de ativação com validade de 24 horas e uso único, para o usuário escolher sua senha pessoalmente. A ativação pelo usuário ainda está pendente. O link correto usa o fragmento `#ativar`; uma montagem inicial com `#convite` foi corrigida antes da entrega, sem mudar o frontend.

Convite completo salvo somente em `data/homologacao/acesso-aluno-teste.json`, ignorado pelo Git, sem token ou senha em documentos versionados. E-mail fictício é apenas identificador de login; não houve envio de e-mail. Abrir o convite em outra janela/navegador ajuda a manter o administrador e o aluno em sessões separadas; cookies são compartilhados por abas do mesmo navegador. Na tela de ativação escolher senha com pelo menos 15 caracteres. Link local em 3333 ainda depende deste computador; não há hospedagem pública.

Esta criação não altera código funcional, schema ou permissões existentes. Não foi repetida a suíte completa da aplicação; os resultados acima são desta execução real e restritos a acesso/permissões. Administrador e banco SQLite preservados. Novo conjunto documental permanece sem aprovação de commit/push.

## Etapas restantes

1. Ativar a conta de aluno de teste pelo convite e validar visualmente seu portal. Administrador já existente, sem senha padrão ou configuração inicial pública.
2. Preparar/testar a hospedagem Node/React/Python e configurar Render/HTTPS, com dados fictícios.
3. Validar login, check-in, chamada, finanças e planos no link online; então preparar acesso específico para os testers.

Preparação em andamento. Sem aprovação de commit/push para este novo conjunto; sem implantação, pagamento ou envio de mensagem externa. As verificações anteriores de SQLite não equivalem a validação Supabase.
