# Instruções de trabalho do projeto Tatame

## Fluxo definido pelo usuário em 19/10/2026

O usuário valida cada alteração antes de sua inclusão em commit e envio ao GitHub. A autorização geral para executar testes não substitui essa aprovação.

1. Consultar o estado do Git e as instruções existentes antes de trabalhar. Preservar alterações prévias do usuário ou de outras tarefas.
2. Implementar o que foi solicitado e atualizar a documentação afetada, mantendo código e documentação local coerentes.
3. Executar as verificações adequadas à mudança. Informar o que foi realmente testado, o resultado e limitações relevantes; não apresentar resultados históricos como uma execução nova.
4. Apresentar uma entrega concreta para validação: comportamento alterado, arquivos envolvidos, justificativa, verificações e forma de conferir o resultado.
5. Aguardar a aprovação explícita do usuário para o conjunto apresentado. Antes dela, não criar commit nem executar push, inclusive para mudanças somente de documentação.
6. Após a aprovação, o próprio Codex deve revisar o diff, selecionar somente as alterações aprovadas, criar um commit descritivo e enviar esse commit ao GitHub, sem pedir novamente autorização para essas mesmas ações.
7. Confirmar o resultado do envio e informar hash do commit, branch e link do GitHub. Se o commit tiver sido criado, mas o push falhar, distinguir claramente o estado local do remoto e explicar a pendência.

Se houver uma nova alteração de escopo ou comportamento depois da aprovação, apresentar essa diferença para validação antes de incluí-la no commit. Uma correção não relacionada não herda automaticamente a aprovação anterior.

## Commits e sincronização

- Usar título claro em português, com prefixo adequado, por exemplo `feat:`, `fix:`, `refactor:` ou `docs:`.
- Descrever no corpo do commit todas as mudanças relevantes do conjunto aprovado, o motivo e a validação executada. Mencionar limitações quando afetarem a avaliação do resultado.
- Manter commits coesos. Não incluir arquivos pendentes de outra tarefa apenas porque estão modificados ou não rastreados.
- Conferir a branch e o remoto antes do envio. Usar a branch de trabalho correspondente à alteração aprovada; informar qual branch foi atualizada. A aprovação para commit/push não autoriza automaticamente merge em outra branch, publicação de release ou implantação da aplicação.
- Usar push normal. Não usar force push, apagar histórico ou substituir versões publicadas para contornar divergências. Resolver com preservação do trabalho existente e comunicar qualquer bloqueio real.
- Nunca versionar `.env` reais, credenciais, banco local, `node_modules`, `.venv` ou arquivos gerados excluídos pelo `.gitignore`.
- Preservar a tag `v1.0.0`. Não mover, substituir ou apagar essa referência. Mudanças futuras não devem reescrever a versão inicial.
- Não criar tags ou alterar o número de versão a cada commit automaticamente. Versionamento de uma nova entrega deve corresponder ao escopo efetivamente combinado.

Modelo de corpo de commit, adaptável ao tamanho da mudança:

```text
Alterações:
- Descrever as mudanças relevantes aprovadas.

Motivo:
- Explicar o problema resolvido ou o objetivo atendido.

Validação:
- Informar verificações executadas e resultados reais.
- Registrar limitações relevantes, se houver.
```

## Documentação do processo

- Atualizar o README quando execução, configuração ou funcionalidades mudarem.
- Atualizar `docs/ARQUITETURA.md` quando responsabilidades, contratos ou modelo de dados mudarem.
- Registrar prompts relevantes, revisão, correções e decisões nos documentos de processo e IA existentes, sem inventar etapas anteriores ou autoria manual.
- Diferenciar uma funcionalidade planejada, implementada e validada. Em especial, não afirmar validação externa de Supabase ou IA apenas pela existência de código/configuração.
- Seguir o fluxo detalhado em `docs/PROCESSO.md`.
