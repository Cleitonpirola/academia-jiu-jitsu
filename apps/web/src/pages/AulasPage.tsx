import { useState, type FormEvent } from 'react';
import { CalendarDays, Clock3, Plus, Search, Users, UserRound, ChevronLeft, ChevronRight, Ban, Eye, Check, Trash2 } from 'lucide-react';
import { DIAS_SEMANA, type AulaExtraInput, type AulaView } from '@tatame/shared';
import { useAcademia } from '../store';
import { Button, Empty, Field, FormError, Modal, Person } from '../components';
import { today, dateLabel, fold } from '../lib';

const weekday = (value: string) => { const date = new Date(value + 'T12:00:00Z'); return Number.isNaN(date.valueOf()) ? null : date.getUTCDay(); };
const dayOffset = (value: string, amount: number) => { const date = new Date(value + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + amount); return date.toISOString().slice(0, 10); };
const status = (aula: AulaView) => <span className={`badge aula-status-${aula.situacao}`}><i/>{aula.situacao === 'agendada' ? 'Agendada' : 'Cancelada'}</span>;

function ExtraForm({ date, onClose, onCreated }: { date: string; onClose: () => void; onCreated: (date: string) => void }) {
  const { turmas, mutate } = useAcademia();
  const [input, setInput] = useState<AulaExtraInput>({ titulo: '', professor: '', dataAula: date, horaInicio: '', horaFim: '', turmaId: null });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const change = (fields: Partial<AulaExtraInput>) => setInput(previous => ({ ...previous, ...fields }));
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await mutate('/aulas/extras', 'POST', input, 'Aula extra criada.'); onCreated(input.dataAula); onClose(); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <Modal title="Nova aula extra" description="Um encontro fora da grade, sem mudar os horários fixos." onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={save}><FormError message={error}/><fieldset className="turma-form-fields" disabled={busy}><div className="form-grid">
      <Field label="Título da aula" full><input required minLength={2} maxLength={120} placeholder="Ex.: Treino da tarde" value={input.titulo} onChange={event => change({ titulo: event.target.value })}/></Field>
      <Field label="Turma (opcional)" full><select value={input.turmaId ?? ''} onChange={event => {
        const turma = turmas.find(item => item.id === event.target.value);
        change({ turmaId: turma?.id ?? null, ...(!input.professor && turma ? { professor: turma.professor } : {}) });
      }}><option value="">Avulsa · sem turma</option>{turmas.filter(item => item.situacao === 'ativo').map(turma => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</select></Field>
      <Field label="Professor responsável" full><input required minLength={2} maxLength={120} value={input.professor} onChange={event => change({ professor: event.target.value })}/></Field>
      <Field label="Data da aula" full><input required type="date" min="1900-01-01" max="9999-12-31" value={input.dataAula} onChange={event => change({ dataAula: event.target.value })}/></Field>
      <Field label="Início"><input required type="time" value={input.horaInicio} onChange={event => change({ horaInicio: event.target.value })}/></Field>
      <Field label="Término"><input required type="time" value={input.horaFim} onChange={event => change({ horaFim: event.target.value })}/></Field>
    </div><p className="helper aula-form-note">Aula extra não gera cobrança adicional. Se escolher uma turma, a lista de alunos habituais ativos será guardada como previsão, sem marcar presença.</p></fieldset>
    <div className="form-actions"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Criar aula extra'}</Button></div></form>
  </Modal>;
}

function GradeForm({ date, onClose, onCreated }: { date: string; onClose: () => void; onCreated: (date: string) => void }) {
  const { turmas, aulas, mutate } = useAcademia();
  const [selectedDate, setSelectedDate] = useState(date);
  const [busy, setBusy] = useState(''); const [error, setError] = useState('');
  const rows = turmas.filter(turma => turma.situacao === 'ativo').flatMap(turma => turma.horarios.filter(horario => horario.diaSemana === weekday(selectedDate)).map(horario => ({ turma, horario })))
    .sort((a, b) => a.horario.horaInicio.localeCompare(b.horario.horaInicio) || a.turma.nome.localeCompare(b.turma.nome, 'pt-BR'));
  const create = async (horarioId: string) => {
    setBusy(horarioId); setError('');
    try { await mutate('/aulas/da-grade', 'POST', { horarioId, dataAula: selectedDate }, 'Aula da grade disponível na agenda.'); onCreated(selectedDate); onClose(); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(''); }
  };
  return <Modal title="Adicionar aula da grade" description="Escolha a data e um horário fixo. Cada clique cria somente aquele encontro." onClose={() => { if (!busy) onClose(); }}>
    <Field label="Data da aula da grade"><input type="date" required min="1900-01-01" max="9999-12-31" value={selectedDate} disabled={!!busy} onChange={event => setSelectedDate(event.target.value)}/></Field>
    <FormError message={error}/><p className="helper aula-form-note">{weekday(selectedDate) !== null ? DIAS_SEMANA[weekday(selectedDate)!] : 'Escolha uma data válida.'} · somente turmas ativas. Criar a aula preserva a grade e não registra presença.</p>
    <div className="aula-grade-options">{rows.length ? rows.map(({ turma, horario }) => {
      const existing = aulas.find(aula => aula.origemHorarioId === horario.id && aula.dataAula === selectedDate);
      return <div className="aula-grade-option" key={horario.id}><div><strong>{horario.horaInicio}–{horario.horaFim}</strong><h3>{turma.nome}</h3><p>{turma.professor}</p>{existing && <small>{existing.situacao === 'cancelada' ? 'Aula já criada e cancelada' : 'Aula já está na agenda'}</small>}</div>
        {existing ? <Button variant="secondary" disabled={!!busy} onClick={() => { onCreated(selectedDate); onClose(); }}><Check size={15}/>Ver na agenda</Button> : <Button disabled={!!busy || !selectedDate} aria-label={`Criar aula ${turma.nome} às ${horario.horaInicio}`} onClick={() => void create(horario.id)}>{busy === horario.id ? 'Criando…' : 'Criar aula'}</Button>}
      </div>;
    }) : <p className="helper">Não há horários de turmas ativas neste dia. Cadastre a grade em Turmas ou crie uma aula extra.</p>}</div>
    <div className="form-actions"><Button variant="secondary" disabled={!!busy} onClick={onClose}>Fechar</Button></div>
  </Modal>;
}

export function AulasPage() {
  const { aulas, turmas, mutate } = useAcademia();
  const [date, setDate] = useState(today); const [search, setSearch] = useState('');
  const [turmaId, setTurmaId] = useState(''); const [situation, setSituation] = useState('');
  const [form, setForm] = useState<'grade' | 'extra' | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null); const [cancel, setCancel] = useState<AulaView | null>(null);
  const [remove, setRemove] = useState<AulaView | null>(null);
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const dayRows = aulas.filter(aula => aula.dataAula === date);
  const rows = dayRows.filter(aula => fold(aula.titulo + ' ' + aula.professor + ' ' + (aula.turmaNome ?? '')).includes(fold(search)) && (!turmaId || (turmaId === 'avulsa' ? !aula.turmaNome : aula.turmaId === turmaId)) && (!situation || aula.situacao === situation));
  const detail = aulas.find(aula => aula.id === detailId);
  const scheduled = dayRows.filter(aula => aula.situacao === 'agendada').length;
  const extras = dayRows.filter(aula => aula.origem === 'extra' && aula.situacao === 'agendada').length;
  const cancelled = dayRows.filter(aula => aula.situacao === 'cancelada').length;
  const created = (value: string) => { setDate(value); setSearch(''); setTurmaId(''); setSituation(''); };
  const openCancel = (aula: AulaView) => { setDetailId(null); setCancel(aula); setReason(''); setError(''); };
  const openRemove = (aula: AulaView) => { setDetailId(null); setRemove(aula); setError(''); };
  const cancelAula = async (event: FormEvent) => {
    event.preventDefault(); if (!cancel) return; setBusy(true); setError('');
    try { await mutate('/aulas/' + cancel.id + '/cancelamento', 'PATCH', { motivo: reason }, 'Aula cancelada. O histórico foi preservado.'); setCancel(null); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  const deleteExtra = async () => {
    if (!remove) return; setBusy(true); setError('');
    try { await mutate('/aulas/' + remove.id, 'DELETE', undefined, 'Aula extra excluída. Os demais registros foram preservados.'); setRemove(null); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <>
    <div className="page-heading"><div><div className="eyebrow">CADA ENCONTRO IMPORTA</div><h1>Aulas<span className="heading-dot">.</span></h1><p>Os treinos do dia, dentro e fora da grade.</p></div><div className="aula-heading-actions"><Button variant="secondary" onClick={() => setForm('grade')}><CalendarDays size={17}/>Da grade fixa</Button><Button onClick={() => setForm('extra')}><Plus size={17}/>Aula extra</Button></div></div>
    <div className="turma-summary"><div className="card"><CalendarDays size={21}/><div><strong>{scheduled}</strong><span>{scheduled === 1 ? 'aula agendada' : 'aulas agendadas'} no dia</span></div></div><div className="card"><Clock3 size={21}/><div><strong>{extras}</strong><span>{extras === 1 ? 'extra agendada' : 'extras agendadas'} no dia</span></div></div><div className="card"><Ban size={21}/><div><strong>{cancelled}</strong><span>{cancelled === 1 ? 'aula cancelada' : 'aulas canceladas'} no dia</span></div></div></div>
    <section className="card aula-toolbar"><div className="aula-date-controls"><div className="aula-day-picker"><button aria-label="Dia anterior" disabled={date <= '1900-01-01'} onClick={() => setDate(dayOffset(date, -1))}><ChevronLeft size={18}/></button><input type="date" aria-label="Data da agenda" min="1900-01-01" max="9999-12-31" value={date} onChange={event => { if (event.target.value && weekday(event.target.value) !== null) setDate(event.target.value); }}/><button aria-label="Próximo dia" disabled={date >= '9999-12-31'} onClick={() => setDate(dayOffset(date, 1))}><ChevronRight size={18}/></button></div><Button variant="ghost" onClick={() => setDate(today())}>Hoje</Button><span>{DIAS_SEMANA[weekday(date)!]}</span></div>
      <div className="toolbar"><div className="search"><Search size={18}/><input aria-label="Buscar aula ou professor" placeholder="Buscar aula, turma ou professor…" value={search} onChange={event => setSearch(event.target.value)}/></div><div className="filters"><select aria-label="Filtrar aulas por turma" value={turmaId} onChange={event => setTurmaId(event.target.value)}><option value="">Todas as turmas</option><option value="avulsa">Avulsas · sem turma</option>{turmas.map(turma => <option key={turma.id} value={turma.id}>{turma.nome}{turma.situacao === 'inativo' ? ' · Inativa' : ''}</option>)}</select><select aria-label="Filtrar aulas por situação" value={situation} onChange={event => setSituation(event.target.value)}><option value="">Todas as situações</option><option value="agendada">Agendadas</option><option value="cancelada">Canceladas</option></select></div></div>
    </section>
    <p className="aula-scope-note">Criar uma aula não marca presenças nem gera cobranças. A chamada por aula será a próxima entrega.</p>
    <div className="aulas-list">{!rows.length ? <section className="card"><Empty title={dayRows.length ? 'Nenhuma aula corresponde aos filtros' : 'Sua agenda está livre neste dia'} description={dayRows.length ? 'Ajuste a busca, a turma ou a situação.' : 'Adicione um encontro da grade fixa ou crie uma aula extra.'}/></section> : rows.map(aula => <article className={`card aula-card ${aula.situacao === 'cancelada' ? 'is-cancelled' : ''}`} key={aula.id}>
      <div className="aula-time"><Clock3 size={18}/><strong>{aula.horaInicio}</strong><span>até {aula.horaFim}</span><small>{dateLabel(aula.dataAula)}</small></div><div className="aula-info"><div className="aula-tags"><span className={`aula-origin aula-origin-${aula.origem}`}>{aula.origem === 'grade' ? 'Grade fixa' : 'Aula extra'}</span>{status(aula)}</div><h2>{aula.titulo}</h2><p><UserRound size={14}/>{aula.professor}</p><p><Users size={14}/>{aula.alunosPrevistos.length} {aula.alunosPrevistos.length === 1 ? 'aluno previsto' : 'alunos previstos'}<span>·</span>{aula.turmaNome ? aula.turmaNome + (!aula.turmaId ? ' · turma excluída' : '') : 'Avulsa · sem turma'}</p>{aula.motivoCancelamento && <p className="aula-cancel-note">{aula.motivoCancelamento}</p>}</div>
      <div className="aula-card-actions"><Button variant="secondary" onClick={() => setDetailId(aula.id)}><Eye size={15}/>Detalhes</Button>{aula.situacao === 'agendada' && <Button variant="ghost" onClick={() => openCancel(aula)}><Ban size={15}/>Cancelar aula</Button>}{aula.origem === 'extra' && <Button variant="ghost" className="aula-delete" aria-label={`Excluir aula extra ${aula.titulo}`} onClick={() => openRemove(aula)}><Trash2 size={15}/>Excluir</Button>}</div>
    </article>)}</div>
    {form === 'extra' && <ExtraForm date={date} onClose={() => setForm(null)} onCreated={created}/>}
    {form === 'grade' && <GradeForm date={date} onClose={() => setForm(null)} onCreated={created}/>}
    {detail && <Modal title={detail.titulo} description={`${dateLabel(detail.dataAula)} · ${detail.horaInicio}–${detail.horaFim}`} onClose={() => setDetailId(null)}>
      <div className="aula-tags"><span className={`aula-origin aula-origin-${detail.origem}`}>{detail.origem === 'grade' ? 'Grade fixa' : 'Aula extra'}</span>{status(detail)}</div><p className="turma-professor"><UserRound size={15}/>{detail.professor}</p><p className="helper aula-form-note">{detail.turmaNome ? detail.turmaNome + (detail.turmaId ? '' : ' · turma excluída; dados da aula preservados') : 'Aula avulsa, sem turma vinculada.'}</p>
      {detail.motivoCancelamento && <div className="aula-cancel-detail"><strong>Motivo do cancelamento</strong><p>{detail.motivoCancelamento}</p></div>}
      <h3 className="turma-detail-label">Alunos previstos · {detail.alunosPrevistos.length}</h3><p className="helper">Lista guardada ao criar a aula. Não representa presenças ou faltas e não impede a participação de outros alunos na futura chamada.</p><div className="turma-student-list">{detail.alunosPrevistos.length ? detail.alunosPrevistos.map(aluno => <div className="turma-detail-student" key={aluno.id}><Person name={aluno.nome} secondary={aluno.alunoId ? 'Previsto na criação da aula' : 'Cadastro excluído · nome histórico'}/></div>) : <p className="helper aula-form-note">Nenhum aluno previsto. A aula pode ser realizada mesmo sem vínculos habituais.</p>}</div>
      <div className="form-actions aula-detail-actions">{detail.origem === 'extra' && <Button variant="danger" onClick={() => openRemove(detail)}><Trash2 size={15}/>Excluir aula extra</Button>}{detail.situacao === 'agendada' && <Button variant="secondary" onClick={() => openCancel(detail)}><Ban size={15}/>Cancelar aula</Button>}<Button variant="secondary" onClick={() => setDetailId(null)}>Fechar</Button></div>
    </Modal>}
    {cancel && <Modal title="Cancelar aula" description={`${cancel.titulo} · ${dateLabel(cancel.dataAula)} · ${cancel.horaInicio}`} onClose={() => { if (!busy) setCancel(null); }}><form onSubmit={cancelAula}><p className="helper">A aula ficará cancelada na agenda, com o motivo e seus dados preservados. Isso não altera a grade da turma nem gera faltas ou cobranças. Para corrigir um encontro, cancele e crie uma nova aula extra.</p><FormError message={error}/><Field label="Motivo do cancelamento"><textarea required minLength={3} maxLength={300} rows={3} value={reason} disabled={busy} onChange={event => setReason(event.target.value)}/></Field><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={() => setCancel(null)}>Voltar</Button><Button type="submit" variant="danger" disabled={busy}>{busy ? 'Cancelando…' : 'Confirmar cancelamento'}</Button></div></form></Modal>}
    {remove && <Modal title="Excluir aula extra definitivamente" description={`${remove.titulo} · ${dateLabel(remove.dataAula)} · ${remove.horaInicio}`} onClose={() => { if (!busy) setRemove(null); }}>
      <p className="confirm-text">Deseja excluir definitivamente a aula extra <strong>{remove.titulo}</strong>?</p><p className="helper">A aula e sua lista de alunos previstos serão removidas. Os cadastros dos alunos, a turma, a grade, as mensalidades, as presenças existentes e as demais aulas serão preservados.</p><p className="helper">Esta ação não pode ser desfeita. Para preservar o histórico deste encontro, mantenha a aula na agenda e use o cancelamento.</p><FormError message={error}/><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={() => setRemove(null)}>Voltar</Button><Button variant="danger" disabled={busy} onClick={() => void deleteExtra()}>{busy ? 'Excluindo…' : 'Excluir definitivamente'}</Button></div>
    </Modal>}
  </>;
}
