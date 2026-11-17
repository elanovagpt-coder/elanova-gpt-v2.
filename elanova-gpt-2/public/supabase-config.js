
const SUPABASE_URL = "https://uibifjibjnbqwqnziddv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qLzHmmCnTlhGxK6Lx5630g_N8DE2Vz9";

window.elanovaSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
