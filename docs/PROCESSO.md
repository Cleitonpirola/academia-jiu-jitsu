# Processo

1. Leitura do desafio técnico e definição da stack com o usuário.
2. O usuário criou docs/ARQUITETURA.md, corrigiu a extensão .md.txt e registrou entidades, relações e campos de aluno.
3. Mudança autorizada de prioridade: entregar MVP e revisar explicações depois.
4. Revisão arquitetural, definição de contratos e persistência SQL; implementação das telas, API, analytics e integração configurável.
5. Validação automatizada e manual registrada em REVISAO_IA.md.

Resultado do MVP: cinco áreas da interface (Visão geral, Alunos, Mensalidades, Presenças, Inteligência), API HTTP real, banco SQL persistente, 20 alunos fictícios no seed e analytics FastAPI/Pandas conectado. Comandos de execução, configuração e testes estão no README. O usuário valida as telas antes da retomada da mentoria por módulos.

Dados de demonstração são fictícios e são gerados somente no banco local vazio. Para Supabase, o seed precisa ser executado explicitamente. A aplicação não publica dados ou código em serviços externos automaticamente.

## Fluxo permanente de alterações e atualização do GitHub — 19/10/2026

O usuário definiu que toda alteração deve ser validada por ele antes de commit e envio. Após essa aprovação, o próprio Codex fica responsável por registrar e subir as mudanças aprovadas, sem transferir a execução dos comandos ao usuário ou pedir outra autorização para o mesmo envio.

### Antes da aprovação

1. Conferir branch, remoto e alterações já existentes.
2. Implementar o pedido e atualizar a documentação relacionada.
3. Executar as verificações proporcionais à mudança. Para documentação, revisar conteúdo e diff; testes de aplicação só são necessários se houver uma razão concreta.
4. Apresentar o que mudou, os arquivos envolvidos, a justificativa, os resultados das verificações e uma forma de validação pelo usuário.
5. Aguardar a aprovação explícita desse conjunto. A permissão geral para testes não permite antecipar commit ou push.

### Depois da aprovação

1. Revisar o diff final e conferir se corresponde ao conjunto aprovado.
2. Selecionar somente os arquivos e trechos aprovados, preservando pendências de outros trabalhos.
3. Criar um commit coeso com título claro e descrição de mudanças relevantes, motivo e validação.
4. Fazer push normal para a branch de trabalho no remoto correspondente.
5. Confirmar o envio e informar ao usuário o hash, a branch e o link para o commit no GitHub.

Se o envio falhar, registrar claramente o que ficou salvo localmente e o que ainda não chegou ao GitHub. Não apresentar uma sincronização como concluída sem confirmação. Não usar force push para resolver uma divergência.

Nova mudança de comportamento ou escopo depois da aprovação precisa ser apresentada para validação antes de entrar no commit. A aprovação de commit/push não autoriza automaticamente merge em outra branch, release ou implantação.

### Documentação e versões

README, arquitetura, prompts, revisão de IA e processo devem acompanhar as mudanças que afetarem seu conteúdo. Os registros devem distinguir execução atual de evidência histórica e implementação de integração efetivamente validada.

A tag v1.0.0 continua preservada. Não é necessário criar uma nova versão a cada commit; uma nova tag ou release depende do escopo combinado. Banco local, segredos e dependências instaladas continuam excluídos do Git.

As instruções operacionais desse fluxo também estão em AGENTS.md, na raiz, para serem consultadas nas próximas sessões de trabalho.

## Correções após a revisão arquitetural — 19/10/2026

1. O usuário solicitou debate antes das correções. Foram esclarecidas as diferenças entre migração de estrutura e transferência de registros, e entre SQL obrigatório e Supabase recomendado no desafio.
2. Após a autorização “pode começar as correções”, Codex implementou proteção da evolução SQLite, isolamento de carregamentos e validação do contrato de analytics. O banco local foi mantido; não foram alteradas as fórmulas de risco ou regras de cobrança.
3. Foram acrescentados testes dos cenários reproduzidos na auditoria. Resultado: 30 TypeScript e 12 Python aprovados, typecheck e build concluídos.
4. O banco existente recebeu o histórico de versão e gerou backup. Contagens e hashes das quatro tabelas de negócio foram iguais antes/depois; a API real e o Python responderam corretamente.
5. Um ambiente separado em memória permitiu conferir no navegador erros isolados, recuperação e cadastro preservando o filtro, sem inserir registros de teste no banco do usuário.
6. Documentação atualizada para refletir código, verificações e limites. A tag v1.0.0 foi preservada.
7. Após a apresentação do resultado e dos testes, o usuário aprovou a finalização com “pode finalizar as alterações”. Essa aprovação autoriza registrar o conjunto e enviar a branch `codex/reestruturacao` ao GitHub, seguindo o fluxo definido acima. O commit correspondente pode ser consultado no histórico Git da branch.

Participação: o usuário definiu a prioridade, autorizou o escopo e aprovou a finalização; Codex escreveu implementação, testes e registros desta etapa. A aprovação não detalhou testes manuais executados pelo usuário; as verificações descritas foram realizadas pelo Codex. Não atribuir esses trechos a programação manual do candidato.
