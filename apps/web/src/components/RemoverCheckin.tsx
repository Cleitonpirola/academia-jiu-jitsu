import { useState } from 'react';
import { UserMinus } from 'lucide-react';
import { Button, FormError, Modal } from '../components';
import { useAcademia } from '../store';

export function RemoverCheckin({ aulaId, alunoId, nome, disabled = false }: { aulaId: string; alunoId: string; nome: string; disabled?: boolean }) {
  const { mutate } = useAcademia();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const remove = async () => {
    if (busy) return; setBusy(true); setError('');
    try { await mutate(`/aulas/${aulaId}/checkins/${alunoId}`, 'DELETE', undefined, 'Check-in removido e ausência registrada.'); setOpen(false); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <><Button variant="ghost" disabled={disabled} aria-label={`Remover check-in de ${nome}`} onClick={() => { setError(''); setOpen(true); }}><UserMinus size={15}/>Remover check-in</Button>
    {open && <Modal title="Remover check-in" onClose={() => { if (!busy) setOpen(false); }}><p className="confirm-text">Remover o check-in de <strong>{nome}</strong> por não comparecimento?</p><p className="helper">O aluno ficará como ausente na chamada e sairá dos confirmados. O crédito do plano será recalculado. Cobranças de aulas adicionais já contratadas serão mantidas. Para corrigir depois, o professor poderá ajustar a chamada.</p><FormError message={error}/><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Voltar</Button><Button variant="danger" disabled={busy} onClick={() => void remove()}>{busy ? 'Removendo…' : 'Confirmar remoção'}</Button></div></Modal>}
  </>;
}
