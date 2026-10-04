export function allowedOperator(email, configuredEmail) {
  return Boolean(email) && email.trim().toLowerCase() === configuredEmail.trim().toLowerCase();
}

export function bearerToken(authorization) {
  if (typeof authorization !== 'string') return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match ? match[1] : null;
}

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Error('invalid_json');
  }
}

export async function requireOperator(request, env = process.env) {
  const token = bearerToken(request.headers.get('authorization'));
  if (!token) return { error: json(401, { error: 'missing_access_token' }) };
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_SECRET_KEY, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return { error: json(401, { error: 'invalid_access_token' }) };
  const user = await response.json();
  if (!allowedOperator(user.email, env.ALLOWED_OPERATOR_EMAIL)) {
    return { error: json(403, { error: 'operator_not_allowed' }) };
  }
  return { user };
}

export async function supabase(path, options = {}, env = process.env) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`supabase_${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
