import { useState, type FormEvent } from 'react';
import { CalendarDays, Clock3, Plus, Search, Users, UserRound, Pencil, Power, Trash2, List, X } from 'lucide-react';
import { DIAS_SEMANA, type TurmaInput, type TurmaView } from '@tatame/shared';
import { useAcademia } from '../store';
import { Badge, Button, Empty, Field, FormError, Modal, Person } from '../components';
import { fold } from '../lib';
import { agruparHorarios, expandirHorarios, ORDEM_SEMANA, type HorarioAgrupado } from '../turma-horarios';

const week = ORDEM_SEMANA;
const shortDay = (day: number) => DIAS_SEMANA[day].replace('-feira', '');
const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function TurmaForm({ turma, onClose }: { turma?: TurmaView; onClose: () => void }) {
  const { alunos, mutate } = useAcademia();
  const [nome, setNome] = useState(turma?.nome ?? '');
  const [professor, setProfessor] = useState(turma?.professor ?? '');
  const [situacao, setSituacao] = useState<TurmaInput['situacao']>(turma?.situacao ?? 'ativo');
  const [horarios, setHorarios] = useState(() => agruparHorarios(turma?.horarios ?? [{ diaSemana: 1, horaInicio: '', horaFim: '' }])
    .map(item => ({ ...item, key: crypto.randomUUID(), intervalos: item.intervalos.map(intervalo => ({ ...intervalo, key: crypto.randomUUID() })) })));
  const [alunoIds, setAlunoIds] = useState(turma?.alunoIds ?? []);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const rows = alunos.filter(aluno => fold(aluno.nome).includes(fold(search)));
  const totalHorarios = horarios.reduce((total, item) => total + item.diasSemana.length * item.intervalos.length, 0);
  const changeDays = (key: string, diasSemana: number[]) => setHorarios(previous => previous.map(item => item.key === key ? { ...item, diasSemana } : item));
  const changeTime = (groupKey: string, timeKey: string, changes: Partial<HorarioAgrupado['intervalos'][number]>) => setHorarios(previous => previous.map(item => item.key === groupKey ? { ...item, intervalos: item.intervalos.map(intervalo => intervalo.key === timeKey ? { ...intervalo, ...changes } : intervalo) } : item));
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const input: TurmaInput = { nome, professor, situacao, alunoIds, horarios: expandirHorarios(horarios) };
      await mutate(turma ? '/turmas/' + turma.id : '/turmas', turma ? 'PUT' : 'POST', input, turma ? 'Turma atualizada.' : 'Turma cadastrada.');
      onClose();
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <Modal wide title={turma ? 'Editar turma' : 'Nova turma'} description="Organize os horários fixos e os alunos habituais." onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={save}><FormError message={error}/><fieldset className="turma-form-fields" disabled={busy}>
      <div className="form-grid">
        <Field label="Nome da turma" full><input required minLength={2} maxLength={120} placeholder="Ex.: Adulto · Noite" value={nome} onChange={event => setNome(event.target.value)}/></Field>
        <Field label="Professor responsável"><input required minLength={2} maxLength={120} placeholder="Nome do professor ou mestre" value={professor} onChange={event => setProfessor(event.target.value)}/></Field>
        <Field label="Situação da turma"><select value={situacao} onChange={event => setSituacao(event.target.value as TurmaInput['situacao'])}><option value="ativo">Ativa</option><option value="inativo">Inativa</option></select></Field>
      </div>
      <div className="turma-form-section"><h3>Grade fixa</h3><p>Combine os dias e todos os horários que eles têm em comum. Ex.: Seg/Qua/Sex, às 12h e às 18h, na mesma combinação.</p>
        <div className="turma-time-rows">{horarios.map((item, index) => <div className="turma-time-group" key={item.key}>
          <div className="turma-time-heading"><strong>Combinação {index + 1}</strong><button type="button" className="icon-btn" aria-label={`Remover combinação ${index + 1}`} disabled={horarios.length === 1} onClick={() => setHorarios(previous => previous.filter(row => row.key !== item.key))}><X size={17}/></button></div>
          <fieldset className="turma-weekdays"><legend>Dias da semana</legend>{week.map(day => <label key={day}><input type="checkbox" aria-label={`${DIAS_SEMANA[day]} da combinação ${index + 1}`} checked={item.diasSemana.includes(day)} disabled={!item.diasSemana.includes(day) && totalHorarios + item.intervalos.length > 100} onChange={event => changeDays(item.key, event.target.checked ? [...item.diasSemana, day] : item.diasSemana.filter(value => value !== day))}/><span>{dayLabels[day]}</span></label>)}</fieldset>
          <p className="helper turma-combination-note">Todos os horários abaixo valem para cada dia selecionado.</p>
          <div className="turma-intervals">{item.intervalos.map((intervalo, timeIndex) => <div className="turma-interval-row" key={intervalo.key}>
            <Field label="Início"><input required type="time" aria-label={`Início do horário ${timeIndex + 1} da combinação ${index + 1}`} value={intervalo.horaInicio} onChange={event => changeTime(item.key, intervalo.key, { horaInicio: event.target.value })}/></Field>
            <Field label="Término"><input required type="time" aria-label={`Término do horário ${timeIndex + 1} da combinação ${index + 1}`} value={intervalo.horaFim} onChange={event => changeTime(item.key, intervalo.key, { horaFim: event.target.value })}/></Field>
            <button type="button" className="icon-btn" aria-label={`Remover horário ${timeIndex + 1} da combinação ${index + 1}`} disabled={item.intervalos.length === 1} onClick={() => setHorarios(previous => previous.map(row => row.key === item.key ? { ...row, intervalos: row.intervalos.filter(value => value.key !== intervalo.key) } : row))}><X size={16}/></button>
          </div>)}</div>
          <Button variant="secondary" aria-label={`Adicionar horário à combinação ${index + 1}`} disabled={item.intervalos.length >= 100 || totalHorarios + item.diasSemana.length > 100} onClick={() => setHorarios(previous => previous.map(row => row.key === item.key ? { ...row, intervalos: [...row.intervalos, { key: crypto.randomUUID(), horaInicio: '', horaFim: '' }] } : row))}><Plus size={15}/>Adicionar horário</Button>
          <p className="helper turma-combination-note">{item.diasSemana.length} {item.diasSemana.length === 1 ? 'dia' : 'dias'} · {item.intervalos.length} {item.intervalos.length === 1 ? 'horário por dia' : 'horários por dia'}</p>
        </div>)}</div>
        <div className="turma-time-footer"><Button variant="ghost" disabled={horarios.length >= 100 || totalHorarios >= 100} onClick={() => setHorarios(previous => [...previous, { key: crypto.randomUUID(), diasSemana: [1], intervalos: [{ key: crypto.randomUUID(), horaInicio: '', horaFim: '' }] }])}><Plus size={15}/>Adicionar outra combinação</Button><span className="helper" role="status">{totalHorarios} {totalHorarios === 1 ? 'horário semanal selecionado' : 'horários semanais selecionados'}</span></div>
      </div>
      <div className="turma-form-section"><h3>Alunos habituais <span>{alunoIds.length} selecionados</span></h3><p>Este vínculo organiza a turma. Ele não registra presença nem limita a participação em outras aulas.</p>
        <div className="search turma-student-search"><Search size={16}/><input aria-label="Buscar aluno para vincular" placeholder="Buscar aluno…" value={search} onChange={event => setSearch(event.target.value)}/></div>
        <div className="turma-student-list">{rows.length ? rows.map(aluno => {
          const checked = alunoIds.includes(aluno.id);
          const unavailable = aluno.situacao === 'inativo' && !turma?.alunoIds.includes(aluno.id);
          return <label key={aluno.id} className={`turma-student-option ${unavailable ? 'is-unavailable' : ''}`}>
            <input type="checkbox" aria-label={`Vincular ${aluno.nome}`} checked={checked} disabled={unavailable || (!checked && alunoIds.length >= 500)} onChange={() => setAlunoIds(previous => checked ? previous.filter(id => id !== aluno.id) : [...previous, aluno.id])}/>
            <Person name={aluno.nome} secondary={aluno.situacao === 'inativo' ? 'Aluno inativo' : aluno.faixa}/>
          </label>;
        }) : <p className="helper">{alunos.length ? 'Nenhum aluno corresponde à busca.' : 'Cadastre alunos na área Alunos. Você pode salvar a turma sem vínculos.'}</p>}</div>
      </div>
    </fieldset><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar turma'}</Button></div></form>
  </Modal>;
}

export function TurmasPage() {
  const { turmas, alunos, mutate } = useAcademia();
  const [search, setSearch] = useState('');
  const [situation, setSituation] = useState('');
  const [day, setDay] = useState('');
  const [view, setView] = useState<'turmas' | 'grade'>('turmas');
  const [edit, setEdit] = useState<TurmaView | 'new' | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toggle, setToggle] = useState<TurmaView | null>(null);
  const [remove, setRemove] = useState<TurmaView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const detail = turmas.find(turma => turma.id === detailId);
  const rows = turmas.filter(turma => fold(turma.nome + ' ' + turma.professor).includes(fold(search)) && (!situation || turma.situacao === situation) && (day === '' || turma.horarios.some(horario => horario.diaSemana === Number(day))));
  const active = turmas.filter(turma => turma.situacao === 'ativo');
  const linked = new Set(active.flatMap(turma => turma.alunoIds)).size;
  const changeSituation = async () => {
    if (!toggle) return;
    setBusy(true); setError('');
    try {
      await mutate('/turmas/' + toggle.id + '/situacao', 'PATCH', { situacao: toggle.situacao === 'ativo' ? 'inativo' : 'ativo' }, toggle.situacao === 'ativo' ? 'Turma desativada. Os vínculos foram preservados.' : 'Turma reativada.');
      setToggle(null);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  const deleteTurma = async () => {
    if (!remove) return;
    setBusy(true); setError('');
    try {
      await mutate('/turmas/' + remove.id, 'DELETE', undefined, 'Turma excluída. Os cadastros dos alunos foram preservados.');
      setRemove(null);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <>
    <div className="page-heading"><div><div className="eyebrow">A ROTINA NO TATAME</div><h1>Turmas<span className="heading-dot">.</span></h1><p>Uma grade organizada, mais tempo para ensinar.</p></div><Button onClick={() => setEdit('new')}><Plus size={18}/>Nova turma</Button></div>
    <div className="turma-summary">
      <div className="card"><CalendarDays size={21}/><div><strong>{active.length}</strong><span>turmas ativas</span></div></div>
      <div className="card"><Clock3 size={21}/><div><strong>{active.reduce((total, turma) => total + turma.horarios.length, 0)}</strong><span>horários na semana</span></div></div>
      <div className="card"><Users size={21}/><div><strong>{linked}</strong><span>alunos em turmas ativas</span></div></div>
    </div>
    <section className="card turma-toolbar"><div className="toolbar">
      <div className="search"><Search size={18}/><input aria-label="Buscar turma ou professor" placeholder="Buscar turma ou professor…" value={search} onChange={event => setSearch(event.target.value)}/></div>
      <div className="filters"><select aria-label="Filtrar turmas por situação" value={situation} onChange={event => setSituation(event.target.value)}><option value="">Todas as situações</option><option value="ativo">Ativas</option><option value="inativo">Inativas</option></select><select aria-label="Filtrar turmas por dia" value={day} onChange={event => setDay(event.target.value)}><option value="">Todos os dias</option>{week.map(value => <option key={value} value={value}>{DIAS_SEMANA[value]}</option>)}</select></div>
    </div><div className="turma-view-switch"><button type="button" aria-pressed={view === 'turmas'} onClick={() => setView('turmas')}><List size={16}/>Turmas</button><button type="button" aria-pressed={view === 'grade'} onClick={() => setView('grade')}><CalendarDays size={16}/>Grade semanal</button><span>{rows.length} {rows.length === 1 ? 'turma' : 'turmas'}</span></div></section>
    {!rows.length ? <section className="card"><Empty title={turmas.length ? 'Nenhuma turma corresponde à busca' : 'Sua grade começa aqui'} description={turmas.length ? 'Ajuste o nome, a situação ou o dia da semana.' : 'Crie uma turma, adicione os horários fixos e escolha os alunos habituais.'} action={!turmas.length ? <Button onClick={() => setEdit('new')}><Plus size={17}/>Criar primeira turma</Button> : undefined}/></section> : view === 'turmas' ? <div className="turma-cards">{rows.map(turma => <article className="card turma-card" key={turma.id}>
      <div className="turma-card-heading"><span className="turma-mark"><CalendarDays size={23}/></span><Badge value={turma.situacao}/></div><h2>{turma.nome}</h2><p className="turma-professor"><UserRound size={15}/>{turma.professor}</p>
      <ul className="turma-schedule">{turma.horarios.map(horario => <li key={horario.id}><span>{shortDay(horario.diaSemana)}</span><strong>{horario.horaInicio}–{horario.horaFim}</strong></li>)}</ul>
      <button className="turma-members" onClick={() => setDetailId(turma.id)}><Users size={16}/>{turma.alunoIds.length} {turma.alunoIds.length === 1 ? 'aluno habitual' : 'alunos habituais'}<span>Ver detalhes</span></button>
      <div className="turma-card-actions"><Button variant="secondary" onClick={() => setEdit(turma)}><Pencil size={15}/>Editar</Button><Button variant="ghost" onClick={() => { setToggle(turma); setError(''); }}><Power size={15}/>{turma.situacao === 'ativo' ? 'Desativar' : 'Reativar'}</Button><Button variant="ghost" className="turma-delete" aria-label={`Excluir turma ${turma.nome}`} onClick={() => { setRemove(turma); setError(''); }}><Trash2 size={15}/>Excluir</Button></div>
    </article>)}</div> : <div className="turma-week">{week.filter(value => day === '' || value === Number(day)).map(value => {
      const entries = rows.flatMap(turma => turma.horarios.filter(horario => horario.diaSemana === value).map(horario => ({ turma, horario }))).sort((a, b) => a.horario.horaInicio.localeCompare(b.horario.horaInicio) || a.turma.nome.localeCompare(b.turma.nome, 'pt-BR'));
      return <section className="card turma-day" key={value}><h2>{shortDay(value)}</h2>{entries.length ? entries.map(({ turma, horario }) => <button className={`turma-week-entry ${turma.situacao === 'inativo' ? 'is-inactive' : ''}`} key={horario.id} onClick={() => setDetailId(turma.id)}><strong>{horario.horaInicio}–{horario.horaFim}</strong><span>{turma.nome}</span><small>{turma.professor}{turma.situacao === 'inativo' ? ' · Inativa' : ''}</small></button>) : <p>Sem horários</p>}</section>;
    })}</div>}
    {edit && <TurmaForm turma={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)}/>}
    {detail && <Modal title={detail.nome} description="Grade fixa e vínculos habituais da turma." onClose={() => setDetailId(null)}>
      <div className="turma-detail-top"><p className="turma-professor"><UserRound size={16}/>{detail.professor}</p><Badge value={detail.situacao}/></div>
      <ul className="turma-schedule">{detail.horarios.map(horario => <li key={horario.id}><span>{DIAS_SEMANA[horario.diaSemana]}</span><strong>{horario.horaInicio}–{horario.horaFim}</strong></li>)}</ul>
      <h3 className="turma-detail-label">Alunos habituais · {detail.alunoIds.length}</h3><div className="turma-student-list">{detail.alunoIds.length ? detail.alunoIds.map(id => {
        const aluno = alunos.find(item => item.id === id);
        return <div className="turma-detail-student" key={id}><Person name={aluno?.nome ?? 'Aluno'} secondary={aluno?.faixa}/>{aluno && <Badge value={aluno.situacao}/>}</div>;
      }) : <p className="helper">Nenhum aluno vinculado. Você pode adicioná-los ao editar a turma.</p>}</div>
      <div className="form-actions turma-detail-actions"><Button variant="danger" onClick={() => { setRemove(detail); setDetailId(null); setError(''); }}><Trash2 size={15}/>Excluir turma</Button><Button variant="secondary" onClick={() => setDetailId(null)}>Fechar</Button><Button onClick={() => { setEdit(detail); setDetailId(null); }}><Pencil size={15}/>Editar turma</Button></div>
    </Modal>}
    {toggle && <Modal title={toggle.situacao === 'ativo' ? 'Desativar turma' : 'Reativar turma'} onClose={() => { if (!busy) setToggle(null); }}><p className="confirm-text">Deseja {toggle.situacao === 'ativo' ? 'desativar' : 'reativar'} a turma <strong>{toggle.nome}</strong>?</p><p className="helper">A grade e os vínculos dos alunos serão preservados.</p><FormError message={error}/><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={() => setToggle(null)}>Cancelar</Button><Button disabled={busy} onClick={() => void changeSituation()}>{busy ? 'Salvando…' : toggle.situacao === 'ativo' ? 'Desativar turma' : 'Reativar turma'}</Button></div></Modal>}
    {remove && <Modal title="Excluir turma definitivamente" onClose={() => { if (!busy) setRemove(null); }}><p className="confirm-text">Deseja excluir definitivamente a turma <strong>{remove.nome}</strong>?</p><p className="helper">A turma, seus horários e os vínculos habituais serão removidos. Os cadastros dos alunos, mensalidades e presenças existentes serão preservados. Aulas já criadas também serão mantidas, com seus dados históricos e sem vínculo com a turma excluída.</p><p className="helper">Esta ação não pode ser desfeita. Você poderá cadastrar uma nova turma depois, mas isso não recupera os dados excluídos.</p><FormError message={error}/><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={() => setRemove(null)}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={() => void deleteTurma()}>{busy ? 'Excluindo…' : 'Excluir definitivamente'}</Button></div></Modal>}
  </>;
}
