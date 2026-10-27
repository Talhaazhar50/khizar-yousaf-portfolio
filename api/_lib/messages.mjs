import { put, list } from "@vercel/blob";

const PREFIX = "portfolio/messages/";

export async function saveMessage(entry) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pathname = `${PREFIX}${id}.json`;
  const payload = { id, ...entry, createdAt: new Date().toISOString(), read: false };
  await put(pathname, JSON.stringify(payload, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return payload;
}

export async function listMessages() {
  try {
    const { blobs } = await list({ prefix: PREFIX });
    const messages = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const res = await fetch(blob.url, { cache: "no-store" });
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      })
    );
    return messages
      .filter(Boolean)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  } catch {
    return [];
  }
}

export async function sendEmailProviders({ name, email, message }) {
  const to = process.env.CONTACT_EMAIL || "khizarch10@gmail.com";
  const subject = `Portfolio message from ${name}`;
  const errors = [];

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "Portfolio <onboarding@resend.dev>",
          to: [to],
          reply_to: email,
          subject,
          text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
        }),
      });
      if (res.ok) return { sent: true, provider: "resend" };
      errors.push(`resend:${await res.text()}`);
    } catch (err) {
      errors.push(`resend:${err.message}`);
    }
  }

  if (process.env.WEB3FORMS_ACCESS_KEY) {
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: process.env.WEB3FORMS_ACCESS_KEY,
          subject,
          name,
          email,
          message,
          from_name: "Khizar Portfolio",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) return { sent: true, provider: "web3forms" };
      errors.push(`web3forms:${data.message || res.status}`);
    } catch (err) {
      errors.push(`web3forms:${err.message}`);
    }
  }

  return { sent: false, errors };
}
