-- Rode este script inteiro no SQL Editor do Supabase (Project > SQL Editor > New query > Run).

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('confirmed','declined')),
  host_first text not null,
  host_last text not null,
  people jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;

-- Convidados (não autenticados) podem enviar o próprio RSVP, mas nunca ler a lista.
create policy "Guests can submit RSVP"
  on public.rsvps
  for insert
  to anon
  with check (true);

-- Só usuários autenticados (você, o organizador) podem ler a lista de confirmados.
create policy "Admins can read RSVPs"
  on public.rsvps
  for select
  to authenticated
  using (true);
