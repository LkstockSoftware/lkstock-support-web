import { allowedOperator, json, readJson } from '../_lib.js';

export async function POST(request) {
  let body;
  try {
    body = await readJson(request);
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!allowedOperator(email, process.env.ALLOWED_OPERATOR_EMAIL)) {
    return json(403, { error: 'operator_not_allowed' });
  }
  if (password.length < 8) {
    return json(400, { error: 'invalid_credentials' });
  }

  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) return json(401, { error: 'invalid_credentials' });
  const session = await response.json();
  if (!session?.access_token) return json(401, { error: 'invalid_credentials' });
  return json(200, { access_token: session.access_token });
}
