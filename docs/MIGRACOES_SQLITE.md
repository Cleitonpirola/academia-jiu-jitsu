# Migrações do banco local

Implementado em 19/10/2026. O SQLite continua sendo o banco local do MVP. Não há transferência automática para Supabase nesta alteração.

## O que é uma migração

É uma instrução versionada para mudar a estrutura do banco que já existe. Pense em uma reforma: acrescentar um cômodo à academia preservando as pessoas e os registros que já estão lá. Criar outra academia vazia e mudar o endereço da conexão é um trabalho diferente de transportar os registros.

## Arquivos e funcionamento

- `apps/api/src/database/sqlite/migrations/001_initial.sql`: estrutura inicial das quatro tabelas, equivalente à versão 1.0.
- `apps/api/src/database/sqlite/migrate.ts`: lista ordenada de versões, checksum, backup, transação e verificação da estrutura.
- `apps/api/src/repository.ts`: executa o runner ao abrir SQLite e fecha a conexão se a migração falhar.
- `apps/api/src/sqlite-migrations.test.ts`: testes de adoção, evolução, preservação e falhas.

Ao iniciar `npm run dev` ou `npm start`, o repositório abre o arquivo definido por SQLITE_PATH ou `data/academia.sqlite`. O runner compara os arquivos com o histórico `_tatame_migrations` e aplica somente versões pendentes. O console informa a versão aplicada e o backup criado.

| Situação | Comportamento |
| --- | --- |
| Banco novo | Cria as tabelas e registra a versão 1; não precisa de backup de registros inexistentes |
| Banco 1.0 compatível, sem histórico | Faz backup, adota a versão 1 e conserva seus registros |
| Banco já atualizado | Confere histórico e estrutura; não reaplica as instruções nem cria cópias a cada início |
| Nova versão registrada no código | Cria backup e executa as versões pendentes em uma transação |
| Erro de SQL ou estrutura incompatível | Reverte a transação e interrompe a abertura; a versão não avança |
| Arquivo aplicado posteriormente alterado, ou banco mais novo que o código | Recusa a abertura para evitar evolução com um histórico divergente |

O checksum normaliza finais de linha CRLF/LF e espaços externos ao texto. Alterar o SQL de uma versão aplicada deve ser substituído pela criação de uma nova migração; não se edita o histórico para silenciar a divergência.

## Preservação e backup

Antes de uma migração pendente sobre um arquivo que contém tabelas, o runner usa `VACUUM INTO` para criar uma cópia consistente, incluindo dados presentes no WAL. O [SQLite documenta esse mecanismo](https://www.sqlite.org/lang_vacuum.html). Se o backup falhar, a migração não começa.

Local padrão: `data/backups/academia.sqlite.antes-v1-<identificador>.sqlite`. Com SQLITE_PATH personalizado, a pasta `backups/` fica ao lado desse arquivo. Banco em memória não gera arquivo de backup. Os bancos e seus arquivos auxiliares estão excluídos do Git; backups devem ser guardados conforme a necessidade do usuário, não publicados no repositório. Não há remoção automática de cópias nesta implementação.

O backup é anterior à migração, não uma cópia contínua de alterações futuras. Para restaurar: primeiro parar todos os processos que usam o arquivo, preservar uma cópia do banco atual e de seus auxiliares, escolher e conferir o backup correto e substituir o conjunto local de maneira controlada. Não substituir um `.sqlite` enquanto o servidor estiver aberto nem deixar arquivos WAL/SHM do banco anterior associados à restauração. Conferir tabelas, vínculos e totais antes de retomar o uso; esse procedimento deve ser acompanhado, sem apagar o original.

## Como acrescentar uma alteração futura

1. Descrever a necessidade, a transformação dos registros existentes e como conferir o resultado. Se um campo novo for obrigatório, definir a origem legítima do valor dos registros antigos.
2. Criar o próximo arquivo SQL, por exemplo `002_<descricao>.sql`, sem alterar `001_initial.sql`.
3. Acrescentá-lo a `sqliteMigrations` em `migrate.ts`, com número consecutivo, nome e leitura do novo SQL.
4. Manter o SQL compatível com a transação do runner: não incluir BEGIN, COMMIT, VACUUM ou comandos que desativem a proteção transacional. Para mudanças que exijam reconstruir tabela, copiar e conferir os registros explicitamente.
5. Atualizar os contratos TypeScript, validações, mapa de colunas do repositório e telas envolvidos. Se o campo também existir no caminho PostgreSQL, atualizar o schema e criar sua migration Prisma correspondente; SQL SQLite não é intercambiável com PostgreSQL.
6. Testar tanto banco vazio quanto uma cópia da versão anterior com registros. Conferir valores, vínculos, unicidade, rollback e reabertura sem reaplicação.
7. Rodar os testes e o build; apresentar o resultado ao usuário antes de commit/push, conforme PROCESSO.md.

A produção contém somente a versão 1 nesta entrega. A versão 2 que acrescenta `endereco` existe apenas como cenário temporário de teste do runner; não adiciona esse campo ao cadastro real.

## Limites

O runner verifica metadados das colunas, chaves estrangeiras e índices únicos, além de `foreign_key_check`. Não compara todas as expressões CHECK, gatilhos ou índices comuns de uma estrutura arbitrária. É uma proteção para as migrações conhecidas, não um conversor universal de bancos antigos.

Um banco desconhecido sem `faixa`, por exemplo, é recusado com backup: não há informação suficiente para inventar a graduação dos alunos. É necessária uma migração específica com transformação definida. Alterações manuais em tabelas e versões devem ser evitadas.

O código não suporta migração automática para uma versão anterior. Restaurar código antigo pode exigir restaurar seu backup correspondente; nunca mover a tag v1.0.0 para contornar uma incompatibilidade.

`npm run db:migrate` continua sendo o comando Prisma/PostgreSQL; as migrações SQLite executam na abertura do repositório. Não foram aplicadas migrações em Supabase/PostgreSQL nesta etapa. Para uma futura transferência, definir exportação/importação, preservação dos IDs e conferência de vínculos e totais separadamente.

## Evidência desta entrega

`npm test`: oito cenários específicos do runner aprovados, além dos testes da API e da interface. Na abertura do arquivo local existente, a versão 1 foi registrada e um backup foi criado. As quatro tabelas de negócio mantiveram exatamente os mesmos registros, conferidos por contagem e SHA-256 das linhas ordenadas: 20 alunos, 110 mensalidades, 425 presenças e zero análises. Nenhum vínculo inválido foi encontrado.
