-- Rode este script no SQL Editor do Supabase (Project > SQL Editor > New query > Run).
-- Permite que o admin logado reordene as fotos da família no painel (setas ◀ ▶),
-- alterando a coluna `ordem` de public.familia_fotos. Sem esta policy, o update
-- é bloqueado pela Row Level Security e a reordenação falha silenciosamente.

drop policy if exists "Admins podem reordenar fotos da familia" on public.familia_fotos;
create policy "Admins podem reordenar fotos da familia"
  on public.familia_fotos
  for update
  to authenticated
  using (true)
  with check (true);
