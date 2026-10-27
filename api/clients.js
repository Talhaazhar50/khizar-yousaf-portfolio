import Busboy from "busboy";
import { put } from "@vercel/blob";
import {
  deleteLogoByUrl,
  readClients,
  writeClients,
} from "./_lib/clients.mjs";

export const config = {
  api: {
    bodyParser: false,
  },
};

function slugId(name) {
  const base = String(name || "client")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "client"}-${Date.now().toString(36)}`;
}

function isAuthorized(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const password = process.env.ADMIN_PASSWORD || "";
  return Boolean(password) && token === password;
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = {};
    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: 8 * 1024 * 1024 },
    });

    busboy.on("file", (name, file, info) => {
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("limit", () => reject(new Error("File too large (max 8MB)")));
      file.on("end", () => {
        if (!chunks.length && !info.filename) return;
        files[name] = {
          buffer: Buffer.concat(chunks),
          filename: info.filename,
          mimeType: info.mimeType,
        };
      });
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("error", reject);
    busboy.on("finish", () => resolve({ fields, files }));
    req.pipe(busboy);
  });
}

async function uploadLogo(fileMeta, id) {
  const ext =
    (fileMeta.filename?.split(".").pop() || "png")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "png";
  const pathname = `portfolio/logos/${id}.${ext}`;
  const blob = await put(pathname, fileMeta.buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: fileMeta.mimeType || "image/png",
  });
  return blob.url;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ ok: true });
  }

  try {
    if (req.method === "GET") {
      const clients = await readClients();
      return res.status(200).json({ clients });
    }

    if (req.method === "POST" || req.method === "PUT") {
      if (!isAuthorized(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { fields, files } = await parseMultipart(req);
      const name = String(fields.name || "").trim();
      const alt = String(fields.alt || name).trim() || name;
      const uploaded = files.file;
      const editingId = String(fields.id || "").trim();
      const isUpdate = req.method === "PUT" || Boolean(editingId);

      if (!name) return res.status(400).json({ error: "Name is required" });

      const clients = await readClients();

      if (isUpdate) {
        const index = clients.findIndex((c) => c.id === editingId);
        if (index < 0) return res.status(404).json({ error: "Not found" });

        const current = clients[index];
        let logo = current.logo;
        if (uploaded?.buffer?.length) {
          if (current.logo && !current.logo.startsWith("/")) {
            await deleteLogoByUrl(current.logo);
          }
          logo = await uploadLogo(uploaded, current.id);
        }

        const updated = {
          ...current,
          name,
          alt,
          logo,
          updatedAt: new Date().toISOString(),
        };
        const next = [...clients];
        next[index] = updated;
        await writeClients(next);
        return res.status(200).json({ client: updated, clients: next });
      }

      if (!uploaded?.buffer?.length) {
        return res.status(400).json({ error: "Logo file is required" });
      }

      const id = slugId(name);
      const logo = await uploadLogo(uploaded, id);
      const client = {
        id,
        name,
        alt,
        logo,
        createdAt: new Date().toISOString(),
      };
      const next = [client, ...clients.filter((c) => c.id !== id)];
      await writeClients(next);
      return res.status(201).json({ client, clients: next });
    }

    if (req.method === "DELETE") {
      if (!isAuthorized(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = typeof req.query?.id === "string" ? req.query.id : null;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const clients = await readClients();
      const target = clients.find((c) => c.id === id);
      if (!target) return res.status(404).json({ error: "Not found" });

      await deleteLogoByUrl(target.logo);
      const next = clients.filter((c) => c.id !== id);
      await writeClients(next);
      return res.status(200).json({ ok: true, clients: next });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
