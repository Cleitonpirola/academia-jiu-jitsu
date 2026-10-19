# Verificação de arquitetura e migrações

Data: 19/10/2026. Referência de código: v1.0.0, commit 618c1b3. Branch observada: codex/reestruturacao.

**Registro histórico:** as seções 1–7 descrevem o código antes das correções. A implementação posterior e sua validação estão na seção 8 e em REVISAO_IA.md. As referências de linhas acima do novo registro pertencem à versão auditada.

## Pedido e conclusão

O usuário trouxe dois apontamentos do Matheus: fragilidade da arquitetura para muitas alterações e falta de migração de banco. A averiguação encontrou riscos concretos de evolução e integração. A afirmação de ausência total de migrações precisa ser qualificada: existe uma migration inicial PostgreSQL, mas não existe um mecanismo equivalente para evoluir tabelas SQLite existentes nem uma rotina de transferência dos dados SQLite para PostgreSQL.

Esta revisão não conclui que qualquer alteração necessariamente quebrará o sistema. Identifica cenários específicos em que uma mudança de schema, uma falha de módulo ou uma resposta incompatível pode causar falha.

## 1. SQLite não evolui tabelas existentes

Prioridade: alta antes de alterar campos do banco local.

Evidência: `apps/api/src/repository.ts`, construtor de SqliteRepository, linhas 29–38. A inicialização executa CREATE TABLE IF NOT EXISTS. Não há runner de migrations SQLite nem controle de versões de schema. O mapa columns também contém manualmente os campos usados em INSERT/UPDATE.

Reprodução isolada:

1. Criar um banco temporário com a tabela Aluno sem a coluna faixa, simulando uma versão de estrutura anterior.
2. Abrir esse arquivo com SqliteRepository atual.
3. Conferir que a coluna continua ausente.
4. Inserir um aluno no formato atual.

Resultado: `table Aluno has no column named faixa`.

Essa é uma simulação de evolução de schema, não uma afirmação de que o banco atual do usuário está sem faixa. Ela demonstra o que aconteceria ao exigir uma nova coluna sem atualizar um arquivo existente. Os testes atuais começam principalmente com tabelas recém-criadas e não exercitam atualização entre versões.

Correção recomendada: adotar migrações incrementais e versionadas caso SQLite continue suportado. Se o projeto passar a usar somente PostgreSQL/Prisma na execução, validar esse caminho como fonte principal de schema e tratar a saída do SQLite explicitamente. Não apagar o banco para contornar o problema.

## 2. Carregamento geral depende de módulos distintos

Prioridade: média; resolver na separação dos módulos/projetos.

Evidência: `apps/web/src/App.tsx`, linhas 19–22. A função reload aguarda alunos, mensalidades, presenças, dashboard, health e análises no mesmo Promise.all. setData ocorre apenas depois que todas respondem com sucesso.

Reprodução na API com repositório em memória:

- Simular falha somente ao listar Analise.
- GET /api/alunos responde 200.
- GET /api/analises responde 500.

Pela lógica de Promise.all inspecionada, essa falha impede aplicar o conjunto de dados na recarga da interface, mesmo com a consulta de alunos funcionando. O efeito na tela foi inferido diretamente do código; não foi executado um teste de navegador desse cenário nesta revisão.

Correção recomendada: carregar dados por módulo ou separar dados essenciais e opcionais, com estados de carregamento e erro próprios. A falha de um histórico avançado não deve impedir usar o cadastro básico.

## 3. Contrato de resposta Python/Node/React não é validado

Prioridade: média; resolver antes de evoluir os indicadores.

Evidências:

- `apps/api/src/app.ts`, linha 25: response.json recebe uma asserção `as Analytics`, sem validação em runtime.
- `apps/web/src/pages/IntelligencePage.tsx`, linha 12: a interface usa riscos.filter esperando uma lista.
- `services/analytics/app.py`, linhas 10–15: as listas de entrada usam dicionários genéricos, sem modelos completos por entidade.

Reprodução isolada:

1. Iniciar um servidor HTTP local temporário no lugar do Python.
2. Responder 200 com `{ "riscos": "contrato alterado" }`.
3. Consultar /api/analytics pela aplicação de teste.

Resultado: Node também responde 200 com esse tipo incorreto. A operação de filtro esperada pelo frontend falha com `filter is not a function`.

Foi verificada a requisição HTTP e a operação de JavaScript correspondente; não foi feita uma alteração no Python real nem um teste completo de renderização no navegador. Asserções de TypeScript não validam dados transportados pela rede.

Correção recomendada: validar a resposta de analytics com schema em runtime, tipar as entidades de entrada do Python, tratar resposta incompatível com erro controlado e acrescentar testes de contrato HTTP. Planejar mudanças de contrato para manter compatibilidade entre os serviços.

## 4. O que existe de migração PostgreSQL

Existem:

- `prisma/schema.prisma`, com Aluno, Mensalidade, Presenca e Analise.
- `prisma/migrations/202610090001_initial/migration.sql`, criando tabelas, relações, restrições e índice.
- `prisma/migrations/migration_lock.toml`, com provider PostgreSQL.
- `npm run db:migrate`, executando prisma migrate deploy.

O comando de validação do Prisma confirmou que o schema atual é válido. Isso não comprova que a migration foi aplicada com sucesso a um banco PostgreSQL, pois esta revisão não abriu nem alterou um servidor PostgreSQL.

Também não há migração automática de registros do SQLite para Supabase. `createRepository`, na linha 84, apenas seleciona qual conexão usar conforme DATABASE_URL. Mudar essa variável não move os registros do arquivo anterior.

É necessário distinguir três trabalhos: criar estrutura inicial, atualizar estrutura entre versões e transferir dados entre bancos. O primeiro possui implementação PostgreSQL; os outros exigem o tratamento descrito acima.

## 5. Organização e cobertura

A concentração de rotas, regras dependentes do banco e clientes externos em app.ts dificulta isolar mudanças e testes. O tamanho do arquivo, por si só, não prova um bug. Os cenários de carregamento e contrato acima demonstram dependências concretas que merecem tratamento.

Há representações do modelo nos contratos TypeScript, DDL SQLite, lista columns e schema/migration PostgreSQL. Novos campos precisam de coordenação; a alteração de apenas uma representação não atualiza as outras automaticamente.

Os testes atuais da API usam SqliteRepository. Não cobrem Prisma/PostgreSQL, atualização de banco legado nem contrato HTTP completo de analytics. Não há workflow de CI no diretório .github observado. CI e testes adicionais são melhorias recomendadas, não requisitos presumidos do enunciado.

## 6. Verificações executadas nesta averiguação

| Verificação | Resultado |
|---|---|
| npm run typecheck | API e frontend aprovados |
| npm test | 12 testes aprovados |
| npm run test:analytics | 8 testes aprovados |
| Prisma validate | Schema válido |
| Banco SQLite temporário legado | Ausência de atualização de coluna reproduzida |
| Falha isolada de Analise | Alunos 200 e análises 500 reproduzidos |
| Contrato analytics incompatível | Tipo incorreto repassado com 200; operação de filtro falhou |

O script de reprodução e resultados foram salvos na pasta externa de auditoria desta conversa. Utilizaram SQLite em memória/arquivo temporário e servidor HTTP local simulado. O banco real do usuário não foi aberto ou alterado. Não foram feitas chamadas à IA, migrations em PostgreSQL ou mudanças no código da aplicação.

## 7. Ordem recomendada

1. Definir se SQLite continuará como modo suportado ou se a execução será padronizada em PostgreSQL/Prisma, conforme a stack escolhida.
2. Preparar migrations e testes de evolução, preservando dados e a tag v1.0.0. Se houver transferência de registros, definir backup, importação e conferência de vínculos/totais.
3. Extrair módulos da API gradualmente, mantendo os contratos e regras já usados.
4. Separar carregamentos e erros do frontend e validar o contrato Node/Python.
5. Incorporar os cenários reproduzidos à suíte de regressão e validar o PostgreSQL em ambiente isolado.

Esta é uma entrega de averiguação e documentação. Correções de implementação ficam para uma próxima alteração solicitada, com validação do usuário antes de commit/push conforme AGENTS.md.

## 8. Correções autorizadas e implementadas — 19/10/2026

Após a discussão com o usuário e o pedido “pode começar as correções”, foram implementados:

1. Runner SQLite com versões, checksum, backup consistente, transação, verificação de estrutura e testes de evolução. O banco 1.0 compatível é adotado sem recriar registros; estruturas desconhecidas são interrompidas com segurança, exigindo migração específica. Não foi feita transferência para PostgreSQL.
2. Carregamento e erro independentes no React. Falha do histórico não descarta dados de outros módulos; a recarga após gravação preserva a página e seus filtros.
3. Extração do serviço de analytics e validação Zod da resposta; entradas Python com modelos Pydantic. Payload incompatível recebe HTTP 503 controlado, preservando as fórmulas existentes.

Validação atual: 30 testes TypeScript, 12 Python e build/typecheck aprovados. A API em execução respondeu com sucesso nas sete consultas de leitura verificadas, incluindo indicadores calculados pelo Python real. No arquivo local, foram conservadas as linhas e os valores de 20 alunos, 110 cobranças e 425 presenças, conferidos por hashes antes/depois.

No navegador, um ambiente isolado em memória simulou falha de histórico e resposta incompatível do Python: dashboard e alunos continuaram utilizáveis, indicadores mostraram erro controlado e o histórico exibiu sua própria tentativa. Após restabelecer os serviços de teste, o botão recuperou os dados. Um cadastro fictício nesse ambiente manteve o texto da busca após a recarga.

Ainda pendentes: validação externa PostgreSQL/IA, separação final das duas entregas, extração dos demais módulos e eventual transferência de registros. Após a apresentação das correções, o usuário aprovou a finalização de implementação e documentação para commit/push na branch de trabalho. Detalhes operacionais: [MIGRACOES_SQLITE.md](MIGRACOES_SQLITE.md).
