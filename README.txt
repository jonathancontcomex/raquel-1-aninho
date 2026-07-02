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

Próximo passo:
- Exportação da lista de confirmados (Excel/PDF) direto do painel.
- Publicar o site (hospedagem/domínio) quando o conteúdo estiver fechado.
