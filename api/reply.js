import { syncNotionTicket } from './_notion.js';
import { json, readJson, requireOperator, supabase } from './_lib.js';

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export async function POST(request) {
  const auth = await requireOperator(request);
  if (auth.error) return auth.error;
  let body;
  try { body = await readJson(request); } catch { return json(400, { error: 'invalid_json' }); }
  const conversationId = String(body.conversationId || '');
  const text = String(body.text || '').trim();
  if (!conversationId || !text || text.length > 4096) return json(400, { error: 'invalid_reply' });
  try {
    const conversations = await supabase(`wa_conversations?id=eq.${encodeURIComponent(conversationId)}&select=id,wa_id,status`);
    if (conversations.length !== 1) return json(404, { error: 'conversation_not_found' });
    const conversation = conversations[0];
    const waId = normalizePhone(conversation.wa_id);
    await supabase(`wa_conversations?id=eq.${encodeURIComponent(conversationId)}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'manual', handoff_by: auth.user.email, handoff_at: new Date().toISOString() }),
    });
    const meta = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID}/messages`, {
      method: 'POST', headers: { authorization: `Bearer ${process.env.WHATSAPP_CLOUD_ACCESS_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: waId, type: 'text', text: { preview_url: false, body: text } }),
    });
    if (!meta.ok) return json(502, { error: 'whatsapp_message_not_accepted' });
    const provider = await meta.json();
    const wamid = provider.messages?.[0]?.id;
    if (!wamid) return json(502, { error: 'whatsapp_message_id_missing' });
    await supabase('wa_messages?on_conflict=provider_message_id', {
      method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ provider_message_id: wamid, conversation_id: conversationId, direction: 'outbound', message_type: 'text', body: text, delivery_status: 'sent', raw_event: { source: 'operator_portal', operator_name: auth.user.email } }),
    });
    await supabase(`wa_messages?provider_message_id=eq.${encodeURIComponent(wamid)}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ body: text }),
    });
    const notionTicketsUpdated = await syncNotionTicket(conversationId, 'takeover');
    return json(200, { ok: true, delivery_status: 'sent', notionTicketsUpdated });
  } catch {
    return json(502, { error: 'reply_not_completed' });
  }
}
