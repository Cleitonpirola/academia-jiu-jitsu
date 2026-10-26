# Vários professores por aula

Entrega de 26/10/2026 aprovada pelo usuário para commit/envio. Resultado da sincronização registrado no histórico do Git; migração externa continua pendente.

## Como usar

1. Abra Aulas e os Detalhes do encontro.
2. Clique em Editar professores e depois em Adicionar professor.
3. Preencha cada nome e clique em Salvar professores. O X remove um nome da lista; Cancelar descarta o rascunho.

A aula deve ter entre 1 e 8 professores, com nomes de 2 a 120 caracteres. Nomes repetidos são rejeitados, inclusive diferenças só de acento, caixa ou espaços. A ordem é mantida. Alteração restrita ao administrador; não cria contas, senhas ou permissões para as pessoas mencionadas.

Ao publicar uma aula pela grade, ela começa com o professor configurado na turma. A edição vale somente para aquele encontro. Outras aulas e turma continuam iguais. Cartão, detalhes, busca, chamada e portal exibem todos os nomes pelo resumo da aula. Corrigir professores de uma aula histórica/cancelada não reabre a aula nem altera presenças, check-ins ou valores.

## Por que guardar uma lista

Antes havia uma única string professor. Um texto como “Ana e Bruno” não permite saber com segurança quantas pessoas estão ali. A tabela AulaProfessor guarda cada nome em sua linha, com aulaId e ordem; uma aula tem várias linhas de professores. A string professor continua como resumo de leitura para compatibilidade com o portal e telas anteriores. Lista e resumo são salvos juntos em transação: se algo falhar, nenhum dos dois fica pela metade.

A migração 11 cria a tabela e copia o professor histórico para uma linha, sem tentar dividir vírgulas ou inventar pessoas. Os IDs antigos das aulas e os dados anteriores são preservados. Não há catálogo global de professores nesta entrega; a lista identifica os nomes de cada encontro.

## Arquivos e contrato

- packages/shared/src/index.ts: AulaProfessor e professores em AulaView.
- apps/api/src/modules/aulas/schema.ts, service.ts e routes.ts: validação, consulta e PATCH /api/aulas/:id/professores, corpo {"professores":["Mestre Ana","Professor Bruno"]}.
- apps/api/src/repository.ts: criação com professor padrão e substituição atômica da lista/resumo nos dois bancos.
- apps/api/src/database/sqlite/migrations/011_professores_aula.sql e prisma/migrations/202610260002_professores_aula/migration.sql: evolução do banco; prisma/schema.prisma: relação.
- apps/web/src/components/ProfessoresAula.tsx e pages/AulasPage.tsx: formulário e acesso pelos detalhes.
- apps/api/src/professores-aula.test.ts: cinco testes novos; testes anteriores mantêm verificações de preservação e passam a considerar a versão 11 e o novo campo de leitura.

## Verificações reais

227 testes TypeScript aprovados, build/typecheck e geração/validação Prisma aprovados. Testes verificam herança, edição/remover nome, isolamento de outra aula/turma, chamada/check-in, nomes inválidos/duplicados, permissões, rollback, concorrência e migração preservando as tabelas anteriores.

SQLite real local atualizado para 11 com backup, hashes dos campos de todas as 22 tabelas anteriores iguais e vínculos válidos. API local reiniciada. Navegador com banco fictício confirmou adicionar e salvar dois professores, reabrir, remover do rascunho e cancelar sem perder a lista salva. Capturas em screenshots/aula-professores-formulario.png e screenshots/aula-professores-salvos.png.

Migração PostgreSQL está preparada, mas não foi aplicada no Supabase nesta entrega; ele continua na versão 10. Geração do Prisma não prova execução externa. Python não foi alterado nem retestado por este incremento. Nenhuma aula real foi renomeada ou recebeu professores fictícios para demonstração.

## Para a defesa oral

- Por que outra tabela? Uma aula pode ter vários professores; cada nome fica separado e ordenado.
- Por que transação? Para a lista e o resumo mudarem juntos, sem gravação parcial.
- Isso muda a turma? Não. Turma fornece o padrão para novos encontros; a aula pode ter sua equipe específica.
