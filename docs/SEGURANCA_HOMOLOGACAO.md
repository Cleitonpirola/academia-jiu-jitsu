# Proteção pendente antes da publicação

## Correção aplicada — 31/10/2026

Usuário autorizou concluir a preparação para testes externos. Migração19 `202610310002_seguranca_tabelas_privadas` aplicada após nova exportação lógica privada e ensaio revertido. Dados integralmente iguais antes/depois, 34 tabelas com RLS e função com caminho fixo. Prisma privado mantém leitura; `anon` e `authenticated` não receberam registros das34 tabelas. Advisors agora só registram INFO de ausência de políticas públicas, coerente com acesso exclusivo pelo backend. A proposta descrita abaixo foi executada; não reaplicar manualmente. Sem commit/push. Publicação em verificação.

## Encontrado em 31/10/2026

Após as oito migrações autorizadas, as **onze tabelas novas** têm Row Level Security (RLS) habilitada, sem políticas públicas. O backend privado lê via Prisma; perfis públicos não recebem seus registros. As **23 tabelas anteriores**, incluindo o histórico Prisma, continuam sem RLS. A consulta de permissões confirmou `SELECT` para `anon` e `authenticated` em Aluno, Usuario e no histórico. Isso representa risco caso os objetos estejam acessíveis pela Data API; não comprova que esse endpoint HTTP esteja habilitado ou que tenha ocorrido vazamento. Conferir também a configuração da API de Dados antes de publicar.

O verificador do Supabase apontou ainda que a função `validar_graduacao_aluno` não fixa o caminho de procura de tabelas (`search_path`).

## Proposta ainda não executada

Após aprovação do usuário, criar **migração separada** com o SQL abaixo. Não acrescentar permissões públicas. O navegador do Tatame atual usa a API Node autenticada, não consulta o Supabase diretamente. A conexão privada Prisma já conseguiu ler as onze tabelas novas protegidas; conferir a mesma separação nas antigas antes de publicar.

Analogia: o aplicativo tem uma recepção que verifica quem entra, mas precisamos fechar também uma porta lateral do banco. RLS fecha essa porta para os perfis públicos; a API continua usando sua conexão privada.

```sql
BEGIN;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Aluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Mensalidade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Presenca" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Analise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Turma" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."HorarioTurma" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AlunoTurma" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Aula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AulaAlunoPrevisto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PresencaAula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Sessao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CheckinAula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PlanoAluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LiberacaoAula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ConfiguracaoAcademia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DebitoAula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ResponsavelAluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EventoAcessoAluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ComunicadoAluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FaixaGraduacao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GrauFaixa" ENABLE ROW LEVEL SECURITY;
ALTER FUNCTION public.validar_graduacao_aluno() SET search_path = public, pg_temp;
COMMIT;
```

Sem políticas públicas, RLS bloqueia acesso por `anon`/`authenticated`. **Se futuramente o frontend consultar o Supabase diretamente ou usar Supabase Auth, projetar políticas adequadas**; a autenticação própria atual do Tatame não é Supabase Auth.

Antes da aplicação proposta: nova exportação lógica privada, ensaio revertido, negação para perfis públicos e leitura privada preservada. Aplicar por Prisma para manter um histórico único e conferir integralmente dados/permissões depois. Não houve aplicação desta proposta durante a autorização das migrações11–18. Referência: [RLS no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).
