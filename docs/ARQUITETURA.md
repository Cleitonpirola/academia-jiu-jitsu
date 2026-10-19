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

Primeira extração gradual: `modules/analytics/service.ts` concentra a consulta dos dados e a chamada HTTP ao Python; `schema.ts` valida sua resposta com Zod. `http-error.ts` compartilha o erro HTTP entre a composição da API e esse serviço. As demais rotas continuam em `app.ts`; a modularização completa ainda não foi realizada.

O contrato TypeScript descreve os tipos durante o desenvolvimento. A validação Zod verifica os valores recebidos pela rede: datas, mês solicitado, inteiros não negativos, listas e níveis de risco. Campos adicionais são aceitos e descartados; campos obrigatórios ausentes ou incompatíveis geram HTTP 503. Isso evita repassar uma string onde a tela espera uma lista. Essa checagem não prova, sozinha, que toda fórmula financeira está correta: os testes determinísticos e a conferência dos períodos continuam necessários.

No Python, StudentInput, PaymentInput e AttendanceInput substituem os dicionários genéricos de entrada. Datas impossíveis, valores fracionados de centavos e presença em texto são rejeitados antes do cálculo. Telefone, e-mail e nascimento não são enviados pelo Node ao Python. A fórmula e os limites de risco não mudaram.

O React mantém dados e estados separados por recurso em `data.ts`; `load-data.ts` publica cada resultado assim que chega, com Promise.allSettled. Cada página depende apenas dos recursos necessários. Histórico e indicadores possuem mensagens e tentativas próprias; erro não é apresentado como lista vazia ou total zero. Recargas em segundo plano preservam a página montada quando seus dados já estão disponíveis; uma falha invalida os dados do recurso afetado.

O SQLite usa o runner em `database/sqlite/migrate.ts` e os arquivos SQL de `database/sqlite/migrations/`. A versão inicial reproduz as quatro tabelas anteriores; registra a adoção de um banco 1.0 compatível sem recriar seus registros. O runner verifica histórico e checksum, faz backup antes de alterações pendentes em arquivos com tabelas e aplica as migrações em transação. Compara colunas, chaves estrangeiras e unicidade com a estrutura conhecida e confere vínculos. Estrutura desconhecida exige uma migração explícita; não se atribui uma faixa presumida ao aluno.

O histórico `_tatame_migrations` descreve o schema local, independentemente da versão do pacote npm. Migrações Prisma/PostgreSQL são outro caminho, mantido em `prisma/migrations/`; trocar DATABASE_URL não transfere registros. Procedimento e limites: [MIGRACOES_SQLITE.md](MIGRACOES_SQLITE.md).

Ao mudar o mês, o dashboard é invalidado até chegar o novo resumo; indicadores também limpam o contexto anterior durante a consulta. Isso impede atribuir números do período anterior ao mês recém-selecionado, sem invalidar os cadastros que não dependem do mês.
