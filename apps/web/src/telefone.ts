function nacional(digits: string) {
  const value = digits.slice(0, 11);
  if (!value) return '';
  if (value.length <= 2) return '(' + value;
  const local = value.slice(2), corte = local.length > 8 ? 5 : 4;
  return `(${value.slice(0, 2)}) ${local.slice(0, corte)}${local.length > corte ? '-' + local.slice(corte) : ''}`;
}
export function mascaraTelefone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (value.trim().startsWith('+')) {
    if (digits.startsWith('55')) return '+55' + (digits.length > 2 ? ' ' + nacional(digits.slice(2)) : '');
    return '+' + digits.slice(0, 15);
  }
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return '+55 ' + nacional(digits.slice(2));
  return nacional(digits);
}
/** Exibição não corta um telefone legado com formato internacional/desconhecido. */
export function telefoneLabel(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length > 11 && !value.trim().startsWith('+') && !(digits.startsWith('55') && digits.length <= 13) ? value : mascaraTelefone(value);
}
export function cursorAposDigitos(value: string, quantidade: number) {
  if (!quantidade) return 0;
  let vistos = 0;
  for (let i = 0; i < value.length; i++) if (/\d/.test(value[i]) && ++vistos === quantidade) return i + 1;
  return value.length;
}
