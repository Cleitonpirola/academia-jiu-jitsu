# Revisão de IA

## Revisão inicial
- Risco: status atrasado armazenado pode ficar incorreto ao virar o dia. Correção: calcular pelas datas.
- Risco: apagar aluno com cobranças elimina rastreabilidade. Correção: restrição de exclusão e opção de inativação.
- Risco: comparar frequência de mês parcial com mês completo. Correção: comparar janelas equivalentes.
- Risco: valores monetários como float. Correção: centavos inteiros.
- Sugestão rejeitada: adicionar XAMPP ao ambiente. Motivo: não integra a stack Node/PostgreSQL escolhida.

## Limites conhecidos
- Supabase e IA precisam das credenciais do usuário; configuração não equivale a teste de integração externa.
- MVP local com administrador único; autenticação e autorização precedem publicação com dados reais.
- O desafio exige SQL e recomenda PostgreSQL/Supabase. PostgreSQL faz parte da stack escolhida, mas sua conexão e as operações externas ainda precisam de validação.

## Erros encontrados e corrigidos durante a execução
- O helper de criação de cobranças nos testes estava marcado async e devolvia Promise em vez do objeto Supertest. Typecheck encontrou o problema; retirado async e executados os testes novamente.
- Preflight do Tailwind zerou a margem padrão do dialog, posicionando o formulário no canto. Detectado na inspeção visual; restaurada margin:auto.
- Auditoria inicial encontrou quatro alertas altos em dependências transitivas do CLI Prisma (deepmerge-ts e mysql2). Overrides para versões corrigidas mantiveram Prisma 7. A reinstalação retornou zero vulnerabilidades.

## Validação final — 09/10/2026
- TypeScript estrito: API e frontend verificados.
- Build Vite: concluído com sucesso.
- 12 testes Node/Supertest aprovados: CRUD, buscas, duplicidades, datas inválidas, valores, vínculos, proteção do histórico, transição de status, presença, IA não configurada e persistência após reabrir o banco.
- 8 testes Python aprovados: banco vazio, limite de vencimento, regras de risco, janelas equivalentes, pagamento posterior à referência, receita por data do pagamento, ausência de divisão por zero e inativos.
- Aplicação local iniciada com Vite, Express e Uvicorn. UI mostrou 20 alunos, 17 ativos e métricas calculadas pelo Python. Conferidas navegação, listagem e formulário de alunos, presenças e indicadores.
- Supabase/PostgreSQL e chamadas externas de OpenAI permanecem sem validação ponta a ponta porque nenhuma credencial foi fornecida. A UI identifica banco local e assistente aguardando ativação.

## Averiguação de arquitetura e migrações — 19/10/2026

Após apontamentos trazidos pelo usuário, foram reproduzidos três cenários isolados: tabela SQLite antiga sem atualização de coluna, falha do histórico independente do cadastro e resposta analytics incompatível aceita sem validação de runtime. O efeito do Promise.all na recarga do frontend foi analisado pelo código; não houve teste de navegador desses cenários.

Nesta execução, typecheck, os 12 testes da API, os 8 testes Python e Prisma validate passaram. Isso confirma a base atual, mas não elimina as lacunas de evolução/integração reproduzidas. A migration inicial PostgreSQL existe; não foram aplicadas migrations em servidor externo e não existe transferência automática de dados SQLite/PostgreSQL.

Evidências, limites dos testes e recomendações estão em [REVISAO_ARQUITETURA_MIGRACOES.md](REVISAO_ARQUITETURA_MIGRACOES.md). Nenhum código da aplicação ou cadastro real foi alterado na averiguação.

## Correções e nova validação — 19/10/2026

Implementadas após autorização do usuário: migrações SQLite, isolamento do carregamento React e validação do contrato Python/Node. Foi extraído o serviço de analytics; as outras rotas permanecem na composição atual. As regras de cobrança, datas e risco foram preservadas.

| Verificação executada | Resultado |
| --- | --- |
| npm test | 30 aprovados: 12 anteriores, 8 de migração, 6 de contrato HTTP com Python substituto e 4 de carregamento |
| npm run test:analytics | 12 aprovados: 8 cálculos anteriores e 4 cenários de entrada inválida |
| npm run build | Typecheck API/frontend e compilação Vite aprovados |
| Banco local após iniciar a API corrigida | Backup criado, versão 1 registrada, mesmas linhas e hashes nas quatro tabelas de negócio; foreign_key_check vazio |
| GET health/alunos/mensalidades/presencas/dashboard/analytics/analises | Sete respostas 200; analytics calculado pelo Python real, com 17 ativos e 7 alunos em risco no mês observado |
| Navegador com falha de histórico e Python incompatível | Dashboard e cadastro carregaram; indicadores e histórico mostraram erros próprios |
| Recuperação dos serviços de teste | Tentar novamente recuperou histórico e indicadores sem recarregar a página |
| Cadastro fictício no navegador de teste | Aluno criado; filtro de busca mantido após a atualização dos dados |

Os testes de falha no navegador usaram um processo separado, SQLite em memória e registros fictícios. Não alteraram o banco local do usuário. Na sua base local, somente o controle de migrações foi acrescentado: 20 alunos, 110 mensalidades, 425 presenças e zero análises permaneceram idênticos por comparação SHA-256 das linhas ordenadas antes/depois. Evidências e capturas desta conversa foram salvas na pasta externa `correcoes_2026-10-19`, sem credenciais.

Escolha revisada: não preencher automaticamente uma faixa ausente em schema desconhecido. Isso inventaria um dado cadastral. O runner interrompe, preserva o backup e exige uma transformação explícita; o teste de evolução de versão 2 usa campo opcional apenas na base temporária de teste.

Durante a validação visual, o preenchimento automatizado de data precisou de eventos de teclado para atualizar o formulário React; a mensagem de data inválida foi conferida antes de repetir o envio. O cadastro posterior foi concluído no ambiente isolado. O controle de atualização da tela foi verificado pelo filtro mantido, não apenas pelo status HTTP.

Limites: não houve chamada a provedor externo de IA nem execução PostgreSQL/Supabase. O teste HTTP real Node/Python é uma conferência manual desta execução; não foi criado um teste automático que inicia os dois processos. As migrações não convertem qualquer schema antigo, e a modularização completa da API permanece futura. O usuário aprovou a finalização do conjunto para commit e envio ao GitHub com “pode finalizar as alterações”.

Na revisão final foi acrescentada invalidação do dashboard ao trocar o mês, conservando os cadastros carregados, e limpeza do contexto dos indicadores durante a consulta. Um teste adicional verifica que a troca exige novos totais sem descartar alunos; por isso o total final é 30 testes TypeScript e 12 Python.
