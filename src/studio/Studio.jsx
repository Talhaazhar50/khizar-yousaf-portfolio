import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ABOUT,
  CONTACT,
  CV_HOTSPOT,
  FALLBACK_CLIENTS,
  FALLBACK_PROJECTS,
  PLACES,
  STATIC_HOTSPOTS,
  SKILLS,
  projectsToHotspots,
} from "./hotspots";
import Reader from "./Reader.jsx";
import "./Studio.css";

const StudioScene = lazy(() => import("./StudioScene.jsx"));
const PhoneDial = lazy(() => import("./PhoneDial.jsx"));
const GlobeView = lazy(() => import("./Globe.jsx"));

const DISCOVER_KEY = "khizar_studio_discovered_v1";
const LAMP_MODES = ["warm", "cool", "off"];
// Digits on the phone that do something; the other numbers just dial.
const DIALS = {
  1: { label: "LinkedIn", href: CONTACT.linkedin },
  2: { label: "Email", href: `mailto:${CONTACT.email}` },
  3: { label: "Call", href: CONTACT.phoneHref },
};

const LOADER_BOOKS = [
  { c: "#2f5d50", h: "30px" },
  { c: "#b2364f", h: "36px" },
  { c: "#d9a514", h: "26px" },
  { c: "#2c4a7a", h: "34px" },
  { c: "#e07a5f", h: "28px" },
  { c: "#6b4fa0", h: "32px" },
];

function loadDiscovered() {
  try {
    const raw = localStorage.getItem(DISCOVER_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export default function Studio() {
  const reduce = useReducedMotion();
  const [projects, setProjects] = useState(FALLBACK_PROJECTS);
  const [clients, setClients] = useState(FALLBACK_CLIENTS);
  const [discovered, setDiscovered] = useState(loadDiscovered);
  const [activeId, setActiveId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hint, setHint] = useState(null);
  const [lampMode, setLampMode] = useState("warm");
  const [ready, setReady] = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [booksUp, setBooksUp] = useState(0);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [place, setPlace] = useState(null); // the pin the globe is turning to
  const [dial, setDial] = useState(null); // {n, id}: a number the phone is dialling

  const workHotspots = useMemo(() => projectsToHotspots(projects), [projects]);
  const hotspots = useMemo(
    () => [...STATIC_HOTSPOTS, ...workHotspots, CV_HOTSPOT],
    [workHotspots]
  );
  const discoverable = useMemo(
    () => hotspots.filter((h) => h.discoverable),
    [hotspots]
  );
  const active = hotspots.find((h) => h.id === activeId) || null;
  const discoveredCount = discoverable.filter((h) => discovered.has(h.id)).length;

  useEffect(() => {
    let alive = true;
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive || !data?.projects?.length) return;
        setProjects(data.projects);
      })
      .catch(() => {});
    fetch("/api/clients")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive || !data?.clients?.length) return;
        setClients(data.clients);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(DISCOVER_KEY, JSON.stringify([...discovered]));
  }, [discovered]);

  useEffect(() => {
    if (reduce) {
      setBooksUp(LOADER_BOOKS.length);
      setLoaderProgress(1);
      const t = setTimeout(() => setReady(true), 200);
      return () => clearTimeout(t);
    }

    let frame = 0;
    const bookTimer = setInterval(() => {
      setBooksUp((n) => {
        if (n >= LOADER_BOOKS.length) {
          clearInterval(bookTimer);
          return n;
        }
        return n + 1;
      });
    }, 180);

    const progressTimer = setInterval(() => {
      frame += 1;
      setLoaderProgress(Math.min(1, frame / 18));
      if (frame >= 18) clearInterval(progressTimer);
    }, 80);

    const done = setTimeout(() => setReady(true), 1700);
    return () => {
      clearInterval(bookTimer);
      clearInterval(progressTimer);
      clearTimeout(done);
    };
  }, [reduce]);

  const phoneOpen = active?.kind === "contact";
  const wide = phoneOpen || active?.kind === "globe";

  useEffect(() => {
    if (active?.kind !== "globe") setPlace(null);
  }, [active?.kind]);

  // Freeze the 3D room whenever something covers it, so the page on top gets the whole main thread.
  // A book is the exception while it flies out (and back): the room has to draw that.
  const workId = active?.kind === "work" ? active.id : null;
  const [bookLanded, setBookLanded] = useState(false);
  useEffect(() => {
    if (!workId) return undefined;
    const t = setTimeout(() => setBookLanded(true), 900);
    return () => {
      clearTimeout(t);
      setBookLanded(false);
    };
  }, [workId]);
  const covered = bookLanded || menuOpen || (active && active.kind !== "lamp" && active.kind !== "work");

  function pressDigit(n) {
    setDial((d) => d || { n });
  }

  function dialled(n) {
    setDial(null);
    const href = DIALS[n]?.href;
    if (!href) return;
    if (href.startsWith("http")) window.open(href, "_blank", "noopener,noreferrer");
    else window.location.href = href;
  }

  useEffect(() => {
    if (!phoneOpen) {
      setDial(null);
      return undefined;
    }
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key) && !e.target.closest?.("input, textarea")) pressDigit(Number(e.key));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phoneOpen]);

  function markDiscovered(id) {
    setDiscovered((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function openHotspot(id) {
    if (!id) {
      setActiveId(null);
      return;
    }
    const item = hotspots.find((h) => h.id === id);
    if (!item) return;

    if (item.kind === "lamp") {
      setLampMode((mode) => {
        const index = LAMP_MODES.indexOf(mode);
        return LAMP_MODES[(index + 1) % LAMP_MODES.length];
      });
      markDiscovered(id);
      setActiveId(id);
      setMenuOpen(false);
      return;
    }

    markDiscovered(id);
    setActiveId(id);
    setMenuOpen(false);
    setHint(null);
  }

  function showHint() {
    const remaining = discoverable.filter((h) => !discovered.has(h.id));
    const pool = remaining.length ? remaining : discoverable;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setHint(pick?.hint || "Click around the studio.");
  }

  async function onSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!name || !email || !message) {
      setStatus("Please fill in all fields.");
      return;
    }

    setSending(true);
    setStatus("Sending…");
    try {
      const accessKey =
        import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ||
        "ee2cc861-475f-4a3a-978f-205f08d2f63c";
      const mailRes = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Portfolio message from ${name}`,
          name,
          email,
          message,
          from_name: "Khizar Portfolio",
        }),
      });
      const mailData = await mailRes.json().catch(() => ({}));
      if (!mailRes.ok || mailData.success === false) {
        throw new Error(mailData.message || "Could not send email");
      }
      await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      }).catch(() => {});
      form.reset();
      setStatus("Message sent. Thanks!");
    } catch (err) {
      setStatus(err.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  const menuGroups = useMemo(() => {
    const groups = {};
    for (const item of discoverable) {
      groups[item.group] = groups[item.group] || [];
      groups[item.group].push(item);
    }
    return groups;
  }, [discoverable]);

  return (
    <div className="studio">
      <Suspense fallback={null}>
        <StudioScene
          hotspots={hotspots}
          clients={clients}
          lampMode={lampMode}
          activeId={activeId}
          paused={!!covered}
          onSelect={openHotspot}
          ready={ready}
        />
      </Suspense>

      <div
        className={`studio-loader${ready ? " is-gone" : ""}`}
        role="status"
        aria-label="Setting up the studio"
      >
        <div className="studio-loader__shelf" aria-hidden="true">
          {LOADER_BOOKS.map((book, index) => (
            <span
              key={book.c}
              className={`studio-loader__book${booksUp > index ? " is-up" : ""}`}
              style={{ "--c": book.c, "--h": book.h }}
            />
          ))}
        </div>
        <span className="studio-loader__label" aria-hidden="true">
          Setting up the studio
        </span>
        <span className="studio-loader__bar" aria-hidden="true">
          <span style={{ "--p": loaderProgress }} />
        </span>
      </div>

      <div className="studio-chrome">
        <div className="studio-top">
          <div className="studio-brand">Khizar Yousaf</div>
          <div className="studio-top__actions">
            <button type="button" className="studio-pill studio-pill--accent" onClick={showHint}>
              Hints
            </button>
            <button
              type="button"
              className="studio-pill"
              onClick={() => setMenuOpen(true)}
            >
              Menu
            </button>
          </div>
        </div>

        <div className="studio-welcome">
          <h1>Welcome to my office</h1>
          <p>
            Click around and see what you find — or use the menu for a quicker way
            through.
            <span className="studio-swipe"> Swipe sideways to look around.</span>
          </p>
          <div className="studio-counter">
            {discoveredCount} of {discoverable.length} discovered
          </div>
        </div>
      </div>

      <nav className="studio-sr-nav" aria-label="Things in the studio">
        <ul>
          {discoverable.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => openHotspot(item.id)}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <AnimatePresence>
        {hint ? (
          <motion.div
            className="studio-hint"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          >
            <strong>Hint:</strong> {hint}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              type="button"
              className="studio-menu-scrim"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              className="studio-menu"
              aria-label="Quick links"
              initial={reduce ? false : { x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { x: 40, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            >
              <div className="studio-menu__head">
                <h2>Quick links</h2>
                <button
                  type="button"
                  className="studio-menu__close"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                >
                  ×
                </button>
              </div>
              {Object.entries(menuGroups).map(([group, items]) => (
                <div className="studio-menu__section" key={group}>
                  <p className="studio-menu__label">{group}</p>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="studio-menu__item"
                      onClick={() => openHotspot(item.id)}
                    >
                      {item.label}
                      {discovered.has(item.id) ? <span>Seen</span> : <span>New</span>}
                    </button>
                  ))}
                </div>
              ))}
              <Link className="studio-menu__admin" to="/admin">
                Admin →
              </Link>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {active && active.kind !== "lamp" && active.kind !== "work" ? (
          <>
            <motion.button
              type="button"
              className="studio-panel-scrim"
              aria-label="Close panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveId(null)}
            />
            <motion.aside
              className={`studio-panel${wide ? " studio-panel--phone" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label={active.label}
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            >
              <div className="studio-panel__head">
                <div>
                  <p className="studio-panel__eyebrow">{active.group}</p>
                  <h2>{active.label}</h2>
                </div>
                <button
                  type="button"
                  className="studio-panel__close"
                  aria-label="Close"
                  onClick={() => setActiveId(null)}
                >
                  ×
                </button>
              </div>

              {active.kind === "about" ? (
                <div className="studio-panel__body">
                  <div className="studio-panel__media">
                    <img src="/khizar.jpg" alt="Khizar Yousaf" />
                  </div>
                  <p>{ABOUT.body}</p>
                  <div className="studio-stats">
                    {ABOUT.stats.map((stat) => (
                      <article key={stat.label}>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                      </article>
                    ))}
                  </div>
                  <div className="studio-jobs">
                    {ABOUT.jobs.map((job) => (
                      <article key={`${job.org}-${job.dates}`}>
                        <time>{job.dates}</time>
                        <h3>{job.role}</h3>
                        <p>{job.org}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {active.kind === "clients" ? (
                <div className="studio-panel__body">
                  <p>Teams I’ve designed with.</p>
                  <div className="studio-clients">
                    {clients.map((client) => (
                      <div className="studio-client" key={client.id || client.name}>
                        <img src={client.logo} alt={client.alt || client.name} />
                        <span>{client.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {active.kind === "skills" ? (
                <div className="studio-panel__body">
                  <p>The tools and craft I use every week.</p>
                  <div className="studio-skills">
                    {SKILLS.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {active.kind === "contact" ? (
                <div className="studio-panel__body studio-phone">
                  <div className="studio-phone__stage">
                    <Suspense fallback={null}>
                      <PhoneDial request={dial} onPress={pressDigit} onDone={dialled} />
                    </Suspense>
                  </div>
                  <div className="studio-phone__side">
                  <p>Branding, social systems, campaigns, or print — tell me what you need.</p>
                  <p className="studio-phone__tip">
                    Pick a number and the phone dials it for you (or press 1, 2 or 3). You can
                    click the numbers on the dial, too.
                  </p>
                  <div className="studio-dials">
                    {Object.entries(DIALS).map(([n, d]) => (
                      <button key={n} type="button" onClick={() => pressDigit(Number(n))}>
                        <span>{n}</span>
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <details className="studio-phone__write">
                  <summary>Or send a message</summary>
                  <form className="studio-form" onSubmit={onSubmit}>
                    <label>
                      Name
                      <input name="name" required autoComplete="name" />
                    </label>
                    <label>
                      Email
                      <input name="email" type="email" required autoComplete="email" />
                    </label>
                    <label>
                      Message
                      <textarea name="message" required />
                    </label>
                    <button className="studio-cta" type="submit" disabled={sending}>
                      {sending ? "Sending…" : "Send message"}
                    </button>
                    {status ? <p className="studio-form__status">{status}</p> : null}
                  </form>
                  </details>
                  </div>
                </div>
              ) : null}

              {active.kind === "resume" ? (
                <div className="studio-panel__body">
                  <p>Download the latest CV as a PDF.</p>
                  <a className="studio-cta" href={CONTACT.resume} download>
                    Download résumé
                  </a>
                </div>
              ) : null}

              {active.kind === "globe" ? (
                <div className="studio-panel__body studio-phone">
                  <div className="studio-phone__stage studio-phone__stage--globe">
                    <Suspense fallback={null}>
                      <GlobeView focus={place} />
                    </Suspense>
                  </div>
                  <div className="studio-phone__side">
                    <p>Places I have worked from. Drag the globe, or pick a pin.</p>
                    <div className="studio-places">
                      {PLACES.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={place === p.id ? "is-on" : ""}
                          onClick={() => setPlace(p.id)}
                        >
                          <i aria-hidden="true" />
                          {p.name}, {p.country}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {active.kind === "mug" ? (
                <div className="studio-panel__body">
                  <p className="studio-play">
                    Fuel for late-night layouts. One more campaign, then maybe sleep.
                  </p>
                </div>
              ) : null}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
      {active?.kind === "work" && active.project ? (
        <div
          className="studio-book-wrap"
          role="dialog"
          aria-modal="true"
          aria-label={active.label}
          onClick={(e) => e.target === e.currentTarget && setActiveId(null)}
        >
          <Reader project={active.project} onClose={() => setActiveId(null)} />
        </div>
      ) : null}

      <AnimatePresence>
        {active?.kind === "lamp" ? (
          <motion.div
            className="studio-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Studio light: <strong>{lampMode}</strong> — click again to change
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
