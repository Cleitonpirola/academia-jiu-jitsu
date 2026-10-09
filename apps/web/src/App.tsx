import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Users, CreditCard, CalendarCheck, Sparkles, ArrowUpRight, X, RotateCw, CheckCircle2, Activity, ChevronRight } from 'lucide-react';
import { MonthPicker, Button } from './components';
import { api, today } from './lib';
import { StoreContext, type Data } from './store';
import type { Aluno, MensalidadeView, PresencaView, Dashboard, Health, Analise } from '@tatame/shared';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage, StudentForm } from './pages/StudentsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { IntelligencePage } from './pages/IntelligencePage';
const navigation=[{id:'dashboard',label:'Visão geral',icon:LayoutDashboard},{id:'alunos',label:'Alunos',icon:Users},{id:'mensalidades',label:'Mensalidades',icon:CreditCard},{id:'presencas',label:'Presenças',icon:CalendarCheck},{id:'inteligencia',label:'Inteligência',icon:Sparkles}];
const initial:Data={alunos:[],mensalidades:[],presencas:[],dashboard:null,health:null,analises:[]};
export default function App() {
  const [page,setPage]=useState('dashboard');const [month,setMonth]=useState(today().slice(0,7));
  const [data,setData]=useState<Data>(initial);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const [toast,setToast]=useState('');const [revision,setRevision]=useState(0);const [studentForm,setStudentForm]=useState(false);const [paymentStudent,setPaymentStudent]=useState('');
  const loadId=useRef(0);
  const reload=useCallback(async()=>{const version=++loadId.current;setLoading(true);try{
    const [alunos,mensalidades,presencas,dashboard,health,analises]=await Promise.all([api<Aluno[]>('/alunos'),api<MensalidadeView[]>('/mensalidades'),api<PresencaView[]>('/presencas'),api<Dashboard>('/dashboard?mes='+month),api<Health>('/health'),api<Analise[]>('/analises')]);
    if(version===loadId.current){setData({alunos,mensalidades,presencas,dashboard,health,analises});setError('');setRevision(v=>v+1);}
  }catch(e){if(version===loadId.current)setError((e as Error).message);}finally{if(version===loadId.current)setLoading(false);}},[month]);
  useEffect(()=>{void reload();},[reload]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(timer);},[toast]);
  const mutate=async(path:string,method:string,body:unknown,message:string)=>{const result=await api(path,{method,...(body!==undefined?{body:JSON.stringify(body)}:{})});setToast(message);await reload();return result;};
  const goto=(id:string)=>{setPage(id);if(id==='mensalidades')setPaymentStudent('');};
  const viewPayments=(id:string)=>{setPaymentStudent(id);setPage('mensalidades');};
  return <StoreContext.Provider value={{...data,month,revision,mutate,reload}}><div className="app-shell"><aside className="sidebar"><a className="brand" href="#" onClick={e=>{e.preventDefault();goto('dashboard');}}><span className="brand-mark">t</span><div>tatame<small>GESTÃO DE ACADEMIA</small></div></a><div className="sidebar-label">ESPAÇO DA ACADEMIA</div><nav aria-label="Navegação principal">{navigation.map(({id,label,icon:Icon})=><button key={id} className={page===id?'nav-item active':'nav-item'} onClick={()=>goto(id)} aria-current={page===id?'page':undefined}><Icon size={20}/><span>{label}</span>{id==='inteligencia'?<span className="new-tag">IA</span>:page===id?<ChevronRight size={16}/>:null}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-note"><span className="note-icon"><Activity size={19}/></span><strong>Do cadastro ao tatame.</strong><p>Mais tempo para ensinar.<br/>Mais clareza para gerir.</p><button onClick={()=>goto('presencas')}>Registrar um treino <ArrowUpRight size={16}/></button></div><div className="admin"><div className="admin-avatar">AD</div><div><strong>Administrador</strong><small>Academia de Jiu-Jitsu</small></div><span className="online-dot"/></div></div></aside><div className="workspace"><header className="topbar"><div className="breadcrumb">Academia <ChevronRight size={14}/><strong>{navigation.find(n=>n.id===page)?.label}</strong></div><div className="topbar-actions"><span className="env-badge"><i/>{data.health?.database==='supabase'?'Supabase conectado':'Banco local'}</span><MonthPicker value={month} onChange={setMonth}/></div></header><main>
    {data.health?.database==='sqlite'&&<div className="demo-label"><span className="demo-dot"/>Ambiente local para validação · dados iniciais fictícios · alterações salvas neste computador</div>}
    {error&&<div className="connection-error" role="alert"><span>{error}</span><Button variant="secondary" onClick={()=>void reload()}><RotateCw size={15}/>Tentar novamente</Button></div>}
    {loading&&!data.dashboard?<div className="loading-screen"><div className="spinner"/><h2>Preparando sua academia</h2><p>Carregando alunos e mensalidades…</p></div>:<>
      {page==='dashboard'&&<DashboardPage onNewStudent={()=>setStudentForm(true)} onPayments={()=>goto('mensalidades')} onStudents={()=>goto('alunos')}/>}
      {page==='alunos'&&<StudentsPage onPayments={viewPayments}/>}
      {page==='mensalidades'&&<PaymentsPage initialStudent={paymentStudent}/>}
      {page==='presencas'&&<AttendancePage/>}
      {page==='inteligencia'&&<IntelligencePage/>}
    </>}
    <footer className="app-footer"><span>Tatame <span>·</span> Gestão de academia</span><span>{loading?'Atualizando…':'Dados sincronizados com o backend'} <CheckCircle2 size={13}/></span></footer>
  </main></div><nav className="mobile-nav" aria-label="Navegação móvel">{navigation.map(({id,label,icon:Icon})=><button key={id} aria-label={label} className={page===id?'active':''} onClick={()=>goto(id)}><Icon size={21}/><span>{label}</span></button>)}</nav>{toast&&<div className="toast" role="status"><CheckCircle2 size={20}/><span>{toast}</span><button aria-label="Fechar aviso" onClick={()=>setToast('')}><X size={17}/></button></div>}{studentForm&&<StudentForm onClose={()=>setStudentForm(false)}/>}</div></StoreContext.Provider>;
}
