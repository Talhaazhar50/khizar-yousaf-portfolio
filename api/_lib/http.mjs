export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    },
  });
}

export function cors(request) {
  if (request.method === "OPTIONS") {
    return json({ ok: true });
  }
  return null;
}

export function isAuthorized(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const password = process.env.ADMIN_PASSWORD || "";
  return Boolean(password) && token === password;
}
