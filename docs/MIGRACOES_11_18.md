# Migrações11–18 na homologação

## Resultado — 31/10/2026

Após confirmação explícita do usuário, aplicadas oito migrações no projeto Supabase **tatame-homologacao**, ref `fnjcfpztsvnbvrkdbdsj`: **18 migrações concluídas e 33 tabelas de domínio**, além do histórico do Prisma. SQLite não alterado nesta operação.

| Migração | Conteúdo |
| --- | --- |
| 11 | Professores por aula; vínculo do professor anterior preservado |
| 12 | Regras, estado e histórico da evolução de graduação |
| 13 | Catálogo padrão de faixas/graus e ajustes previstos de cores/ordem |
| 14 | Categorias Infantil/Juvenil/Adulto independentes |
| 15 | Preferência de exibição dos controles de planos |
| 16 | Lotes de comunicados e acompanhamento das entregas |
| 17 | Fotos de perfil |
| 18 | Biblioteca de técnicas e RLS das onze tabelas novas das migrações11–18 |

Modelo/preço dos vídeos continuam **adiados pelo usuário**. Estrutura criada não inicia cobrança, concede acesso ou contrata provedor.

## Preservação

Conferidos destino Session pooler, TLS/certificado, dez migrações anteriores concluídas e checksums dos arquivos. Exportação lógica privada das **23 tabelas existentes**, com dados, histórico e metadados de colunas, restrições, índices, triggers, funções e segurança, salva e relida em `.test-output/backups/homologacao-antes-11-18.json`. Ignorada pelo Git e excluída do upload Vercel. Cobre o schema `public` do Tatame; **não é um pg_dump nem backup completo dos schemas gerenciados do Supabase**. Restauração não ensaiada.

As oito migrações foram ensaiadas em transação PostgreSQL e revertidas. Dados e estrutura originais foram reconferidos antes de executar definitivamente `prisma migrate deploy`, com destino privado explícito.

Resultado depois de aplicar:

- **20 tabelas fora do catálogo** mantiveram integralmente seus registros.
- Todos os registros antigos de faixas/graus permaneceram; oito faixas receberam os ajustes previstos de aparência/ordem/situação/data. Identidade e histórico preservados; novos itens acrescentados.
- Os **dois alunos existentes** e seus vínculos de graduação permaneceram iguais.
- Todas as tabelas de domínio corresponderam ao estado esperado do ensaio.
- Histórico confirmou 18 migrações concluídas, com checksums conferidos.

Sem reset, seed, importação do SQLite, login/ativação de contas existentes, mensagens ou lançamentos financeiros.

## Verificações novas

Os **onze modelos novos foram lidos pelo Prisma**. Restrições PostgreSQL validadas, vínculos de graduação válidos e contagens conferidas independentemente pelo MCP. Consultas como `anon`, em transação de leitura revertida, não receberam registros das tabelas novas; flags RLS conferidas. Ausência de políticas públicas nelas é intencional para o backend privado.

Um verificador inicial comparou campo ausente do contrato limpo com `NULL` do PostgreSQL e acusou divergência. Corrigida a comparação para a normalização já existente; nenhum aluno foi alterado para resolver o teste. Exportação e ensaio já comprovavam os dados preservados.

Os 276 testes locais pertencem à rodada anterior; **não foram reexecutados nesta operação**. As verificações novas são as externas descritas aqui. Ainda sem teste completo da aplicação publicada com PostgreSQL/Python.

## Antes de publicar

Corrigir RLS das 23 tabelas antigas e caminho da função de validação. Proposta separada e não executada em [SEGURANCA_HOMOLOGACAO.md](SEGURANCA_HOMOLOGACAO.md). Sem commit/push/deploy: autorização de banco não substitui validação do conjunto para Git.
