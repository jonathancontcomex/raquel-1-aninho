-- Rode no SQL Editor do Supabase.
-- Permite que o admin logado exclua uma confirmação (ex: duplicada ou
-- enviada por engano) direto pelo painel.

create policy "Admins podem excluir confirmacoes"
  on public.rsvps
  for delete
  to authenticated
  using (true);
