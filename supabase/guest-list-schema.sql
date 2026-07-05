-- Rode este script inteiro no SQL Editor do Supabase.
-- Cria a lista mestre de convidados, para comparar com quem já confirmou.
-- Acesso restrito a quem estiver logado como admin (mesma conta do /painel/).

create table public.guest_list (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.guest_list enable row level security;

create policy "Admins podem ver a lista de convidados"
  on public.guest_list
  for select
  to authenticated
  using (true);

create policy "Admins podem adicionar na lista de convidados"
  on public.guest_list
  for insert
  to authenticated
  with check (true);

create policy "Admins podem remover da lista de convidados"
  on public.guest_list
  for delete
  to authenticated
  using (true);
