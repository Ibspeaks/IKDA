// IKDA LIVE - Supabase Configuration

const SUPABASE_URL = "https://dvskuudjamineqbvvjld.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_r8v8E93qy_DpvNhL9pvyKQ_HZBLaBm5";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
