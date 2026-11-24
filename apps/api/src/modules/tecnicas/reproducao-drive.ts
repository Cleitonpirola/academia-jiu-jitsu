import type { Request, Response as RespostaExpress } from 'express';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { VideosDrive } from './drive.js';
import { HttpError } from '../../http-error.js';

const limiteParte = 4 * 1024 * 1024;

function interpretarIntervalo(range: string, tamanho: number) {
  const partes = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!partes || (!partes[1] && !partes[2])) return null;
  const primeiro = Number(partes[1]), ultimo = Number(partes[2]);
  const inicio = partes[1] ? primeiro : Math.max(0, tamanho - ultimo);
  const fimSolicitado = partes[1] && partes[2] ? ultimo : tamanho - 1;
  if (!Number.isSafeInteger(primeiro) || !Number.isSafeInteger(ultimo) || inicio >= tamanho || fimSolicitado < inicio) return null;
  return { inicio, fim: Math.min(tamanho - 1, fimSolicitado, inicio + limiteParte - 1) };
}

export async function reproduzirDrive(req: Request, res: RespostaExpress, drive: VideosDrive, id: string) {
  const { tamanho } = await drive.verificarArquivo(id);
  res.set('Accept-Ranges', 'bytes');
  if (req.method === 'HEAD') {
    res.set({ 'Content-Type': 'video/mp4', 'Content-Length': String(tamanho) }).end();
    return;
  }

  const range = req.get('Range');
  const parte = range ? interpretarIntervalo(range, tamanho) : null;
  if (range && !parte) {
    res.set('Content-Range', `bytes */${tamanho}`).sendStatus(416);
    return;
  }

  const controller = new AbortController();
  const desconectar = () => controller.abort();
  res.once('close', desconectar);
  try {
    const intervalo = parte ? `bytes=${parte.inicio}-${parte.fim}` : null;
    const conteudo = await drive.abrirArquivo(id, intervalo, AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]));
    const esperado = parte ? `bytes ${parte.inicio}-${parte.fim}/${tamanho}` : null;
    if (!conteudo.body || conteudo.status !== (parte ? 206 : 200) ||
        (esperado && conteudo.headers.get('Content-Range') !== esperado)) {
      await conteudo.body?.cancel();
      throw new HttpError(502, 'O Google Drive não retornou o trecho solicitado.');
    }
    res.type('video/mp4');
    if (parte && esperado) {
      res.status(206).set({ 'Content-Range': esperado, 'Content-Length': String(parte.fim - parte.inicio + 1) });
    }
    await pipeline(Readable.fromWeb(conteudo.body as import('node:stream/web').ReadableStream), res);
  } catch (error) {
    if (!controller.signal.aborted) throw error;
  } finally {
    res.off('close', desconectar);
  }
}
