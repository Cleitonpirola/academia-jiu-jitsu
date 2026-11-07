import { useState } from 'react';
import { Button, FormError, Modal } from '../components';
import { api } from '../lib';

export function ExcluirComunicado({ titulo, path, equipe = false, onExcluded }: {
  titulo: string;
  path: string;
  equipe?: boolean;
  onExcluded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function excluir() {
    setBusy(true);
    setError('');
    try {
      await api(path, { method: 'DELETE' });
      setOpen(false);
      onExcluded();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <Button variant="secondary" aria-label={`Excluir comunicado ${titulo}`} onClick={() => { setError(''); setOpen(true); }}>Excluir</Button>
    {open && <Modal title="Excluir comunicado" onClose={() => { if (!busy) setOpen(false); }}>
      <p className="confirm-text">Excluir <strong>{titulo}</strong>?</p>
      <p className="helper">{equipe ? 'O comunicado será removido da caixa de entrada de todos os destinatários.' : 'O comunicado será removido da caixa de entrada deste aluno ou responsável.'}</p>
      <FormError message={error}/>
      <div className="form-actions">
        <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button>
        <Button variant="danger" disabled={busy} onClick={() => void excluir()}>{busy ? 'Excluindo…' : 'Excluir comunicado'}</Button>
      </div>
    </Modal>}
  </>;
}
