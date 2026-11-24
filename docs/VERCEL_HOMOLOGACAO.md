# Tatame na Vercel — preparação de homologação

## Acesso direto autorizado — 24/11/2026

O usuário pediu demonstração em dois celulares: mestre como administrador e outro aparelho como aluno fictício. O endereço diário agora é domínio de produção com entrada direta pelo Tatame. Vercel Authentication permanece ativa em Standard Protection, preservando prévias e URLs geradas. Sem bypass ou link temporário. Os dois logins e bloqueios foram testados por HTTP e navegador; o usuário aprovou incluir a cidade opcional em seguida. [Estado, configuração e roteiro](ACESSO_DEMONSTRACAO.md). Registros anteriores de proteção all no endereço diário são históricos.

## Publicação atualizada — 24/11/2026

O endereço **https://tatame-test-diario.vercel.app/** aponta agora para `dpl_J3B3eYEWneShxyrTyceMSMYXJkpK`, READY/Preview/gru1, código `9ba3873`. As 177 fontes do pacote final foram comparadas com a árvore remota e correspondem ao commit enviado ao GitHub; nenhuma credencial, fixture ou arquivo privado foi publicado. A migração aditiva de bolsistas já está no banco brasileiro, sem alterar os registros existentes. O candidato intermediário cancelado não recebeu o alias diário.

Os dois acessos foram conferidos na versão atualizada. SSO da Vercel e login/permissões do Tatame continuam ativos; use o mesmo endereço e as mesmas senhas privadas. O notebook pode ficar desligado, com internet no dispositivo de acesso. O código de instalação web não oferece uso offline. As seções datadas anteriores são históricas. [Resultado e limites da conferência](TESTES_EXTERNOS.md#versão-atualizada-para-a-academia--24112026).

## Acesso diário protegido — 23/11/2026

Endereço fixo: **https://tatame-test-diario.vercel.app/**. Deployment `dpl_6iFkciQ7Si2BbFSuf7GHPhJwJhcj`, READY, projeto `tatame-test`, ambiente Preview/staging, região `gru1`. Fontes extraídas exclusivamente do commit aprovado `18ce58e25ce681b1fd0b367975364de1b731dc8a`: 167 arquivos de código/configuração conferidos com a árvore remota por SHA-1, sem diferenças ou arquivos ausentes. As outras alterações locais não foram publicadas. Nenhum `.env`, banco local, credencial, fixture ou documento privado foi enviado.

`APP_ORIGIN` em Preview aponta para o endereço fixo; a recuperação configurada como `preview` deriva essa mesma origem. Segredos existentes foram mantidos em Preview, sem descriptografia ou cópia para Production. O alias normal não é um link compartilhável de uma hora. Salve-o nos favoritos. Primeiro entre com a conta Vercel autorizada, depois com a conta de aluno ou professor do Tatame. O computador local pode ficar desligado.

A proteção Vercel continua para **todos** os deployments. A tentativa de teste com `vercel curl` criou uma credencial persistente de automação; a revisão automática bloqueou sua continuação. A credencial foi revogada explicitamente, sem substituição, e a consulta final confirmou zero bypasses ativos e SSO global `all`. Não usar `vercel curl`, share links ou exceções para contornar esse bloqueio sem autorização específica. A visita anônima recebeu redirecionamento de autenticação; a navegação normal na aba de teste mostrou o login da Vercel.

O Supabase brasileiro `yptdxyjqgvzmkoizavmj` estava INACTIVE e foi retomado, chegando a ACTIVE_HEALTHY. Conferidas 20 migrações concluídas e a existência dos dois usuários de avaliação ativos, com papéis `aluno` e `admin`. Não houve migração, importação, exclusão, troca de senha ou criação de conta nesta etapa. Credenciais existentes foram reunidas em arquivo privado ignorado pelo Git; não incluí-las neste guia.

**Teste funcional concluído em 23/11/2026:** após o proprietário entrar na Vercel e avisar **pronto**, aluno e professor entraram no Tatame pelo fluxo normal. Ambos mantiveram a sessão ao atualizar; o aluno carregou o próprio portal e Comunicados, recebeu bloqueio ao abrir `/api/alunos`, e após sair essa rota exigiu login. O professor carregou os indicadores, a lista de alunos e a ficha com histórico de comunicados recolhido e consulta vazia após expandir. Os arquivos privados inicialmente reunidos continham senhas antigas; foram corrigidos com os registros brasileiros atuais, que passaram nos logins, sem alterar as contas. Arquivos separados em `.test-output/publicacao-diaria-20261123/privado/ACESSO_ALUNO_DIARIO.txt` e `ACESSO_PROFESSOR_DIARIO.txt`, ignorados pelo Git. Capturas: [aluno](screenshots/acesso-diario-aluno.jpg) e [professor](screenshots/acesso-diario-professor.jpg). Não foram enviados comunicados, confirmadas presenças, alteradas senhas ou executada nova suíte local neste teste.

## Atalho para gerar link de teste

Uma vez no Windows, instale a CLI com `npm install -g vercel` e entre na sua conta com `vercel login`. Use a conta com acesso ao projeto **tatame-test**. [CLI da Vercel](https://vercel.com/docs/cli).

Depois que uma atualização estiver publicada, abra **Gerar link de teste.cmd** na pasta do projeto. Cole o endereço inteiro na mensagem para os avaliadores. O atalho usa a publicação de teste mais recente, verifica se o login responde e copia o link completo. Se a prévia estiver em construção ou tiver falhado, a janela avisa.

Quem receber o link pode abrir a tela do Tatame sem conta na Vercel durante a validade de até uma hora. O login do Tatame ainda é necessário. [Links compartilháveis na Vercel](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links).

Se você abrir o atalho de novo na mesma prévia, ele copia o link que gerou e guardou de forma criptografada para o seu usuário do Windows. Quando esse link vence, o atalho emite outro. Se o link existente foi criado fora desse fluxo, copie-o em **Share** enquanto estiver válido ou revogue-o ali antes de gerar outro.

## Publicação atualizada e refresh corrigido — 01/11/2026

Prévia final READY: [Abrir o Tatame](https://tatame-homologacao-f1fi4dmth-cleiton-pirola.vercel.app), deployment `dpl_HzupaAG1JgiEW7KEKkiCZCG5oz2S`, ambiente API staging/Preview. Substitui a prévia original e o candidato intermediário de segurança. Mantidos os dois acessos fictícios, sem alterar senhas. Arquivos privados de acesso atualizados; não encaminhados automaticamente a terceiros.

Base recomposta das159 fontes exatas da publicação anterior, conferidas por SHA1. Somente quatro arquivos diferem: package.json/package-lock.json/app.ts para segurança do commit510eb87 e AuthGate.tsx para corrigir o botão durante o refresh, relatado por Gabriel. Storage não incluído nem ativado. O pacote não é um checkout integral do commit510eb87: reutiliza também funcionalidades já publicadas a partir da fonte local; metadados dirty=true registram essa composição.

Pacote de segurança sem Storage:279 testes, build/typecheck e npm audit sem alertas. Ajuste adicional só de renderização: build/typecheck e QA visual controlada com conexão pendente/erro/recuperação. Não foram adicionados testes espelho nem alegada nova execução da suíte285 após esse ajuste visual. Na publicação final: login dos dois perfis, autorização401/403, banco Supabase/Python, catálogo, presença fictícia anterior e indicadores conferidos; rota de Storage404.159 fontes remotas conferidas por hash. Relatório privado .test-output/deploy-seguranca-validacao-online.json.

Acesso direto limitado ao deployment final, login/permissões do Tatame e SSO global preservados; revogadas as exceções anteriores e o compartilhamento temporário antigo após confirmação da versão final. Sem expiração automática: revogar a exceção final ao terminar os testes. Os links antigos podem pedir login Vercel; encaminhar o endereço novo.

Git: segurança já enviada em510eb8761be09b5c65b6459746e03b270c57ea0b, branch codex/evolucao-tatame. A correção visual e esta atualização documental aguardam validação específica antes de novo commit/push, conforme AGENTS.md. Nenhuma migração, bucket, chave de Storage, pagamento, main/tag/release ou conta nova nesta publicação.

## Acesso direto autorizado para estes testes — 31/10/2026

Usuário confirmou “autorizo apenas para esses testes” após a rejeição inicial da revisão automática. A nova chamada autorizada criou `alias-protection-override` somente no deployment `dpl_4Wnh38NWzR3VFZZzXkHcVFU1a6b9`. URL: https://tatame-homologacao-aum8h1pc1-cleiton-pirola.vercel.app/. Proteção global SSO continua habilitada; autenticação e permissões do Tatame preservadas. A exceção não tem expiração automática: revogar ao encerrar estes testes; não estender a outras publicações. O prazo do antigo link temporário não se aplica ao acesso direto.

Verificação nova sem cookies/parâmetros: página200, estado200/usuario:null, alunos401, portal401. Navegador confirmou formulário de login após logout apenas do aluno fictício. Arquivos privados dos dois acessos atualizados sem alterar senhas. Evidência `.test-output/acesso-direto-validacao.json` e `docs/screenshots/homologacao-login-direto.png`. Nenhuma migração, alteração de lógica, nova publicação, commit ou push nesta liberação. Os registros anteriores abaixo são históricos.

## Concluído para testes externos — 31/10/2026

Aplicação Preview READY `dpl_4Wnh38NWzR3VFZZzXkHcVFU1a6b9`, origem https://tatame-homologacao-aum8h1pc1-cleiton-pirola.vercel.app. Link temporário com23h e acessos fictícios entregues somente em arquivo privado local. [Roteiro, provas e limites](TESTES_EXTERNOS.md). Supabase/Python disponíveis, login/roles/cadastro/check-in/chamada/indicadores por categoria comprovados. Sem commit/push; publicação de fonte local para validação.

Ferramentas get_access_to_vercel_url/web_fetch não localizaram o deployment apesar da leitura por ID funcionar. Alternativa autorizada: patch_url_protection_bypass no ID explícito, mesmo team, ttl82800, sem desativar proteção global; depois navegador e requisições HTTP com cookie temporário. Não repetir reconexões por implicação dessa falha. Senhas/tokens de compartilhamento não entram na documentação ou Git. Domínio principal é só placeholder; usar Preview.

## Publicação em verificação — 31/10/2026

Migração19 de segurança autorizada e aplicada:33 tabelas de domínio +histórico protegidas por RLS, leitura privada preservada. Conexão de funções usa certificado público Supabase Root2021CA incluído em `apps/api/certs/supabase-root.crt`; configuração hospedada troca a referência de arquivo local pelo arquivo do pacote, mantendo `sslmode=verify-full`. Teste sem o certificado falhou por cadeia não confiável; teste com arquivo incluído passou no Transaction pooler6543, sem desativar TLS.

159 arquivos públicos de código/configuração enviados por allowlist com SHA1; nenhum ambiente, banco, QA ou fixture. Primeira tentativa rejeitou runtimes escritos como versões de Functions; corrigido `vercel.json` para autodetectar por framework, mantendo Node24 no projeto e .python-version3.14. Na primeira publicação do projeto, a plataforma força Production mesmo ao pedir Preview: inicializado só um placeholder estático sem dados/API/segredos, depois iniciada a aplicação em Preview (targetnull). Domínio principal ainda mostra apenas preparação; o link da aplicação será o da Preview validada. Proteção da Vercel mantida. DATABASE_URL permanece somente Secret/Preview.

Candidato atual: dpl_8vqV11koJzHNprXgA4sJLWC94vm2, https://tatame-homologacao-4nttalc7m-cleiton-pirola.vercel.app, ainda BUILDING na última consulta. Não entregar como funcional antes de conferir runtime, login e APIs/Python. 277 testes locais novos passaram; sem commit/push ou merge/release. Código enviado inclui alterações locais para validação do usuário.

## Estado em 31/10/2026

**Estado mais recente:** as oito migrações11–18 foram autorizadas pelo usuário e aplicadas. Supabase agora tem18 concluídas/33 tabelas de domínio, com preservação e leitura Prisma conferidas. [Relatório](MIGRACOES_11_18.md). DATABASE_URL permanece Secret/Preview; configuração não comprova execução na Vercel. Antes da publicação, concluir [proteção das tabelas antigas](SEGURANCA_HOMOLOGACAO.md) e validação do conjunto para Git. Nenhuma implantação ainda. A lista de migrações pendentes nos registros de preparação abaixo foi superada por esta aplicação.

Atualização: usuário executou o atalho local e salvou `DATABASE_URL` como Secret. A conferência de metadados mostrou inicialmente somente Production; Codex corrigiu apenas o ambiente para **Preview** e reconferiu `type: sensitive`, `target: [preview]`, sem descriptografar o valor. Isso confirma a configuração do segredo, não uma conexão executada pela aplicação hospedada. Com a biblioteca de técnicas adicionada depois da preparação inicial, as migrações externas pendentes agora são **11–18 (oito)**. Ainda sem implantação ou commit/push.

Projeto vazio `tatame-homologacao` criado no espaço `cleiton-pirola`, com Node 24 e framework Services. O acesso adicional ao espaço foi autorizado pelo usuário. Ainda não existe implantação nem endereço funcional para os avaliadores. A proteção de acesso da Vercel foi preservada.

Supabase `tatame-homologacao`: conexão administrativa verificada por consultas de metadados, com dez migrações Prisma concluídas. As migrações 11–17 continuam pendentes; nenhuma escrita, migração, seed ou importação de dados foi executada nesta preparação. O SQLite local continua independente, na versão 17.

## Como as peças se conectam

Pense na Vercel como o endereço onde a academia recebe visitantes e no Supabase como o arquivo onde os registros são guardados. Instalar os plugins permite ao Codex administrar esses serviços; isso, sozinho, não publica o aplicativo nem transfere seu banco.

`vercel.json` prepara três serviços no mesmo projeto:

- `web`: telas React/Vite; navegação interna retorna `index.html`.
- `api`: Express/Node 24; recebe `/api` e `/api/*` e usa PostgreSQL.
- `analytics`: FastAPI/Pandas, acessado internamente pela API com o vínculo `ANALYTICS_URL`. Nenhuma rota pública foi configurada para esse serviço.

Services está em beta. A estrutura da configuração foi validada contra o JSON Schema oficial, mas o build remoto e o funcionamento conjunto ainda precisam ser comprovados. Referências: [Services](https://vercel.com/docs/services), [variáveis privadas](https://vercel.com/docs/environment-variables).

## Conexão privada: ação do usuário

No terminal da raiz do projeto:

```powershell
npm run copiar:conexao-vercel
```

O atalho lê a configuração privada existente em `.env.homologacao`, verifica o destino e copia a conexão para a área de transferência sem mostrá-la. Não altera arquivo nem banco. Se a configuração estiver ausente/incorreta, para com uma mensagem; não inventa credenciais.

Abra [Environment Variables do projeto](https://vercel.com/cleiton-pirola/tatame-homologacao/settings/environment-variables), escolha **Add Environment Variable** e preencha:

| Campo | Conteúdo |
| --- | --- |
| Key / Name | `DATABASE_URL` |
| Value | Cole com Ctrl+V o valor copiado pelo comando |
| Environment | Somente `Preview` |
| Type | `Secret` |

Salve. Não cole o valor no chat nem em documentação ou commits. Após salvar, substitua o conteúdo da área de transferência por um texto comum. Ao verificar a configuração, consultar apenas nomes/tipos/ambientes, sem solicitar valores descriptografados.

O backend hospedado usa **Transaction pooler, porta 6543**, adequado às conexões das funções. O atalho mantém `sslmode=verify-full`, a senha codificada e os demais parâmetros. O arquivo original permanece com **Session pooler, porta 5432**, para a execução controlada de migrações. Usamos Prisma com o adaptador `pg`; não é necessário ativar a Data API nem instalar `supabase-js` para esse caminho.

## Por que existe uma entrada diferente para a Vercel

`apps/api/src/vercel.ts` exporta o aplicativo Express sem abrir uma porta com `listen`. `vercel-config.ts` exige PostgreSQL, TLS verificado, origem HTTPS e vínculo com o Python; desliga o acesso administrativo local e o seed. Assim, uma configuração incompleta falha explicitamente, em vez de abrir um banco SQLite vazio no servidor.

As telas são entregues pelo serviço web. A API hospedada usa `serveFrontend: false`; a execução local habitual preserva seu comportamento. O `APP_ORIGIN` padrão é a origem exata de `VERCEL_URL`. Caso seja usado outro domínio/alias, configurar essa origem explicitamente e testar sessão e proteção de origem. Os cookies permanecem HttpOnly, Secure em HTTPS e SameSite=Strict.

`.vercelignore` exclui ambientes privados, bancos locais, dependências, ambientes Python e artefatos de teste. `.vercel/project.json` é apenas o vínculo local ao projeto e está ignorado pelo Git.

## O que já foi testado nesta preparação

- 270 testes TypeScript aprovados, incluindo falhas de configuração, rotas autenticadas, recusa de origem externa e cookie seguro em contexto HTTPS fictício.
- Dois testes do atalho de conexão aprovados com senhas fictícias: porta correta, preservação de TLS e recusa de outro destino.
- 15 testes Python aprovados.
- Verificação de tipos e compilação web aprovadas.
- Configuração `vercel.json` aceita pelo JSON Schema oficial; projeto remoto configurado para Services/Node 24.

Esses resultados não comprovam ainda build na Vercel, execução PostgreSQL das novas funcionalidades, autenticação no endereço publicado ou comunicação remota com Python. O atalho de copiar credencial não foi executado pelo Codex com a senha real.

## Ordem dos próximos passos

1. Usuário cadastrar a variável privada; conferir sua existência sem ler o valor.
2. Apresentar o conjunto local para validação e obter aprovação de commit/push conforme `AGENTS.md`. A base atual é `c8c7ef4`, branch `codex/evolucao-tatame`; a `main` não contém as mudanças locais recentes.
3. Explicar e combinar a aplicação das sete migrações pendentes no banco de homologação, preservando seus dados. Não executar reset, seed ou importação da base local por implicação.
4. Criar uma implantação de teste da entrega aprovada, sem merge na `main` ou publicação de release.
5. Verificar navegador → API → PostgreSQL e API → Python, além de login administrativo/aluno, cookies, fotos, ranking e permissões com dados fictícios identificáveis.
6. Entregar o link aos avaliadores com a forma de acesso adequada à proteção da Vercel. Não desativar a proteção automaticamente.

Pagamento por provedor, envio de e-mail/WhatsApp e reconhecimento automático de pagamentos não foram implementados por esta configuração.
