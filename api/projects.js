import Busboy from "busboy";
import { put } from "@vercel/blob";
import {
  deleteImageByUrl,
  readProjects,
  writeProjects,
} from "./_lib/projects.mjs";

export const config = {
  api: {
    bodyParser: false,
  },
};

function slugId(title) {
  const base = String(title || "work")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "work"}-${Date.now().toString(36)}`;
}

function normalizeLink(link) {
  const value = String(link || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
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
      limits: { fileSize: 12 * 1024 * 1024 },
    });

    busboy.on("file", (name, file, info) => {
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("limit", () => reject(new Error("File too large (max 12MB)")));
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

async function uploadBuffer(fileMeta, id) {
  const ext =
    (fileMeta.filename?.split(".").pop() || "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";
  const pathname = `portfolio/images/${id}.${ext}`;
  const blob = await put(pathname, fileMeta.buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: fileMeta.mimeType || "image/jpeg",
  });
  return blob.url;
}

function projectFromFields(fields, extras = {}) {
  const title = String(fields.title || "").trim();
  const tag = String(fields.tag || "Selected Work").trim();
  const category = String(fields.category || "Branding").trim();
  const span = String(fields.span || "sm").trim();
  const link = normalizeLink(fields.link);
  return {
    title,
    tag,
    category,
    span: ["lg", "md", "sm", "xs"].includes(span) ? span : "sm",
    link,
    ...extras,
  };
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
      const projects = await readProjects();
      return res.status(200).json({ projects });
    }

    if (req.method === "POST" || req.method === "PUT") {
      if (!isAuthorized(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { fields, files } = await parseMultipart(req);
      const title = String(fields.title || "").trim();
      const uploaded = files.file;
      const editingId = String(fields.id || "").trim();
      const isUpdate = req.method === "PUT" || Boolean(editingId);

      if (!title) return res.status(400).json({ error: "Title is required" });

      const projects = await readProjects();

      if (isUpdate) {
        const index = projects.findIndex((p) => p.id === editingId);
        if (index < 0) return res.status(404).json({ error: "Not found" });

        const current = projects[index];
        let image = current.image;
        if (uploaded?.buffer?.length) {
          if (current.image && !current.image.startsWith("/")) {
            await deleteImageByUrl(current.image);
          }
          image = await uploadBuffer(uploaded, current.id);
        }

        const updated = {
          ...current,
          ...projectFromFields(fields, {
            id: current.id,
            image,
            createdAt: current.createdAt,
            updatedAt: new Date().toISOString(),
          }),
        };
        const next = [...projects];
        next[index] = updated;
        await writeProjects(next);
        return res.status(200).json({ project: updated, projects: next });
      }

      if (!uploaded?.buffer?.length) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const id = slugId(title);
      const image = await uploadBuffer(uploaded, id);
      const project = projectFromFields(fields, {
        id,
        image,
        createdAt: new Date().toISOString(),
      });
      const next = [project, ...projects.filter((p) => p.id !== id)];
      await writeProjects(next);
      return res.status(201).json({ project, projects: next });
    }

    if (req.method === "DELETE") {
      if (!isAuthorized(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const id = typeof req.query?.id === "string" ? req.query.id : null;
      if (!id) return res.status(400).json({ error: "Missing id" });

      const projects = await readProjects();
      const target = projects.find((p) => p.id === id);
      if (!target) return res.status(404).json({ error: "Not found" });

      await deleteImageByUrl(target.image);
      const next = projects.filter((p) => p.id !== id);
      await writeProjects(next);
      return res.status(200).json({ ok: true, projects: next });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
