# Arquitetura — Academia de Jiu-Jitsu

## Objetivo
Construir um sistema para cadastrar alunos e controlar mensalidades.

## Dados principais
- Aluno: guarda as informações cadastrais de uma pessoa.
- Mensalidade: guarda uma cobrança, com valor, vencimento e situação.
- Um aluno pode ter zero ou várias mensalidades.
- Cada mensalidade pertence a um único aluno.

## Identificação dos registros
- O id do aluno identifica seu cadastro e é sua chave primária.
- O id da mensalidade identifica a cobrança e é sua chave primária.
- O alunoId da mensalidade aponta para o id do aluno e é uma chave estrangeira.

## Campos de Aluno — rascunho
- id: identificador único do cadastro.
- nome: nome do aluno.
- telefone: contato telefônico do aluno.
- email: endereço de e-mail do aluno.
- dataNascimento: data em que o aluno nasceu.
- faixa: faixa atual do aluno, como branca ou azul.
- dataMatricula: data em que o aluno entrou na academia.
- situacao: indica se o aluno está ativo ou inativo.

## MVP e decisões de implementação — 09/10/2026

O usuário alterou a dinâmica da mentoria: priorizar um MVP executável e validar as telas antes das explicações. O histórico acima registra a modelagem feita pelo aluno.

### Componentes

React + TypeScript + Tailwind (apps/web) → API Express + TypeScript (apps/api) → repositório SQL.
O backend consulta FastAPI + Pandas (services/analytics) para métricas determinísticas. Somente essas métricas e nomes necessários são enviados ao modelo de IA pela API Node. Credenciais ficam no backend.

- Supabase/PostgreSQL + Prisma 7: caminho configurável com DATABASE_URL; migrations versionadas.
- SQLite nativo do Node 24: banco real persistido em data/academia.sqlite para validar o MVP sem credenciais externas. O desafio exige SQL e recomenda PostgreSQL/Supabase; a validação de PostgreSQL continua planejada por fazer parte da stack escolhida. A tela identifica o banco utilizado.
- O repositório possui o mesmo contrato nos dois bancos. Nenhuma conexão com o Supabase é presumida ou simulada.
- UUID identifica registros. Datas de calendário usam YYYY-MM-DD, sem conversão de fuso; a data atual é calculada em America/Sao_Paulo.
- Valores monetários são inteiros em centavos, evitando arredondamentos de ponto flutuante.

### Mensalidade

id, alunoId (FK), competencia (YYYY-MM), valorCentavos, dataVencimento, dataPagamento (opcional), criadoEm. Uma cobrança por aluno/competência no MVP.
O status é calculado: com pagamento = pago; sem pagamento e vencimento anterior a hoje = atrasado; demais = pendente. Vencer hoje ainda não significa atraso. Não persistimos o status, pois ele muda com o calendário.

### Presença e análises

```mermaid
erDiagram
  Aluno ||--o{ Mensalidade : possui
  Aluno ||--o{ Presenca : registra
```

Presenca: id, alunoId, dataTreino, tipoTreino e presente. Há um registro por aluno/data/tipo; editar permite corrigir a chamada.
Analise: pergunta, resposta real da IA, usuário local, modelo, data e snapshot das métricas. O MVP local tem um administrador; autenticação e perfis são uma evolução antes de qualquer publicação com dados reais.

### Regras e erros

A API valida todos os payloads com Zod, rejeita datas inexistentes/futuras quando inadequadas, relacionamentos inválidos, e-mails e cobranças duplicados. Alunos com cobranças não podem ser excluídos: devem ser inativados para preservar o histórico. HTTP 400 = entrada inválida; 404 = inexistente; 409 = conflito; 503 = integração indisponível. Mensagens da interface vêm da API. Consultas SQLite parametrizadas e Prisma evitam SQL concatenado.

### Dashboard e analytics

Receita do mês usa dataPagamento. Valor a receber usa vencimentos no mês sem pagamento; parcelas pendentes e atrasadas permanecem distinguíveis. Risco: atraso +30, pelo menos 14 dias sem presença +30, queda acima de 50% +40. Baixo 0–30, médio 31–60, alto 61–100. A frequência do mês corrente é comparada com os mesmos dias do mês anterior, evitando comparar um mês parcial com um completo.

### Revisão arquitetural antes da implementação

Codex revisou o rascunho e adotou: status derivado, centavos inteiros, restrição de exclusão financeira, períodos comparáveis e identificação explícita das integrações. Rejeitada a necessidade de XAMPP: a stack é Node/PostgreSQL. DBeaver é opcional. Não há resposta simulada apresentada como IA.

## Correções de evolução e integração — 19/10/2026

Primeira extração gradual: `modules/analytics/service.ts` concentra a consulta dos dados e a chamada HTTP ao Python; `schema.ts` valida sua resposta com Zod. `http-error.ts` compartilha o erro HTTP entre a composição da API e esse serviço. As rotas anteriores continuam em `app.ts`; a modularização completa ainda não foi realizada. A nova entrega de turmas usa módulo próprio desde sua criação, conforme a seção abaixo.

O contrato TypeScript descreve os tipos durante o desenvolvimento. A validação Zod verifica os valores recebidos pela rede: datas, mês solicitado, inteiros não negativos, listas e níveis de risco. Campos adicionais são aceitos e descartados; campos obrigatórios ausentes ou incompatíveis geram HTTP 503. Isso evita repassar uma string onde a tela espera uma lista. Essa checagem não prova, sozinha, que toda fórmula financeira está correta: os testes determinísticos e a conferência dos períodos continuam necessários.

No Python, StudentInput, PaymentInput e AttendanceInput substituem os dicionários genéricos de entrada. Datas impossíveis, valores fracionados de centavos e presença em texto são rejeitados antes do cálculo. Telefone, e-mail e nascimento não são enviados pelo Node ao Python. A fórmula e os limites de risco não mudaram.

O React mantém dados e estados separados por recurso em `data.ts`; `load-data.ts` publica cada resultado assim que chega, com Promise.allSettled. Cada página depende apenas dos recursos necessários. Histórico e indicadores possuem mensagens e tentativas próprias; erro não é apresentado como lista vazia ou total zero. Recargas em segundo plano preservam a página montada quando seus dados já estão disponíveis; uma falha invalida os dados do recurso afetado.

O SQLite usa o runner em `database/sqlite/migrate.ts` e os arquivos SQL de `database/sqlite/migrations/`. A versão inicial reproduz as quatro tabelas anteriores; registra a adoção de um banco 1.0 compatível sem recriar seus registros. O runner verifica histórico e checksum, faz backup antes de alterações pendentes em arquivos com tabelas e aplica as migrações em transação. Compara colunas, chaves estrangeiras e unicidade com a estrutura conhecida e confere vínculos. Estrutura desconhecida exige uma migração explícita; não se atribui uma faixa presumida ao aluno.

O histórico `_tatame_migrations` descreve o schema local, independentemente da versão do pacote npm. Migrações Prisma/PostgreSQL são outro caminho, mantido em `prisma/migrations/`; trocar DATABASE_URL não transfere registros. Procedimento e limites: [MIGRACOES_SQLITE.md](MIGRACOES_SQLITE.md).

Ao mudar o mês, o dashboard é invalidado até chegar o novo resumo; indicadores também limpam o contexto anterior durante a consulta. Isso impede atribuir números do período anterior ao mês recém-selecionado, sem invalidar os cadastros que não dependem do mês.

## Desenho da entrega 1A — turmas e grade fixa — 19/10/2026

Registrado antes da implementação, após o usuário autorizar começar pelas pequenas entregas. Escopo: cadastrar, editar, consultar e desativar turmas; grade semanal com vários horários por dia; vínculos habituais dos alunos. Aula extra, encontro datado, nova chamada, planos e login permanecem nas entregas seguintes. O professor responsável é um nome cadastral nesta etapa, não uma conta autenticada.

- Turma: UUID, nome, professor responsável, situação ativo/inativo e datas de criação/atualização.
- HorarioTurma: UUID, turmaId, diaSemana (0 = domingo a 6 = sábado), horaInicio/horaFim em HH:mm. Vários horários no mesmo dia são permitidos; repetição e sobreposição dentro da mesma turma são rejeitadas. Nesta entrega, um intervalo não atravessa a meia-noite.
- AlunoTurma: UUID, turmaId, alunoId e criadoEm; unicidade por turma/aluno. O vínculo é habitual e não define ainda um direito comercial ou uma presença.

As tabelas novas usam chaves estrangeiras e não alteram as quatro tabelas de negócio anteriores. Novos vínculos exigem aluno ativo; um aluno posteriormente inativado pode permanecer vinculado até a remoção explícita. Exclusão de aluno vinculado é impedida, com orientação para retirar o vínculo ou inativar. Desativar a turma preserva horários e vínculos.

O desenho inicial não expunha exclusão de turma. Após conferir a interface, o usuário pediu a remoção definitiva, além da desativação. Foi acrescentado DELETE /api/turmas/:id e `removeTurma` no repositório, removendo horários, vínculos e turma em uma transação SQLite/Prisma. Não exclui alunos, mensalidades ou as presenças existentes. Não foi necessária outra migração. A interface exige confirmação e explica que recriar uma turma gera um cadastro novo. Na futura etapa de aulas, a preservação do histórico de encontros e presenças também deverá ser mantida ao definir a relação com turmas.

Implementado em `modules/turmas/`: schema Zod, serviço e rotas. O método `saveTurma` do repositório salva turma, horários e vínculos na mesma transação: síncrona, sem awaits intercalados no SQLite, e por `$transaction` no Prisma. A grade define programação, sem gerar encontros ou presenças automaticamente. Os horários usam a referência local da academia, America/Sao_Paulo nesta entrega.

Contratos implementados: GET/POST /api/turmas, GET/PUT/DELETE /api/turmas/:id e PATCH /api/turmas/:id/situacao. A edição completa recebe nome, professor, situação, lista de horários e alunoIds; a resposta inclui identificadores e datas. O React possui recurso próprio de turmas, com falha isolada das demais áreas, filtros, cartões, detalhes, formulário e grade semanal. A versão de schema SQLite avança pela nova migração `002_turmas`; `001_initial.sql` permanece intacta. O caminho PostgreSQL recebe migração equivalente, sem presumir validação externa.

Validação executada: migração sobre arquivo temporário da versão anterior sem alterar seus registros, persistência após reabrir, gravação atômica com rollback, horários inválidos/sobrepostos, vínculos inexistentes/repetidos/inativos, aluno em várias turmas, desativação sem perda e navegador com base fictícia isolada. A atualização da base local também preservou os registros anteriores. Resultados e limites em [TURMAS.md](TURMAS.md) e [REVISAO_IA.md](REVISAO_IA.md).

```mermaid
erDiagram
  Turma ||--o{ HorarioTurma : possui
  Turma ||--o{ AlunoTurma : organiza
  Aluno ||--o{ AlunoTurma : participa
```

Horários mantidos preservam seus IDs por dia/início; vínculos mantidos preservam ID e data de criação. A substituição da grade e dos vínculos ocorre como uma unidade. Nesta fase, não há histórico completo de remoção de vínculos nem bloqueio otimista de edições simultâneas: a última edição completa prevalece. A geração de aulas futuras deverá guardar seus próprios dados e participantes esperados, sem reconstruir encontros antigos a partir da grade atual. Aulas, planos, login e isolamento entre academias continuam planejados.

## Desenho da entrega 1B — aulas datadas — 19/10/2026

Registrado antes de implementar, após o usuário aprovar começar com “bora”. Aula guarda data, início/fim, título, professor, origem (grade/extra), situação (agendada/cancelada), turma opcional e cópia do nome da turma. Criar da grade recebe horário e data, exige turma ativa e dia da semana compatível; usa cópias dos horários/professor atuais, sem gerar calendário inteiro. Extra recebe campos livres, com turma ativa opcional. Datas futuras são permitidas; horários não atravessam meia-noite. Não há confirmação automática de realização ou presença.

`AulaAlunoPrevisto` guarda a lista de alunos habituais ativos no momento da criação e uma cópia dos nomes. Previsão não é presença/inscrição nem limita participação futura. Essa fotografia prepara a chamada 1C sem aplicar mudanças atuais de vínculo ao passado. As duas tabelas são salvas numa transação. A turma e o aluno são referências opcionais com ON DELETE SET NULL: excluir o cadastro desvincula a referência, preservando a aula e seus nomes históricos. Nenhuma presença anterior é convertida ou inventada.

A origem do horário é uma chave histórica sem FK, porque a edição da grade substitui seus registros. A combinação origemHorarioId/dataAula é única: repetir a criação retorna a aula existente, inclusive cancelada, sem reativar ou sobrescrever dados. Cancelar exige motivo e preserva o registro; repetição mantém o primeiro cancelamento. Não há rota de exclusão nem edição de aula nesta entrega. Correções usam cancelamento e nova aula extra, com histórico explícito. Sobreposição entre aulas/professores não é bloqueada, pois ainda não há cadastro de locais e contas de professores.

Serão acrescentados módulo de aulas, contratos compartilhados, migração SQLite 3 e equivalente PostgreSQL, navegação própria e carregamento isolado. A edição/exclusão de turmas permanece disponível, com suas aulas preservadas. Fluxo administrativo local, sem login, cobrança automática, nova chamada ou mudança nos cálculos Python. Aprovação para implementar não é aprovação para commit/push desta entrega.

**Estado após implementação:** o desenho acima foi implementado em `modules/aulas`, `AulasPage.tsx`, migração 003 e modelos Prisma. Rotas: GET /api/aulas (filtros opcionais), GET /api/aulas/:id, POST /api/aulas/da-grade, POST /api/aulas/extras e PATCH /api/aulas/:id/cancelamento. Criação da grade responde 201 ou 200 para repetição; a chave única também protege concorrência. Cancelamento usa UPDATE condicionado a agendada, preservando o primeiro motivo/timestamp. Agenda e formulários possuem recurso de carregamento próprio; os sete destinos móveis ficam em duas linhas. Lista por dia na interface; consultas ainda carregam todas as aulas, sem paginação.

Foram aprovados 61 testes TypeScript, 12 Python, build/typecheck e schema Prisma; navegador fictício e preservação das sete tabelas locais conferidos. Não houve validação externa PostgreSQL/IA. Sem conversão de presenças antigas, marcação de realização, edição ou reativação de aula; alunos previstos não são presenças. Guia e evidências em [AULAS.md](AULAS.md). A entrega 1B permanece local para validação antes de commit/push.

```mermaid
erDiagram
  Turma o|--o{ Aula : referencia_opcional
  Aula ||--o{ AulaAlunoPrevisto : guarda
  Aluno o|--o{ AulaAlunoPrevisto : referencia_opcional
```

### Incremento 1B solicitado: excluir aulas extras

Após conferir os testes, o usuário pediu “adicione um botão de exclusão das aulas extras também”. Desenho anterior à implementação do incremento: DELETE /api/aulas/:id permitido somente para origem extra, agendada ou cancelada; aulas da grade retornam 409. Remover a extra e seus alunos previstos numa transação, preservando cadastros, turmas/grade, finanças, presenças atuais e outras aulas. A confirmação diferencia excluir definitivamente de cancelar com histórico; cancelar continua disponível. O repositório também confere a origem antes de remover os previstos, evitando perda parcial se for chamado diretamente com uma aula da grade.

Não é necessária nova migração. Nesta fase as presenças antigas ainda não apontam para aulas. Antes da entrega 1C, a política de exclusão deverá considerar as presenças vinculadas, sem apagá-las por consequência. O incremento permanece no conjunto local da entrega 1B, aguardando validação antes de commit/push.

Implementado em serviço/rota, repositórios e tela de aulas. DELETE retorna 204; ID inválido/inexistente retorna 404, grade fixa 409. Os dois repositórios fazem a remoção transacional somente após conferir origem extra; SQLite sem awaits durante a transação e Prisma por `$transaction`. Botão nos cartões/detalhes, confirmação explícita e opção de voltar. Nova execução: 65 testes TypeScript e build/typecheck aprovados. Navegador verificou a confirmação e seu cancelamento; exclusão efetiva e rollback validados em HTTP/SQL. A comparação das nove tabelas no reinício preservou inclusive a aula já criada pelo usuário. Sem alteração de SQL aplicado ou validação externa do Prisma.

**Aprovação posterior — 20/10/2026:** o usuário autorizou commit/envio do conjunto 1B, incluindo exclusão de extras, com “pode commitar”. As pendências de aprovação descritas nesta seção registram a apresentação anterior. Não houve nova alteração de arquitetura ou testes nesta etapa de registro; não inclui autorização para implementar a chamada 1C ou publicar tag/release.
