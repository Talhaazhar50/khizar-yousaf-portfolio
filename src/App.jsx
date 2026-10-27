import "./App.css";

const highlights = [
  {
    value: "3.5+",
    label: "Years designing for nonprofit and freelance briefs",
  },
  {
    value: "Social",
    label: "Content planning, publishing, and campaign coverage",
  },
  {
    value: "USA",
    label: "Brand identity and collateral for Kozzi Space",
  },
];

const jobs = [
  {
    dates: "Mar 2023 — Present",
    role: "Sr. Graphic Designer & Social Media Management",
    org: "Volunteer Management Department, Alkhidmat Foundation Pakistan",
    points: [
      "Manage social media presence through content planning, post preparation, publishing, and campaign coverage.",
      "Create digital and print materials for volunteer campaigns, internships, trainings, and community initiatives.",
      "Maintain brand consistency and prepare high-quality digital assets and print-ready artwork.",
      "Grow audience reach and engagement with clear social media marketing strategy.",
    ],
  },
  {
    dates: "Jun 2025 — Present",
    role: "Graphic Designer",
    org: "Allah Wale Foundation (Remote)",
    points: [
      "Design campaign visuals, awareness content, social posts, banners, and print collateral.",
      "Build clear layouts and branded graphics for digital publishing and professional printing.",
    ],
  },
  {
    dates: "Sep 2022 — Dec 2022",
    role: "Graphic Designer — Resource Mobilization",
    org: "Alkhidmat Foundation Pakistan",
    points: [
      "Produced fundraising campaign graphics, donor communication materials, ads, and presentation visuals.",
      "Kept visual consistency across digital and printed communication.",
    ],
  },
];

const projects = [
  {
    tag: "Brand Identity & Marketing",
    title: "Kozzi Space, USA",
    copy: "Logo, visual identity, promotional banners, and a professional company brochure for digital and print use.",
  },
  {
    tag: "Annual Report Design",
    title: "Allah Wale Foundation",
    copy: "Structured annual report layout with consistent typography, branded page systems, and clear impact storytelling.",
  },
];

const skills = [
  "Brand Identity & Logo Design",
  "Social Media Management",
  "Campaign Design",
  "Event Branding",
  "Brochure & Annual Reports",
  "Typography & Layout",
  "Photo Editing",
  "Short-Form Video",
  "Adobe Photoshop",
  "Adobe Illustrator",
  "Affinity Designer",
  "Canva",
  "CapCut",
  "Filmora",
];

export default function App() {
  return (
    <div className="site">
      <nav className="nav">
        <a className="nav__brand" href="#top">
          Khizar Yousaf
        </a>
        <ul className="nav__links">
          <li>
            <a href="#about">About</a>
          </li>
          <li>
            <a href="#work">Experience</a>
          </li>
          <li>
            <a href="#projects">Projects</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>
      </nav>

      <header className="hero" id="top">
        <div className="hero__mark" aria-hidden="true" />
        <p className="hero__eyebrow">Graphic Designer · Lahore, Pakistan</p>
        <h1 className="hero__name">Khizar Yousaf</h1>
        <p className="hero__lede">
          Social media management and branding for nonprofit, social-impact, and
          freelance work — turning briefs into brand-consistent digital and print
          visuals.
        </p>
        <div className="hero__actions">
          <a className="btn" href="#contact">
            Get in touch
          </a>
          <a className="btn btn--ghost" href="/Khizar_Yousaf.pdf" download>
            Download CV
          </a>
        </div>
      </header>

      <section className="section" id="about">
        <p className="section__label">Profile</p>
        <h2 className="section__title">Design that stays on brand and on deadline.</h2>
        <p className="section__copy">
          Creative and detail-oriented designer with 3.5+ years across nonprofit
          and freelance projects. Known for dependable delivery, visual
          consistency, and coordinating multiple deadlines and revisions —
          from campaign content and event branding to brochures and annual
          reports.
        </p>
        <div className="highlights">
          {highlights.map((item) => (
            <article key={item.value}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="work">
        <p className="section__label">Experience</p>
        <h2 className="section__title">Where the work lives.</h2>
        <div className="jobs">
          {jobs.map((job) => (
            <article className="job" key={`${job.org}-${job.dates}`}>
              <div className="job__meta">{job.dates}</div>
              <div>
                <h3 className="job__role">{job.role}</h3>
                <p className="job__org">{job.org}</p>
                <ul>
                  {job.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="projects">
        <p className="section__label">Selected projects</p>
        <h2 className="section__title">Identity, campaigns, and reports.</h2>
        <div className="projects">
          {projects.map((project) => (
            <article className="project" key={project.title}>
              <span className="project__tag">{project.tag}</span>
              <h3>{project.title}</h3>
              <p>{project.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="skills">
        <p className="section__label">Toolkit</p>
        <h2 className="section__title">Software and craft.</h2>
        <div className="skills">
          {skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </section>

      <section className="section" id="contact">
        <p className="section__label">Contact</p>
        <h2 className="section__title">Let’s build the next visual system.</h2>
        <div className="contact">
          <a href="mailto:khizarch10@gmail.com">khizarch10@gmail.com</a>
          <a href="tel:+923073740727">0307-3740727</a>
          <a href="/Khizar_Yousaf.pdf" download>
            Download CV (PDF)
          </a>
        </div>
      </section>

      <footer className="footer">
        <span>Khizar Yousaf · Graphic Designer</span>
        <span>Lahore, Pakistan</span>
      </footer>
    </div>
  );
}
