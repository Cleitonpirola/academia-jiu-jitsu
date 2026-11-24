import { GraduacoesProvider } from './graduacoes';
import { ResponsavelPortal } from './pages/ResponsavelPortal';
import { useEffect, useId, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { SENHA_MINIMA, type AuthState } from '@tatame/shared';
import App from './App';
import { StudentPortal } from './pages/StudentPortal';
import { api } from './lib';
import { Button, Field, FormError } from './components';
import './auth-password.css';

function CampoSenha({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  const [visivel, setVisivel] = useState(false);
  return <div className="field auth-password-field">
    <label htmlFor={id}>{label}</label>
    <div className="auth-password-control">
      <input {...props} id={id} type={visivel ? 'text' : 'password'}/>
      <button type="button" aria-label={`${visivel ? 'Ocultar' : 'Mostrar'} ${label === 'Confirme a senha' ? 'confirmação da senha' : 'senha'}`} onClick={() => setVisivel(valor => !valor)}>
        {visivel ? <EyeOff size={18} aria-hidden="true"/> : <Eye size={18} aria-hidden="true"/>}
      </button>
    </div>
  </div>;
}

export default function AuthGate() {
  const [state, setState] = useState<AuthState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('ativar') ?? '');
  const [tokenRecuperacao, setTokenRecuperacao] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('redefinir') ?? '');
  const [solicitando, setSolicitando] = useState(false);
  const [recuperacaoInvalida, setRecuperacaoInvalida] = useState(false);
  const [aviso, setAviso] = useState('');
  const load = async () => {
    setError('');
    try {
      const estado = await api<AuthState>('/auth/estado');
      if (tokenRecuperacao) {
        const resultado = estado.recuperacaoDisponivel && await api<{ valido: boolean }>('/auth/validar-recuperacao', {
          method: 'POST', body: JSON.stringify({ token: tokenRecuperacao }),
        });
        setRecuperacaoInvalida(!resultado || !resultado.valido);
      }
      setState(estado);
    }
    catch (error) { setError((error as Error).message); }
  };
  useEffect(() => {
    if (token || tokenRecuperacao) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    void load();
    const expired = () => { setState(current => ({ ...current, configuracaoInicial: false, usuario: null })); setSenha(''); setError('Sua sessão terminou. Entre novamente.'); };
    window.addEventListener('tatame:session-expired', expired);
    return () => window.removeEventListener('tatame:session-expired', expired);
  }, []);
  const logout = async () => {
    setError('');
    try { await api('/auth/sair', { method: 'POST' }); setState(current => ({ ...current, configuracaoInicial: false, usuario: null })); setSenha(''); setConfirmacao(''); }
    catch (error) { setError((error as Error).message); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setAviso('');
    if (novaSenha && senha !== confirmacao) { setError('As senhas precisam ser iguais.'); return; }
    setBusy(true);
    try {
      if (solicitando) {
        await api('/auth/recuperar-senha', { method: 'POST', body: JSON.stringify({ email }) });
        setAviso('Se o e-mail estiver vinculado a uma conta ativa, você receberá um link para redefinir a senha.');
      } else if (tokenRecuperacao) {
        await api('/auth/redefinir-senha', { method: 'POST', body: JSON.stringify({ token: tokenRecuperacao, senha }) });
        setState(current => ({ ...current, configuracaoInicial: false, usuario: null }));
        setTokenRecuperacao('');
        setToken('');
        setAviso('Senha atualizada. Entre com a nova senha.');
      } else {
        const path = token ? '/ativar' : setup ? '/configurar' : '/entrar';
        const body = token ? { token, senha } : setup ? { nome, email, senha } : { email, senha };
        setState(await api<AuthState>('/auth' + path, { method: 'POST', body: JSON.stringify(body) }));
        setToken('');
      }
      setSenha(''); setConfirmacao('');
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  const setup = Boolean(state?.configuracaoInicial && !token && !tokenRecuperacao && !solicitando);
  const novaSenha = Boolean(setup || token || tokenRecuperacao);
  const recuperando = solicitando || Boolean(tokenRecuperacao);
  const voltar = () => { setSolicitando(false); setTokenRecuperacao(''); setRecuperacaoInvalida(false); setToken(''); setSenha(''); setConfirmacao(''); setError(''); setAviso(''); };
  const solicitarLink = () => { voltar(); setSolicitando(true); };
  if (state?.usuario && !token && !recuperando) return <GraduacoesProvider key={state.usuario.id}>{error && <div className="auth-session-error"><FormError message={error}/></div>}{state.usuario.perfil === 'admin' ? <App key={state.usuario.id} usuario={state.usuario} onLogout={() => void logout()}/> : state.usuario.perfil === 'responsavel' ? <ResponsavelPortal key={state.usuario.id} onLogout={() => void logout()}/> : <StudentPortal key={state.usuario.id} onLogout={() => void logout()}/>}</GraduacoesProvider>;
  const titulo = solicitando ? 'Recupere seu acesso' : recuperacaoInvalida ? 'Link inválido ou expirado' : tokenRecuperacao ? 'Escolha uma nova senha' : token ? 'Ative seu acesso' : setup ? 'Vamos preparar sua academia' : 'Bom ter você por aqui.';
  const descricao = solicitando ? 'Informe o e-mail que você usa no Tatame.' : recuperacaoInvalida ? 'Solicite um novo e-mail para redefinir sua senha.' : tokenRecuperacao ? 'Depois de salvar, entre com sua nova senha.' : token ? 'Escolha sua senha para entrar na sua área. O link vale por 24 horas e pode ser usado uma vez.' : setup ? 'Crie a conta do administrador. Essa configuração acontece uma única vez, neste computador.' : 'Entre para acompanhar os treinos ou cuidar da sua academia.';
  const acao = solicitando ? 'Enviar link' : tokenRecuperacao ? 'Salvar nova senha' : token ? 'Ativar minha conta' : setup ? 'Criar minha conta' : 'Entrar';
  return <div className="auth-shell"><aside className="auth-story"><a className="brand" href="/"><span className="brand-mark">t</span><div>tatame<small>DA ACADEMIA PARA A SUA VIDA</small></div></a><div><span className="auth-kicker">SEU PRÓXIMO TREINO COMEÇA AQUI</span><h1>Dentro do tatame.<br/>Conectado com a sua evolução.</h1><p>Uma academia organizada. Uma jornada de treino que acompanha você.</p></div><small>Respeito, constância e evolução. Oss!</small></aside>
    <main className="auth-main"><section className="auth-card"><span className="auth-icon"><LockKeyhole size={25}/></span><div className="eyebrow">BEM-VINDO AO TATAME</div><h2>{titulo}</h2><p className="auth-description">{descricao}</p><FormError message={error}/>{aviso && <p className="portal-notice" role="status">{aviso}</p>}
      {!state ? error ? <Button variant="secondary" onClick={() => void load()}>Tentar conexão novamente</Button> : <p role="status" aria-live="polite">Conferindo acesso…</p> : recuperacaoInvalida ? (
        state.recuperacaoDisponivel && <Button onClick={solicitarLink}>Solicitar novo link</Button>
      ) : <form onSubmit={submit}>
        {setup && <Field label="Seu nome"><input required minLength={2} maxLength={120} autoComplete="name" value={nome} onChange={event => setNome(event.target.value)}/></Field>}
        {!token && !tokenRecuperacao && <Field label="E-mail"><input required type="email" maxLength={180} autoComplete="username" value={email} onChange={event => setEmail(event.target.value)}/></Field>}
        {!solicitando && <CampoSenha key={novaSenha ? 'nova' : 'atual'} label={novaSenha ? 'Crie uma senha' : 'Senha'} required minLength={novaSenha ? SENHA_MINIMA : 1} maxLength={128} autoComplete={novaSenha ? 'new-password' : 'current-password'} value={senha} onChange={event => setSenha(event.target.value)}/>}
        {novaSenha && <><p className="helper">Use pelo menos {SENHA_MINIMA} caracteres. Espaços só entre palavras.</p><CampoSenha label="Confirme a senha" required minLength={SENHA_MINIMA} maxLength={128} autoComplete="new-password" value={confirmacao} onChange={event => setConfirmacao(event.target.value)}/></>}
        <Button type="submit" disabled={busy}>{busy ? 'Aguarde…' : acao}<ArrowRight size={17}/></Button>
      </form>}
      {state && !setup && !token && !recuperando && (state.recuperacaoDisponivel
        ? <><Button variant="ghost" disabled={busy} onClick={solicitarLink}>Esqueci minha senha</Button><p className="auth-help">Primeiro acesso? Peça à academia um link de acesso.</p></>
        : <p className="auth-help">Primeiro acesso? Peça à academia um convite.</p>)}
      {(token || recuperando) && <Button variant="ghost" disabled={busy} onClick={voltar}>Voltar para o login</Button>}
      <div className="auth-trust"><ShieldCheck size={16}/>Cada pessoa acessa apenas sua área.</div>
    </section></main></div>;
}
