# Evolução funcional do Tatame

**Planos — incremento aprovado em 22/10/2026:** configurador individual de plano ilimitado/limite semanal na ficha, resumo no portal, restrição transacional de check-in e liberação administrativa por aula implementados e aprovados para commit/envio após nova validação automatizada bem-sucedida. [PLANOS.md](PLANOS.md) distingue as regras atuais das propostas abaixo. Catálogo compartilhado, turmas incluídas, preço/cobrança de excedentes e geração mensal continuam futuros. Hospedagem ficou para outra ocasião, conforme pedido do usuário. Autorização registrada em PROCESSO.md.

**Aprovação posterior — 22/10/2026:** o usuário autorizou commit/envio das implementações locais de chamada, horários combinados, aniversários, login/portal e bloqueio financeiro, condicionado aos testes. A nova execução passou; pendências de aprovação anteriores são históricas. As funcionalidades futuras deste plano continuam planejadas, sem autorização automática de implementação. Registro em [PROCESSO.md](PROCESSO.md).

Data: 19/10/2026. Base consultada: commit `fb7600a`, branch `codex/reestruturacao`.

**Situação atualizada em 22/10/2026:** turmas, aulas, chamada, horários combinados, aniversários, login e primeiro portal implementados localmente; validação do usuário pendente. As demais propostas abaixo continuam em planejamento. O usuário escolheu começar por turmas, horários e chamada dos professores. Confirmou turmas fixas com participação em outras turmas, várias presenças por aluno no mesmo dia e criação de aulas extras fora da grade. Este documento não implementa as funções abaixo nem representa aprovação para enviar alterações ao GitHub. A tag `v1.0.0` continua preservando o MVP inicial; não estamos criando uma nova versão neste planejamento.

**Objetivo comercial futuro:** o usuário pretende vender a plataforma para outras equipes. O planejamento deve permitir que cada academia configure planos ilimitados, limites de treinos e turmas incluídas, com tratamento de participações excedentes. A academia atual usa mensalidade com treinos ilimitados. Regras detalhadas de excedente e operação com várias academias ainda precisam de definição; não estão implementadas.

**Estado de execução posterior ao planejamento:** entrega 1A implementada, testada, aprovada e enviada no commit `507d260`; 1B, incluindo exclusão de extras, enviada em `dd3212e` após aprovação em 20/10/2026. O nome histórico era `codex/reestruturacao`; a branch atual é `codex/evolucao-tatame`. Em 21/10/2026, o usuário autorizou começar as melhorias, priorizando a chamada por aula. **1C implementada e testada localmente, aguardando validação antes de commit/push.** Guias: [TURMAS.md](TURMAS.md), [AULAS.md](AULAS.md), [CHAMADA.md](CHAMADA.md). Demais etapas continuam propostas. A proposta de versionamento está em [VERSIONAMENTO.md](VERSIONAMENTO.md); nenhuma nova tag foi criada.

## 1. O objetivo da próxima evolução

Conectar as funções existentes à rotina da academia: organizar aulas, fazer a chamada, gerar mensalidades, acompanhar a evolução dos alunos e transformar os registros em informações úteis. Cada entrega deve funcionar por inteiro e poder ser demonstrada e explicada pelo candidato.

Exemplo do fluxo desejado: o administrador cadastra um aluno e seu plano; vincula o aluno a uma turma; o professor abre a aula do dia e registra presenças; o financeiro gera as cobranças do mês; os indicadores mostram frequência e inadimplência; a IA explica os resultados calculados.

Esse fluxo completo ainda não existe. Hoje há cadastro de alunos, turmas com grade fixa e vínculos habituais, agenda de aulas datadas/extra com cancelamento, cobranças criadas individualmente, registro de pagamento, dashboard, chamada por aula e formato anterior por data/tipo, analytics Python e integração de IA configurável. Login e portal do aluno foram implementados posteriormente, com check-in no dia e validação administrativa; guia em [ACESSO_ALUNO.md](ACESSO_ALUNO.md). Ainda não há planos, reservas futuras, cobrança de excedentes nem perfil separado de professor. Chamada, horários combinados, aniversário e acesso individual continuam em validação local, sem envio ao GitHub.

## 2. O que precisa ser concluído para o desafio

A leitura do enunciado completo, com 19 páginas, confirma que as funções extras não substituem estas entregas:

| Pendência | Resultado necessário |
| --- | --- |
| IA real, páginas 7–8 | Executar a integração externa com dados persistidos e indicadores Python; conferir a resposta e o histórico. Código existente e teste com substituto não comprovam uma chamada real. |
| Dois projetos, página 12 | Preparar duas aplicações executáveis em dois repositórios públicos: gestão básica e evolução com inteligência. Registrar a origem do código e manter instalação própria em cada entrega. |
| Banco escolhido | Validar migrations, seed e operações no PostgreSQL/Supabase em ambiente separado. SQL é obrigatório; Supabase é recomendado pelo desafio e faz parte da stack escolhida pelo usuário. Não trocar a conexão do banco local nem transferir seus registros implicitamente. |
| Qualidade da entrega, páginas 10–13 e 19 | Conferir execução a partir de clone limpo, documentação, exemplos fictícios, histórico de commits e evidências dos cálculos. |
| Defesa, páginas 16–18 | Explicar o caminho tela → API → banco, as regras, o papel do Python e os dados enviados à IA; praticar pequenas alterações. |

Esses pontos devem ser acompanhados ao longo das entregas. A definição dos dois projetos precisa ocorrer antes de espalhar novas dependências: o projeto de gestão deve continuar executável sem Python ou chave de IA.

O planejamento inicial não executou testes. A implementação posterior da entrega 1A chegou a 44 testes TypeScript aprovados, incluindo exclusão, além de 12 Python, build, validação de schema e navegador. Não houve validação de provedor externo. Evidências datadas e limites em [REVISAO_IA.md](REVISAO_IA.md).

## 3. Ordem proposta das melhorias

O usuário confirmou a prioridade em turmas, horários e chamada dos professores. As etapas posteriores continuam como proposta. Login foi implementado antes do primeiro portal individual; funções adicionais de professor e planos continuam propostas.

| Entrega | O que o usuário verá | Por que acrescentar | Dependências |
| --- | --- | --- | --- |
| 1 — Turmas e aulas | Turmas, grade fixa, aulas extras, professor responsável e chamada por aula, permitindo várias aulas por aluno no dia | Aproxima a presença da rotina real e esclarece o significado do tipo de treino | Detalhar a rotina confirmada; migração preservando as presenças atuais |
| 2 — Login e permissões | Entrada com conta e telas adequadas a administrador e professor | Define quem pode consultar ou alterar cada informação | Decidir matriz de permissões e forma de autenticação; vínculo com professores |
| 3 — Planos e mensalidades | Planos configuráveis, treinos ilimitados ou limitados, turmas incluídas, tratamento de excedentes e geração mensal com prévia | Atende modelos diferentes de academia e reduz tarefas financeiras repetitivas | Regras de consumo e cobrança confirmadas; permissões, aulas identificadas e histórico de alterações |
| 4 — Ficha e evolução do aluno | Histórico de graduação, graus, frequência e responsável quando necessário | Enriquece o acompanhamento sem perder o passado | Confirmar campos e regras reais da academia |
| 5 — Área do aluno | Próprias mensalidades e presenças, consulta das aulas e inscrição conforme o plano | Permite acompanhar a situação e escolher as aulas respeitando a cota ou a liberação adicional paga | Login, vínculo conta/aluno e autorização na API; aulas e regras de plano/cobrança já organizadas |
| 6 — Relatórios e IA | Comparação de períodos, filtros e resumo fundamentado da academia | Transforma dados operacionais em apoio à gestão | Dados e fórmulas conferidos; IA externa efetivamente validada |
| 7 — Automação opcional | Preparação de lembretes e resumo periódico, possivelmente com n8n | Reduz tarefas repetitivas e pode atender ao bônus do desafio | Fluxos anteriores estáveis; canal, destinatários e regras definidos |

As entregas não precisam entrar em um único pacote. Cada uma será dividida em mudanças menores, testada e apresentada para validação antes de commit e envio.

## 4. Primeira prioridade confirmada: turmas e aulas

Uma **turma** organiza um grupo e sua programação. A **grade fixa** define dias e horários habituais. Uma **aula** é um encontro em uma data e horário específicos: pode vir da grade ou ser criada como **aula extra**, fora dela. A **presença** registra a participação de um aluno em uma dessas aulas.

### Rotina confirmada e comportamento proposto

Resposta do usuário: “Há turmas fixas, mas o aluno também pode participar de outras”.

Esclarecimento posterior: no mesmo dia, um aluno pode participar das aulas fixas das 12h e 18h e também de um treino extra às 15h, se o responsável criar essa aula. Portanto, a flexibilidade inclui tanto frequentar outras aulas existentes quanto criar um encontro fora da grade fixa.

- Manter o vínculo habitual do aluno com sua turma ou turmas, sem impor neste plano que só possa ter uma.
- Exibir os alunos habituais na chamada da aula, sem marcar presença ou ausência automaticamente.
- Permitir buscar e adicionar à aula um aluno já cadastrado de outra turma. Essa participação pontual não altera seu vínculo habitual.
- Registrar a presença na aula específica, sem duplicar o aluno na mesma chamada nem gerar presença em outra aula.
- Permitir várias presenças do aluno no mesmo dia, uma por aula efetivamente realizada. Na academia atual, o plano é ilimitado e não gera adicional pela quantidade de treinos. Outras academias poderão adotar limites e regras comerciais próprias, sem reduzir o registro de presenças a uma por dia ou modalidade.
- Permitir que o responsável crie uma aula extra com data, horário, professor e demais informações aplicáveis, sem alterar a grade fixa. Ela pode estar associada a uma turma ou ser avulsa, sem exigir uma turma fictícia apenas para registrá-la.
- O aluno não escolhe um horário arbitrário e gera presença sozinho: primeiro deve existir a aula, cadastrada pelo responsável, e então sua chamada.
- Não registrar falta apenas porque o aluno não participou de uma turma à qual não está vinculado. A correção da chamada continua sendo uma ação explícita do responsável.

Exemplo: Ana está vinculada à turma das 19h e treina pontualmente na aula das 20h. O responsável pode incluí-la na chamada das 20h; Ana continua vinculada à turma habitual. Isso não marca automaticamente sua presença nem sua ausência na aula das 19h.

### Grade fixa e aula extra na interface

| Opção proposta | Informações | Efeito |
| --- | --- | --- |
| Grade fixa | Turma, dia da semana, horário e professor responsável | Define a programação habitual; as aulas realizadas mantêm seus próprios registros |
| Criar aula extra | Data, horário livre, professor, modalidade/objetivo quando aplicáveis e turma opcional | Acrescenta um encontro específico, sem mudar os horários fixos |
| Chamada da aula | Aula selecionada e seus participantes | Salva a presença de cada aluno naquele encontro |

Exemplo para a mesma segunda-feira:

| Horário | Origem | Participação do mesmo aluno |
| --- | --- | --- |
| 12h | Grade fixa | Uma presença nesta aula |
| 15h | Aula extra criada pelo responsável | Uma presença nesta aula |
| 18h | Grade fixa | Uma presença nesta aula |

Resultado esperado: três presenças em três aulas distintas, em um dia de treino. Essas aulas podem inclusive ter a mesma modalidade. Repetir a marcação da mesma aula deve atualizar o registro existente, sem criar uma quarta presença. Nos indicadores, manter clara a diferença entre quantidade de treinos e quantidade de dias treinados.

No exemplo da academia atual, os três treinos estão incluídos na mensalidade. Ser uma aula extra na agenda não determina seu preço: a inclusão ou eventual adicional depende do plano contratado. Essa separação deve ser preservada no desenho dos módulos de aulas e planos.

### Divisão em pequenas entregas para validação

| Parte | Entrega concreta | Validação principal |
| --- | --- | --- |
| 1A — Turmas, implementada localmente | Listagem, cadastro/edição, professor responsável, grade fixa de dias/horários, situação, vínculos habituais e exclusão definitiva | Testes e navegador conferidos; usuário aprovou commit/push |
| 1B — Aulas, implementada localmente | Listagem por dia/turma, encontros criados da grade fixa, aula extra avulsa/vinculada, previstos, cancelamento com motivo e exclusão definitiva de extras com confirmação | Testes e navegador conferidos; usuário aprovou commit/push em 20/10/2026 |
| 1C — Chamada, implementada localmente | Previstos, inclusão pontual, marcação/correção/limpeza por aula e proteção do histórico | 81 testes TypeScript, 13 Python, build, navegador e integração local conferidos; aguardando validação do usuário antes de commit/push |

As partes 1A e 1B foram enviadas ao GitHub. A parte 1C está implementada/testada localmente e usa o histórico de previstos de 1B sem aplicar vínculos atuais retroativamente. As marcações antigas não foram associadas a aulas presumidas. Login e autorização por professor continuam na entrega 2; identificar o responsável na tela não restringe o acesso sozinho.

### Escopo inicial

1. Cadastrar e editar uma turma: nome, programação, professor responsável e situação ativa/inativa.
2. Vincular alunos à turma e permitir a participação pontual em aulas de outra turma, conforme a rotina confirmada.
3. Criar e consultar aulas da grade fixa e aulas extras, com data, horário e situação realizada/cancelada. A aula extra não depende de alterar a grade ou cadastrar uma turma nova. No primeiro incremento, criar uma aula não exige geração automática de todo o calendário.
4. Abrir uma aula e registrar a chamada dos alunos vinculados, permitindo incluir um aluno cadastrado de outra turma. O mesmo aluno pode participar de várias aulas no dia. Sem marcação significa “não registrado”; não converter automaticamente todos os demais em ausentes.
5. Manter o histórico de aulas e presenças. Uma turma com histórico deve poder ser desativada sem apagar seus registros.

Separar **modalidade** (“com kimono” ou “sem kimono”) de **objetivo da aula** (“fundamentos” ou “competição”, caso usados pela academia). A existência de “Fundamentos” no MVP foi uma hipótese inicial, não uma regra confirmada pelo usuário. As opções finais dependem da rotina real.

O nome do professor cadastrado nesta etapa não equivale a uma conta autenticada. O vínculo com seu acesso será tratado na entrega 2. O uso inicial permanece administrativo/local.

### Como conferir a entrega

- Cadastrar uma turma, associar alunos e definir horários fixos às 12h e 18h na segunda-feira.
- Criar uma aula extra às 15h da mesma segunda-feira, inclusive sem vínculo com turma, e conferir que a grade fixa permanece igual.
- Registrar o mesmo aluno nas três aulas, inclusive usando a mesma modalidade, e conferir três presenças independentes. Repetir a marcação da mesma aula não pode criar uma quarta presença.
- Incluir um aluno de outra turma em uma aula e conferir que o vínculo habitual permanece igual e que nenhuma outra chamada foi marcada automaticamente.
- Cancelar uma aula sem gerar faltas ou contá-la como treino realizado.
- Reiniciar o sistema e conferir os registros salvos.
- Aplicar a migração em uma cópia da base atual e conferir que os registros anteriores continuam íntegros.
- Conferir com um exemplo calculado manualmente como as presenças antigas e novas entram na frequência Python.

**Cuidado com o histórico:** as presenças atuais não informam turma, horário ou professor. Não inventar esses vínculos durante a migração. Preservar os registros como históricos sem aula identificada e documentar sua participação nos indicadores. A regra atual de frequência conta registros de treino; qualquer mudança para contagem por dia ou taxa sobre aulas oferecidas deve ser uma decisão específica.

**Decisão implementada em 1C:** a unicidade aluno/data/tipo permanece somente no formato anterior. A migração 004 acrescenta `PresencaAula` com unicidade aula/aluno, data/horário obtidos do encontro e proteção das FKs. Nenhum registro antigo foi reescrito ou associado a horário presumido. Os indicadores recebem ambos os formatos, sem deduplicar por dia; o mesmo evento não deve ser lançado nas duas formas. Justificativa, testes e limites em [CHAMADA.md](CHAMADA.md).

**Perguntas para a defesa:** por que separar turma de aula? Por que a presença deve apontar para a aula específica?

## 5. Regras essenciais das próximas entregas

### Login e permissões

Proposta inicial de acesso, ainda sujeita à validação:

| Perfil | Acesso proposto |
| --- | --- |
| Administrador | Gestão de alunos, turmas, planos, cobranças, relatórios, contas e permissões |
| Professor/mestre | Suas aulas e chamadas; quando autorizado para gestão, poderá atribuir e editar o plano de treino do aluno. Confirmação de pagamentos continua exigindo permissão própria |
| Aluno, na entrega 5 | Apenas os próprios dados permitidos, mensalidades, presenças e aulas disponíveis; inscrição nas aulas conforme o plano contratado |

As permissões precisam ser verificadas na API. Esconder um botão não impede uma requisição direta. Testar, por exemplo, que um professor sem permissão financeira não consegue registrar pagamento e que um aluno não consegue consultar a cobrança de outro trocando um identificador. O título de mestre, por si só, não substitui a configuração da permissão de gestão na conta.

Definir a forma de autenticação antes de implementar, incluindo criação de contas, recuperação de acesso e encerramento de sessão. Não permitir que o próprio cadastro público escolha o perfil administrador. Não incluir credenciais no código ou no Git. Nenhum provedor foi escolhido neste plano.

### Planos e mensalidades

- Cadastrar planos com nome, valor e regras de participação editáveis pelo administrador ou professor/mestre autorizado para gestão; associar ao aluno as condições contratadas, início, vencimento e situação do vínculo.
- Exibir uma prévia de quais cobranças serão criadas antes de confirmar o mês.
- Repetir a geração sem duplicar mensalidades. A regra atual é uma mensalidade por aluno/competência. Aulas excedentes exigirão itens ou cobranças adicionais identificáveis, com modelo próprio definido antes da implementação; não criar uma segunda mensalidade indistinguível nem apenas sobrescrever o total da primeira.
- Confirmar regras para entrada no meio do mês, pausa, cancelamento, desconto e alteração de plano antes de automatizá-las. Não presumir cálculo proporcional.
- Preservar o valor de uma cobrança já emitida quando o preço do plano mudar.
- Registrar quem confirmou ou corrigiu um pagamento e o motivo; manter rastreabilidade financeira.

Gerar uma cobrança no sistema não realiza um débito bancário. PIX, boleto e confirmação automática por instituição financeira seriam uma integração posterior, com conciliação e prevenção de confirmações duplicadas. Não fazem parte deste primeiro incremento financeiro.

**Pedido adicional em 22/10 — etapa final:** o usuário quer confirmação automática de pagamento por integração externa e um aviso destacado de mensalidade paga/a vencer na área do aluno, próximo ao acesso e ao check-in. Essa integração e esse novo banner foram deixados para a etapa mais sofisticada, junto ao envio de e-mails, sem confundir os dois serviços. A informação financeira aparecerá depois da identificação, sem revelar débitos publicamente na tela de login. Definir antecedência do aviso, cobrança de referência, provedor, vínculo de transação, validação da confirmação, idempotência e estornos antes da implementação. Nada disso foi conectado ou enviado nesta etapa.

**Bloqueio financeiro inicial — implementado localmente em 22/10:** consulta as cobranças existentes; vencida sem pagamento restringe o portal/check-in a partir do dia seguinte. Registro administrativo de todos os pagamentos vencidos libera na próxima consulta. Sem depender de API bancária ou e-mail, sem criar mensalidades, multa ou flag persistida. Guia e testes: [BLOQUEIO_FINANCEIRO.md](BLOQUEIO_FINANCEIRO.md). Aguarda validação do usuário.

#### Configuração dos planos de treino

O usuário confirmou a necessidade de atender tanto sua academia, com mensalidade e treinos ilimitados, quanto equipes com quantidade de treinos ou turma contratada e cobrança por participação adicional. A proposta é configurar essas regras no plano, sem alterar o código para cada cliente.

| Configuração | Exemplo ilustrativo | Efeito esperado |
| --- | --- | --- |
| Quantidade incluída | Ilimitada ou três aulas por semana | No ilimitado, cinco treinos no dia não alteram a mensalidade; no limitado, o sistema acompanha o consumo |
| Turmas incluídas | Todas ou uma seleção de turmas | Define quais encontros estão cobertos, sem confundir vínculo habitual com direito de acesso |
| Tratamento do excedente | Permitir sem adicional, exigir autorização para liberar ou oferecer aula avulsa com valor definido | Define como tratar participação além da quantidade ou fora das turmas incluídas |

Quantidade e turmas são critérios combináveis. Por exemplo, um plano pode incluir três aulas por semana em turmas selecionadas. O preço e a política de excedente pertencem à configuração da academia e às condições contratadas pelo aluno; não são decididos pela IA.

Proposta de fluxo: ao incluir o aluno na aula, conferir seu plano e mostrar se a participação está incluída ou excede as condições contratadas. Quando houver adicional, exibir o motivo e o valor ao responsável autorizado antes de confirmar a cobrança. Exceções gratuitas precisam de registro, sem alterar silenciosamente o plano.

**Fluxo solicitado pelo usuário para acesso do aluno:** o professor/mestre responsável poderá definir, por exemplo, três aulas semanais ou um plano ilimitado. O aluno autenticado verá as aulas disponíveis e poderá se inscrever nelas. No plano limitado, ao atingir a cota, uma nova inscrição incluída no plano será bloqueada; se a academia oferecer aula adicional paga, mostrar a opção e o preço e liberar aquele encontro após a confirmação do pagamento. Essa liberação é específica e não transforma todo o plano em ilimitado. No plano ilimitado, a quantidade de treinos não gera bloqueio por frequência nem adicional. As aulas elegíveis ainda respeitam as turmas incluídas no plano, quando houver essa restrição.

**Inscrição e presença:** escolher uma aula antes de ela acontecer é inscrição; presença confirmada comprova a participação realizada. Não contar uma inscrição antecipada como treino realizado nos indicadores Python. Antes da implementação, definir quando a cota é comprometida, como a presença será confirmada e como cancelamento ou falta afetam o saldo. O pedido confirma limite e possibilidade de pagamento adicional, mas não define esses detalhes. No primeiro fluxo financeiro, pagamento pode ser confirmado manualmente por alguém autorizado; integração automática continua sendo outra etapa.

Presença registra o que aconteceu; liberação de acesso e cobrança são decisões relacionadas, mas distintas. Uma aula extra pode ser gratuita para um plano ilimitado. Uma aula da grade fixa pode estar fora de um plano restrito. Não omitir uma presença já ocorrida por haver pendência comercial; nesse caso, registrar a participação e encaminhar a situação para regularização. Um bloqueio de reserva ou entrada seria aplicado antes da participação, conforme a regra escolhida.

Antes da implementação dos limites, definir:

- Se o limite conta aulas ou dias de treino. A proposta inicial é contar aulas, identificadas separadamente; não presumir que dois treinos no mesmo dia consomem uma única unidade.
- Como começa e termina a semana, o fuso utilizado e o tratamento de mudança de plano no meio do período. Não presumir que créditos não usados acumulam.
- Como cancelamento de aula, ausência e correção de presença afetam o consumo. Não cobrar adicional apenas por aparecer na lista esperada de uma turma.
- Como evitar cobrar duas vezes uma participação que exceda simultaneamente o limite semanal e as turmas incluídas, salvo política explícita diferente.
- Quem pode liberar exceção, confirmar adicional e corrigir cobrança. Uma nova tentativa ou marcação repetida não deve duplicar o adicional da mesma participação.

As condições precisam ter vigência e histórico. Mudar hoje o preço ou limite de um plano não pode recalcular silenciosamente treinos e cobranças anteriores. A participação e o eventual adicional devem apontar para a aula e para as condições aplicáveis naquele momento. Manter dinheiro em centavos e correções financeiras rastreáveis.

Critérios de aceite futuros:

- No plano ilimitado, registrar cinco aulas no mesmo dia, inclusive extras, mantendo a mensalidade e sem adicionais por frequência.
- Em um exemplo de plano com três aulas semanais, identificar a quarta conforme a definição de semana e a política escolhidas.
- No fluxo de limite com adicional pago, impedir a quarta inscrição incluída no plano, mostrar a opção avulsa e só liberar essa aula após o pagamento confirmado. Uma tentativa de pagamento ou sua simples solicitação não equivale à confirmação.
- Aplicar a cota na API e impedir que tentativas repetidas ou simultâneas ultrapassem o limite ou gerem liberações e cobranças duplicadas.
- Identificar uma aula fora das turmas incluídas e apresentar a opção comercial configurada, sem mudar o vínculo habitual do aluno.
- Repetir a marcação sem duplicar consumo ou adicional; conferir também correção e cancelamento conforme a política definida.
- Editar preço e regras com vigência futura, preservando o histórico anterior.

#### Preparação para vender a outras equipes

Configurar planos é uma parte da evolução comercial. A operação com várias academias no mesmo sistema também exigirá definir a organização dos clientes: equipe, academia, unidade e quem administra cada uma. Esse desenho será uma etapa própria, antes de cadastrar clientes diferentes no mesmo ambiente.

O requisito será separar dados, contas, permissões e configurações de cada cliente e testar que uma academia não consulta nem altera informações de outra pela API. Não basta adicionar um seletor de academia na tela. A arquitetura atual é de uma academia local e não oferece esse isolamento; este documento não declara o produto pronto para comercialização.

Na primeira evolução de aulas, manter o caso real da academia atual, com treinos ilimitados, e evitar fixar no código a ideia de que todo cliente terá essa mesma regra. A implementação comercial de limites e adicionais será detalhada na entrega de planos, com migrações e documentação próprias.

### Ficha e evolução

- Registrar graduação como evento com data, faixa/grau e responsável pelo registro, em vez de conservar apenas a faixa atual.
- Definir os graus e regras usados pela academia antes de validar progressões.
- Exibir frequência e quantidade de treinos a partir das presenças, sem criar totais manuais paralelos.
- Incluir responsável para aluno menor, quando aplicável, com os dados de contato realmente necessários.
- Avaliar histórico de matrícula, pausa e inativação para permitir análises históricas corretas. Hoje o sistema só conhece a situação cadastral atual.

### Área do aluno

O usuário solicitou que o aluno veja as aulas do dia e possa se registrar nelas, com aplicação do plano limitado ou ilimitado. O escopo planejado passa a incluir consulta dos próprios dados e inscrição nas aulas; um excedente pago exige pagamento confirmado antes da liberação. Distinguir inscrição de presença confirmada, conforme o fluxo de planos descrito acima.

Definir a forma de confirmação da presença antes de implementar; não presumir que clicar em uma aula futura significa que o aluno já treinou. Controle de capacidade, lista de espera e check-in por QR code continuam como incrementos posteriores, não como decisões já aprovadas. Não permitir que um aluno marque presença por outro ou altere os próprios pagamentos.

Atualização de 22/10: o primeiro portal está implementado/testado localmente, com consulta própria e check-in no dia. Reservas futuras e aplicação de planos permanecem planejadas. Publicação e acesso pela internet também exigem planejamento próprio; criar uma tela de login não torna a aplicação automaticamente publicada.

### Relatórios e IA

- Comparar receita, inadimplência e frequência em períodos explicitamente definidos.
- Permitir filtros úteis, como turma, faixa e alunos com cobranças atrasadas; exportação deve respeitar as permissões.
- Exibir os motivos da pontuação de risco e permitir conferir os cálculos. Alterar pesos ou número de dias requer registrar a regra e sua versão para não tornar o histórico ambíguo.
- Conferir quais dados o Node fornece ao Python e à IA; enviar somente o necessário para a pergunta.
- Identificar período, métricas e usuário de cada análise. Manter claro o que foi calculado e o que foi interpretação do modelo.
- A IA pode sugerir ações administrativas; alterações de cobrança, pagamentos e cadastro devem continuar em fluxos explícitos de confirmação.

### Automação opcional

Uma primeira automação útil é preparar uma lista de lembretes para revisão do administrador. Um envio real exige escolher e configurar o canal e autorizar os destinatários. Conferir novamente se a cobrança segue em aberto, evitar envio duplicado e registrar falhas e tentativas.

Para o bônus n8n, conferir também os critérios do enunciado: gatilho, integração HTTP, tratamento dos dados e erros, lógica, documentação e exportação do workflow. Nenhum envio ou agendamento está autorizado ou configurado por este plano.

## 6. Como ampliar sem perder a versão funcional

1. Desenhar a pequena mudança e sua regra antes de programar. Atualizar a arquitetura quando responsabilidades, contratos ou tabelas mudarem.
2. Separar os novos módulos por assunto, como turmas, aulas e planos. Extrair os módulos existentes conforme forem necessários, preservando seu comportamento; evitar reescrever a aplicação inteira.
3. Criar novas migrações, mantendo os arquivos já aplicados. Considerar os dois caminhos suportados, SQLite e Prisma/PostgreSQL, sem declarar compatibilidade externa sem teste.
4. Conferir uma cópia dos dados existentes e uma instalação vazia. Não usar o banco do usuário como base de testes destrutivos.
5. Testar os cenários próprios da entrega e os fluxos afetados: cadastro, cobrança, pagamento, presença e indicadores, conforme a mudança.
6. Apresentar telas, regras, justificativa e resultados reais. Aguardar validação do usuário; depois revisar o diff, fazer commit e push do conjunto aprovado.
7. Registrar prompts e correções reais, sem inventar autoria manual ou testes. Preparar uma explicação curta e duas perguntas de defesa por entrega.

Migrações e testes reduzem o risco de regressão; não garantem que qualquer alteração futura será compatível. A preservação da tag inicial também não substitui backup do banco.

## 7. Recorte recomendado até dezembro

**Compromisso principal proposto:** concluir as pendências obrigatórias do desafio e desenvolver turmas/aulas, permissões e geração de mensalidades em entregas pequenas. Esses itens conectam a rotina de treino ao cadastro e ao financeiro.

**Expansão seguinte:** evolução do aluno e portal com consulta e inscrição em aulas conforme o plano. Implementar se houver tempo para testar e para o candidato entender e defender o resultado. Relatórios podem ser acrescentados aos poucos, conforme os dados de cada entrega estiverem disponíveis.

**Bônus posterior:** automação n8n, reservas, QR code e integração financeira externa. Selecionar pela necessidade real e pelo tempo disponível. Este plano não promete concluir todos esses extras até dezembro.

Já confirmado: grade fixa com participação em outras turmas, criação de aulas extras em horários livres e várias presenças por aluno no mesmo dia, uma por aula. Antes da implementação correspondente, definir as modalidades e objetivos realmente usados e quem pode corrigir uma chamada. Esses detalhes não exigem resolver agora todas as decisões do portal ou do financeiro.

Também confirmado como objetivo de produto: planos comerciais configuráveis para atender outras academias. O plano ilimitado atende à academia atual; limites, turmas incluídas e adicionais serão desenvolvidos em etapa própria. Operação com várias academias isoladas não faz parte do incremento inicial de turmas e aulas.

Não há estimativa fechada de horas. Depois de escolhido o primeiro incremento, dividir em telas e pequenas entregas compatíveis com as noites e os fins de semana do usuário.

## 8. Referências desta proposta

- Código e documentos do repositório em `fb7600a`; conferidos Git, schema Prisma, rotas e tela de presenças.
- Enunciado completo do desafio fornecido pelo usuário: páginas 3–13 e 18–19; não apenas as duas imagens iniciais.
- Perguntas recentes do usuário sobre “Registrar um treino”, “Fundamentos” e acesso dos alunos. São dúvidas de produto; nenhuma alteração foi aprovada automaticamente por terem sido discutidas.
- [Plano técnico e separação das duas entregas](PLANO_EVOLUCAO.md), [arquitetura implementada](ARQUITETURA.md), [revisão e evidências anteriores](REVISAO_IA.md) e [fluxo de validação](PROCESSO.md).
