import { json, requireOperator } from './_lib.js';

export async function GET(request) {
  const auth = await requireOperator(request);
  if (auth.error) return auth.error;
  return json(200, { email: auth.user.email });
}
