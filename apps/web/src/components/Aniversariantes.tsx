import { useEffect, useState } from 'react';
import { Cake, Sparkles } from 'lucide-react';
import { useAcademia } from '../store';
import { Person } from '../components';
import { today, dateLabel } from '../lib';
import { aniversariantesDoDia, mensagemAniversario } from '../aniversarios';

export function Aniversariantes() {
  const { alunos } = useAcademia();
  const [dia, setDia] = useState(today);
  useEffect(() => {
    const update = () => setDia(today());
    const timer = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); window.removeEventListener('focus', update); };
  }, []);
  const birthdays = aniversariantesDoDia(alunos, dia);
  return <section className="card birthday-card" aria-labelledby="birthday-title">
    <div className="card-heading"><div><h2 id="birthday-title"><Cake size={19}/>Aniversariantes do dia</h2><p>Celebrando quem faz parte do nosso tatame · {dateLabel(dia)}</p></div><span className="birthday-icon"><Sparkles size={23}/></span></div>
    {birthdays.length ? <div className="birthday-list">{birthdays.map(aluno => <article key={aluno.id}><Person name={aluno.nome} secondary="Hoje é o seu dia!"/><p>{mensagemAniversario(aluno.nome)}</p></article>)}</div>
      : <p className="birthday-empty">Nenhum aluno ativo faz aniversário hoje. As homenagens aparecerão aqui na data cadastrada.</p>}
  </section>;
}
