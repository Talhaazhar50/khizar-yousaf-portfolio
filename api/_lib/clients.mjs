import { put, list, del } from "@vercel/blob";

export const CLIENTS_PATH = "portfolio/clients.json";

export const DEFAULT_CLIENTS = [
  {
    id: "alkhidmat",
    name: "Alkhidmat Foundation",
    logo: "/logos/alkhidmat.svg",
    alt: "Alkhidmat Foundation Pakistan official logo",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "allah-wale",
    name: "Allah Wale Foundation",
    logo: "/logos/allah-wale.webp",
    alt: "Allah Wale Foundation official logo",
    createdAt: "2024-02-01T00:00:00.000Z",
  },
  {
    id: "kozzi",
    name: "Kozzi Space",
    logo: "/logos/kozzi.png",
    alt: "Kozzi Space official logo",
    createdAt: "2024-03-01T00:00:00.000Z",
  },
];

function blobOpts() {
  return {
    access: "public",
    addRandomSuffix: false,
  };
}

export async function readClients() {
  try {
    const { blobs } = await list({ prefix: CLIENTS_PATH });
    const match = blobs.find((b) => b.pathname === CLIENTS_PATH);
    if (!match) return [...DEFAULT_CLIENTS];

    const res = await fetch(match.url, { cache: "no-store" });
    if (!res.ok) return [...DEFAULT_CLIENTS];
    const data = await res.json();
    if (!Array.isArray(data)) return [...DEFAULT_CLIENTS];
    return data;
  } catch {
    return [...DEFAULT_CLIENTS];
  }
}

export async function writeClients(clients) {
  await put(CLIENTS_PATH, JSON.stringify(clients, null, 2), {
    ...blobOpts(),
    contentType: "application/json",
    allowOverwrite: true,
  });
  return clients;
}

export async function deleteLogoByUrl(url) {
  if (!url || url.startsWith("/")) return;
  try {
    await del(url);
  } catch {
    // ignore missing blobs
  }
}
