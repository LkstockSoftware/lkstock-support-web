import { json, readJson, requireOperator } from '../_lib.js';

export async function POST(request) {
  const auth = await requireOperator(request);
  if (auth.error) return auth.error;

  let body;
  try {
    body = await readJson(request);
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const password = String(body.password || '');
  if (password.length < 12) {
    return json(400, { error: 'password_too_short' });
  }

  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      authorization: request.headers.get('authorization'),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) return json(502, { error: 'password_not_saved' });
  return json(200, { saved: true });
}
