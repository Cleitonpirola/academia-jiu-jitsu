import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComunicadoAlunoView } from '@tatame/shared';
import { api } from './lib';

export function useComunicados(base: string, habilitado = true) {
  const [estado, setEstado] = useState<{ base: string; rows: ComunicadoAlunoView[]; error: string; loaded: boolean }>({ base, rows: [], error: '', loaded: false });
  const [busy, setBusy] = useState(false);
  const leitura = useRef(0);
  const confirmando = useRef(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    const versao = ++leitura.current;
    try {
      const timeout = AbortSignal.timeout(15000);
      const rows = await api<ComunicadoAlunoView[]>(base + '/comunicados', { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
      if (!signal?.aborted && versao === leitura.current) {
        setEstado({ base, rows: rows.filter(row => row.tipo === 'aviso'), error: '', loaded: true });
      }
    } catch (error) {
      if (!signal?.aborted && versao === leitura.current) {
        setEstado(current => ({ base, rows: current.base === base ? current.rows : [], error: (error as Error).message, loaded: current.base === base && current.loaded }));
      }
    }
  }, [base]);

  useEffect(() => {
    if (!habilitado) return;
    const controller = new AbortController();
    void load(controller.signal);
    const refresh = () => { if (!document.hidden) void load(controller.signal); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      controller.abort();
      leitura.current++;
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [habilitado, load]);

  const confirmar = async (id: string) => {
    if (confirmando.current) return;
    confirmando.current = true;
    setBusy(true);
    leitura.current++;
    try {
      const comunicado = await api<ComunicadoAlunoView>(base + `/comunicados/${id}/resposta`, {
        method: 'PUT', body: JSON.stringify({ resposta: 'ciente' }),
      });
      leitura.current++;
      setEstado(current => current.base === base
        ? { ...current, error: '', rows: current.rows.map(row => row.id === id ? comunicado : row) }
        : current);
    } catch (error) {
      setEstado(current => current.base === base ? { ...current, error: (error as Error).message } : current);
    } finally {
      confirmando.current = false;
      setBusy(false);
    }
  };

  const rows = estado.base === base ? estado.rows : [];
  const error = estado.base === base ? estado.error : '';
  const loaded = estado.base === base && estado.loaded;
  return { rows, error, busy, loaded, load, confirmar };
}

export type CaixaComunicados = ReturnType<typeof useComunicados>;
