-- Rode este script inteiro no SQL Editor do Supabase (Project > SQL Editor > New query > Run).
-- Cria a área de fotos da família: só o admin (organizador) sobe as fotos pelo
-- painel, e a página pública /slideshow/ fica passando elas em loop (para TV do Buffet).

-- 1) Bucket de armazenamento das fotos (público para leitura, upload só para admin)
insert into storage.buckets (id, name, public)
values ('familia-fotos', 'familia-fotos', true)
on conflict (id) do nothing;

-- 2) Regras de acesso ao armazenamento
create policy "Qualquer pessoa pode ver as fotos da familia"
  on storage.objects
  for select
  to public
  using (bucket_id = 'familia-fotos');

create policy "Admins podem enviar fotos da familia"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'familia-fotos');

create policy "Admins podem apagar fotos da familia"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'familia-fotos');

-- 3) Tabela com os metadados de cada foto (ordem = ordem de upload, usada no slideshow)
create table public.familia_fotos (
  id uuid primary key default gen_random_uuid(),
  ordem bigserial,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.familia_fotos enable row level security;

create policy "Qualquer pessoa pode ver a lista de fotos da familia"
  on public.familia_fotos
  for select
  to public
  using (true);

create policy "Admins podem registrar fotos da familia"
  on public.familia_fotos
  for insert
  to authenticated
  with check (true);

create policy "Admins podem apagar registros de fotos da familia"
  on public.familia_fotos
  for delete
  to authenticated
  using (true);
