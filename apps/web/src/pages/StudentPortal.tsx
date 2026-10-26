import { Comunicados } from '../components/Comunicados';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, CreditCard, DollarSign, LogOut, RefreshCw, User, PartyPopper } from 'lucide-react';
import type { AulaAlunoView, RespostaPortalAluno } from '@tatame/shared';
import { Badge, Belt, Button, Empty, FormError, Field, Modal, Person } from '../components';
import { api, dateLabel, money, today } from '../lib';
import { mensagemAniversario } from '../aniversarios';
import { BloqueioFinanceiro } from '../components/BloqueioFinanceiro';
import { ResumoPlano } from '../components/ResumoPlano';
import { ResumoSaldoMensal } from '../components/SaldoMensalAluno';
import { DebitosAluno } from '../components/DebitosAluno';
import { PerfilAluno } from '../components/PerfilAluno';

export function StudentPortal({ onLogout, apiBase='/portal', responsavel=false, podeCheckin=true }: { onLogout: () => void; apiBase?:string; responsavel?:boolean; podeCheckin?:boolean }) {
  const [response, setResponse] = useState<RespostaPortalAluno | null>(null);
  const data = response && !response.bloqueado ? response : null;
  const bloqueio = response?.bloqueado ? response : null;
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState('agenda');
  const [dia, setDia] = useState(today());
  const [filter, setFilter] = useState(today());
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adicional,setAdicional] = useState<AulaAlunoView|null>(null);
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const id = ++sequence.current;
    setLoading(true);
    try {
      const result = await api<RespostaPortalAluno>(apiBase);
      if (id === sequence.current) {
        setResponse(result); setError(''); setDia(today());
        if (result.bloqueado) setNotice('');
        return result;
      }
    } catch (error) { if (id === sequence.current) { setResponse(null); setNotice(''); setError((error as Error).message); } }
    finally { if (id === sequence.current) setLoading(false); }
  }, [apiBase]);
  useEffect(() => {
    void load();
    const refresh = () => { if (!document.hidden) void load(); };
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { sequence.current++; clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [load]);
  const checkin = async (aula: AulaAlunoView) => {
    setBusy(true); setNotice('');
    try {
      await api(`${apiBase}/aulas/${aula.id}/checkin`, { method: 'PUT', body: '{}' });
      setNotice(`Check-in enviado para ${aula.titulo}, às ${aula.horaInicio}. Aguarde a confirmação do responsável.`);
      await load();
    } catch (error) {
      const current = await load();
      if (!current?.bloqueado) setError((error as Error).message);
    }
    finally { setBusy(false); }
  };
  const adicionalConfirmado=(id:string)=>data?.debitos?.some(item=>item.aulaId===id&&!item.canceladoEm&&item.statusPagamento!=='cancelado')??false;
  const confirmarAdicional=async()=>{
    if(!adicional||!data?.condicoesAdicionais||data.condicoesAdicionais.valorAulaAdicionalCentavos===null)return;
    setBusy(true);setError('');setNotice('');
    try{await api(`${apiBase}/aulas/${adicional.id}/adicional`,{method:'POST',body:JSON.stringify({confirmo:true,valorEsperadoCentavos:data.condicoesAdicionais.valorAulaAdicionalCentavos,prazoEsperadoDias:data.condicoesAdicionais.prazoPagamentoDias})});setAdicional(null);setPage('debitos');await load();setNotice('Aula adicional confirmada. O débito já está disponível em Débitos. Faça o check-in no dia da aula.');}
    catch(error){await load();setError((error as Error).message);}finally{setBusy(false);}
  };
  const nav = [{ id: 'agenda', label: 'Aulas e check-in', icon: CalendarDays }, { id: 'historico', label: 'Meus treinos', icon: CheckCircle2 }, { id: 'mensalidades', label: 'Mensalidades', icon: DollarSign }, { id: 'debitos', label: 'Débitos', icon: CreditCard }, { id: 'avisos', label: 'Avisos e autorizações', icon: User }, { id: 'perfil', label: 'Meu perfil', icon: User }];
  const historico = data?.aulas.filter(aula => aula.presenca || aula.checkin).sort((a, b) => (b.dataAula + b.horaInicio).localeCompare(a.dataAula + a.horaInicio)) ?? [];
  const pendentes = data?.aulas.filter(aula => aula.checkin && !aula.presenca && aula.situacao !== 'cancelada').length ?? 0;
  const selected = data?.aulas.filter(aula => filter ? aula.dataAula === filter : aula.dataAula >= dia) ?? [];
  return <div className="portal-shell"><header className="portal-header"><a className="brand" href="#" onClick={event => { event.preventDefault(); setPage('agenda'); }}><span className="brand-mark">t</span><div>tatame<small>{responsavel?'ALUNO ACOMPANHADO':'ÁREA DO ALUNO'}</small></div></a><div><Button variant="ghost" disabled={loading} onClick={() => void load()} aria-label="Atualizar minha área"><RefreshCw size={17}/></Button><Button variant="secondary" onClick={onLogout}><LogOut size={16}/>Sair</Button></div></header>
    <main className="portal-main">{!bloqueio && <section className="portal-welcome"><div><div className="eyebrow">SUA JORNADA NO TATAME</div><h1>Oss{data ? `, ${data.aluno.nome.trim().split(/\s+/)[0]}` : ''}!</h1><p>Um treino de cada vez. Sua evolução começa com a presença.</p></div>{data && <Belt value={data.aluno.faixa} grauId={data.aluno.grauId}/>}</section>}
      {data && data.aluno.dataNascimento.slice(5) === dia.slice(5) && <div className="portal-birthday"><PartyPopper size={28}/><div><strong>Hoje o tatame celebra você!</strong><p>{mensagemAniversario(data.aluno.nome)}</p></div></div>}
      {(data || bloqueio) && <nav className="portal-nav" aria-label="Minha área">{nav.filter(item=>!bloqueio||item.id==='debitos'||item.id==='avisos'||(!responsavel&&item.id==='perfil')).map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setPage(id)} aria-current={page === id ? 'page' : undefined} className={page === id ? 'active' : ''}><Icon size={18}/>{label}</button>)}</nav>}
      {data && <ResumoPlano uso={data.plano}/>}
      {data?.saldoMensal && <ResumoSaldoMensal saldo={data.saldoMensal} valorAdicionalCentavos={data.condicoesAdicionais?.valorAulaAdicionalCentavos}/>}
      {data?.debitoVencido&&<p className="portal-notice" role="alert">Você possui débito de aula adicional vencido. Regularize com a academia para fazer novos check-ins.</p>}<FormError message={error}/>{error && <Button variant="secondary" disabled={loading} onClick={() => void load()}>Tentar novamente</Button>}
      {notice && <p className="portal-notice" role="status"><CheckCircle2 size={19}/>{notice}</p>}
      {responsavel&&!podeCheckin&&<p className="portal-notice">O aluno possui celular próprio e faz o próprio check-in. Você acompanha os dados, débitos e autorizações.</p>}
      {page==='perfil'&&!responsavel ? <PerfilAluno onSaved={load}/> : page === 'avisos' ? <Comunicados base={apiBase}/> : page === 'debitos' ? <DebitosAluno apiBase={apiBase}/> : bloqueio ? <BloqueioFinanceiro bloqueio={bloqueio} loading={loading} onRefresh={() => void load()}/> : !data ? <Empty title={loading ? 'Preparando sua área…' : 'Não foi possível carregar seus dados'} description="Confira sua conexão e tente novamente."/> : <>
        {page === 'agenda' && <><div className="portal-section-heading"><div><h2>Encontre seu próximo treino</h2><p>{pendentes ? `${pendentes} check-in(s) aguardando validação.` : 'Escolha uma aula publicada pela academia.'}</p></div><Field label="Data das aulas"><input type="date" value={filter} onChange={event => setFilter(event.target.value)}/></Field></div><div className="portal-agenda-actions"><Button variant="secondary" onClick={() => setFilter(dia)}>Hoje</Button><Button variant="ghost" onClick={() => setFilter('')}>Ver próximas aulas</Button></div><p className="helper">O check-in fica disponível no dia da aula. Você pode participar de mais de uma aula no mesmo dia. O professor confirma sua presença depois.</p>
          <div className="portal-aulas">{selected.map(aula => <article className={`card portal-aula ${aula.situacao === 'cancelada' ? 'is-cancelled' : ''}`} key={aula.id}><div className="portal-aula-time"><CalendarDays size={19}/><strong>{dateLabel(aula.dataAula)}</strong><span>{aula.horaInicio} – {aula.horaFim}</span></div><div className="portal-aula-info"><span className="eyebrow">{aula.origem === 'extra' ? 'REGISTRO ANTERIOR' : 'GRADE DA TURMA'}</span><h3>{aula.titulo}</h3>{data.plano.aulasLiberadas.includes(aula.id) && <span className="attendance-status is-present">Aula extra autorizada</span>}<p>{aula.professor} {aula.turmaNome && aula.turmaNome !== aula.titulo ? `· ${aula.turmaNome}` : ''}</p>{aula.situacao === 'cancelada' && <p className="portal-cancelled">Cancelada · {aula.motivoCancelamento}</p>}</div><div className="portal-aula-action">{aula.situacao === 'cancelada' ? <span className="attendance-status is-absent">Aula cancelada</span> : aula.presenca ? <span className={`attendance-status ${aula.presenca.presente ? 'is-present' : 'is-absent'}`}>{aula.presenca.presente ? 'Presença confirmada' : 'Ausência registrada'}</span> : aula.checkin ? <span className="attendance-status unmarked"><Clock3 size={14}/>Aguardando confirmação</span> : adicionalConfirmado(aula.id) && aula.dataAula > dia ? <span className="attendance-status is-present">Adicional confirmado · check-in no dia</span> : data.saldoMensal?.limiteAtingido && !adicionalConfirmado(aula.id) ? <Button disabled={aula.origem!=='grade' || busy || loading || Boolean(error) || data.debitoVencido || data.condicoesAdicionais?.valorAulaAdicionalCentavos == null || aula.dataAula < dia || aula.dataAula.slice(0,7) !== data.saldoMensal.competencia} onClick={()=>{setError('');setAdicional(aula);}}>{aula.origem!=='grade' ? 'Registro anterior' : data.condicoesAdicionais?.valorAulaAdicionalCentavos == null ? 'Limite mensal atingido' : 'Reservar aula adicional'}</Button> : <Button disabled={!podeCheckin || busy || loading || Boolean(error) || data.debitoVencido || Boolean(data.saldoMensal?.limiteAtingido && !adicionalConfirmado(aula.id)) || aula.dataAula !== dia || (data.plano.limiteAtingido && !data.plano.aulasLiberadas.includes(aula.id))} onClick={() => void checkin(aula)}>{!podeCheckin ? 'Check-in pelo aluno' : aula.dataAula === dia ? data.saldoMensal?.limiteAtingido && !adicionalConfirmado(aula.id) ? 'Limite mensal atingido' : data.plano.limiteAtingido && !data.plano.aulasLiberadas.includes(aula.id) ? 'Limite semanal atingido' : 'Fazer check-in' : aula.dataAula > dia ? 'Disponível no dia' : 'Aula encerrada'}</Button>}</div></article>)}</div>
          {!selected.length && <Empty title="Nenhuma aula publicada para este período" description="A academia precisa publicar as aulas na agenda. Consulte os próximos dias ou converse com seu professor."/>}
        </>}
        {page === 'historico' && <section className="card portal-panel"><h2>Meus treinos</h2><p className="helper">Check-ins pendentes não contam como presença. Mais de uma aula no dia aparece separadamente.</p>{historico.length ? <div className="portal-history">{historico.map(aula => <div key={aula.id}><div><strong>{aula.titulo}</strong><small>{dateLabel(aula.dataAula)} · {aula.horaInicio} – {aula.horaFim}</small></div><span className={`attendance-status ${aula.situacao === 'cancelada' ? 'is-absent' : aula.presenca ? aula.presenca.presente ? 'is-present' : 'is-absent' : 'unmarked'}`}>{aula.situacao === 'cancelada' ? 'Aula cancelada' : aula.presenca ? aula.presenca.presente ? 'Presente' : 'Ausente' : 'Aguardando confirmação'}</span></div>)}</div> : <Empty title="Seu histórico começa no próximo treino" description="Seus check-ins e confirmações aparecerão aqui."/>}{data.historicoAntigo.length > 0 && <><h3>Registros anteriores por modalidade</h3><p className="helper">Histórico preservado; esses registros não identificam uma aula da agenda.</p><div className="portal-history">{data.historicoAntigo.map(item => <div key={item.id}><div><strong>{item.tipoTreino}</strong><small>{dateLabel(item.dataTreino)}</small></div><Badge value={item.presente ? 'Presente' : 'Ausente'}/></div>)}</div></>}</section>}
        {page === 'mensalidades' && <section className="card portal-panel"><h2>Minhas mensalidades</h2><p className="helper">Consulte as cobranças e pagamentos registrados pela academia. Pagamentos online ainda não estão disponíveis.</p>{data.mensalidades.length ? <div className="portal-history">{data.mensalidades.map(item => <div key={item.id}><div><strong>{money(item.valorCentavos)} · {item.competencia.split('-').reverse().join('/')}</strong><small>Vencimento: {dateLabel(item.dataVencimento)}{item.dataPagamento ? ` · Pago em ${dateLabel(item.dataPagamento)}` : ''}</small></div><Badge value={item.status}/></div>)}</div> : <Empty title="Nenhuma mensalidade registrada" description="As cobranças cadastradas pela academia aparecerão aqui."/>}</section>}
        {page === 'perfil' && <section className="card portal-panel"><h2>Meu perfil</h2><Person name={data.aluno.nome} secondary={data.aluno.email.endsWith('@cadastro.invalid')?'Sem e-mail próprio':data.aluno.email}/><dl className="detail-grid"><div><dt>Telefone</dt><dd>{data.aluno.telefone}</dd></div><div><dt>Nascimento</dt><dd>{dateLabel(data.aluno.dataNascimento)}</dd></div><div><dt>Matrícula</dt><dd>{dateLabel(data.aluno.dataMatricula)}</dd></div><div><dt>Faixa</dt><dd><Belt value={data.aluno.faixa}/></dd></div></dl><p className="helper">Precisa corrigir seu cadastro ou recuperar o acesso? Converse com a academia.</p></section>}
      </>}
      {adicional && data && <Modal title="Confirmar aula adicional" onClose={()=>{if(!busy)setAdicional(null);}}><p><strong>{adicional.titulo}</strong> · {dateLabel(adicional.dataAula)}, às {adicional.horaInicio}</p><p>Valor: <strong>{money(data.condicoesAdicionais.valorAulaAdicionalCentavos ?? 0)}</strong>. Prazo: <strong>{data.condicoesAdicionais.prazoPagamentoDias} dia(s)</strong> a partir da confirmação.</p><p className="helper">Ao confirmar, você autoriza a geração deste débito. A reserva não registra presença; faça o check-in no dia da aula.</p><FormError message={error}/><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={()=>setAdicional(null)}>Voltar</Button><Button disabled={busy||data.debitoVencido||data.condicoesAdicionais.valorAulaAdicionalCentavos===null} onClick={()=>void confirmarAdicional()}>Confirmar aula e gerar débito</Button></div></Modal>}
      <footer className="app-footer"><span>Tatame · Área do aluno</span><span>{loading ? 'Atualizando…' : error ? 'Confira a conexão' : 'Você e sua evolução'}</span></footer>
    </main></div>;
}
