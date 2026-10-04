import { syncNotionTicket } from './_notion.js';
import { json, readJson, requireOperator, supabase } from './_lib.js';

const transitions = {
  takeover: { status: 'manual' },
  return_to_bot: { status: 'bot' },
  close: { status: 'closed' },
};

function cleanText(value, maxLength = 160) {
  return String(value || '').trim().slice(0, maxLength);
}

export async function POST(request) {
  const auth = await requireOperator(request);
  if (auth.error) return auth.error;
  let body;
  try { body = await readJson(request); } catch { return json(400, { error: 'invalid_json' }); }
  const conversationId = String(body.conversationId || '');
  if (!conversationId) return json(400, { error: 'conversation_id_required' });

  try {
    if (body.action === 'profile_update') {
      const profile = {
        display_name: cleanText(body.displayName),
        company_id: cleanText(body.companyId, 80),
        company_name: cleanText(body.companyName),
      };
      await supabase(`wa_conversations?id=eq.${encodeURIComponent(conversationId)}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(profile),
      });
      await supabase('wa_operator_actions', {
        method: 'POST', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ conversation_id: conversationId, action: 'profile_update', operator_name: auth.user.email }),
      });
      return json(200, { ok: true, profile });
    }

    if (body.action === 'pin' || body.action === 'unpin') {
      const pinned = body.action === 'pin';
      await supabase(`wa_conversations?id=eq.${encodeURIComponent(conversationId)}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ pinned }),
      });
      await supabase('wa_operator_actions', {
        method: 'POST', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ conversation_id: conversationId, action: body.action, operator_name: auth.user.email }),
      });
      return json(200, { ok: true, pinned });
    }

    const transition = transitions[body.action];
    if (!transition) return json(400, { error: 'invalid_operator_action' });
    const handoff = body.action === 'return_to_bot'
      ? { ...transition, handoff_by: null, handoff_at: null }
      : { ...transition, handoff_by: auth.user.email, handoff_at: new Date().toISOString() };
    await supabase(`wa_conversations?id=eq.${encodeURIComponent(conversationId)}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(handoff),
    });
    await supabase('wa_operator_actions', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ conversation_id: conversationId, action: body.action, operator_name: auth.user.email }),
    });
    const notionTicketsUpdated = await syncNotionTicket(conversationId, body.action);
    return json(200, { ok: true, status: handoff.status, notionTicketsUpdated });
  } catch {
    return json(502, { error: 'operator_action_not_saved' });
  }
}
