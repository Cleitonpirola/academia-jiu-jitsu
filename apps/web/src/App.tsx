import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Users, CreditCard, CalendarCheck, CalendarDays, Clock3, Sparkles, ArrowUpRight, X, RotateCw, CheckCircle2, Activity, ChevronRight } from 'lucide-react';
import { MonthPicker, Button } from './components';
import { api, today } from './lib';
import { StoreContext } from './store';
import { initialData, initialResourceStatus, startLoading, resourceLabels, type Resource } from './data';
import { loadResources } from './load-data';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage, StudentForm } from './pages/StudentsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { IntelligencePage } from './pages/IntelligencePage';
import { TurmasPage } from './pages/TurmasPage';
import { AulasPage } from './pages/AulasPage';
import type { UsuarioView } from '@tatame/shared';
const navigation=[{id:'dashboard',label:'Visão geral',icon:LayoutDashboard},{id:'alunos',label:'Alunos',icon:Users},{id:'turmas',label:'Turmas',icon:CalendarDays},{id:'aulas',label:'Aulas',icon:Clock3},{id:'mensalidades',label:'Mensalidades',icon:CreditCard},{id:'presencas',label:'Presenças',icon:CalendarCheck},{id:'inteligencia',label:'Inteligência',icon:Sparkles}];
const requiredResources: Record<string, Resource[]> = {
  dashboard: ['dashboard', 'alunos', 'mensalidades'], alunos: ['alunos'],
  mensalidades: ['mensalidades', 'alunos'], presencas: ['alunos'], inteligencia: [], turmas: ['turmas', 'alunos'], aulas: ['aulas', 'turmas'],
};
export default function App({ usuario, onLogout }: { usuario: UsuarioView; onLogout: () => void }) {
  const [page,setPage]=useState('dashboard');const [month,setMonth]=useState(today().slice(0,7));
  const [data,setData]=useState(initialData);const [resourceStatus,setResourceStatus]=useState(initialResourceStatus);
  const [toast,setToast]=useState('');const [revision,setRevision]=useState(0);const [studentForm,setStudentForm]=useState(false);const [paymentStudent,setPaymentStudent]=useState('');
  const loadId=useRef(0);
  const requestedMonth=useRef(month);
  const reload=useCallback(async()=>{
    const version=++loadId.current;
    const periodChanged=requestedMonth.current!==month;
    requestedMonth.current=month;
    setResourceStatus(previous=>startLoading(previous,periodChanged?['dashboard']:[]));
    if(periodChanged)setData(previous=>({...previous,dashboard:null}));
    await loadResources(month, api, {
      onSuccess: (resource, value) => {
        if(version!==loadId.current)return;
        setData(previous=>({...previous,[resource]:value}));
        setResourceStatus(previous=>({...previous,[resource]:{loading:false,loaded:true,error:null}}));
      },
      onFailure: (resource, message) => {
        if(version!==loadId.current)return;
        setData(previous=>({...previous,[resource]:initialData()[resource]}));
        setResourceStatus(previous=>({...previous,[resource]:{loading:false,loaded:false,error:message}}));
      },
    });
    if(version===loadId.current)setRevision(value=>value+1);
  },[month]);
  useEffect(()=>{void reload();},[reload]);
  useEffect(()=>{
    const refresh=()=>{if(!document.hidden)void reload();};
    const timer=window.setInterval(refresh,30000);
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refresh);
    return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[reload]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(timer);},[toast]);
  const mutate=async(path:string,method:string,body:unknown,message:string)=>{const result=await api(path,{method,...(body!==undefined?{body:JSON.stringify(body)}:{})});setToast(message);void reload();return result;};
  const goto=(id:string)=>{setPage(id);if(id==='mensalidades')setPaymentStudent('');};
  const viewPayments=(id:string)=>{setPaymentStudent(id);setPage('mensalidades');};
  const required=requiredResources[page] || [];
  const pageLoading=required.some(resource=>resourceStatus[resource].loading);
  const pageHasData=required.every(resource=>resourceStatus[resource].loaded);
  const pageError=required.filter(resource=>resourceStatus[resource].error).map(resource=>`${resourceLabels[resource]}: ${resourceStatus[resource].error}`).join(' ');
  const loading=Object.values(resourceStatus).some(state=>state.loading);
  const partialUpdate=Object.values(resourceStatus).some(state=>state.error);
  return <StoreContext.Provider value={{...data,resourceStatus,month,revision,mutate,reload}}>
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={event=>{event.preventDefault();goto('dashboard');}}>
          <span className="brand-mark">t</span><div>tatame<small>GESTÃO DE ACADEMIA</small></div>
        </a>
        <div className="sidebar-label">ESPAÇO DA ACADEMIA</div>
        <nav aria-label="Navegação principal">
          {navigation.map(({id,label,icon:Icon})=><button key={id} className={page===id?'nav-item active':'nav-item'} onClick={()=>goto(id)} aria-current={page===id?'page':undefined}>
            <Icon size={20}/><span>{label}</span>
            {id==='inteligencia'?<span className="new-tag">IA</span>:page===id?<ChevronRight size={16}/>:null}
          </button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon"><Activity size={19}/></span><strong>Do cadastro ao tatame.</strong>
            <p>Mais tempo para ensinar.<br/>Mais clareza para gerir.</p>
            <button onClick={()=>goto('presencas')}>Registrar um treino <ArrowUpRight size={16}/></button>
          </div>
          <div className="admin"><div className="admin-avatar">AD</div><div><strong>{usuario.nome}</strong><small>Administrador · Tatame</small></div><span className="online-dot"/></div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">Academia <ChevronRight size={14}/><strong>{navigation.find(item=>item.id===page)?.label}</strong></div>
          <div className="topbar-actions">
            <Button variant="ghost" onClick={onLogout} aria-label={`Sair da conta de ${usuario.nome}`}>Sair</Button>
            <span className={`env-badge ${data.health?'':'is-offline'}`}><i/>{data.health?(data.health.database==='supabase'?'Supabase conectado':'Banco local'):(resourceStatus.health.loading?'Conferindo conexão…':'Conexão indisponível')}</span>
            {!['turmas','aulas','presencas'].includes(page)&&<MonthPicker value={month} onChange={setMonth}/>}
          </div>
        </header>
        <main>
          {data.health?.database==='sqlite'&&<div className="demo-label"><span className="demo-dot"/>Ambiente local para validação · dados iniciais fictícios · alterações salvas neste computador</div>}
          {pageError&&<div className="connection-error" role="alert"><span>{pageError}</span><Button variant="secondary" onClick={()=>void reload()}><RotateCw size={15}/>Tentar novamente</Button></div>}
          {!pageError&&pageLoading&&!pageHasData?<div className="loading-screen"><div className="spinner"/><h2>Preparando sua academia</h2><p>Carregando os dados desta área…</p></div>:pageError?null:<>
            {page==='dashboard'&&<DashboardPage onNewStudent={()=>setStudentForm(true)} onPayments={()=>goto('mensalidades')} onStudents={()=>goto('alunos')}/>}
            {page==='alunos'&&<StudentsPage onPayments={viewPayments}/>}
            {page==='turmas'&&<TurmasPage/>}
            {page==='aulas'&&<AulasPage/>}
            {page==='mensalidades'&&<PaymentsPage initialStudent={paymentStudent}/>}
            {page==='presencas'&&<AttendancePage onAgenda={()=>goto('aulas')}/>}
            {page==='inteligencia'&&<IntelligencePage/>}
          </>}
          <footer className="app-footer">
            <span>Tatame <span>·</span> Gestão de academia</span>
            <span>{loading?'Atualizando…':partialUpdate?'Alguns dados estão indisponíveis':'Dados sincronizados com o backend'} {partialUpdate?<X size={13}/>:<CheckCircle2 size={13}/>}</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegação móvel">
        {navigation.map(({id,label,icon:Icon})=><button key={id} aria-label={label} className={page===id?'active':''} onClick={()=>goto(id)}><Icon size={21}/><span>{label}</span></button>)}
      </nav>
      {toast&&<div className="toast" role="status"><CheckCircle2 size={20}/><span>{toast}</span><button aria-label="Fechar aviso" onClick={()=>setToast('')}><X size={17}/></button></div>}
      {studentForm&&<StudentForm onClose={()=>setStudentForm(false)}/>}
    </div>
  </StoreContext.Provider>;
}
