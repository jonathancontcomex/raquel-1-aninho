Projeto Raquel • Birthday Experience

Sprint 1 + 2 inicial:
- Estrutura modular: index.html, css/style.css, js/app.js, assets/fotos.
- Convite premium com tema de conto de fadas e princesas ilustrativas originais.
- RSVP nominal: nome + sobrenome; ao continuar, convidado principal entra como adulto.
- Fluxo "Infelizmente, eu não irei".
- Familiares restritos à família do convidado, com Adulto ou Criança até 7 anos.
- Painel administrativo local via localStorage para validação inicial.

Sprint 3:
- Painel administrativo separado do convite público: agora vive em painel/
  (painel/index.html, painel/painel.css, painel/painel.js) e não aparece mais
  para quem acessa o convite (index.html).
- Acesso ao painel protegido por senha simples (painel/painel.js, constante
  ADMIN_PASSWORD = 'raquel2026'). ATENÇÃO: como o projeto ainda é 100%
  estático, isso NÃO é segurança real — é só uma barreira contra convidados
  casuais. Troque a senha antes de publicar e não divulgue o link do painel.
- Painel e convite continuam lendo o mesmo localStorage ('raquel_rsvp_v1'),
  então ambos precisam estar no mesmo navegador/dispositivo até o backend
  real entrar (próximo passo abaixo).

Sprint 4:
- localStorage substituído por Supabase (Postgres real). Tabela `rsvps`
  criada via supabase/schema.sql (rode esse script no SQL Editor do projeto
  Supabase antes de usar).
- Credenciais públicas do Supabase em js/supabase-config.js (SUPABASE_URL e
  SUPABASE_KEY — é a "publishable key", segura para expor no front-end) e o
  client em js/supabase-client.js. Ambos carregados por CDN
  (@supabase/supabase-js@2), sem precisar de build.
- js/app.js: ao confirmar ou recusar presença, o RSVP é inserido direto na
  tabela `rsvps` do Supabase (insert), com feedback de erro se a internet
  falhar.
- painel/painel.js: login trocado de senha fixa no código para autenticação
  real via Supabase Auth (e-mail + senha). Sessão persiste entre visitas até
  fazer logout. A leitura da lista de confirmados (select) só é permitida
  para usuários autenticados — regra aplicada no banco via Row Level
  Security (ver supabase/schema.sql), não apenas na tela.
- Para dar acesso ao painel a outra pessoa (ex: um segundo organizador),
  crie o usuário dela em Authentication > Users no painel do Supabase — não
  há cadastro pelo próprio site.

Sprint 5:
- Site publicado no GitHub Pages: https://jonathancontcomex.github.io/raquel-1-aninho/
  (painel em /painel/). Repositório GitHub: jonathancontcomex/raquel-1-aninho
  (público — necessário para Pages funcionar no plano gratuito).
- Redesenho visual: convite, card "Quem é você?", card de resumo/confirmação
  e tela de agradecimento agora usam ilustrações reais (castelo, princesas,
  coroa etc. em assets/illustrations/frame-*.jpg) como fundo, com o texto de
  verdade (nome, data, endereço, formulário) sobreposto por cima via CSS —
  nada de texto "chapado" em imagem, tudo continua editável/acessível.
- assets/illustrations/fontes-originais/ guarda as imagens originais (antes
  do recorte) caso precise recortar de novo ou ajustar posições.
- Falta uma ilustração equivalente para o card "Você terá acompanhantes?"
  (passo 2) — por enquanto ele usa um tratamento decorativo mais simples
  (borda dourada + cantos com recortes do castelo/rosas). Se gerar essa
  ilustração no mesmo estilo das outras, é só pedir para eu encaixar.
- Imagens comprimidas para JPEG (~200-300KB cada, eram 2-3MB em PNG) para
  o site carregar rápido.

Sprint 6:
- Galeria de fotos da página inicial trocada por uma sequência da história:
  gravidez (foto de capa, "Onde tudo começou"), recém-nascida, 3, 6, 9 e 11
  meses (assets/fotos/). Legendas condizentes em index.html.
- Mural da Festa (mural/): página nova onde qualquer convidado sobe fotos
  pelo celular sem precisar de login (nome é opcional), e todas ficam
  arquivadas permanentemente numa galeria pública. Link "📸 Mural da Festa"
  aparece no convite e na tela de agradecimento.
  - Fotos guardadas no Supabase Storage (bucket `mural-fotos`, público) e
    registradas na tabela `mural_photos` — schema em supabase/mural-schema.sql
    (rode esse script no SQL Editor antes de usar).
  - Envio é aberto (anon insert) de propósito, para não ter fricção na hora
    da festa — qualquer pessoa com o link pode enviar qualquer imagem.
  - Moderação: quem estiver logado como admin (mesma conta do /painel/) vê um
    botão de apagar em cada foto do mural — remove do Storage e do banco.
    Sessão de login é compartilhada entre /painel/ e /mural/ (mesmo domínio).
  - Limite de 8MB por foto (validado no navegador antes de enviar).

Próximo passo:
- Ilustração dedicada para o card de acompanhantes (passo 2).
- Exportação da lista de confirmados (Excel/PDF) direto do painel.
- Ilustração do painel administrativo (assets/illustrations/fontes-originais/original-painel.png
  já existe, mas ainda não foi encaixada — tem gráfico de rosca e cards que
  exigem mais trabalho para casar com dados dinâmicos).
- Acompanhar o uso de armazenamento do Supabase (plano grátis tem limite,
  ~1GB) conforme as fotos do mural forem chegando no dia da festa.
