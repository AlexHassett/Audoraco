import { getAvailabilityConfiguration } from '../_shared/availability.js';

export async function onRequestGet({ env }) {
  return Response.json(await getAvailabilityConfiguration(env), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function onRequest() {
  return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'GET' } });
}
