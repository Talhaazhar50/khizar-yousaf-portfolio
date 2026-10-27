export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = process.env.ADMIN_PASSWORD || "";
  if (!password) {
    return res.status(500).json({ error: "Admin password is not configured" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (String(body.password || "") !== password) {
    return res.status(401).json({ error: "Wrong password" });
  }

  return res.status(200).json({ token: password, ok: true });
}
