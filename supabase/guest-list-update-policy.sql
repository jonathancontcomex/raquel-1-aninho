-- Rode no SQL Editor do Supabase.
-- Faltava a permissão de UPDATE na lista de convidados (só existia
-- select/insert/delete) — por isso confirmar/desfazer não salvava nada.

create policy "Admins podem atualizar a lista de convidados"
  on public.guest_list
  for update
  to authenticated
  using (true)
  with check (true);
