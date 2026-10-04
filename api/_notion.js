const DATA_SOURCE_ID = '73d8a2e0-32fa-483a-8028-9989541c125c';

export function notionState(action) {
  const states = { takeover: 'En atención', return_to_bot: 'Pendiente', close: 'Cerrado' };
  if (!states[action]) throw new Error('unsupported_notion_action');
  return states[action];
}

async function notion(path, options = {}, env = process.env) {
  const response = await fetch(`https://api.notion.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${env.NOTION_API_KEY}`,
      'notion-version': '2025-09-03',
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`notion_${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export async function syncNotionTicket(conversationId, action, env = process.env) {
  const state = notionState(action);
  const results = await notion(`/v1/data_sources/${DATA_SOURCE_ID}/query`, {
    method: 'POST',
    body: JSON.stringify({ filter: { property: 'Conversación ID', rich_text: { equals: conversationId } } }),
  }, env);
  let updated = 0;
  for (const page of results.results || []) {
    await notion(`/v1/pages/${page.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties: {
        Estado: { select: { name: state } },
        'Última actualización': { date: { start: new Date().toISOString() } },
      } }),
    }, env);
    updated += 1;
  }
  return updated;
}
