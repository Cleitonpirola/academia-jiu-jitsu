# Salvar a versão 1.0.0 no GitHub

## Fluxo adotado após o primeiro envio

Desde 19/10/2026, o usuário valida cada alteração antes do commit. Após a aprovação explícita do conjunto apresentado, o Codex cria o commit descritivo, envia a branch de trabalho ao GitHub e confirma hash, branch e link do resultado. As etapas detalhadas estão em [PROCESSO.md](PROCESSO.md) e as instruções para próximas sessões estão em [AGENTS.md](../AGENTS.md).

O tutorial abaixo continua como referência para entender a instalação e o primeiro envio. Para alterações futuras, a execução de commit/push fica com o Codex depois da validação do usuário. A tag v1.0.0 permanece preservada.

Git registra versões no computador. GitHub guarda uma cópia desses registros na sua conta. Um **commit** é um registro dos arquivos; a **tag v1.0.0** identifica o registro desta primeira versão.

## 1. Instalação e preparação

Neste computador, o Git 2.55.0 já está instalado, e o nome e o e-mail do autor já estão configurados. Não é necessário instalar GitHub CLI ou GitHub Desktop para seguir este guia.

No terminal do VS Code, você pode conferir:

```powershell
git --version
git config --get user.name
git config --get user.email
```

Se estiver em outro computador sem Git, use a [instalação oficial para Windows](https://git-scm.com/install/windows), mantenha o Git Credential Manager habilitado e reabra o terminal depois de instalar. Configure o autor usando seu nome e o e-mail verificado no GitHub ou o endereço privado fornecido pelo GitHub:

```powershell
git config --global user.name "SEU NOME"
git config --global user.email "SEU EMAIL"
```

Os manifests npm e o package-lock.json estão na versão 1.0.0. Nenhuma função, rota, tela, regra de negócio ou cálculo foi alterado nesta preparação.

O registro local inicial está preparado na branch `main`, com a tag `v1.0.0`. Estes comandos permitem conferir sem modificar arquivos:

```powershell
git status
git log -1 --oneline
git show --no-patch v1.0.0
```

## 2. Criar o repositório na sua conta

1. Entre na sua conta e abra [github.com/new](https://github.com/new).
2. Em **Owner**, selecione sua conta.
3. Em **Repository name**, use `academia-jiu-jitsu`, se o nome estiver disponível.
4. Descrição sugerida: `Tatame — gestão de academia de Jiu-Jitsu — versão 1.0.0`.
5. Para guardar a versão antes das mudanças, a sugestão é **Private**. Você pode escolher **Public** se já quiser disponibilizar o código para qualquer pessoa. A entrega final do desafio exige repositórios públicos.
6. Deixe **Add a README file** desativado, **.gitignore** como **None** e **License** como **None**. Os arquivos locais já serão enviados.
7. Clique em **Create repository**.
8. Copie a URL **HTTPS** mostrada no novo repositório. Ela terá o formato `https://github.com/SEU_USUARIO/academia-jiu-jitsu.git`.

Um repositório é a pasta do código e do histórico. A função GitHub Projects é um quadro de tarefas e não é necessária para enviar o código.

## 3. Conectar a pasta ao repositório

No VS Code, abra **Terminal → New Terminal**. Entre na pasta do projeto:

```powershell
Set-Location -LiteralPath 'C:\Users\Cleiton Pirola\OneDrive\Documentos\academia-jiu-jitsu'
```

Depois de confirmado o registro local v1.0.0, execute um comando por vez. Substitua a URL abaixo pela URL HTTPS que você copiou:

```powershell
git remote add origin https://github.com/SEU_USUARIO/academia-jiu-jitsu.git
git remote -v
git push -u origin main
git push origin v1.0.0
```

`origin` é o nome da conexão com seu repositório. O primeiro `push` envia o histórico e os arquivos; o segundo envia a marca da versão 1.0.0.

Se abrir uma janela de autenticação, entre na sua conta no navegador e conclua a autenticação do Git Credential Manager. Não coloque senhas ou tokens dentro da URL. Se aparecer um erro, pare no comando que falhou e traga a mensagem para analisarmos; não use `--force`.

## 4. Conferir o envio

Atualize a página do repositório e confira:

- Pastas `apps`, `packages`, `services`, `prisma`, `scripts` e `docs`.
- README e arquivos package.json/package-lock.json.
- Branch `main` e tag `v1.0.0`.
- Ausência de `.env`, `node_modules`, `.venv` e `data`.

Todo o código, os testes, o seed e a documentação entram no repositório. Dependências instaladas, banco local, arquivos compilados e credenciais são excluídos pelo `.gitignore`. O banco deste computador continua salvo localmente; enviar código ao GitHub não é um backup dos dados cadastrados.

## 5. Apresentar a versão como uma release

A tag já preserva a versão. Se quiser também uma página de lançamento no GitHub:

1. Abra **Releases → Draft a new release** no repositório.
2. Em **Choose a tag**, escolha a tag existente `v1.0.0`.
3. Título: `Tatame 1.0.0`.
4. Descrição sugerida:

```text
Primeiro registro do MVP Tatame.

Cadastro de alunos, controle de mensalidades, pagamentos, dashboard,
presenças e indicadores calculados por FastAPI/Pandas.

Executa localmente com SQLite. Integrações externas com Supabase e
OpenAI dependem de credenciais e de validação posterior.
```

5. Deixe a opção de pré-lançamento desmarcada e clique em **Publish release** quando estiver pronto.

## 6. Preparar as mudanças estruturais depois

Quando os dois envios forem concluídos, podemos criar uma branch para trabalhar nas mudanças. A tag v1.0.0 continuará apontando para esta versão:

```powershell
git switch -c codex/reestruturacao
```

Não mova nem substitua a tag v1.0.0. Uma versão futura recebe outro número. Para apenas consultar o registro original sem trocar os arquivos em uso:

```powershell
git show v1.0.0:README.md
```

Enviar o código ao GitHub não publica a aplicação na internet. Para executar uma cópia em outro computador, siga os comandos de instalação do README.

## Referências

- [Adicionar código local ao GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).
- [Criar um repositório](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository).
- [Autenticação com Git Credential Manager](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git?platform=windows).
- [Gerenciar releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).
