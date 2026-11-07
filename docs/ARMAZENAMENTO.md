# Fotos e vídeos no Supabase Storage

**Direção posterior —01/11/2026:** usuário prefere manter vídeos no YouTube e avalia envio automático pelo Tatame com a API oficial. Proposta em [TECNICAS.md](TECNICAS.md), ainda sem integração/envio real. Upload de vídeo em bucket permanece adiado, código preservado. A mudança não define armazenamento de fotos nem resolve a intenção de vender acesso; as restrições comerciais e de compartilhamento do YouTube foram registradas para decisão futura.

## Decisão posterior — implementação adiada, 31/10/2026

O usuário decidiu retomar o upload/hospedagem de vídeos depois de definir tamanho, qualidade e duração, para não atrasar a atualização atual. O código local foi preservado e não foi ativado online. A configuração de chave, criação de buckets e publicação descritas abaixo são etapas futuras, não tarefas para executar agora. Fotos existentes e links de vídeo continuam funcionando como antes. Os50 MiB/MP4 são uma configuração inicial de teste; não há definição final aprovada de formato/qualidade/duração. Reavaliar validade de600s das URLs para explicações longas. Nenhuma alteração externa, commit ou push nesta decisão.

## Estado em 31/10/2026

Implementado e validado **localmente**, com o SDK oficial e respostas simuladas do Storage. Ainda não ativado no endereço externo: faltam a chave secreta no servidor, preparação dos buckets, nova publicação de testes e verificação real de envio/leitura. Consulta somente de metadados ao Supabase confirmou zero buckets e zero políticas em `storage.objects`. Nenhum bucket, política, migração, conta ou conteúdo externo foi alterado nesta etapa.

Para quem está começando: a Vercel executa o aplicativo; o PostgreSQL guarda registros; o Storage guarda os arquivos. A ficha do vídeo guarda uma referência como `storage://tatame-tecnicas/...`, em vez de guardar o vídeo inteiro no banco. Essa referência não é um link público e não permite abrir o arquivo diretamente.

## Buckets e limites

| Bucket | Acesso | Arquivos | Limite por arquivo |
| --- | --- | --- | --- |
| `tatame-fotos` | Privado | JPEG normalizado pelo editor de foto | 130.000 bytes |
| `tatame-tecnicas` | Privado | MP4 | 50 MiB |

Os nomes, tipos e limites são definidos no servidor. O professor não precisa escolher caminhos, nomes de objetos ou permissões. A preparação é explícita e só administrativa: **Técnicas da semana → Armazenamento de fotos e vídeos → Preparar armazenamento**. Repetir não duplica buckets. Se já existir um bucket público ou com restrições diferentes, a API recusa; não altera permissões silenciosamente.

## Ativação na homologação

1. No projeto Supabase `tatame-homologacao`, abrir **Settings → API Keys**. Usar uma **Secret API key** com prefixo `sb_secret_`. Não usar Publishable/anon, senha do banco ou chave legada `service_role`. Não enviar a chave no chat, em capturas ou no Git.
2. Na Vercel, projeto `tatame-homologacao`, **Settings → Environment Variables**, cadastrar somente para **Preview**:
   - `SUPABASE_URL`: `https://fnjcfpztsvnbvrkdbdsj.supabase.co`, tipo Config.
   - `SUPABASE_SECRET_KEY`: valor da chave secreta, tipo **Secret**.
3. Não usar prefixo `VITE_`. Não substituir `DATABASE_URL`. Cadastrar as duas variáveis antes de publicar esta integração; configuração parcial é recusada na inicialização.
4. Publicar nova Preview com o código revisado. O link atual de testes ainda executa a versão anterior. A exceção de login da Vercel pertence apenas ao deployment anterior; não presumir que uma nova Preview herda a liberação.
5. Entrar como professor, preparar o armazenamento e conferir no Supabase que os dois buckets são privados e têm os limites acima. Não acrescentar políticas públicas de leitura/escrita a `storage.objects`; o acesso passa pelo backend com autenticação própria do Tatame.
6. Validar upload de foto e de MP4 fictício; conferir que não abrem pela URL pública. Testar aluno sem acesso, com acesso e após revogação, além de responsável vinculado. Só então declarar a integração validada externamente.

Para desenvolvimento local, as mesmas duas variáveis podem ficar em um `.env` privado ignorado. Sem ambas, as fotos continuam no formato anterior e links externos continuam funcionando; envio de vídeos privados não é disponibilizado. Após haver referências privadas no banco, a configuração do Storage deve ser mantida para conseguir ler esses arquivos.

## Fluxos e decisões

### Fotos

O navegador mantém o recorte quadrado e a conversão JPEG já existentes. A API valida a imagem e grava o arquivo no bucket usando dois UUIDs: dono e arquivo. Salva somente a referência em `FotoPerfil.imagem`. As rotas existentes continuam devolvendo a foto autenticada; ranking/chamada não recebem a chave nem acesso público ao bucket. A leitura valida o dono antes de consultar o Storage.

Fotos antigas em base64 continuam legíveis. Não houve conversão em massa. Na próxima substituição com Storage configurado, a nova foto vai ao bucket. Se o upload ou a gravação da ficha falhar, a foto anterior é preservada; um upload novo sem ficha é removido por compensação. A substituição/remoção tenta limpar o objeto antigo, sem remover fotos de outros alunos.

### Vídeos

1. Professor escolhe arquivo MP4 no editor; YouTube e Vimeo continuam como alternativa.
2. A API, após validar sessão e perfil administrativo, gera uma autorização de upload para um caminho aleatório, sem sobrescrita. O vídeo vai diretamente do navegador ao Supabase: os50 MiB não atravessam o corpo da requisição da função Vercel.
3. Um comprovante HMAC liga caminho, usuário, tamanho e validade de2h. Antes de salvar o cadastro, a API valida esse comprovante, os metadados do arquivo e o cabeçalho `ftyp`. Lê somente o começo do vídeo, não o arquivo inteiro. O comprovante não é persistido no catálogo.
4. Aluno/responsável só recebe URL de leitura depois de verificar sessão, vínculo, biblioteca ativa, liberação vigente, publicação e data. O catálogo não revela referências nem URLs privadas.
5. O link de leitura dura600 segundos. Remover a liberação impede emitir novos links; um link já emitido pode continuar válido até expirar. O botão **Assistir técnica** pode ser usado novamente após atualizar os vídeos para obter outro link.

`FotoPerfil.imagem` e `VideoTecnica.url` já são campos de texto. A mudança de representação é documentada e compatível com os formatos anteriores; não exigiu alterar tabelas ou migrar os19 registros de migração existentes. O login continua sendo o do Tatame, sem migração para Supabase Auth.

## Arquivos principais

| Arquivo | Responsabilidade |
| --- | --- |
| `apps/api/src/modules/arquivos/storage.ts` | SDK servidor, configuração, buckets, fotos, comprovantes e URLs temporárias |
| `apps/api/src/modules/arquivos/routes.ts` | Estado da configuração e preparação administrativa |
| `apps/api/src/modules/equipe/fotos.ts` | Compatibilidade das fotos e integração com o repositório |
| `apps/api/src/modules/tecnicas/routes.ts` | Autorização de upload, cadastro e leitura dos vídeos |
| `apps/api/src/app.ts` | Composição e injeção do serviço para testes |
| `apps/web/src/pages/TecnicasPage.tsx` | Escolha link/arquivo, envio direto e mensagens de andamento |
| `apps/api/src/storage.test.ts` | Regressão de permissões, falhas do provedor e arquivos inválidos |
| `package.json` / `package-lock.json` | Cliente oficial fixado em `@supabase/supabase-js@2.118.0` |

## Verificações e limites

- Nova suíte completa: **284 testes passaram**, zero falhas. Build e typecheck passaram. Fotos/vídeos anteriores preservados nos testes.
- Seis testes novos usam o SDK oficial com HTTP simulado e SQLite em memória. Verificam buckets privados/idempotência, dono da foto, falha no upload, integridade do comprovante, tamanho/MIME/cabeçalho MP4, permissões e URL temporária.
- Primeira execução dentro do sandbox teve bloqueio de conexões locais (`EACCES`); repetida com portas locais liberadas. Corrigida uma fixture de tamanho cujo arquivo acidentalmente tinha o tamanho esperado; nenhuma regra foi relaxada.
- Prévia visual isolada em3354 confirmou seletor **Enviar arquivo privado**, campo MP4 e limite. Não é upload real nem comprovação de reprodução. Captura: `screenshots/storage-video-privado.png`.
- `npm audit --omit=dev` identificou quatro avisos em dependências preexistentes (`body-parser`, `fast-uri`, `qs`, `zod`); nenhum atribuído ao novo SDK. Correção dessas dependências é pendência separada, não executada automaticamente.
- Não há transcodificação, DRM, verificação completa dos codecs, player próprio ou garantia contra gravação de tela/cópia. Um link assinado pode ser repassado enquanto válido.
- Upload abandonado antes do cadastro, exclusão de aluno por cascata e falha na limpeza podem deixar objetos sem referência. Revisar manualmente objetos sem vínculo antes de apagar; não foi criada rotina automática de exclusão nem modificada a política de retenção.
- O plano gratuito e a cota de armazenamento/transferência limitam o volume de vídeos. Não houve contratação de plano, alteração de limite financeiro ou liberação de cobrança. Reavaliar hospedagem/transmissão antes de lançar uma biblioteca comercial com muitos vídeos.

## Defesa oral

**Por que não guardar vídeo no banco?** O banco organiza fichas e relacionamentos; o Storage serve arquivos. Guardamos na ficha apenas o endereço interno do arquivo.

**Por que privado?** Saber o caminho não deve conceder acesso ao conteúdo pago. O servidor confere a autorização e só depois cria um link curto.

**Por que a chave fica na API?** Ela tem privilégios elevados no projeto. Entregá-la ao navegador permitiria ignorar nossas regras. O aluno recebe somente uma autorização temporária para o arquivo permitido.

**Já está funcionando online?** Ainda não nesta etapa: código e testes locais aprovados, chave/buckets/publicação e ensaio real pendentes. Não confundir implementação com validação externa.

## Referências oficiais consultadas

- [Buckets públicos e privados](https://supabase.com/docs/guides/storage/buckets/fundamentals).
- [Uploads assinados com validade de2h](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl).
- [Leitura de arquivos e URLs temporárias](https://supabase.com/docs/guides/storage/serving/downloads).
- [Uso e limites de armazenamento](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size).
- [Changelog TLS de12/10/2026](https://supabase.com/changelog/cbc-tls-ciphers-deprecated), conferido antes da implementação; cliente Node24 sem redução da validação TLS.
