# Comunicados da academia

## Aprovação e verificação do conjunto — 22/11/2026

O usuário aprovou commit e envio dos comunicados com **commite**. A seleção, separada das outras funcionalidades pendentes, passou em build/typecheck e 295 testes locais em uma cópia isolada. As capturas abaixo registram a conferência anterior com dados fictícios. O pedido de commit não publica a aplicação nem executa migração em banco externo.

## Uso atual

O menu administrativo **Comunicados** reúne os envios, fora da ficha dos alunos. Com **Todos da equipe** selecionado, escreva um título e uma mensagem e use **Enviar para toda a equipe**. Para um envio individual, escolha um aluno na lista de destinatários.

O envio coletivo considera alunos ativos. Cada cadastro recebe uma mensagem em seu acesso principal: aluno com acesso próprio, ou responsável quando o menor tem esse acesso como principal. Cadastros sem conta/vínculo adequado aparecem em **Cadastros que precisam de atenção** e não são apresentados como entregas. Depois de preparar um acesso que faltava, envie a mensagem individualmente para esse aluno. Alunos cadastrados depois não entram retroativamente nos lotes antigos.

O aluno ou responsável recebe a mensagem na aba **Comunicados** e confirma pelo botão **Estou ciente**. Na gestão, abra **Ver confirmações individuais** para acompanhar cada cadastro. A confirmação exige uma ação da pessoa.

## Destaque no portal — 20/11/2026, local para validação

Complemento de 22/11/2026: o histórico permanece na aba **Comunicados** de cada aluno e mostra **Enviado em** e **Ciente em**, com data e horário de São Paulo quando a confirmação existe. O contador representa recados aguardando **Estou ciente** salvo. Abrir, atualizar a página ou sair da conta não confirma nem apaga os recados. Não há exclusão automática por tempo ou por confirmação.

Enquanto houver mensagens sem confirmação, um cartão amarelo aparece no início da área do aluno, acima da agenda e das demais abas. Ele informa a quantidade pendente, mostra o título e uma prévia do comunicado pendente mais recente e oferece **Ler comunicados**. O menu **Comunicados** também exibe essa quantidade. A lista apresenta pendentes primeiro, com borda destacada; os recados confirmados continuam no histórico.

Abrir a mensagem não confirma a leitura: o destaque diminui somente depois que **Estou ciente** é salvo pela API. Falhas de consulta ou de confirmação mantêm as pendências já carregadas e exibem erro. A consulta ocorre ao entrar, ao voltar à janela e a cada 30 segundos com a página visível. O responsável tem a mesma experiência no contexto do dependente selecionado, inclusive com bloqueio financeiro.

Para conferir: entre como aluno com dois avisos pendentes, abra **Ler comunicados**, confirme um e confira o contador diminuir; confirme o outro e confira o cartão desaparecer. Os dois recados devem continuar consultáveis na aba. No acesso familiar, troque o dependente e confira somente seus próprios recados.

Verificação desta rodada: build/typecheck aprovado e conferência no navegador com a interface real e respostas fictícias da API, cobrindo contador, ordem, foco, ausência de confirmação ao abrir, falha/sucesso ao confirmar, histórico, responsável, troca de contexto, bloqueio financeiro e erro ao atualizar. Passaram 17 testes HTTP de acesso familiar e quatro de comunicados coletivos. A interface não foi publicada nesta rodada; não houve alteração de banco ou envio externo.

Cada comunicado na gestão tem o botão **Excluir**. A confirmação informa o alcance da exclusão. Na tela de um aluno, ela retira a mensagem daquele destinatário. Em **Todos da equipe**, ela retira o envio e as cópias das caixas de entrada dos destinatários.

Desde 05/11/2026, os formulários enviam comunicados como `aviso`. Pedidos de autorização antigos ficam guardados no banco como histórico e foram retirados das telas de comunicados.

Quando o responsável acompanha irmãos, há uma entrega por aluno, visível na área de cada dependente. As contagens são de cadastros, não de pessoas únicas. O responsável pode responder separadamente por cada criança.

## Consulta na ficha pelos professores — 22/11/2026, local para validação

Em **Alunos**, abra **Ver ficha** (ícone do olho). O bloco **Histórico de comunicados**, depois de **Área do aluno**, mostra todos os avisos daquele cadastro, incluindo cópias dos envios coletivos. Cada recado traz título, conteúdo, data/hora de envio, nome e perfil da conta destinatária e o estado **Sem confirmação de leitura** ou **Leitura confirmada · Estou ciente em…**. Há um resumo de enviados, confirmados e pendentes. Use **Atualizar comunicados** para consultar novamente; a atualização automática visível continua a cada 30 segundos.

O professor consulta o registro e não pode confirmar pelo destinatário nessa ficha. Enviar e excluir continuam no menu **Comunicados**. A confirmação indica que a conta do aluno ou responsável executou **Estou ciente**, sem afirmar compreensão do texto ou identidade física de quem usou a conta. A ausência de confirmação também não comprova que o recado nunca foi aberto. O primeiro horário registrado é preservado ao repetir a mesma confirmação. Nomes são os da conta consultada atualmente; não foi criada uma cópia histórica do nome.

Refinamento visual de 22/11/2026: **Histórico de comunicados** começa recolhido, com os totais no resumo. Clique para expandir a lista compacta de títulos e situações; cada recado também pode ser expandido separadamente para consultar conteúdo, destinatário e horários. Os controles nativos aceitam teclado. A atualização da consulta conserva os blocos abertos. Esse recolhimento se aplica à consulta na ficha; os recados do portal do aluno continuam com o botão **Estou ciente**. Nenhum registro é removido ao recolher.

O build/typecheck foi executado e passou após esse refinamento. No navegador, conferidos estado inicial recolhido, expansão independente de um recado, manutenção das datas, atualização mantendo a consulta aberta e recolhimento por teclado. Não foi repetida a suíte HTTP, pois o refinamento não altera API ou persistência. [Ficha recolhida com dados fictícios](screenshots/comunicados-ficha-recolhida.jpg).

A API administrativa existente acrescenta `destinatario: { nome, perfil } | null` à consulta individual. O histórico continua filtrado pelo aluno e protegido por sessão de administrador. Não expõe senha, e-mail ou credenciais nessa projeção. Portal do aluno continua restrito às próprias mensagens. Sem novas tabelas ou migração.

Verificação desta entrega: build/typecheck e **22 testes HTTP** de comunicados/acesso familiar passaram, incluindo pendência antes de confirmar, horário original preservado, isolamento por aluno, responsável identificado, acesso administrativo negado a aluno/visitante e ausência de rota administrativa para responder pelo aluno. No navegador, a aplicação real com SQLite em memória mostrou uma pendência e uma confirmação; a conta fictícia do aluno confirmou, e a ficha administrativa passou a mostrar duas confirmações com horário. [Captura fictícia](screenshots/comunicados-leitura-ficha.jpg). Nenhum dado real, banco externo, commit ou publicação foi alterado.

## Por que foi feito assim

Pense num comunicado entregue a toda a turma, acompanhado de uma lista de assinaturas. O professor escreve uma vez, mas cada destinatário confirma a própria leitura. Reutilizamos `ComunicadoAluno`, que já controla as respostas e o acesso de cada pessoa.

`LoteComunicado` representa o envio coletivo. `EntregaComunicado` liga o lote a cada mensagem individual, guardando o nome no momento do envio. As pendências daquele envio também ficam registradas; preparar uma conta depois não altera o resultado histórico do lote.

A gravação é uma única transação: se uma entrega falhar, nenhuma parte do lote fica salva. O formulário mantém um identificador UUID durante uma tentativa. Repetir o mesmo pedido devolve o lote já criado; usar aquele identificador com outro conteúdo gera conflito, evitando mensagens duplicadas por repetição da requisição.

## Contratos e segurança

- Administrador: `GET /api/comunicados/destinatarios`, `GET /api/comunicados/lotes`, `POST /api/comunicados/lotes`.
- Exclusão administrativa usa `DELETE /api/alunos/:id/comunicados/:comunicadoId` para um destinatário ou `DELETE /api/comunicados/lotes/:id` para o envio coletivo. A exclusão das mensagens e de seus vínculos acontece em uma transação.
- POST aceita somente `id`, `tipo`, `titulo` e `mensagem`; o autor vem da sessão.
- Respostas continuam nos contratos individuais do portal, restritas ao destinatário e ao aluno acompanhado.
- SQLite usa `BEGIN IMMEDIATE`; PostgreSQL prepara transação com o mesmo bloqueio de alterações familiares. PostgreSQL externo não foi executado nesta rodada.
- Migração 16 somente acrescenta duas tabelas; não altera mensagens anteriores.

## Verificação real em 27/10/2026

Suíte completa: **264 testes TypeScript passaram**, incluindo envio coletivo, repetição concorrente sem duplicar, conteúdo divergente, rollback de entrega com falha, permissões, destinatário responsável e respostas independentes. Build/typecheck e Prisma gerado/validado passaram.

Na interface local, um aviso fictício foi enviado de uma vez às duas contas da QA. Uma delas confirmou **Estou ciente**: a gestão mostrou uma resposta e a outra aguardando confirmação. Nenhuma mensagem real foi enviada para fora da plataforma.

SQLite principal e QA foram atualizados para v17 (migrações 16 e 17), com backup e hashes idênticos das 27 tabelas anteriores. Supabase segue v10, sem acesso nem aplicação das migrações 11–17, por solicitação do usuário.

WhatsApp e e-mail continuam futuros. Este envio coletivo acontece **dentro do Tatame**.
