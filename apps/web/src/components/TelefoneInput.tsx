import { useLayoutEffect, useRef, type InputHTMLAttributes } from 'react';
import { cursorAposDigitos, mascaraTelefone, telefoneLabel } from '../telefone';

export function TelefoneInput({ value, onValueChange, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & { value: string; onValueChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null), cursor = useRef<number | null>(null);
  useLayoutEffect(() => { if (cursor.current !== null) { ref.current?.setSelectionRange(cursor.current, cursor.current); cursor.current = null; } });
  return <input {...props} ref={ref} type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-1234"
    pattern={'(?:\\([0-9]{2}\\) [0-9]{4,5}-[0-9]{4}|\\+55 \\([0-9]{2}\\) [0-9]{4,5}-[0-9]{4}|\\+[0-9]{8,15})'}
    title="Informe DDD e telefone: (11) 99999-1234 ou (11) 3333-1234. Para outro país, comece com +."
    value={telefoneLabel(value)} onChange={event => {
      const raw = event.target.value, before = raw.slice(0, event.target.selectionStart ?? raw.length).replace(/\D/g, '').length;
      const formatted = mascaraTelefone(raw); cursor.current = cursorAposDigitos(formatted, before); onValueChange(formatted);
    }} onKeyDown={event => {
      if (!['Backspace', 'Delete'].includes(event.key)) return;
      const input = event.currentTarget, start = input.selectionStart ?? 0;
      if (start !== input.selectionEnd) return;
      let pos = event.key === 'Backspace' ? start - 1 : start;
      if (pos < 0 || pos >= input.value.length || /\d/.test(input.value[pos])) return;
      while (pos >= 0 && pos < input.value.length && !/\d/.test(input.value[pos])) pos += event.key === 'Backspace' ? -1 : 1;
      if (pos < 0 || pos >= input.value.length) return;
      event.preventDefault();
      const formatted = mascaraTelefone(input.value.slice(0, pos) + input.value.slice(pos + 1));
      cursor.current = cursorAposDigitos(formatted, input.value.slice(0, pos).replace(/\D/g, '').length);
      onValueChange(formatted);
    }}/>;
}
