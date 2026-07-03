-- Corrige as políticas do mural: elas só liberavam acesso para "anon"
-- (não logado). Quem está logado como admin (authenticated) ficava de fora
-- também — via 0 fotos e não conseguia enviar. Rode este script inteiro no
-- SQL Editor do Supabase.

-- Tabela mural_photos: leitura e envio para qualquer pessoa, logada ou não
drop policy if exists "Qualquer pessoa pode ver a lista de fotos do mural" on public.mural_photos;
create policy "Qualquer pessoa pode ver a lista de fotos do mural"
  on public.mural_photos
  for select
  to public
  using (true);

drop policy if exists "Qualquer pessoa pode registrar uma foto no mural" on public.mural_photos;
create policy "Qualquer pessoa pode registrar uma foto no mural"
  on public.mural_photos
  for insert
  to public
  with check (true);

-- Storage (arquivos das fotos): mesma correção
drop policy if exists "Qualquer pessoa pode enviar foto ao mural" on storage.objects;
create policy "Qualquer pessoa pode enviar foto ao mural"
  on storage.objects
  for insert
  to public
  with check (bucket_id = 'mural-fotos');

drop policy if exists "Qualquer pessoa pode ver as fotos do mural" on storage.objects;
create policy "Qualquer pessoa pode ver as fotos do mural"
  on storage.objects
  for select
  to public
  using (bucket_id = 'mural-fotos');

-- (As políticas de apagar continuam só para "authenticated" — isso já estava certo)
