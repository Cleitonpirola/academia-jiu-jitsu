# Testes externos do Tatame

## Acesso diário — conferência em 23/11/2026

Nova publicação protegida em **https://tatame-test-diario.vercel.app/**, deployment `dpl_6iFkciQ7Si2BbFSuf7GHPhJwJhcj`, baseada no commit `18ce58e`. READY confirmado e 167 fontes remotas iguais ao pacote aprovado. Banco brasileiro retomado e dois usuários de avaliação ativos encontrados. Proteção SSO global `all`, zero bypasses de automação ativos após revogação da credencial criada pelo teste da CLI. Visita sem autenticação redireciona para o login Vercel.

Após autenticação manual do proprietário na Vercel, os dois logins passaram no endereço fixo. Aluno: portal próprio e Comunicados carregados, sessão preservada ao atualizar e bloqueio administrativo ao abrir `/api/alunos`. Depois de sair, a mesma rota exigiu login. Professor: indicadores, gestão de alunos e ficha com histórico de comunicados inicialmente recolhido; expandir mostrou a situação real de zero mensagens. A sessão do professor também permaneceu após atualizar. Capturas novas: [aluno](screenshots/acesso-diario-aluno.jpg) e [professor](screenshots/acesso-diario-professor.jpg).

As senhas dos primeiros artefatos privados estavam desatualizadas e foram recusadas. Os registros atuais em `.test-output/regiao-br/` permitiram os dois logins; os artefatos de acesso diário foram corrigidos, sem mudar senhas no sistema. Não houve envio/ciência de comunicado, alteração de dados, cobrança ou novo teste de entrega de e-mail. Nenhuma suíte local foi repetida nesta rodada; os 295 testes anteriores pertencem à seleção do commit, não a este teste externo. [Instruções e detalhes](VERCEL_HOMOLOGACAO.md#acesso-diário-protegido--23112026).

## Publicação atualizada e refresh corrigido — 01/11/2026

Prévia final READY: [Abrir o Tatame](https://tatame-homologacao-f1fi4dmth-cleiton-pirola.vercel.app), deployment `dpl_HzupaAG1JgiEW7KEKkiCZCG5oz2S`, ambiente API staging/Preview. Substitui a prévia original e o candidato intermediário de segurança. Mantidos os dois acessos fictícios, sem alterar senhas. Arquivos privados de acesso atualizados; não encaminhados automaticamente a terceiros.

Base recomposta das159 fontes exatas da publicação anterior, conferidas por SHA1. Somente quatro arquivos diferem: package.json/package-lock.json/app.ts para segurança do commit510eb87 e AuthGate.tsx para corrigir o botão durante o refresh, relatado por Gabriel. Storage não incluído nem ativado. O pacote não é um checkout integral do commit510eb87: reutiliza também funcionalidades já publicadas a partir da fonte local; metadados dirty=true registram essa composição.

Pacote de segurança sem Storage:279 testes, build/typecheck e npm audit sem alertas. Ajuste adicional só de renderização: build/typecheck e QA visual controlada com conexão pendente/erro/recuperação. Não foram adicionados testes espelho nem alegada nova execução da suíte285 após esse ajuste visual. Na publicação final: login dos dois perfis, autorização401/403, banco Supabase/Python, catálogo, presença fictícia anterior e indicadores conferidos; rota de Storage404.159 fontes remotas conferidas por hash. Relatório privado .test-output/deploy-seguranca-validacao-online.json.

Acesso direto limitado ao deployment final, login/permissões do Tatame e SSO global preservados; revogadas as exceções anteriores e o compartilhamento temporário antigo após confirmação da versão final. Sem expiração automática: revogar a exceção final ao terminar os testes. Os links antigos podem pedir login Vercel; encaminhar o endereço novo.

Git: segurança já enviada em510eb8761be09b5c65b6459746e03b270c57ea0b, branch codex/evolucao-tatame. A correção visual e esta atualização documental aguardam validação específica antes de novo commit/push, conforme AGENTS.md. Nenhuma migração, bucket, chave de Storage, pagamento, main/tag/release ou conta nova nesta publicação.

## Pronto para avaliação — 31/10/2026

Publicação **Preview**, deployment `dpl_4Wnh38NWzR3VFZZzXkHcVFU1a6b9`, origem `https://tatame-homologacao-aum8h1pc1-cleiton-pirola.vercel.app`. É homologação com dados de teste, separada do SQLite local. Não precisa manter o computador ligado para os avaliadores usarem essa publicação.

**Acesso atual:** [Entrar no Tatame](https://tatame-homologacao-aum8h1pc1-cleiton-pirola.vercel.app/). Professor e aluno usam o mesmo endereço, com seus respectivos e-mails e senhas do Tatame. Não precisam de conta Vercel nem de parâmetro de compartilhamento.

Após autorização explícita do usuário (“autorizo apenas para esses testes”), criada exceção de proteção **somente neste deployment de homologação**. A proteção global do projeto continua habilitada. A exceção não tem expiração automática configurada: deve ser revogada ao encerrar estes testes; não aplicar automaticamente a novas publicações. A validade de23h do compartilhamento anterior não limita esta exceção.

Conferência nova por HTTPS, sem cookies nem parâmetro: página200, estado de sessão200 com usuário nulo, `/api/alunos`401 e `/api/portal`401. Navegador confirmou formulário do Tatame após sair da sessão fictícia. Registro privado: `.test-output/acesso-direto-validacao.json`; captura: `screenshots/homologacao-login-direto.png`. A antiga tela Vercel decorria da proteção anterior; esse diagnóstico foi superado pela liberação autorizada.

## Acessos

Após pedido do usuário por dois acessos fictícios, conferidos perfil, identidade, senha e situação ativa do aluno, sem criar contas duplicadas. Arquivos privados separados: `.test-output/ACESSO_PROFESSOR_TATAME.txt` e `.test-output/ACESSO_ALUNO_TATAME.txt`, cada um com seu login/senha e o endereço direto atualizado. Assim, pode-se encaminhar somente o perfil destinado a cada avaliador. Ambos ignorados pelo Git e excluídos da publicação. A atualização do endereço não alterou contas ou senhas.

Contas exclusivas e fictícias de professor/administrador e aluno foram preparadas. E-mails, senhas aleatórias e link completo estão no arquivo privado local `.test-output/ACESSOS_TESTE_TATAME.txt`, ignorado pelo Git e excluído de qualquer pacote de publicação. Compartilhar somente com avaliadores escolhidos. Senhas não estão nesta documentação pública. Não usar os dados de acesso das contas antigas para os testes automatizados.

Foi mantido um aluno fictício, uma turma de avaliação e uma aula de31/10/2026 às12h, com check-in e presença confirmada. Graduação do aluno fictício: Adulto Faixa Branca. Se testar em outro dia, publicar uma aula para **o dia do teste**, pois check-in é permitido no dia da aula. Cadastros anteriores não foram removidos nem substituídos.

## Roteiro para professor/administrador

1. Entrar e conferir **Supabase conectado** no topo.
2. Cadastrar um aluno fictício, editar telefone/nome e conferir a listagem.
3. Criar turma, combinar dias e horários e publicar uma aula para o dia do teste.
4. Pedir check-in pelo acesso do aluno; abrir a chamada e confirmar presença. Conferir depois no ranking e no histórico do aluno.
5. Conferir graduação na ficha e metas de aulas por grau em Regras de graduação.
6. Testar mensalidades e débitos com valores fictícios; não há cobrança bancária real automática.
7. Conferir comunicados e o botão Estou ciente no aluno. A biblioteca de técnicas pode ser conferida com conteúdo de demonstração; modelo/preço comercial seguem adiados.

## Roteiro para aluno

1. Entrar e confirmar que só a área do aluno aparece, sem menus administrativos.
2. Escolher uma aula publicada no dia e fazer check-in.
3. Após o professor confirmar, verificar a presença em Meus treinos e no ranking.
4. Conferir perfil, graduação, avisos, mensalidades e débitos próprios.

Para reportar problema: informar perfil utilizado, tela, ação, resultado esperado e observado; enviar captura sem senhas ou dados sensíveis. Não usar dados reais de alunos nesta avaliação.

## O que foi realmente validado

**278 testes TypeScript locais aprovados** após correção de contrato dos indicadores para faixas por categoria. No ambiente publicado: login administrativo e de aluno; anônimo401 e aluno403 nas rotas administrativas; cadastro fictício; convite/ativação de acesso; turma/aula publicadas; check-in; chamada confirmada; portal com presença persistida; ranking; catálogo de técnicas; graduação por categoria e cálculo real Python com essa faixa. Saúde confirmou PostgreSQL/Supabase e Python disponíveis. Navegador confirmou login, painel conectado, portal/presença/categoria e ausência de erros de console na conferência.

Segurança:19 migrações Prisma concluídas,33 tabelas de domínio +histórico com RLS; perfis públicos não recebem registros, backend privado mantém leitura. Exportação lógica e ensaio revertido precederam as migrações; **62 registros que já existiam antes da segurança19 foram conferidos novamente após os testes e permaneceram idênticos**. Apenas os novos registros fictícios de avaliação foram acrescentados.

Não considerar validado: cada combinação possível de permissões/planos; testes físicos em vários celulares; recuperação/envio de e-mail, WhatsApp, pagamento automático, hospedagem privada de vídeos ou resposta de IA externa. `aiConfigured:false`: indicadores Python disponíveis; API de IA não ativada nesta publicação.

## Fonte, versão e Git

Publicada a fonte local em Preview para validação, sem merge na main, release, tag ou commit/push novo. Base Git continua `c8c7ef4`, branch `codex/evolucao-tatame`; mudanças recentes ainda locais. Após o usuário validar o conjunto e autorizar, revisar diff, criar commit descritivo e enviar ao GitHub conforme AGENTS.md. O código online mais recente não deve ser apresentado como já sincronizado no GitHub.

O domínio principal do projeto mostra somente uma página estática de preparação, usada para inicializar a primeira publicação que a Vercel força para Production. A aplicação validada é a **Preview indicada neste documento**, não esse placeholder. A conexão privada foi configurada somente em Preview.
