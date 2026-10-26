import { useState } from 'react';
import { Check, X, RotateCcw, Search, UserPlus, UserCheck, CalendarCheck } from 'lucide-react';
import type { AulaView } from '@tatame/shared';
import { Button, Empty, FormError, Person } from '../components';
import { useAcademia } from '../store';
import { fold, today } from '../lib';
import { RemoverCheckin } from './RemoverCheckin';

export function ChamadaAula({ aula }: { aula: AulaView }) {
  const { alunos, mutate, resourceStatus, reload } = useAcademia();
  const [search, setSearch] = useState('');
  const [extraId, setExtraId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [clearId, setClearId] = useState<string | null>(null);
  const byAluno = new Map(alunos.map(aluno => [aluno.id, aluno]));
  const byRegistro = new Map(aula.chamada.map(registro => [registro.alunoId, registro]));
  const byCheckin = new Map(aula.checkins.map(registro => [registro.alunoId, registro]));
  const ids = new Set([...byRegistro.keys(), ...byCheckin.keys()]);
  const rows = [...ids].map(id => ({ id, aluno: byAluno.get(id), registro: byRegistro.get(id),
    nome: byRegistro.get(id)?.nome ?? byCheckin.get(id)?.nome ?? byAluno.get(id)?.nome ?? 'Aluno',
  })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const filtered = rows.filter(row => fold(row.nome).includes(fold(search)));
  const candidates = alunos.filter(aluno => aluno.situacao === 'ativo' && aluno.dataMatricula <= aula.dataAula && !ids.has(aluno.id));
  const readOnly = aula.situacao === 'cancelada' ? 'Esta aula foi cancelada. A chamada está indisponível.'
    : aula.dataAula > today() ? 'A chamada será liberada na data da aula.' : '';
  const disabled = busy || resourceStatus.aulas.loading;
  const mark = async (alunoId: string, presente: boolean) => {
    setBusy(true); setError(''); setClearId(null);
    try {
      await mutate(`/aulas/${aula.id}/chamada/${alunoId}`, 'PUT', { presente }, presente ? 'Presença salva nesta aula.' : 'Ausência salva nesta aula.');
      setExtraId('');
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  const clear = async () => {
    if (!clearId) return;
    setBusy(true); setError('');
    try { await mutate(`/aulas/${aula.id}/chamada/${clearId}`, 'DELETE', undefined, 'Marcação removida desta aula.'); setClearId(null); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <div className="chamada-aula">
    <div className="mini-stats chamada-stats">
      <div><span className="mini-icon green"><UserCheck size={19}/></span><div><small>Presentes</small><strong>{aula.chamada.filter(item => item.presente).length}</strong></div></div>
      <div><span className="mini-icon coral"><X size={19}/></span><div><small>Ausentes</small><strong>{aula.chamada.filter(item => !item.presente).length}</strong></div></div>
      <div><span className="mini-icon amber"><CalendarCheck size={19}/></span><div><small>Sem marcação</small><strong>{rows.filter(row => !row.registro).length}</strong></div></div>
    </div>
    {readOnly && <p className="chamada-notice" role="status">{readOnly}</p>}
    <p className="helper chamada-intro">Cada marcação vale somente para esta aula. O mesmo aluno pode participar de outros horários. Sem marcação não significa ausência.</p>
    {aula.checkins.some(item => !byRegistro.has(item.alunoId)) && <p className="portal-notice" role="status">{aula.checkins.filter(item => !byRegistro.has(item.alunoId)).length} check-in(s) aguardando sua confirmação.</p>}
    <FormError message={error}/>
    {clearId && <div className="chamada-clear" role="alert"><p>Limpar a marcação de <strong>{rows.find(row => row.id === clearId)?.nome}</strong>? Ela deixará de contar nos indicadores. Quem tiver check-in voltará a aguardar validação. Participantes sem check-in sairão desta lista.</p><div><Button variant="secondary" disabled={disabled} onClick={() => setClearId(null)}>Voltar</Button><Button variant="danger" disabled={disabled} onClick={() => void clear()}>Confirmar limpeza</Button></div></div>}
    <div className="card chamada-list"><div className="toolbar"><div className="search"><Search size={18}/><input aria-label="Buscar aluno nesta aula" placeholder="Buscar na chamada…" value={search} onChange={event => setSearch(event.target.value)}/></div><span className="helper">{aula.checkins.length} check-ins · {aula.chamada.length} marcações</span></div>
      {filtered.length ? <div className="chamada-rows">{filtered.map(row => {
        const blocked = Boolean(readOnly) || disabled || (!row.registro && (!row.aluno || row.aluno.situacao !== 'ativo' || row.aluno.dataMatricula > aula.dataAula));
        return <div className="chamada-row" key={row.id}>
          <div><Person name={row.nome} secondary={(byCheckin.has(row.id) ? 'Check-in nesta aula' : 'Registro do professor') + (row.aluno?.situacao === 'inativo' ? ' · cadastro inativo' : '')}/>
            <span className={`attendance-status ${row.registro ? row.registro.presente ? 'is-present' : 'is-absent' : 'unmarked'}`}>{row.registro ? row.registro.presente ? 'Presente' : 'Ausente' : byCheckin.has(row.id) ? 'Check-in · aguardando validação' : 'Sem marcação'}</span>
            {!row.registro && row.aluno?.situacao === 'inativo' && <small className="helper">Reative o aluno para registrar uma nova marcação.</small>}
          </div>
          <div className="attendance-buttons"><button aria-label={`Marcar ${row.nome} como presente nesta aula`} aria-pressed={row.registro?.presente === true} disabled={blocked} className={row.registro?.presente ? 'selected present' : ''} onClick={() => void mark(row.id, true)}><Check size={16}/>Presente</button><button aria-label={`Marcar ${row.nome} como ausente nesta aula`} aria-pressed={row.registro?.presente === false} disabled={blocked} className={row.registro && !row.registro.presente ? 'selected absent' : ''} onClick={() => void mark(row.id, false)}><X size={16}/>Ausente</button>{row.registro && <button aria-label={`Limpar marcação de ${row.nome}`} disabled={disabled || Boolean(readOnly)} onClick={() => { setClearId(row.id); setError(''); }}><RotateCcw size={15}/>Limpar</button>}{byCheckin.has(row.id) && <RemoverCheckin aulaId={aula.id} alunoId={row.id} nome={row.nome} disabled={disabled || Boolean(readOnly)}/>}</div>
        </div>;
      })}</div> : <Empty title={search ? 'Nenhum aluno corresponde à busca' : 'Nenhum aluno nesta chamada'} description={search ? 'Ajuste o nome pesquisado.' : readOnly ? 'Não há marcações guardadas para esta aula.' : 'Os check-ins aparecerão aqui. Você também pode registrar um participante abaixo.'}/>}
    </div>
    {!readOnly && <div className="chamada-add"><h3><UserPlus size={17}/>Incluir outro aluno</h3><p className="helper">Alunos ativos de qualquer turma podem participar. Isso não altera a turma habitual e não gera cobrança.</p>
      {resourceStatus.alunos.error ? <><FormError message={resourceStatus.alunos.error}/><Button variant="secondary" onClick={() => void reload()}>Recarregar alunos</Button></> : <div className="chamada-add-controls"><label className="field"><span>Aluno participante</span><select aria-label="Aluno participante de outra turma" value={extraId} disabled={disabled || resourceStatus.alunos.loading} onChange={event => setExtraId(event.target.value)}><option value="">{candidates.length ? 'Selecione um aluno cadastrado' : 'Nenhum outro aluno disponível'}</option>{candidates.map(aluno => <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>)}</select></label><Button disabled={disabled || !extraId || resourceStatus.alunos.loading} onClick={() => void mark(extraId, true)}><Check size={16}/>Adicionar como presente</Button></div>}
    </div>}
    <p className="helper chamada-intro">Registre cada treino uma única vez: por aula ou pelo registro antigo por modalidade. O histórico antigo foi preservado e não é associado automaticamente aos horários.</p>
  </div>;
}
