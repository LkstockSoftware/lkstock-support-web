import { json, requireOperator, supabase } from './_lib.js';

export async function GET(request) {
  const auth = await requireOperator(request);
  if (auth.error) return auth.error;
  const conversationId = new URL(request.url).searchParams.get('conversationId');
  if (!conversationId) return json(400, { error: 'conversation_id_required' });
  try {
    const rows = await supabase(`wa_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id,direction,message_type,body,automation_status,delivery_status,created_at&order=created_at.asc&limit=250`);
    return json(200, { messages: rows || [] });
  } catch {
    return json(502, { error: 'message_store_unavailable' });
  }
}
