import { createPrivateKey, sign } from 'node:crypto';
import { z } from 'zod';
import { HttpError } from '../../http-error.js';

const idDrive = /^[A-Za-z0-9_-]{10,150}$/;
const endpointToken = 'https://oauth2.googleapis.com/token';
const escopoDrive = 'https://www.googleapis.com/auth/drive.readonly';
const contaSchema = z.object({ client_email: z.email(), private_key: z.string().min(1) });

export function idDoVideoDrive(referencia: string): string | null {
  const id = referencia.startsWith('drive://') ? referencia.slice('drive://'.length) : '';
  return idDrive.test(id) ? id : null;
}

export function normalizarLinkDrive(url: URL): string | null {
  if (url.hostname !== 'drive.google.com') return null;
  const caminhoArquivo = /^\/file\/d\/([^/]+)(?:\/(?:view|preview|edit))?\/?$/.exec(url.pathname);
  const id = caminhoArquivo?.[1] ?? (url.pathname === '/open' ? url.searchParams.get('id') : null);
  if (!id || !idDrive.test(id)) throw new Error('Informe o link de um arquivo de vídeo do Google Drive.');
  return 'drive://' + id;
}

export interface VideosDrive {
  verificarArquivo(id: string): Promise<{ tamanho: number }>;
  abrirArquivo(id: string, intervalo: string | null, signal: AbortSignal): Promise<Response>;
}

export function exigirVideosDrive(drive: VideosDrive | undefined) {
  if (!drive) throw new HttpError(503, 'O Google Drive ainda não está configurado no servidor.');
  return drive;
}

export function configurarVideosDrive(env: NodeJS.ProcessEnv, buscar = fetch): VideosDrive | undefined {
  if (!env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON || !env.GOOGLE_DRIVE_FOLDER_ID) return undefined;
  const pasta = env.GOOGLE_DRIVE_FOLDER_ID.trim();
  let conta: z.infer<typeof contaSchema>, chave: ReturnType<typeof createPrivateKey>;
  try {
    if (!idDrive.test(pasta)) throw new Error('ID inválido.');
    conta = contaSchema.parse(JSON.parse(env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON));
    chave = createPrivateKey(conta.private_key);
  } catch {
    throw new Error('Configuração inválida da conta de serviço ou pasta do Google Drive.');
  }

  let token: { valor: string; expiraEm: number } | undefined;
  let renovacao: Promise<string> | undefined;
  async function renovarToken() {
    const agora = Math.floor(Date.now() / 1000);
    const base64 = (objeto: object) => Buffer.from(JSON.stringify(objeto)).toString('base64url');
    const cabecalho = base64({ alg: 'RS256', typ: 'JWT' });
    const dados = base64({ iss: conta.client_email, scope: escopoDrive, aud: endpointToken, iat: agora, exp: agora + 3600 });
    const corpo = `${cabecalho}.${dados}`;
    const assinatura = sign('RSA-SHA256', Buffer.from(corpo), chave).toString('base64url');
    const resposta = await buscar(endpointToken, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${corpo}.${assinatura}` }),
    });
    if (!resposta.ok) throw new HttpError(502, 'Não foi possível autorizar o acesso ao Google Drive.');
    const dadosToken = z.object({ access_token: z.string().min(1), expires_in: z.number().positive() }).safeParse(await resposta.json());
    if (!dadosToken.success) throw new HttpError(502, 'O Google Drive respondeu com uma autorização inválida.');
    token = { valor: dadosToken.data.access_token, expiraEm: agora + dadosToken.data.expires_in };
    return token.valor;
  }

  async function obterToken() {
    if (token && token.expiraEm > Date.now() / 1000 + 60) return token.valor;
    renovacao ??= renovarToken().finally(() => { renovacao = undefined; });
    return renovacao;
  }

  async function buscarArquivo(id: string, consulta: string, intervalo: string | null, signal: AbortSignal) {
    if (!idDrive.test(id)) throw new HttpError(404, 'Arquivo de vídeo inválido.');
    let resposta: Response;
    try {
      const headers: Record<string, string> = { Authorization: 'Bearer ' + await obterToken() };
      if (intervalo) headers.Range = intervalo;
      resposta = await buscar(`https://www.googleapis.com/drive/v3/files/${id}?supportsAllDrives=true&${consulta}`, { headers, signal, redirect: 'error' });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(502, 'Não foi possível acessar o arquivo no Google Drive. Tente novamente.');
    }
    if (resposta.ok) return resposta;
    await resposta.body?.cancel();
    if (resposta.status === 401) token = undefined;
    if (resposta.status === 403 || resposta.status === 404) throw new HttpError(404, 'Arquivo indisponível no Google Drive. Confira o acesso da conta de serviço.');
    throw new HttpError(502, 'O Google Drive não pôde fornecer o arquivo.');
  }

  return {
    async verificarArquivo(id) {
      const resposta = await buscarArquivo(id, 'fields=mimeType,size,parents,trashed,capabilities(canDownload)', null, AbortSignal.timeout(10000));
      const dados = z.object({ mimeType: z.literal('video/mp4'), size: z.string().regex(/^\d+$/), parents: z.array(z.string()), trashed: z.literal(false), capabilities: z.object({ canDownload: z.literal(true) }) }).safeParse(await resposta.json());
      const tamanho = dados.success ? Number(dados.data.size) : 0;
      if (!dados.success || !dados.data.parents.includes(pasta) || !Number.isSafeInteger(tamanho) || tamanho < 1) {
        throw new HttpError(400, 'Use um vídeo MP4 na pasta privada de vídeos do Tatame.');
      }
      return { tamanho };
    },
    abrirArquivo(id, intervalo, signal) { return buscarArquivo(id, 'alt=media', intervalo, signal); },
  };
}
