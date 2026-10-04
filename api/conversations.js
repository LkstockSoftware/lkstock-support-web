import { json, requireOperator, supabase } from './_lib.js';

export async function GET(request) {
  const auth = await requireOperator(request);
  if (auth.error) return auth.error;
  const search = new URL(request.url).searchParams.get('search')?.trim() || '';
  try {
    let query = 'wa_conversations?select=id,wa_id,display_name,company_id,company_name,pinned,status,last_message_at,updated_at&order=pinned.desc,updated_at.desc&limit=100';
    if (search) {
      const term = encodeURIComponent(`*${search.replace(/[,*()]/g, '')}*`);
      query += `&or=(display_name.ilike.${term},company_id.ilike.${term},company_name.ilike.${term},wa_id.ilike.${term})`;
    }
    const rows = await supabase(query);
    return json(200, { conversations: rows || [] });
  } catch {
    return json(502, { error: 'conversation_store_unavailable' });
  }
}
