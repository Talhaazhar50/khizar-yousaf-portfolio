import { useEffect, useMemo, useState } from "react";
import { dummyPages } from "./hotspots";

const pad = (n) => String(n).padStart(2, "0");

function Picture({ src, alt = "" }) {
  return <img src={src} alt={alt} draggable="false" />;
}

function Words({ page, link }) {
  return (
    <>
      <p className="studio-panel__eyebrow">{page.eyebrow}</p>
      <h2>{page.title}</h2>
      <p>{page.body}</p>
      {page.meta ? (
        <dl className="reader__meta">
          {page.meta.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {page.list ? (
        <ul className={`reader__list${page.list.length > 8 ? " reader__list--cols" : ""}`}>
          {page.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {link ? (
        <a className="studio-cta" href={link} target="_blank" rel="noopener noreferrer">
          View project
        </a>
      ) : null}
    </>
  );
}

/**
 * A leaf that turns over the spine: `front` shows first, `back` once it has crossed.
 * The turn is a CSS animation (see Studio.css), so the compositor runs it even while the
 * main thread is busy drawing the 3D room.
 */
function Leaf({ side, cover, front, back, onDone }) {
  return (
    <div
      className={`studio-book__leaf studio-book__leaf--${side}${cover ? " is-cover" : ""}`}
      onAnimationEnd={(e) => e.target === e.currentTarget && onDone()}
    >
      <div className="studio-book__face studio-book__face--front">{front}</div>
      <div className="studio-book__face studio-book__face--back">{back}</div>
    </div>
  );
}

/**
 * The open case study. It lands closed, the cover swings open, then arrows / keys turn the pages.
 * Pages come from project.pages (admin) or dummy copy until they exist.
 */
export default function Reader({ project, onClose }) {
  const pages = useMemo(
    () => (project.pages?.length ? project.pages : dummyPages(project)),
    [project]
  );
  const narrow = useMemo(() => window.matchMedia("(max-width: 720px)").matches, []);
  const [i, setI] = useState(0);
  // {dir: "next" | "prev", cover?: true}: the leaf that is turning right now
  const [turn, setTurn] = useState(narrow ? null : { dir: "next", cover: true });
  const [intro, setIntro] = useState(true); // the first page's words fade in after the cover opens
  const last = pages.length - 1;
  const opened = narrow || !turn?.cover;

  function go(dir) {
    if (turn || !opened) return;
    if (dir === "next" ? i >= last : i <= 0) return;
    setIntro(false);
    if (narrow) setI(i + (dir === "next" ? 1 : -1));
    else setTurn({ dir });
  }

  function landed() {
    if (!turn.cover) setI(i + (turn.dir === "next" ? 1 : -1));
    setTurn(null);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go("next");
      else if (e.key === "ArrowLeft") go("prev");
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const nextTurn = turn?.dir === "next" && !turn.cover;
  const leftPage = pages[turn?.dir === "prev" ? i - 1 : i];
  const rightPage = pages[nextTurn ? i + 1 : i];
  const linkFor = (page) => (page === pages[last] ? project.link : null);

  return (
    <>
      <div className={`studio-book${narrow ? "" : " is-opening"}`}>
        {opened ? (
          <div className="studio-book__page studio-book__left">
            <Picture src={leftPage.image} alt={leftPage.title} />
          </div>
        ) : null}
        <div className={`studio-book__page studio-book__page--text${intro ? " is-intro" : ""}`}>
          <Words page={rightPage} link={linkFor(rightPage)} />
        </div>

        {turn?.cover ? (
          <Leaf
            side="right"
            cover
            front={<Picture src={project.image} />}
            back={<Picture src={pages[0].image} alt={pages[0].title} />}
            onDone={landed}
          />
        ) : null}
        {nextTurn ? (
          <Leaf
            side="right"
            front={
              <div className="studio-book__page--text">
                <Words page={pages[i]} link={linkFor(pages[i])} />
              </div>
            }
            back={<Picture src={pages[i + 1].image} />}
            onDone={landed}
          />
        ) : null}
        {turn?.dir === "prev" ? (
          <Leaf
            side="left"
            front={<Picture src={pages[i].image} />}
            back={
              <div className="studio-book__page--text">
                <Words page={pages[i - 1]} />
              </div>
            }
            onDone={landed}
          />
        ) : null}
      </div>

      <div className="reader__nav">
        <button type="button" aria-label="Previous page" disabled={!opened || !!turn || i === 0} onClick={() => go("prev")}>
          ‹
        </button>
        <span>
          {pad(i + 1)} / {pad(pages.length)}
        </span>
        <button type="button" aria-label="Next page" disabled={!opened || !!turn || i === last} onClick={() => go("next")}>
          ›
        </button>
      </div>

      <button type="button" className="studio-panel__close studio-book__close" aria-label="Close" onClick={onClose}>
        ×
      </button>
    </>
  );
}
