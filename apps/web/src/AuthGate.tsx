import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { AuthState } from '@tatame/shared';
import App from './App';
import { StudentPortal } from './pages/StudentPortal';
import { api } from './lib';
import { Button, Field, FormError } from './components';

export default function AuthGate() {
  const [state, setState] = useState<AuthState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('ativar') ?? '');
  const load = async () => {
    setError('');
    try { setState(await api<AuthState>('/auth/estado')); }
    catch (error) { setError((error as Error).message); }
  };
  useEffect(() => {
    if (token) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    void load();
    const expired = () => { setState({ configuracaoInicial: false, usuario: null }); setSenha(''); setError('Sua sessão terminou. Entre novamente.'); };
    window.addEventListener('tatame:session-expired', expired);
    return () => window.removeEventListener('tatame:session-expired', expired);
  }, []);
  const logout = async () => {
    setError('');
    try { await api('/auth/sair', { method: 'POST' }); setState({ configuracaoInicial: false, usuario: null }); setSenha(''); setConfirmacao(''); }
    catch (error) { setError((error as Error).message); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if ((state?.configuracaoInicial || token) && senha !== confirmacao) { setError('As senhas precisam ser iguais.'); return; }
    setBusy(true);
    try {
      const path = token ? '/ativar' : state?.configuracaoInicial ? '/configurar' : '/entrar';
      const body = token ? { token, senha } : state?.configuracaoInicial ? { nome, email, senha } : { email, senha };
      setState(await api<AuthState>('/auth' + path, { method: 'POST', body: JSON.stringify(body) }));
      setSenha(''); setConfirmacao(''); setToken('');
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  if (state?.usuario && !token) return <>{error && <div className="auth-session-error"><FormError message={error}/></div>}{state.usuario.perfil === 'admin' ? <App key={state.usuario.id} usuario={state.usuario} onLogout={() => void logout()}/> : <StudentPortal key={state.usuario.id} onLogout={() => void logout()}/>}</>;
  const setup = Boolean(state?.configuracaoInicial && !token);
  return <div className="auth-shell"><aside className="auth-story"><a className="brand" href="/"><span className="brand-mark">t</span><div>tatame<small>DA ACADEMIA PARA A SUA VIDA</small></div></a><div><span className="auth-kicker">SEU PRÓXIMO TREINO COMEÇA AQUI</span><h1>Dentro do tatame.<br/>Conectado com a sua evolução.</h1><p>Uma academia organizada. Uma jornada de treino que acompanha você.</p></div><small>Respeito, constância e evolução. Oss!</small></aside>
    <main className="auth-main"><section className="auth-card"><span className="auth-icon"><LockKeyhole size={25}/></span><div className="eyebrow">BEM-VINDO AO TATAME</div><h2>{token ? 'Ative seu acesso' : setup ? 'Vamos preparar sua academia' : 'Bom ter você por aqui.'}</h2><p className="auth-description">{token ? 'Escolha sua senha para entrar na área do aluno. O link vale por 24 horas e pode ser usado uma vez.' : setup ? 'Crie a conta do administrador. Essa configuração acontece uma única vez, neste computador.' : 'Entre para acompanhar os treinos ou cuidar da sua academia.'}</p><FormError message={error}/>
      {!state ? <Button variant="secondary" onClick={() => void load()}>Tentar conexão novamente</Button> : <form onSubmit={submit}>
        {setup && <Field label="Seu nome"><input required minLength={2} maxLength={120} autoComplete="name" value={nome} onChange={event => setNome(event.target.value)}/></Field>}
        {!token && <Field label="E-mail"><input required type="email" maxLength={180} autoComplete="username" value={email} onChange={event => setEmail(event.target.value)}/></Field>}
        <Field label={setup || token ? 'Crie uma senha' : 'Senha'}><input required type="password" minLength={setup || token ? 15 : 1} maxLength={128} autoComplete={setup || token ? 'new-password' : 'current-password'} value={senha} onChange={event => setSenha(event.target.value)}/></Field>
        {(setup || token) && <><p className="helper">Use uma frase com pelo menos 15 caracteres. Pode incluir espaços.</p><Field label="Confirme a senha"><input required type="password" minLength={15} maxLength={128} autoComplete="new-password" value={confirmacao} onChange={event => setConfirmacao(event.target.value)}/></Field></>}
        <Button type="submit" disabled={busy}>{busy ? 'Aguarde…' : token ? 'Ativar minha conta' : setup ? 'Criar minha conta' : 'Entrar'}<ArrowRight size={17}/></Button>
      </form>}
      {!setup && !token && <p className="auth-help">Primeiro acesso ou esqueceu a senha? Peça à academia um link de acesso para aluno.</p>}
      {token && <Button variant="ghost" disabled={busy} onClick={() => { setToken(''); setSenha(''); setError(''); }}>Voltar para o login</Button>}
      <div className="auth-trust"><ShieldCheck size={16}/>Cada pessoa acessa apenas sua área.</div>
    </section></main></div>;
}
