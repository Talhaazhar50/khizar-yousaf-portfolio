/** Hotspots aligned to the filled yellow bookshelf + left wall. */

export const STATIC_HOTSPOTS = [
  {
    id: "about",
    label: "About Khizar",
    group: "About",
    kind: "about",
    discoverable: true,
    hint: "The framed portrait on the wall shelf",
    position: [-2.15, 2.795, 0.12],
  },
  {
    id: "clients",
    label: "Kind words",
    group: "Clients",
    kind: "clients",
    discoverable: true,
    hint: "The corkboard under the wall shelf",
    position: [-2.2, 1.55, 0.03],
  },
  {
    id: "skills",
    label: "Toolkit",
    group: "Skills",
    kind: "skills",
    discoverable: true,
    hint: "The plant on the yellow wall shelf",
    position: [-3.15, 2.795, 0.14],
  },
  {
    id: "poster",
    label: "Inspiration wall",
    group: "Play",
    kind: "mug",
    discoverable: true,
    hint: "The framed poster on the wall",
    position: [-3.35, 1.55, 0.01],
  },
  {
    id: "contact",
    label: "Say hello",
    group: "Contact",
    kind: "contact",
    discoverable: true,
    hint: "The pink phone on the right-hand shelf",
    position: [3.67, 1.83, 0.24],
  },
  {
    id: "resume",
    label: "Résumé",
    group: "Contact",
    kind: "resume",
    discoverable: true,
    hint: "The poster tube on the tall shelf",
    position: [3.05, 1.63, 0.24],
  },
  {
    id: "lamp",
    label: "Moon lamp",
    group: "Play",
    kind: "lamp",
    discoverable: true,
    hint: "The moon lamp on top of the bookshelf",
    position: [1.075, 2.575, 0.22],
  },
  {
    id: "chess",
    label: "Side quests",
    group: "Play",
    kind: "mug",
    discoverable: true,
    hint: "The checkered board on the shelf",
    position: [2.77, 2.38, 0.12],
  },
  {
    id: "globe",
    label: "Where I’ve worked",
    group: "Play",
    kind: "mug",
    discoverable: true,
    hint: "The little globe on the shelf",
    position: [2.95, 0.83, 0.24],
  },
  {
    id: "cat",
    label: "Studio buddy",
    group: "Play",
    kind: "mug",
    discoverable: true,
    hint: "The cat sitting on the floor",
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
    image: "/work-kozzi.jpg",
  },
  {
    id: "social",
    title: "Alkhidmat VMD Campaigns",
    tag: "Social Media",
    category: "Social",
    image: "/work-social.jpg",
  },
  {
    id: "report",
    title: "Allah Wale Annual Report",
    tag: "Print Design",
    category: "Print",
    image: "/work-report.jpg",
  },
  {
    id: "event",
    title: "Workshop Event Branding",
    tag: "Event Design",
    category: "Events",
    image: "/work-event.jpg",
  },
  {
    id: "fundraising",
    title: "Fundraising Campaign Visuals",
    tag: "Campaign Design",
    category: "Social",
    image: "/work-fundraising.jpg",
  },
  {
    id: "stories",
    title: "Volunteer Story Packs",
    tag: "Social Stories",
    category: "Social",
    image: "/work-stories.jpg",
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

/** Interactive book rows sitting ON shelf boards (world positions). */
export const BOOK_SLOTS = [
  { position: [0.66, 1.73, 0], colors: ["#8f9e7a", "#e9dcc0", "#c98a5e", "#e3a57a", "#7f8f6a", "#d9c7a0", "#b5574b"], h: 0.66 },
  { position: [0.66, 0.88, 0], colors: ["#a9c79a", "#e9dcc0", "#7fae78", "#cfe0b8", "#9cc48f", "#6f9a5f"], h: 0.66 },
  { position: [0.66, 0.05, 0], colors: ["#6f4a52", "#2f3b4a", "#3d5a4a", "#e8b77a", "#b5574b", "#7a4d6b"], h: 0.66 },
  { position: [1.6, 0.05, 0], colors: ["#d9c7a0", "#e8d6a8", "#c9b07a", "#efe2c0", "#d8bf8c"], h: 0.48 },
  { position: [2.36, 0.05, 0], colors: ["#2a2f2a", "#6f4a52", "#3d5a4a", "#b5574b", "#2f3b4a", "#5a3a3a", "#3a4a3a"], h: 0.66, lean: 0 },
  { position: [3.3, 0.93, 0], colors: ["#b5574b", "#3d5a4a", "#2f3b4a", "#6f4a52", "#3a5a40"], h: 0.7, lean: 0 },
];

export function projectsToHotspots(projects) {
  return projects.slice(0, BOOK_SLOTS.length).map((project, index) => ({
    id: `work-${project.id}`,
    label: project.title,
    group: "Work",
    kind: "work",
    discoverable: true,
    hint: "A colorful stack of books on the yellow shelf",
    position: BOOK_SLOTS[index].position,
    book: BOOK_SLOTS[index],
    project,
  }));
}
