-- Rode este script no SQL Editor do Supabase.
-- Adiciona confirmação manual (com sugestões) na lista de convidados, em vez
-- de adivinhar sozinho quando há nomes repetidos (ex: vários "Tiago").

alter table public.guest_list
  add column if not exists matched_rsvp_id uuid references public.rsvps(id) on delete set null,
  add column if not exists matched_person_name text;
