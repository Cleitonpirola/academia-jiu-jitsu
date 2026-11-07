# Ranking, fotos e presenças por dia

## Fotos em bucket —31/10/2026, implementação local

Com Storage configurado, novos envios vão para bucket privado e a ficha guarda referência. As rotas autenticadas usadas pelo ranking/chamada continuam iguais; fotos antigas base64 permanecem legíveis, sem conversão em massa. Sem configuração, mantém formato anterior. Seis testes novos de Storage e suíte284 passaram. Configuração e validação externa pendentes: [ARMAZENAMENTO.md](ARMAZENAMENTO.md).

## Onde conferir

- Professor: **Ranking** no menu principal; Mensal (padrão) ou Anual, com seleção do mês ou ano.
- Aluno: **Área do aluno → Ranking**.
- Foto do aluno: **Meu perfil → Minha foto → Escolher foto → Salvar foto**.
- Foto do administrador: **Configurações → Minha foto**.
- Responsável: Minha foto de perfil no início da sua área; a foto da criança fica em **Meu perfil → Foto do aluno** no dependente selecionado.
- Professor: **Presenças → escolher dia → Ver presenças** na aula desejada.
- Aluno: **Aulas e check-in → escolher dia → aula/horário**. O histórico conserva data e horário de cada participação.

## Como o ranking funciona

Cada aula com presença confirmada pelo professor soma um treino. Dois horários no mesmo dia podem somar dois treinos. Fazer check-in sem comparecer não soma. Ausência, aula cancelada, aula futura, cadastro inativo e registro anterior à matrícula não entram.

Mensal considera a data da aula no mês escolhido e vem selecionado no mês atual. A cada dia 1, o novo mês começa sem pontos herdados do anterior. Anual soma as presenças de janeiro a dezembro do ano selecionado, sem misturar anos. Durante o ano corrente, o resultado é parcial até hoje; ao terminar dezembro, é possível consultar o total daquele ano e seus primeiros colocados.

Renovar não significa apagar: a API calcula pelos registros do período. Os meses e anos anteriores continuam consultáveis. A página acompanha a virada do mês/ano enquanto está aberta ou ao voltar para ela; uma consulta a um período histórico não é trocada automaticamente. Não depende de uma tarefa agendada ou de o computador estar ligado à meia-noite. Uma mesma aula não é contada duas vezes para o mesmo aluno. O ranking só mostra alunos com pelo menos uma presença válida. Em empate, os nomes ficam em ordem alfabética, com o identificador como último desempate estável. Os três primeiros têm destaque; os demais aparecem na lista.

Os registros antigos por modalidade permanecem no histórico, mas não são somados ao ranking: não identificam uma aula e poderiam duplicar o mesmo treino. Aulas anteriores reconhecidas manualmente para graduação também não viram presenças de ranking. O total é calculado a partir dos dados; não existe um contador de pontos independente que precise ser corrigido depois de cada alteração.

## Como as fotos são guardadas

A pessoa escolhe JPG, PNG ou WebP de até 20 MB. Antes de enviar, o navegador recorta o centro em quadrado e gera JPEG de 256 × 256 pixels. Essa conversão reduz o arquivo e não transporta os metadados originais. O servidor aceita somente JPEG pequeno, com validação de assinatura, limite de conteúdo e contrato estrito. Não aceita SVG ou URL remota fornecida pelo usuário.

`FotoPerfil` guarda a imagem e sua data de atualização, vinculada exclusivamente a um aluno ou a um usuário. A foto do aluno fica ligada ao cadastro, preservando-a em transferências de acesso para responsável/aluno. Cada sessão só altera o próprio perfil; o responsável usa a rota protegida do dependente. A foto do responsável não substitui a foto da criança.

Ranking e imagens da equipe exigem login. O ranking entrega somente identificador do aluno, nome, quantidade, posição e URL interna da foto; não entrega telefone, e-mail, senha ou dados financeiros de outros alunos. Sem foto, aparecem as iniciais. O armazenamento inicial é no mesmo banco, adequado ao MVP; um armazenamento de objetos pode ser adotado futuramente sem alterar a identidade do aluno.

## Presenças por dia e aula

Um seletor mostra os dias próximos e permite escolher outra data. Um ponto indica dias com aula publicada. Para o professor, cada aula tem horário, nome, professor e resumo de presentes/pendentes. **Ver presenças** abre somente a chamada daquela aula. As ações existentes de Presente, Ausente, limpar marcação e remover check-in continuam disponíveis, respeitando as regras já existentes.

O aluno enxerga as aulas publicadas do dia e faz check-in no horário desejado. O nome mostrado no portal identifica o horário: **Aula das 12h**, **Aula das 18h30** etc. O nome administrativo editado da aula é preservado no banco. Crédito, bloqueio financeiro e confirmação do professor continuam seguindo os contratos anteriores.

O registro antigo por modalidade foi mantido para compatibilidade e oferece somente **Com kimono** e **Sem kimono** para novos registros na interface. Tipos históricos não foram apagados. Outras modalidades estão planejadas para uma configuração futura da academia.

## Arquivos e contratos principais

- API: `modules/equipe/ranking.ts` calcula o ranking; `routes.ts` expõe `GET /api/equipe/ranking?mes=AAAA-MM` ou `?ano=AAAA` e a foto autenticada. Sem filtro, usa o mês corrente de São Paulo. Mês e ano juntos são rejeitados; não existe opção Geral na interface.
- `modules/equipe/fotos.ts`: contratos de foto, GET/PUT/DELETE em `/api/perfil/foto`, `/api/portal/foto` e portal do dependente.
- Web: `RankingPage.tsx`, `FotoPerfil.tsx`, `DiasAulas.tsx`, `AttendancePage.tsx`, `StudentPortal.tsx` e `nome-aula.ts`.
- Migração 17 acrescenta `FotoPerfil`. Migração 16 pertence ao envio coletivo de comunicados. Não reescrevem as tabelas anteriores.

## O que foi realmente verificado

Em 27/10/2026, **267 testes TypeScript passaram**, incluindo contagem geral/mensal, duplicação, dois treinos no dia, ausência/cancelamento/futuro, campos expostos, formatos de foto, isolamento entre alunos e acesso por responsável. Build/typecheck passaram; Prisma gerado/validado sem conexão externa.

Interface conferida: comunicado coletivo e Ciente; envio/recorte/salvamento de uma imagem fictícia no perfil; imagem no ranking; geral com 29, outubro com 26 e setembro com 3 treinos na QA existente; chamada por dia/aula. Um banco visual separado, somente com cinco alunos fictícios, permitiu conferir pódio/lista e tela de 390 pixels. Os cinco alunos não foram incluídos na base principal nem na QA usada pelo usuário.

A primeira prévia de foto falhou porque usava URL de objeto, incompatível com a política de imagens do servidor. Foi trocada por leitura de arquivo como data URL, sem enfraquecer essa política. Novo envio visual funcionou e a foto foi salva. Build/typecheck reexecutados após a correção; a suíte de API já aprovada não foi apresentada como novo teste visual.

SQLite principal e QA v17, backup e 27 tabelas anteriores preservadas. Nenhum teste ou migração no Supabase: usuário reiterou mantê-lo parado. Alterações ainda aguardam validação do usuário antes de commit/push.

## Para a defesa oral

**Por que o check-in não soma sozinho?** Porque ele é a intenção de treinar; a presença confirmada registra quem realmente participou.

**Por que calcular o ranking pelos registros?** Se uma presença for corrigida ou a aula cancelada, a próxima consulta já refletirá os dados corretos, sem um segundo contador que possa divergir.

**Por que a foto fica no cadastro do aluno?** Para manter sua identidade e imagem mesmo quando muda quem administra o acesso.

## Ajuste solicitado depois — mês renovável e total anual

Pedido do usuário: todo mês renovar o ranking e ao fim do ano contabilizar quem mais treinou. Mensal passou a ser o padrão e Geral foi substituído por Anual. A soma anual é por presença confirmada no ano civil, não por somar posições ou vencer meses. Quem soma mais treinos no ano fica à frente, mesmo sem ter vencido um mês.

Novos testes provaram passagem dezembro/janeiro, primeiro dia do mês seguinte sem registros, consulta ao ano encerrado, exclusão de outro ano e de aulas futuras, ausência de alteração do histórico, filtro padrão e rejeição de parâmetros conflitantes. Teste da atualização de período verifica que consultas históricas são mantidas. Suíte nova completa:267pass/0fail; build/typecheck aprovados. Interface conferida com Mensal padrão nos dois perfis, Anual2026 com pódio, Anual2025 sem registros na demonstração e retorno ao ano corrente. Esta mudança não exigiu migração nem alterou dados. Supabase continua parado; sem commit/push até validação.
