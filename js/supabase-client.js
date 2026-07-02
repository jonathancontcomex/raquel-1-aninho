// Instancia o client do Supabase a partir das credenciais em supabase-config.js.
// Nome "sbClient" (em vez de "supabase") para não colidir com o objeto global
// da biblioteca carregada via CDN.
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
