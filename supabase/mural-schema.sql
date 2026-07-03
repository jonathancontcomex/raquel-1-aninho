-- Rode este script inteiro no SQL Editor do Supabase (Project > SQL Editor > New query > Run).
-- Cria o "Mural da Festa": convidados sobem fotos pelo celular, sem precisar de login.

-- 1) Bucket de armazenamento das fotos (público, para as imagens poderem ser exibidas direto por URL)
insert into storage.buckets (id, name, public)
values ('mural-fotos', 'mural-fotos', true)
on conflict (id) do nothing;

-- 2) Regras de acesso ao armazenamento
create policy "Qualquer pessoa pode enviar foto ao mural"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'mural-fotos');

create policy "Qualquer pessoa pode ver as fotos do mural"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'mural-fotos');

create policy "Admins podem apagar fotos do mural"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'mural-fotos');

-- 3) Tabela com os metadados de cada foto (quem mandou, quando)
create table public.mural_photos (
  id uuid primary key default gen_random_uuid(),
  guest_name text,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.mural_photos enable row level security;

create policy "Qualquer pessoa pode registrar uma foto no mural"
  on public.mural_photos
  for insert
  to anon
  with check (true);

create policy "Qualquer pessoa pode ver a lista de fotos do mural"
  on public.mural_photos
  for select
  to anon
  using (true);

create policy "Admins podem apagar registros do mural"
  on public.mural_photos
  for delete
  to authenticated
  using (true);
