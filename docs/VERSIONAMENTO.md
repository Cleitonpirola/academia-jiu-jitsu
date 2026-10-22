# Commits, versões e revisão pelo Matheus

Proposta operacional apresentada em 19/10/2026. Mantém o fluxo do usuário: implementar, testar, apresentar e aguardar sua validação antes de commit/push. Uma consulta sobre esse fluxo não equivale à aprovação de uma entrega pendente.

## Quando enviar ao GitHub

Recomendação para o Tatame: enviar cada pequena entrega funcional depois de testada e aprovada pelo usuário. Por exemplo, cadastro de turmas e grade fixa pode ser uma entrega; aulas e nova chamada serão outras. Não esperar todo o planejamento ficar pronto para mostrar progresso.

Uma entrega pode precisar de mais de um commit quando houver mudanças independentes que façam sentido separadas. Os commits devem representar o trabalho real, com título e descrição em português. Não dividir artificialmente alterações só para aumentar o histórico. Após a aprovação, Codex revisa o diff, seleciona apenas o conjunto aprovado, cria os commits e faz push normal para a branch correspondente.

Ao confirmar o envio, informar branch, hash, link do commit e resumo do que mudou e foi testado. Esse é o link que o usuário pode encaminhar ao Matheus. A branch de trabalho atual é `codex/evolucao-tatame`; o conteúdo de `main` pode ser diferente. Merge em main é uma ação separada e não está autorizado automaticamente.

## O que cada nome significa

- **Commit:** um registro identificado das alterações no código/documentação. É o histórico que permite acompanhar cada avanço.
- **Push:** o envio dos commits locais para o GitHub. Só criar um commit não faz o Matheus recebê-lo pelo repositório remoto.
- **Tag:** uma referência com nome, como `v1.1.0`, apontando para um commit de uma entrega definida.
- **Release:** a apresentação de uma entrega no GitHub, associada à tag, com descrição de novidades, correções, migrações e limites. Não significa que a aplicação foi implantada na internet.

O [GitHub documenta a relação entre releases e tags](https://docs.github.com/pt/repositories/releasing-projects-on-github/about-releases). Criar ou enviar commits não cria uma release automaticamente.

## Como escolher o número

Usaremos como referência o [Versionamento Semântico](https://semver.org/lang/pt-BR/), com três números: maior, menor e correção. A classificação depende do efeito da entrega e da compatibilidade dos contratos documentados, especialmente rotas, campos e comportamento da API.

| Tipo | Exemplo de progressão | Quando se aplica |
| --- | --- | --- |
| Correção | 1.1.0 → 1.1.1 | Corrigir erro preservando os contratos existentes |
| Função nova compatível | 1.0.0 → 1.1.0 | Acrescentar uma capacidade sem quebrar a integração existente |
| Mudança incompatível | 1.1.0 → 2.0.0 | Alterar um contrato existente de modo que quem o utiliza precise se adaptar |

Uma mudança visual grande não exige por si só versão maior. Criar uma tabela nova também não determina sozinho o número. Compatibilidade, migrações e requisitos de atualização precisam ser avaliados em cada entrega. O número não representa quantidade de commits nem é decimal: depois de 1.9.0 pode vir 1.10.0.

## Quando marcar uma versão

Não há regra de “a cada cinco atualizações”. Podemos ter vários commits aprovados e enviados antes de marcar uma versão. Quando fecharmos o escopo de uma entrega para versionamento, a descrição deverá informar o que está incluído e o que ainda é planejado.

Proposta atual: o cadastro de turmas, grade fixa e vínculos habituais é candidato à próxima versão menor, `v1.1.0`, após a validação do usuário e a combinação desse marco. Aulas datadas, aulas extras, nova chamada, planos limitados e portal não podem aparecer como concluídos nessa versão se ainda não estiverem implementados.

Esta proposta não criou a tag `v1.1.0`, não mudou os manifestos de `1.0.0` e não publicou release. A aprovação habitual de commit/push não autoriza automaticamente tag, release, merge ou implantação; o marco precisa ser combinado explicitamente. Uma vez combinado e aprovado, ajustar os manifestos e lock aplicáveis, testar, registrar o estado e publicar a referência aprovada com suas notas. Não mover tags já publicadas.

## Estado observado nesta etapa

A tag local existente é `v1.0.0`, preservada. Antes da entrega de turmas, o último commit local era `fb7600a` na branch `codex/reestruturacao`. As correções desse commit já foram enviadas em etapa anterior; não foi criada uma tag de correção para cada commit. Após a apresentação da implementação de turmas e seus documentos, o usuário autorizou commit/push com “pode commitar”. Não houve autorização para nova tag ou release.

Cada confirmação futura deve consultar o estado real do Git e do remoto; este parágrafo registra o momento da preparação, não garante sincronização de alterações ainda não aprovadas.

Atualização posterior: entrega 1A enviada no commit `507d260` à branch de trabalho e conferida no remoto, sem tag/release. Em seguida, a entrega 1B de aulas foi implementada e testada localmente após autorização para começar. Em 20/10/2026, após os esclarecimentos da exclusão de extras, o usuário aprovou commit/push do conjunto 1B com “pode commitar”. Não foi atribuído automaticamente um número de versão a nenhuma dessas etapas nem autorizada nova tag/release.

Em 21/10/2026, após escolher o nome, o usuário teve a branch `codex/reestruturacao` renomeada para `codex/evolucao-tatame`, no GitHub e localmente, ainda no commit `dd3212e`. Renomear uma branch não cria commit, versão de produto, tag, release ou implantação. As menções anteriores ao nome antigo são registros históricos; as próximas consultas e envios devem usar o novo nome. A atualização da documentação dessa renomeação é apresentada para validação antes de seu próprio commit/push.

Depois da apresentação, o usuário aprovou os ajustes documentais com “pode commitar”. Seu registro será um commit de documentação na branch renomeada, mantendo o número 1.0.0 dos manifests e a tag inicial; essa aprovação não cria marco de versão, PR, merge ou implantação.
