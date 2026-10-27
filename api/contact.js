import { saveMessage, sendEmailProviders } from "./_lib/messages.mjs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email" });
    }

    const saved = await saveMessage({ name, email, message });
    const mail = await sendEmailProviders({ name, email, message });

    return res.status(200).json({
      ok: true,
      message: mail.sent
        ? "Message sent to Khizar’s email. Thanks!"
        : "Message received. Khizar will get back to you soon.",
      emailed: Boolean(mail.sent),
      id: saved.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not send message" });
  }
}
