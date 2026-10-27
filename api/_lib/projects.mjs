import { put, list, del } from "@vercel/blob";

export const PROJECTS_PATH = "portfolio/projects.json";

export const DEFAULT_PROJECTS = [
  {
    id: "kozzi",
    title: "Kozzi Space Brand Identity",
    tag: "Branding · USA",
    category: "Branding",
    image: "/work-kozzi.jpg",
    span: "lg",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "social",
    title: "Alkhidmat VMD Campaigns",
    tag: "Social Media",
    category: "Social",
    image: "/work-social.jpg",
    span: "md",
    createdAt: "2024-02-01T00:00:00.000Z",
  },
  {
    id: "report",
    title: "Allah Wale Annual Report",
    tag: "Print Design",
    category: "Print",
    image: "/work-report.jpg",
    span: "sm",
    createdAt: "2024-03-01T00:00:00.000Z",
  },
  {
    id: "event",
    title: "Workshop Event Branding",
    tag: "Event Design",
    category: "Events",
    image: "/work-event.jpg",
    span: "sm",
    createdAt: "2024-04-01T00:00:00.000Z",
  },
  {
    id: "fundraising",
    title: "Fundraising Campaign Visuals",
    tag: "Campaign Design",
    category: "Social",
    image: "/work-fundraising.jpg",
    span: "sm",
    createdAt: "2024-05-01T00:00:00.000Z",
  },
  {
    id: "stories",
    title: "Volunteer Story Packs",
    tag: "Social Stories",
    category: "Social",
    image: "/work-stories.jpg",
    span: "sm",
    createdAt: "2024-06-01T00:00:00.000Z",
  },
  {
    id: "brochure",
    title: "Organization Brochure",
    tag: "Print Collateral",
    category: "Print",
    image: "/work-brochure.jpg",
    span: "md",
    createdAt: "2024-07-01T00:00:00.000Z",
  },
  {
    id: "brandboard",
    title: "Brand System Explorations",
    tag: "Identity System",
    category: "Branding",
    image: "/work-brandboard.jpg",
    span: "xs",
    createdAt: "2024-08-01T00:00:00.000Z",
  },
];

function blobOpts() {
  return {
    access: "public",
    addRandomSuffix: false,
  };
}

export async function readProjects() {
  try {
    const { blobs } = await list({ prefix: PROJECTS_PATH });
    const match = blobs.find((b) => b.pathname === PROJECTS_PATH);
    if (!match) return [...DEFAULT_PROJECTS];

    const res = await fetch(match.url, { cache: "no-store" });
    if (!res.ok) return [...DEFAULT_PROJECTS];
    const data = await res.json();
    if (!Array.isArray(data)) return [...DEFAULT_PROJECTS];
    return data;
  } catch {
    return [...DEFAULT_PROJECTS];
  }
}

export async function writeProjects(projects) {
  await put(PROJECTS_PATH, JSON.stringify(projects, null, 2), {
    ...blobOpts(),
    contentType: "application/json",
    allowOverwrite: true,
  });
  return projects;
}

export async function uploadImage(file, id) {
  const ext =
    (file.name?.split(".").pop() || "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";
  const pathname = `portfolio/images/${id}.${ext}`;
  const blob = await put(pathname, file, {
    ...blobOpts(),
    contentType: file.type || "image/jpeg",
    allowOverwrite: true,
  });
  return blob.url;
}

export async function deleteImageByUrl(url) {
  if (!url || url.startsWith("/")) return;
  try {
    await del(url);
  } catch {
    // ignore missing blobs
  }
}
