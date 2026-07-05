-- Rode no SQL Editor do Supabase.
-- Permite que o admin logado corrija dados de uma confirmação (ex: idade
-- errada, nome digitado errado) direto pelo painel.

create policy "Admins podem corrigir confirmacoes"
  on public.rsvps
  for update
  to authenticated
  using (true)
  with check (true);
