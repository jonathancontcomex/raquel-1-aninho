# Projeto Raquel — Birthday Experience

Site estático (sem build) para o convite e experiência do 1º aniversário da Raquel.
Publicado no GitHub Pages: https://jonathancontcomex.github.io/raquel-1-aninho/
Repositório: jonathancontcomex/raquel-1-aninho (público)

## Informações do evento
Ficam hardcoded em [index.html](index.html) (hero + card de agradecimento) e
duplicadas nos links de "Como chegar" / "Adicionar ao calendário":
- Data: 26 de julho de 2026, 12h30
- Local: Buffet Zupaloo — R. Cantagalo, 1553 - Tatuapé, São Paulo - SP, 03319-001

Ao mudar data/local, atualizar em pelo menos 3 lugares no index.html: o card
de info do hero, o link do Google Maps e o link do Google Calendar (formato
`YYYYMMDDTHHMMSSZ`, em UTC — horário local -3h).

## Estrutura
- `index.html` + `css/style.css` + `js/app.js` — convite público e fluxo de RSVP
  (nome/sobrenome → acompanhantes → resumo → confirmação).
- `js/supabase-config.js` / `js/supabase-client.js` — credenciais públicas
  (publishable key, segura no front) e client do Supabase, via CDN.
- `painel/` — painel administrativo (estatísticas, lista de convidados x
  confirmados, edição/correção de RSVPs, exportação CSV/PDF). Login real via
  Supabase Auth; usuários criados manualmente em Authentication > Users no
  Supabase (não há cadastro pelo site).
- `mural/` — upload público de fotos pelos convidados (sem login), galeria
  pública. Moderação (apagar foto) só para quem está logado como admin.
- `slideshow/` — apresentação das fotos.
- `supabase/*.sql` — schemas e policies; rodar manualmente no SQL Editor do
  Supabase quando uma feature nova exigir (não há migração automática).
- `assets/fotos/` — sequência da história (gravidez → 11 meses) usada na
  galeria do index. `assets/illustrations/` — ilustrações do tema
  conto-de-fadas; `fontes-originais/` guarda as imagens antes do recorte.

## Notas
- Projeto 100% estático — sem bundler, sem package.json. Editar HTML/CSS/JS
  direto e testar abrindo no navegador (ou GitHub Pages após push).
- Histórico completo de decisões por sprint está em [README.txt](README.txt) —
  consultar antes de reintroduzir algo que já foi resolvido.
- Pendências conhecidas: ilustração dedicada para o card "Você terá
  acompanhantes?" (passo 2); ilustração do painel ainda não encaixada
  (`assets/illustrations/fontes-originais/original-painel.png`); acompanhar
  uso de storage do Supabase (plano grátis ~1GB) no dia da festa.
