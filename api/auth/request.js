import { allowedOperator, json, readJson } from '../_lib.js';

export async function POST(request) {
  let body;
  try {
    body = await readJson(request);
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  const email = String(body.email || '').trim().toLowerCase();
  if (!allowedOperator(email, process.env.ALLOWED_OPERATOR_EMAIL)) {
    return json(403, { error: 'operator_not_allowed' });
  }
  const redirectTo = process.env.AUTH_REDIRECT_URL;
  if (!redirectTo) return json(500, { error: 'auth_redirect_not_configured' });
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: { apikey: process.env.SUPABASE_SECRET_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ email, create_user: false, email_redirect_to: redirectTo }),
  });
  if (!response.ok) return json(502, { error: 'magic_link_not_sent' });
  return json(200, { sent: true });
}
