# Evolução configurável da graduação

## Registro manual de graus — 05/11/2026

No ajuste da graduação, faixas padrão até a marrom, inclusive as antigas sem categoria e as infantis, oferecem **Sem graus** e **1º a 4º grau**. A preta oferece até o **6º grau**. A faixa seguinte na referência da IBJJF é vermelha e preta, correspondente ao 7º grau. O catálogo vigente do Tatame termina na preta. [Sistema Geral de Graduação da CBJJ/IBJJF](https://cbjj.com.br/graduation-system).

O campo de aulas anteriores registra o total já reconhecido pelo professor. Mesmo com 120 aulas, a escolha do grau é manual. Ao salvar, o servidor cria o grau padrão se faltar no catálogo e registra a graduação no histórico. Esse fluxo também permite atualizar manualmente os graus da faixa preta.

**Atualização vigente de categorias (27/10/2026):** Infantil, Juvenil e Adulto seguem as opções enviadas pelo usuário, somente até preta. A meta de aulas é independente por faixa/categoria. Migração 14 apenas acrescenta registros; os alunos/graduações antigos aguardam classificação explícita do professor, sem inferência por idade nem perda de histórico. [Sequência e uso atuais](GRADUACOES.md). As capturas/listas anteriores sem categorias são históricas.

Entrega local de 27/10/2026. Aguardando validação do usuário antes de commit/push. Nenhuma migração no Supabase foi autorizada ou executada nesta etapa.

## Catálogo simplificado

As 20 faixas kids e adultas seguem sequência, cores e listras fixas. Não há criação/edição/exclusão de faixas nem controle de ativação. Aulas e demais metas continuam editáveis por faixa. Registros personalizados anteriores foram preservados. Consulte [GRADUACOES.md](GRADUACOES.md) para sequência, migração 13 e verificação atual. Nenhum bloqueio etário foi inferido da imagem.

## O que mudou para a academia

Faixa e Grau na faixa saíram do formulário comum de cadastro/edição. Nome, contato, nascimento, matrícula e situação continuam ali. A graduação passou para **Alunos → Ver ficha → Evolução da graduação**.

A área administrativa **Regras de graduação → Configurar aulas** permite editar a quantidade de aulas por grau e salvar. A configuração não mostra lista de graus nem os campos de total/destino. A academia escolhe:

- aulas confirmadas por grau, opcional;

Os critérios de meses por grau e permanência mínima foram retirados a pedido do usuário. A evolução atual considera aulas confirmadas e a sequência de graus; o mestre continua confirmando cada promoção. Nenhuma cor impõe espera obrigatória. A academia pode deixar a meta de aulas vazia para avaliação manual, sem inventar uma meta automática. Os campos de meses permanecem no banco e nos snapshots antigos por compatibilidade, mas não são usados no cálculo. A API aceita apenas os valores neutros antigos (null e 0), ou a omissão desses campos, e rejeita novas exigências de tempo. Ao salvar, grava os valores neutros. Nenhuma migração extra ou reescrita de histórico é necessária.

Ao salvar aulas, os graus de 0 a 4 são criados se faltarem nas faixas branca, kids e coloridas até marrom. O limite de quatro não é aplicado automaticamente à preta, corais ou registros personalizados anteriores. Itens já inativos não são reativados silenciosamente. Cores e ordem seguem o catálogo padrão; a evolução do grau é controlada na ficha do aluno; renumerar um grau já atribuído a aluno é bloqueado para não alterar sua graduação por outro caminho.

## Exemplos configuráveis

| Exemplo | Aulas por grau | Graus para concluir | Total de aulas |
|---|---:|---:|---:|
| Regra escolhida pela academia | 30 | 4 | 120 |
| Outra regra possível | 20 | 4 | 80 |

Com 30 aulas por grau, as metas acumuladas desde o início da faixa são 30, 60, 90 e 120. As concessões acontecem uma por vez, sempre confirmadas pelo mestre. Aos quatro graus e 120 aulas, a faixa seguinte fica disponível se houver um destino configurado. Aulas sozinhas não mudam a graduação. Alterar a meta não apaga nem desfaz promoções antigas.

## Ponto de partida e cadastros antigos

O banco não sabe a data em que cada aluno recebeu a faixa atual. A migração preserva a graduação anterior e deixa o acompanhamento sem estado inicial até o mestre informar a data real.

Na ficha, **Definir ponto de partida** permite selecionar faixa/grau, data de início e aulas anteriores não registradas. Um cadastro novo usa a primeira faixa ativa do catálogo como valor inicial de compatibilidade; a ficha permite corrigir para a graduação real antes de iniciar o acompanhamento. Não se considera matrícula como data de graduação.

**Aulas anteriores não registradas** é um crédito histórico informado pelo mestre. Não incluir novamente aulas que já aparecem na chamada, para evitar soma indevida. O sistema mostra separadamente presenças confirmadas e crédito reconhecido. **Ajustar graduação** permite corrigir dados/registrar uma exceção do mestre; o ajuste fica registrado automaticamente, sem fingir que os critérios foram cumpridos automaticamente.

Grau não informado não é tratado como zero confirmado para liberar uma promoção. O mestre deve confirmar o grau atual; Sem graus (0) é uma escolha explícita.

Editar dados comuns preserva faixa/grau, inclusive se uma promoção acontecer simultaneamente. Troca de graduação por PUT comum é recusada com orientação para usar a ficha. Alunos com histórico de graduação devem ser inativados, em vez de excluídos.

## Quais aulas contam

Somente **PresencaAula presente**, confirmada pelo professor, ligada a uma aula não cancelada, ocorrida até hoje e a partir da data inicial da faixa. Uma mesma aula conta uma vez; vários horários no mesmo dia podem contar separadamente. Check-in pendente, ausência, aula cancelada e aula anterior ao início não contam.

O registro antigo por modalidade (Presenca) não é somado automaticamente, pois não identifica o encontro e poderia duplicar a chamada. Aulas antigas reconhecidas podem ser informadas pelo mestre no ponto de partida. A regra foi confirmada pelo usuário: contar presenças validadas pelo professor.

Ao mudar de faixa, a contagem recomeça. Os identificadores das aulas já utilizadas ficam no marco da nova faixa, impedindo recontagem até se uma marcação antiga for apagada e criada de novo. Uma presença nova do mesmo dia pode contar. Conceder apenas um grau mantém o acumulado da faixa.

Corrigir/remover presenças recalcula o progresso, mas não rebaixa nem apaga uma promoção já confirmada; divergências são avaliadas pelo mestre e podem gerar ajuste justificado.

## O que o aluno vê e como sinaliza

Em **Meu perfil → Minha trajetória**, aparecem faixa/grau, data inicial, aulas confirmadas, crédito anterior, próxima meta, aulas restantes e as datas dos graus recebidos.

Quando apto, **Sinalizar ao professor** registra um pedido interno. O mesmo estado de graduação aceita um pedido, inclusive diante de requisições repetidas/concorrentes. O botão fica Professor avisado. A concessão de grau/faixa ou ajuste muda a versão do estado e encerra a indicação pendente anterior, preservando o histórico do pedido.

Na gestão, **Alunos → Graduações para revisar** lista quem atingiu critérios ou avisou. Clicar abre a ficha. O professor confere o caso e confirma a promoção pelo botão **Adicionar próximo grau** na ficha administrativa do aluno. O aluno não escolhe a própria faixa/grau e não chama a API administrativa. Consultar trajetória e sinalizar continuam disponíveis durante bloqueio financeiro; isso não libera check-in. A API familiar também respeita o vínculo existente do responsável, sem permitir promoção por ele. Aviso é interno ao Tatame; não envia e-mail/WhatsApp.

## Modelo, contratos e motivo técnico

- **RegraGraduacao:** uma configuração por faixa. Relação com a próxima faixa opcional.
- **EstadoGraduacao:** um estado por aluno, com início, crédito anterior, marco de aulas e versão.
- **EventoGraduacao:** histórico de ajustes, concessões e pedidos, com faixa/grau anterior/novo, aulas consideradas, motivo, autor, data e snapshot da regra usada.
- Migração **12** aditiva para SQLite/PostgreSQL. Nenhuma regra, data inicial ou promoção é inventada ao migrar.
- `GET /api/graduacoes/regras`, `PUT /api/graduacoes/faixas/:id/regra` e `GET /api/graduacoes/pendencias`: administração.
- `GET/POST /api/alunos/:alunoId/graduacao`: progresso e ações administrativas. Ajuste dispensa justificativa digitada; grau/faixa exigem versão do estado e assinatura da regra apresentada.
- `GET /api/portal/graduacao`, `POST /api/portal/graduacao/solicitacao`: conta própria vinculada, sem aceitar outro aluno no corpo. Equivalentes familiares seguem o acesso por dependente já existente.

Cálculos ficam no backend Node, junto das transações e verificações de acesso. Não dependem de IA nem de um contador enviado pelo navegador. Regras, graus criados e alterações de graduação/histórico são gravados de forma atômica. SQLite usa transação imediata; Prisma/PostgreSQL serializa catálogo por advisory lock e trava o aluno. A versão impede promoção duplicada por clique simultâneo; a assinatura da regra exige recarregar se os critérios mudarem durante a confirmação. Snapshot/histórico explicam uma decisão antiga sem depender das configurações atuais.

## Verificação executada e limites

**Estado mais recente:** após simplificar para apenas aulas/Salvar e Adicionar próximo grau na ficha, 248 testes TypeScript e build/typecheck passaram. Mais uma execução focada de 16 testes passou, com recusa explícita do quinto grau. A UI fictícia confirmou configuração, concessão do primeiro grau, histórico e bloqueio da meta seguinte. Testes específicos verificam que tempos antigos não bloqueiam grau/faixa, não são mais configuráveis pela API e não alteram o histórico existente. SQLite local v13 com backup, 25 tabelas além do catálogo preservadas e IDs das faixas anteriores mantidos. A interface fictícia confirmou salvar e reabrir metas kids. Os itens seguintes registram a validação anterior da evolução (v12), não uma segunda execução de Prisma ou Python.

- **243 testes TypeScript aprovados**, incluindo 16 novos de evolução: 30/120 aulas, critérios de tempo, combinação, datas, presenças elegíveis, marco entre faixas, edição comum, histórico, permissões, pedidos idempotentes, concorrência, regra alterada, bloqueio financeiro, rollback e migração aditiva.
- Build/typecheck, geração e validação Prisma aprovados. Expectations dos testes anteriores foram atualizadas para a migração 12 e o novo fluxo de edição; verificações de preservação permaneceram.
- SQLite real local na versão 12, com backup, hashes dos dados das **23 tabelas anteriores iguais**, chaves estrangeiras válidas. API local reiniciada. Nenhum aluno real foi graduado para demonstração.
- Navegador fictício confirmou 29 aulas/falta uma, validação da 30ª presença, aviso do aluno, pedido na gestão, concessão de grau, atualização da próxima meta/histórico e formulário comum sem faixa/grau. Configuração por tempo (6/24 meses) foi salva pela interface. Capturas em screenshots/trajetoria-*.png e aluno-cadastro-sem-graduacao.png.
- A primeira tentativa de escrita no servidor fictício usava portas fora das origens locais permitidas e foi recusada corretamente. O harness ignorado foi ajustado para traduzir somente suas próprias origens de QA; proteção de origem da aplicação real não foi alterada.
- **Supabase permanece na migração 10. Migrações 11 e 12 externas preparadas e NÃO aplicadas, por pedido expresso do usuário para aguardar.** Nenhuma prova PostgreSQL externa desta etapa, implantação pública ou teste físico em celular. Python/IA não foram alterados e não foram retestados nesta mudança.
- Aguardando validação humana antes de commit/push. Permanece na branch codex/evolucao-tatame com base c8c7ef4; versão/tag não foram alteradas.

## Defesa oral, em linguagem simples

A regra é o combinado da academia; o estado é o ponto em que o aluno está; o histórico é o livro de registros. A lista de presenças comprova as aulas, e o mestre confirma a promoção pelo botão **Adicionar próximo grau** na ficha administrativa do aluno. O sistema ajuda a lembrar, calcular e conferir, sem substituir a avaliação técnica.

Perguntas para estudar: por que um check-in sozinho não comprova que o aluno treinou? Por que precisamos guardar a regra usada numa promoção antiga e impedir dois cliques de concederem dois graus?

## Tela atual simplificada

Meses por grau e permanência mínima foram removidos; esta captura substitui as imagens anteriores que exibiam configuração por tempo.

## Simplificação final de 27/10/2026

Na configuração da faixa existe somente a quantidade de aulas e Salvar. No perfil administrativo do aluno, Adicionar próximo grau abre a confirmação de um avanço. Aulas e graus já registrados não são modificados ao editar a meta. O limite de quatro é uma decisão de produto para branca/kids/coloridas até marrom; não uma afirmação de norma universal para todas as faixas.

A API aceita o corpo reduzido {aulasPorGrau}. Preserva destino anterior omitido e usa quatro graus nas faixas cobertas. Campos antigos aceitos por compatibilidade não podem redefinir esse limite; quinta graduação não pode ser cadastrada/atribuída nessas faixas. Dados legados além de quatro continuam preservados, sem rebaixamento automático. Regras antigas de total diferente são interpretadas como quatro no progresso dessas faixas, sem reescrever dados históricos. Para faixas avançadas/legadas, dados anteriores permanecem; não foi inventada uma regra nova para preta/corais. Sem nova migração.

Esta captura substitui os formulários maiores anteriores:

## Ajustes sem justificativa e graus com datas — 27/10/2026

O professor usa **Ajustar graduação** sem escrever uma justificativa. O formulário envia somente a graduação, início da faixa, crédito anterior e versão. O backend preenche uma descrição automática no evento; autoria, data, valores anteriores/novos e histórico antigo continuam preservados. Motivos informados por clientes antigos ainda são aceitos e preservados, mas não são pedidos pela interface. O aluno continua sem permissão para alterar graduação.

A seção visível passou a ser **Graus recebidos**: apenas o grau/faixa e a data da concessão registrada. Não exibe ponto de partida, ajustes, pedidos ou explicações. Esses eventos continuam no histórico interno e na resposta autorizada da API. A data mostrada vem da concessão no sistema, em São Paulo; não é inventada a partir de uma correção ou do ponto de partida.

249 testes TypeScript passaram após a mudança do contrato sem justificativa, incluindo ajuste para cima/baixo, autoria e preservação de registros anteriores, além da rejeição de aluno. O último ajuste visual da lista recebeu build/typecheck e conferência de navegador; não se apresenta o teste de backend como prova automatizada dessa tela. Na UI fictícia o ajuste salvou sem texto e a lista manteve apenas o primeiro grau com a data, sem criar um segundo recebimento.
