import { useState, type FormEvent } from 'react';
import { CalendarDays, CalendarCheck, Clock3, Search, Users, UserRound, ChevronLeft, ChevronRight, Ban, Eye, Check, Pencil } from 'lucide-react';
import { DIAS_SEMANA, type AulaView } from '@tatame/shared';
import { useAcademia } from '../store';
import { Button, Empty, Field, FormError, Modal, Person } from '../components';
import { today, dateLabel, fold } from '../lib';
import { ChamadaAula } from '../components/ChamadaAula';
import { RemoverCheckin } from '../components/RemoverCheckin';
import { confirmadosAula } from '../participantes-aula';
import { ProfessoresAula } from '../components/ProfessoresAula';

const weekday = (value: string) => { const date = new Date(value + 'T12:00:00Z'); return Number.isNaN(date.valueOf()) ? null : date.getUTCDay(); };
const dayOffset = (value: string, amount: number) => { const date = new Date(value + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + amount); return date.toISOString().slice(0, 10); };
const status = (aula: AulaView) => <span className={`badge aula-status-${aula.situacao}`}><i/>{aula.situacao === 'agendada' ? 'Agendada' : 'Cancelada'}</span>;

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
    }) : <p className="helper">Não há horários de turmas ativas neste dia. Cadastre os horários em Turmas.</p>}</div>
    <div className="form-actions"><Button variant="secondary" disabled={!!busy} onClick={onClose}>Fechar</Button></div>
  </Modal>;
}

function NomeAulaForm({ aula, onClose, onSaved }: { aula: AulaView; onClose: () => void; onSaved: () => void }) {
  const { mutate } = useAcademia();
  const [titulo, setTitulo] = useState(aula.titulo);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { await mutate('/aulas/' + aula.id + '/nome', 'PATCH', { titulo: titulo.trim() }, 'Nome da aula atualizado.'); onSaved(); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <Modal title="Editar nome da aula" description={`${dateLabel(aula.dataAula)} · ${aula.horaInicio}–${aula.horaFim}`} onClose={() => { if (!busy) onClose(); }}><form onSubmit={save}>
    <p className="helper aula-form-note">O nome será alterado somente neste encontro. O nome da turma, os outros horários, as presenças e as cobranças serão preservados.</p>
    <FormError message={error}/><Field label="Nome da aula"><input autoFocus required minLength={2} maxLength={120} value={titulo} disabled={busy} onChange={event => setTitulo(event.target.value)}/></Field>
    <div className="form-actions"><Button variant="secondary" disabled={busy} onClick={onClose}>Voltar</Button><Button type="submit" disabled={busy || titulo.trim().length < 2}>{busy ? 'Salvando…' : 'Salvar nome'}</Button></div>
  </form></Modal>;
}

export function AulasPage() {
  const { aulas, turmas, mutate } = useAcademia();
  const [date, setDate] = useState(today); const [search, setSearch] = useState('');
  const [turmaId, setTurmaId] = useState(''); const [situation, setSituation] = useState('');
  const [form, setForm] = useState<'grade' | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null); const [cancel, setCancel] = useState<AulaView | null>(null);
  const [editName, setEditName] = useState<AulaView | null>(null);
  const [editProfessores, setEditProfessores] = useState<AulaView | null>(null);
  const [chamadaId, setChamadaId] = useState<string | null>(null);
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const dayRows = aulas.filter(aula => aula.dataAula === date);
  const rows = dayRows.filter(aula => fold(aula.titulo + ' ' + aula.professor + ' ' + (aula.turmaNome ?? '')).includes(fold(search)) && (!turmaId || aula.turmaId === turmaId) && (!situation || aula.situacao === situation));
  const detail = aulas.find(aula => aula.id === detailId);
  const confirmados = detail ? confirmadosAula(detail) : [];
  const chamada = aulas.find(aula => aula.id === chamadaId);
  const scheduled = dayRows.filter(aula => aula.situacao === 'agendada').length;
  const presentes = dayRows.reduce((total,aula)=>total+aula.chamada.filter(item=>item.presente).length,0);
  const cancelled = dayRows.filter(aula => aula.situacao === 'cancelada').length;
  const created = (value: string) => { setDate(value); setSearch(''); setTurmaId(''); setSituation(''); };
  const openCancel = (aula: AulaView) => { setDetailId(null); setCancel(aula); setReason(''); setError(''); };
  const cancelAula = async (event: FormEvent) => {
    event.preventDefault(); if (!cancel) return; setBusy(true); setError('');
    try { await mutate('/aulas/' + cancel.id + '/cancelamento', 'PATCH', { motivo: reason }, 'Aula cancelada. O histórico foi preservado.'); setCancel(null); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <>
    <div className="page-heading"><div><div className="eyebrow">CADA ENCONTRO IMPORTA</div><h1>Aulas<span className="heading-dot">.</span></h1><p>Publique os encontros a partir dos horários das turmas.</p></div><div className="aula-heading-actions"><Button variant="secondary" onClick={() => setForm('grade')}><CalendarDays size={17}/>Adicionar aula da turma</Button></div></div>
    <div className="turma-summary"><div className="card"><CalendarDays size={21}/><div><strong>{scheduled}</strong><span>{scheduled === 1 ? 'aula agendada' : 'aulas agendadas'} no dia</span></div></div><div className="card"><CalendarCheck size={21}/><div><strong>{presentes}</strong><span>presenças confirmadas no dia</span></div></div><div className="card"><Ban size={21}/><div><strong>{cancelled}</strong><span>{cancelled === 1 ? 'aula cancelada' : 'aulas canceladas'} no dia</span></div></div></div>
    <section className="card aula-toolbar"><div className="aula-date-controls"><div className="aula-day-picker"><button aria-label="Dia anterior" disabled={date <= '1900-01-01'} onClick={() => setDate(dayOffset(date, -1))}><ChevronLeft size={18}/></button><input type="date" aria-label="Data da agenda" min="1900-01-01" max="9999-12-31" value={date} onChange={event => { if (event.target.value && weekday(event.target.value) !== null) setDate(event.target.value); }}/><button aria-label="Próximo dia" disabled={date >= '9999-12-31'} onClick={() => setDate(dayOffset(date, 1))}><ChevronRight size={18}/></button></div><Button variant="ghost" onClick={() => setDate(today())}>Hoje</Button><span>{DIAS_SEMANA[weekday(date)!]}</span></div>
      <div className="toolbar"><div className="search"><Search size={18}/><input aria-label="Buscar aula ou professor" placeholder="Buscar aula, turma ou professor…" value={search} onChange={event => setSearch(event.target.value)}/></div><div className="filters"><select aria-label="Filtrar aulas por turma" value={turmaId} onChange={event => setTurmaId(event.target.value)}><option value="">Todas as turmas</option>{turmas.map(turma => <option key={turma.id} value={turma.id}>{turma.nome}{turma.situacao === 'inativo' ? ' · Inativa' : ''}</option>)}</select><select aria-label="Filtrar aulas por situação" value={situation} onChange={event => setSituation(event.target.value)}><option value="">Todas as situações</option><option value="agendada">Agendadas</option><option value="cancelada">Canceladas</option></select></div></div>
    </section>
    <p className="aula-scope-note">Abra a Chamada para registrar quem participou de cada horário. Criar uma aula não marca presenças nem gera cobranças.</p>
    <div className="aulas-list">{!rows.length ? <section className="card"><Empty title={dayRows.length ? 'Nenhuma aula corresponde aos filtros' : 'Sua agenda está livre neste dia'} description={dayRows.length ? 'Ajuste a busca, a turma ou a situação.' : 'Adicione uma aula dos horários cadastrados em Turmas.'}/></section> : rows.map(aula => <article className={`card aula-card ${aula.situacao === 'cancelada' ? 'is-cancelled' : ''}`} key={aula.id}>
      <div className="aula-time"><Clock3 size={18}/><strong>{aula.horaInicio}</strong><span>até {aula.horaFim}</span><small>{dateLabel(aula.dataAula)}</small></div><div className="aula-info"><div className="aula-tags"><span className={`aula-origin aula-origin-${aula.origem}`}>{aula.origem === 'grade' ? 'Grade da turma' : 'Registro anterior'}</span>{status(aula)}</div><div className="aula-title"><h2>{aula.titulo}</h2><button className="icon-btn" aria-label={`Editar nome da aula ${aula.titulo} às ${aula.horaInicio}`} title="Editar nome da aula" onClick={() => setEditName(aula)}><Pencil size={16}/></button></div><p><UserRound size={14}/>{aula.professor}</p><p><Users size={14}/>{confirmadosAula(aula).length} {confirmadosAula(aula).length === 1 ? 'aluno confirmado' : 'alunos confirmados'}<span>·</span>{aula.turmaNome ? aula.turmaNome + (!aula.turmaId ? ' · turma excluída' : '') : 'Registro anterior · sem turma'}</p>{aula.situacao === 'agendada' && aula.checkins.some(item => !aula.chamada.some(marcacao => marcacao.alunoId === item.alunoId)) && <p className="aula-checkin-pending">{aula.checkins.filter(item => !aula.chamada.some(marcacao => marcacao.alunoId === item.alunoId)).length} check-in(s) para validar</p>}{aula.motivoCancelamento && <p className="aula-cancel-note">{aula.motivoCancelamento}</p>}</div>
      <div className="aula-card-actions"><Button aria-label={`Abrir chamada de ${aula.titulo} às ${aula.horaInicio}`} onClick={() => setChamadaId(aula.id)}><CalendarCheck size={15}/>Chamada{aula.chamada.length > 0 ? ` · ${aula.chamada.filter(item => item.presente).length}` : ''}</Button><Button variant="secondary" onClick={() => setDetailId(aula.id)}><Eye size={15}/>Detalhes</Button>{aula.situacao === 'agendada' && <Button variant="ghost" disabled={aula.chamada.length > 0} title={aula.chamada.length ? 'A aula possui chamada. Corrija as marcações antes de cancelar.' : undefined} onClick={() => openCancel(aula)}><Ban size={15}/>Cancelar aula</Button>}</div>
    </article>)}</div>
    {form === 'grade' && <GradeForm date={date} onClose={() => setForm(null)} onCreated={created}/>}
    {chamada && <Modal wide title={`Chamada · ${chamada.titulo}`} description={`${dateLabel(chamada.dataAula)} · ${chamada.horaInicio}–${chamada.horaFim} · ${chamada.professor}`} onClose={() => setChamadaId(null)}><ChamadaAula key={chamada.id} aula={chamada}/><div className="form-actions"><Button variant="secondary" onClick={() => setChamadaId(null)}>Fechar chamada</Button></div></Modal>}
    {detail && <Modal title={detail.titulo} description={`${dateLabel(detail.dataAula)} · ${detail.horaInicio}–${detail.horaFim}`} onClose={() => setDetailId(null)}>
      <div className="aula-tags aula-form-note"><span className={`aula-origin aula-origin-${detail.origem}`}>{detail.origem === 'grade' ? 'Grade fixa' : 'Registro anterior'}</span>{status(detail)}</div><div className="aula-professores-heading"><p className="turma-professor"><UserRound size={15}/>{detail.professor}</p><Button variant="ghost" onClick={() => { setDetailId(null); setEditProfessores(detail); }}><Pencil size={14}/>Editar professores</Button></div><p className="helper aula-form-note">{detail.turmaNome ? detail.turmaNome + (detail.turmaId ? '' : ' · turma excluída; dados da aula preservados') : 'Registro anterior, sem turma vinculada.'}</p>
      {detail.motivoCancelamento && <div className="aula-cancel-detail"><strong>Motivo do cancelamento</strong><p>{detail.motivoCancelamento}</p></div>}
      <h3 className="turma-detail-label">Alunos confirmados · {confirmados.length}</h3><p className="helper">Quem fez check-in ou teve presença registrada pelo professor. O check-in ainda precisa de validação na chamada.</p><div className="turma-student-list">{confirmados.length ? confirmados.map(aluno => <div className="turma-detail-student aula-confirmado" key={aluno.alunoId}><Person name={aluno.nome} secondary={aluno.presente ? 'Presença confirmada' : 'Check-in · aguardando validação'}/>{aluno.temCheckin && <RemoverCheckin aulaId={detail.id} alunoId={aluno.alunoId} nome={aluno.nome} disabled={detail.situacao === 'cancelada' || detail.dataAula > today()}/>}</div>) : <p className="helper aula-form-note">Nenhum aluno confirmou participação nesta aula.</p>}</div>
      {detail.checkins.length > 0 && <p className="helper aula-form-note">Esta aula possui {detail.checkins.length} check-in(s). Cancelar preserva os avisos dos alunos.</p>}{detail.chamada.length > 0 && <p className="helper aula-form-note">Esta aula possui {detail.chamada.length} marcações de chamada. O cancelamento está bloqueado para preservar o histórico.</p>}
      <div className="form-actions aula-detail-actions"><Button onClick={() => { setDetailId(null); setChamadaId(detail.id); }}><CalendarCheck size={15}/>Abrir chamada</Button>{detail.situacao === 'agendada' && <Button variant="secondary" disabled={detail.chamada.length > 0} onClick={() => openCancel(detail)}><Ban size={15}/>Cancelar aula</Button>}<Button variant="secondary" onClick={() => setDetailId(null)}>Fechar</Button></div>
    </Modal>}
    {editName && <NomeAulaForm aula={editName} onClose={() => setEditName(null)} onSaved={() => setEditName(null)}/>}
    {editProfessores && <ProfessoresAula aula={editProfessores} onClose={() => { setDetailId(editProfessores.id); setEditProfessores(null); }}/>}
    {cancel && <Modal title="Cancelar aula" description={`${cancel.titulo} · ${dateLabel(cancel.dataAula)} · ${cancel.horaInicio}`} onClose={() => { if (!busy) setCancel(null); }}><form onSubmit={cancelAula}><p className="helper">A aula ficará cancelada na agenda, com o motivo e seus dados preservados. Isso não altera a grade da turma nem gera faltas ou cobranças. Para outro encontro, configure o horário na turma e publique a aula pela grade.</p><FormError message={error}/><Field label="Motivo do cancelamento"><textarea required minLength={3} maxLength={300} rows={3} value={reason} disabled={busy} onChange={event => setReason(event.target.value)}/></Field><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={() => setCancel(null)}>Voltar</Button><Button type="submit" variant="danger" disabled={busy}>{busy ? 'Cancelando…' : 'Confirmar cancelamento'}</Button></div></form></Modal>}
  </>;
}
