# Comunicados da academia

## Uso atual

O menu administrativo **Comunicados** reúne os envios, fora da ficha dos alunos. Com **Todos da equipe** selecionado, escreva um título e uma mensagem e use **Enviar para toda a equipe**. Para um envio individual, escolha um aluno na lista de destinatários.

O envio coletivo considera alunos ativos. Cada cadastro recebe uma mensagem em seu acesso principal: aluno com acesso próprio, ou responsável quando o menor tem esse acesso como principal. Cadastros sem conta/vínculo adequado aparecem em **Cadastros que precisam de atenção** e não são apresentados como entregas. Depois de preparar um acesso que faltava, envie a mensagem individualmente para esse aluno. Alunos cadastrados depois não entram retroativamente nos lotes antigos.

O aluno ou responsável recebe a mensagem na aba **Comunicados** e confirma pelo botão **Estou ciente**. Na gestão, abra **Ver confirmações individuais** para acompanhar cada cadastro. A confirmação exige uma ação da pessoa.

Cada comunicado na gestão tem o botão **Excluir**. A confirmação informa o alcance da exclusão. Na tela de um aluno, ela retira a mensagem daquele destinatário. Em **Todos da equipe**, ela retira o envio e as cópias das caixas de entrada dos destinatários.

Desde 05/11/2026, os formulários enviam comunicados como `aviso`. Pedidos de autorização antigos ficam guardados no banco como histórico e foram retirados das telas de comunicados.

Quando o responsável acompanha irmãos, há uma entrega por aluno, visível na área de cada dependente. As contagens são de cadastros, não de pessoas únicas. O responsável pode responder separadamente por cada criança.

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
