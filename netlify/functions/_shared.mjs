// Shared helper for the demo API endpoints.
// CORS headers + JSON responses + tiny in-memory rate guard.

const ALLOW = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "content-type": "application/json",
};

export const preflight = () =>
  new Response(null, { status: 204, headers: ALLOW });

export const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...ALLOW, ...extra } });

export const error = (msg, status = 400) => json({ ok: false, error: msg }, status);

export async function readBody(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}