# Correção de dependências — 31/10/2026

## Resultado

Os quatro alertas apontados pelo npm foram corrigidos. Nova execução de `npm audit` na cópia isolada e no workspace retornou **zero vulnerabilidades conhecidas**. Isso se refere às dependências auditadas nessa data; não equivale a auditoria completa do aplicativo.

| Biblioteca | Antes | Instalada após a correção | Motivo |
| --- | --- | --- | --- |
| `body-parser` | 2.3.0 | 2.4.0 | Corrige falha que pode encerrar o processo ao tratar corpo comprimido malformado |
| `fast-uri` | 3.1.8 | 3.1.9 | Corrige normalização e interpretação inseguras de URLs |
| `qs` | 6.16.0 | 6.17.1 | Inclui a correção da serialização que pode lançar erro com entrada manipulada |
| `zod` | 4.6.5 | 4.6.7 | Inclui a correção de consumo excessivo de memória na validação de coleções |

O mínimo do Zod em `package.json` passou para `^4.6.7`; as demais correções são dependências transitivas registradas no lockfile. Não foram forçadas versões principais incompatíveis, usado `npm audit fix --force` ou alteradas regras de negócio. O npm também completou seis entradas opcionais da árvore WASI já declarada pelo Tailwind no lockfile da cópia limpa; não são novas funcionalidades.

## Tratamento HTTP e teste de regressão

O teste novo envia JSON gzip válido e inválido para a API local com banco em memória. O válido continua aceito; o malformado recebe400, e a próxima consulta anônima aos alunos recebe401. Assim, verifica tanto a continuidade do servidor quanto a exigência de autenticação.

A primeira execução do teste detectou resposta500 para erro `Z_DATA_ERROR`: a dependência atualizada já evitava o encerramento, mas o tratador genérico do Tatame classificava mal a entrada inválida. O tratamento passou a reconhecer somente erros de descompressão400 `Z_DATA_ERROR`/`Z_BUF_ERROR`, devolvendo mensagem400 sem revelar detalhes internos. Não foi relaxada a expectativa do teste para aceitar500.

## Validação realmente executada

- Cópia isolada do commit-base `c8c7ef4`, com apenas este conjunto: **228 testes passaram**, zero falhas. Dependências instaladas por `npm ci`; cliente Prisma gerado sem conexão ao banco. Build e typecheck aprovados.
- Workspace com todas as alterações locais preservadas: **285 testes passaram**, zero falhas; build e typecheck aprovados.
- Auditoria completa com `npm audit`: zero vulnerabilidades conhecidas tanto na cópia isolada quanto no workspace.
- Ensaio HTTP somente em `127.0.0.1`, porta temporária, com SQLite em memória. Nenhuma requisição de teste malformada enviada à publicação online ou a serviços de terceiros.

## Escopo do commit e da publicação

O usuário autorizou revisar, corrigir, testar e commitar esse conjunto de segurança. Foram selecionados apenas manifests, tratamento HTTP, teste de regressão e documentação correspondente. Mudanças anteriores de funcionalidades, hospedagem e Storage continuam preservadas localmente para revisão própria; não entram neste commit por estarem no mesmo diretório.

Não houve deploy nesta correção. A Preview existente na Vercel continua executando a publicação anterior; enviar ao GitHub não comprova atualização dessa Preview. Nenhuma migração, segredo, banco local, bucket, tag/release ou merge em `main` foi incluído. O upload privado de vídeos continua adiado.

## Explicação para a defesa oral

Uma dependência é uma peça pronta usada pelo aplicativo. Atualizamos quatro peças com falhas conhecidas e repetimos os testes para conferir que o conjunto continua funcionando. O `package-lock.json` registra as versões exatas instaladas, para que outra pessoa consiga reproduzir essa instalação.

Um alerta não prova que alguém atacou o Tatame. Ele informa que uma versão usada possui uma falha conhecida, cuja exposição depende de como ela é utilizada. A correção remove essas versões conhecidamente vulneráveis; não representa promessa de ausência de qualquer falha no sistema.

## Referências

- [Comunicado do body-parser](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828).
- [Comunicado do fast-uri](https://github.com/fastify/fast-uri/security/advisories/GHSA-w74x-v6f9-j3xg).
- [Alerta revisado do qs](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw).
- [Correção do Zod no repositório oficial](https://github.com/colinhacks/zod/pull/6652).
