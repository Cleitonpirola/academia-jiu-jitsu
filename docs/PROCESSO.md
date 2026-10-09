# Processo

1. Leitura do desafio técnico e definição da stack com o usuário.
2. O usuário criou docs/ARQUITETURA.md, corrigiu a extensão .md.txt e registrou entidades, relações e campos de aluno.
3. Mudança autorizada de prioridade: entregar MVP e revisar explicações depois.
4. Revisão arquitetural, definição de contratos e persistência SQL; implementação das telas, API, analytics e integração configurável.
5. Validação automatizada e manual registrada em REVISAO_IA.md.

Resultado do MVP: cinco áreas da interface (Visão geral, Alunos, Mensalidades, Presenças, Inteligência), API HTTP real, banco SQL persistente, 20 alunos fictícios no seed e analytics FastAPI/Pandas conectado. Comandos de execução, configuração e testes estão no README. O usuário valida as telas antes da retomada da mentoria por módulos.

Dados de demonstração são fictícios e são gerados somente no banco local vazio. Para Supabase, o seed precisa ser executado explicitamente. A aplicação não publica dados ou código em serviços externos automaticamente.
