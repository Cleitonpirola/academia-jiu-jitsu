import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import type { AulaView } from '@tatame/shared';
import { Button, Field, FormError, Modal } from '../components';
import { useAcademia } from '../store';
import { dateLabel } from '../lib';

export function ProfessoresAula({ aula, onClose }: { aula: AulaView; onClose: () => void }) {
  const { mutate } = useAcademia();
  const [nomes, setNomes] = useState(aula.professores ?? [aula.professor]);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { await mutate(`/aulas/${aula.id}/professores`, 'PATCH', { professores: nomes.map(nome => nome.trim()) }, 'Professores da aula atualizados.'); onClose(); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <Modal title="Professores da aula" description={`${aula.titulo} · ${dateLabel(aula.dataAula)} · ${aula.horaInicio}`} onClose={() => { if (!busy) onClose(); }}><form onSubmit={save}>
    <p className="helper aula-form-note">Adicione os professores que conduzirão este encontro. Isso não altera o professor da turma nem as outras aulas.</p><FormError message={error}/>
    <div className="professores-aula-list">{nomes.map((nome, index) => <div className="professor-aula-row" key={index}><Field label={`Professor ${index + 1}`}><input required minLength={2} maxLength={120} value={nome} disabled={busy} placeholder="Nome do professor" onChange={event => setNomes(values => values.map((value, i) => i === index ? event.target.value : value))}/></Field>{nomes.length > 1 && <button type="button" className="icon-btn" aria-label={`Remover professor ${index + 1}`} disabled={busy} onClick={() => setNomes(values => values.filter((_, i) => i !== index))}><X size={17}/></button>}</div>)}</div>
    <Button variant="secondary" disabled={busy || nomes.length >= 8} onClick={() => setNomes(values => [...values, ''])}><Plus size={16}/>Adicionar professor</Button>
    <div className="form-actions"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar professores'}</Button></div>
  </form></Modal>;
}
