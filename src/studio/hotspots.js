/** Hotspots aligned to the filled yellow bookshelf + left wall. */

export const STATIC_HOTSPOTS = [
  {
    id: "about",
    label: "About Khizar",
    group: "About",
    kind: "about",
    discoverable: true,
    position: [-2.15, 2.795, 0.12],
  },
  {
    id: "clients",
    label: "Kind words",
    group: "Clients",
    kind: "clients",
    discoverable: true,
    position: [-2.2, 1.55, 0.03],
  },
  {
    id: "skills",
    label: "Toolkit",
    group: "Skills",
    kind: "skills",
    discoverable: true,
    position: [-3.15, 2.795, 0.14],
  },
  {
    id: "poster",
    label: "Inspiration wall",
    group: "Play",
    kind: "mug",
    discoverable: true,
    position: [-3.35, 1.55, 0.01],
  },
  {
    id: "contact",
    label: "Say hello",
    group: "Contact",
    kind: "contact",
    discoverable: true,
    position: [3.67, 1.83, 0.24],
  },
  {
    id: "resume",
    label: "Résumé",
    group: "Contact",
    kind: "resume",
    discoverable: true,
    position: [3.05, 1.63, 0.24],
  },
  {
    id: "lamp",
    label: "Moon lamp",
    group: "Play",
    kind: "lamp",
    discoverable: true,
    position: [1.075, 2.575, 0.22],
  },
  {
    id: "globe",
    label: "Where I’ve been",
    group: "Play",
    kind: "globe",
    discoverable: true,
    position: [2.95, 0.83, 0.24],
  },
  {
    id: "cat",
    label: "Studio buddy",
    group: "Play",
    kind: "mug",
    discoverable: true,
    position: [0.05, 0, 1.3],
  },
];

export const SKILLS = [
  "Logo & Brand Identity",
  "Social Media Design",
  "Campaign Visuals",
  "Event Branding",
  "Brochures",
  "Annual Reports",
  "Typography",
  "Photo Editing",
  "Short-Form Video",
  "Photoshop",
  "Illustrator",
  "Affinity Designer",
  "Canva",
  "CapCut",
];

export const ABOUT = {
  title: "Design with color and purpose",
  body: "Graphic designer and social media manager with 3.5+ years across nonprofit and freelance work. I build identity systems, campaigns, event branding, brochures, and annual reports that stay consistent from screen to print.",
  stats: [
    { value: "3.5+", label: "Years designing" },
    { value: "8+", label: "Featured projects" },
    { value: "3", label: "Active orgs" },
  ],
  jobs: [
    {
      dates: "Mar 2023 — Present",
      role: "Sr. Graphic Designer & Social Media",
      org: "Alkhidmat Foundation Pakistan — Volunteer Management",
    },
    {
      dates: "Jun 2025 — Present",
      role: "Graphic Designer",
      org: "Allah Wale Foundation (Remote)",
    },
    {
      dates: "Sep 2022 — Dec 2022",
      role: "Graphic Designer — Resource Mobilization",
      org: "Alkhidmat Foundation Pakistan",
    },
  ],
};

export const CONTACT = {
  email: "khizarch10@gmail.com",
  phone: "0307-3740727",
  phoneHref: "tel:+923073740727",
  linkedin: "https://www.linkedin.com/in/khizar-yousuf-749592229/",
  resume: "/Khizar_Yousaf.pdf",
};

export const FALLBACK_PROJECTS = [
  {
    id: "kozzi",
    title: "Kozzi Space Brand Identity",
    tag: "Branding · USA",
    category: "Branding",
    image: "/img/work-kozzi.jpg",
  },
  {
    id: "social",
    title: "Alkhidmat VMD Campaigns",
    tag: "Social Media",
    category: "Social",
    image: "/img/work-social.jpg",
  },
  {
    id: "report",
    title: "Allah Wale Annual Report",
    tag: "Print Design",
    category: "Print",
    image: "/img/work-report.jpg",
  },
  {
    id: "event",
    title: "Workshop Event Branding",
    tag: "Event Design",
    category: "Events",
    image: "/img/work-event.jpg",
  },
  {
    id: "fundraising",
    title: "Fundraising Campaign Visuals",
    tag: "Campaign Design",
    category: "Social",
    image: "/img/work-fundraising.jpg",
  },
  {
    id: "stories",
    title: "Volunteer Story Packs",
    tag: "Social Stories",
    category: "Social",
    image: "/img/work-stories.jpg",
  },
];

export const FALLBACK_CLIENTS = [
  {
    id: "alkhidmat",
    name: "Alkhidmat Foundation",
    logo: "/logos/alkhidmat.svg",
    alt: "Alkhidmat Foundation Pakistan official logo",
  },
  {
    id: "allah-wale",
    name: "Allah Wale Foundation",
    logo: "/logos/allah-wale.webp",
    alt: "Allah Wale Foundation official logo",
  },
  {
    id: "kozzi",
    name: "Kozzi Space",
    logo: "/logos/kozzi.png",
    alt: "Kozzi Space official logo",
  },
];

/**
 * The bookshelf, bay by bay. Books on a shelf are projects whose category is in `match`;
 * missing ones are filled with sample projects so every shelf can be opened.
 * `position` is the shelf board the row stands on, `colors` are all the books in the row.
 */
export const SHELVES = [
  { id: "social", title: "Social Media", match: ["social"], books: 4, position: [0.66, 1.73, 0], h: 0.6, seed: 1, colors: ["#8f9e7a", "#e9dcc0", "#c98a5e", "#e3a57a", "#7f8f6a", "#d9c7a0", "#b5574b"] },
  { id: "branding", title: "Branding", match: ["branding"], books: 4, position: [0.66, 0.88, 0], h: 0.6, seed: 2, colors: ["#a9c79a", "#e9dcc0", "#7fae78", "#cfe0b8", "#9cc48f", "#6f9a5f", "#d9c7a0"] },
  { id: "uiux", title: "UI / UX", match: ["ui/ux", "ui", "ux", "uiux"], books: 4, position: [0.66, 0.056, 0], h: 0.6, seed: 3, colors: ["#6f4a52", "#2f3b4a", "#3d5a4a", "#e8b77a", "#b5574b", "#7a4d6b", "#2a2f2a"] },
  { id: "logo", title: "Logo", match: ["logo"], books: 3, position: [1.6, 0.66, 0], h: 0.42, seed: 4, colors: ["#e9dcc0", "#a9c79a", "#e8b77a", "#7f8f6a", "#b5574b"] },
  { id: "poster", title: "Poster Design", match: ["poster", "print", "events"], books: 3, position: [1.6, 0.056, 0], h: 0.42, seed: 5, colors: ["#d9c7a0", "#e8d6a8", "#c9b07a", "#efe2c0", "#d8bf8c"] },
  { id: "p1", title: "Project 01", books: 1, position: [3.3, 0.93, 0], h: 0.62, seed: 6, colors: ["#b5574b", "#3d5a4a", "#2f3b4a", "#6f4a52", "#3a5a40"] },
  { id: "p2", title: "Project 02", books: 1, position: [3.3, 0.056, 0], h: 0.64, seed: 7, colors: ["#8f9e7a", "#e9dcc0", "#c98a5e", "#e3a57a", "#7f8f6a", "#d9c7a0", "#b5574b", "#6f4a52"] },
  { id: "p3", title: "Project 03", books: 1, position: [2.36, 0.056, 0], h: 0.6, seed: 8, colors: ["#2a2f2a", "#6f4a52", "#3d5a4a", "#b5574b", "#2f3b4a", "#5a3a3a", "#3a4a3a"] },
];

/** Placeholder until the real project exists. */
function sampleProject(shelf, n) {
  const featured = !shelf.match;
  return {
    id: `${shelf.id}-sample-${n + 1}`,
    title: featured ? `Featured project ${shelf.title.slice(-2)}` : `${shelf.title} sample ${n + 1}`,
    tag: "Sample project",
    category: shelf.title,
    image: PAGE_IMAGES[(SHELVES.indexOf(shelf) * 3 + n) % PAGE_IMAGES.length],
  };
}

export function projectsToHotspots(projects) {
  const used = new Set();
  return SHELVES.flatMap((shelf) => {
    const real = shelf.match
      ? projects
          .filter((pr) => !used.has(pr.id) && shelf.match.includes(String(pr.category || "").toLowerCase()))
          .slice(0, shelf.books)
      : [];
    real.forEach((pr) => used.add(pr.id));
    const list = [...real];
    while (list.length < shelf.books) list.push(sampleProject(shelf, list.length));
    return list.map((project, j) => ({
      id: `work-${project.id}`,
      label: project.title,
      group: shelf.title,
      kind: "work",
      discoverable: true,
      section: shelf.title,
      shelf,
      // spread the clickable books along the row
      pickIndex: Math.floor(((j + 0.5) * shelf.colors.length) / shelf.books),
      position: shelf.position,
      project,
    }));
  });
}

const PAGE_IMAGES = [
  "/img/work-brandboard.jpg",
  "/img/work-brochure.jpg",
  "/img/work-event.jpg",
  "/img/work-fundraising.jpg",
  "/img/work-kozzi.jpg",
  "/img/work-report.jpg",
  "/img/work-social.jpg",
  "/img/work-stories.jpg",
];

/** Placeholder case-study pages: swap for real copy (project.pages) when it is written. */
export function dummyPages(project) {
  const pics = PAGE_IMAGES.filter((src) => src !== project.image);
  const copy = [
    {
      eyebrow: "Overview",
      title: project.title,
      body: "A short introduction: who the work was for, what it had to do, and the one idea that held it together. Replace this with two or three plain sentences.",
      meta: [
        ["Category", project.category || project.tag],
        ["My role", "Design and art direction"],
        ["Deliverables", "Identity, layouts, social and print"],
        ["Year", "2025"],
      ],
    },
    {
      eyebrow: "The brief",
      title: "What was asked for",
      body: "Placeholder copy. Describe the problem the client brought, who the audience was and what success would look like.",
      list: ["A clear, consistent look", "Works on screen and in print", "Easy for a small team to reuse"],
    },
    {
      eyebrow: "Research",
      title: "Looking before drawing",
      body: "Placeholder copy. Note what you studied first: similar organisations, the audience, what already existed and what was missing.",
    },
    {
      eyebrow: "Concept",
      title: "The idea",
      body: "Placeholder copy. Explain the central idea in a sentence, then show how it turned into sketches, shapes and a first direction.",
    },
    {
      eyebrow: "Design system",
      title: "Colour, type and layout",
      body: "Placeholder copy. Cover the palette, the typefaces and the grid, and why each was chosen.",
      list: ["Colour palette", "Typography", "Grid and spacing", "Image style"],
    },
    {
      eyebrow: "In use",
      title: "Out in the world",
      body: "Placeholder copy. Show where the work lives: posts, printed pieces, signage, reports and anything else it was applied to.",
    },
    {
      eyebrow: "Outcome",
      title: "What changed",
      body: "Placeholder copy. Close with the result and what you would do next. Add real numbers or a client quote here once you have them.",
    },
  ];
  return copy.map((page, i) => ({ ...page, image: i === 0 ? project.image : pics[(i - 1) % pics.length] }));
}

/** Where the work has happened: the pins on the globe. Australia is pinned on Sydney. */
export const PLACES = [
  { id: "lahore", name: "Lahore", country: "Pakistan", lat: 31.5497, lon: 74.3436 },
  { id: "dubai", name: "Dubai", country: "UAE", lat: 25.2048, lon: 55.2708 },
  { id: "newyork", name: "New York", country: "USA", lat: 40.7128, lon: -74.006 },
  { id: "sydney", name: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093 },
];

/** The CV is a book on the shelf too, built from the About, Skills and Contact data above. */
const CV_PROJECT = {
  id: "cv",
  title: "Curriculum Vitae",
  tag: "Experience, skills and contact",
  category: "CV",
  image: "/img/khizar.jpg",
  pages: [
    {
      eyebrow: "Curriculum vitae",
      title: "Khizar Yousaf",
      body: ABOUT.body,
      meta: [
        ["Role", "Graphic designer and social media manager"],
        ["Experience", `${ABOUT.stats[0].value} years`],
        ["Based in", "Lahore, Pakistan"],
      ],
      image: "/img/khizar.jpg",
    },
    {
      eyebrow: "Experience",
      title: "Where I’ve worked",
      body: "Roles, newest first.",
      list: ABOUT.jobs.map((job) => `${job.role}, ${job.org} (${job.dates})`),
      image: "/img/work-social.jpg",
    },
    {
      eyebrow: "Skills",
      title: "Tools and craft",
      body: "What I use every week.",
      list: SKILLS,
      image: "/img/work-brandboard.jpg",
    },
    {
      eyebrow: "Contact",
      title: "Let’s work together",
      body: "Branding, social systems, campaigns, or print. Tell me what you need.",
      meta: [
        ["Email", CONTACT.email],
        ["Phone", CONTACT.phone],
        ["LinkedIn", "linkedin.com/in/khizar-yousuf-749592229"],
      ],
      image: "/img/work-kozzi.jpg",
    },
  ],
};

export const CV_HOTSPOT = {
  id: "cv",
  label: "Curriculum Vitae",
  group: "About",
  kind: "cv",
  discoverable: true,
  section: "CV",
  position: [2.775, 2.375, 0.2],
  project: CV_PROJECT,
};
