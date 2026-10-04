import { json, requireOperator, supabase } from './_lib.js';

export async function GET(request) {
  const auth = await requireOperator(request);
  if (auth.error) return auth.error;
  try {
    const rows = await supabase('wa_conversations?select=id,wa_id,display_name,company_name,status,last_message_at,updated_at&order=updated_at.desc&limit=100');
    return json(200, { conversations: rows || [] });
  } catch {
    return json(502, { error: 'conversation_store_unavailable' });
  }
}
