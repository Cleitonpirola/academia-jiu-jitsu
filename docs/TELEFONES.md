# Telefone: máscara e edição

Atualização de 26/10/2026. Componente compartilhado TelefoneInput nos cadastros/edição de aluno, perfil próprio, responsável e ativação de acesso próprio. Exibição formatada na lista e ficha de alunos e no portal.

- Celular brasileiro: (11) 99999-1234. Fixo: (11) 3333-1234.
- DDD e número recebem parênteses, espaço e hífen durante digitação/colagem. Número nacional limitado a 11 dígitos; letras são removidas.
- Colagem com código 55 reconhecido mostra +55 (11) 99999-1234. Outro país com + preserva até 15 dígitos, sem forçar DDD brasileiro.
- Cursor acompanha dígitos ao editar o meio. Backspace/Delete junto à pontuação removem um dígito, evitando travar na máscara.
- Validação de formato completo no formulário. Opcional continua permitido para menor sem telefone próprio. Backend mantém as validações anteriores; não houve migração nem regravação automática de contatos antigos.
- Exibição preserva número legado longo desconhecido em vez de cortá-lo silenciosamente. Quem edita precisa conferir o número antes de salvar.

Quatro testes novos de máscara/cursor, suíte completa com 222 testes e build/typecheck aprovados. Navegador fictício confirmou colar 12 dígitos e limitar/formatar, apagar junto ao parêntese e salvar/exibir telefone fixo. Não houve envio de SMS, WhatsApp ou alteração de contato real para demonstração.
