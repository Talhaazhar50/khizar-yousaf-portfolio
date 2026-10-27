import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, PerformanceMonitor, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { PhoneModel } from "./PhoneDial.jsx";
import { Earth, earthTexture } from "./Globe.jsx";

// Layout: back wall is the z = 0 plane, floor is y = 0, everything faces +z.
const YELLOW = "#ecc22a";
const YELLOW_BACK = "#d9ab1c";
const WALL = "#6e5846";
const FLOOR = "#4a372a";
const BAND = "#d8b25a";

const FILL_PALETTE = [
  "#8f9e7a", "#e9dcc0", "#c98a5e", "#e3a57a", "#7f8f6a", "#d9c7a0",
  "#a9c79a", "#6f4a52", "#2f3b4a", "#b5574b", "#3d5a4a", "#e8b77a",
];

/** Bookshelf columns: x is the left edge, ys are board heights (bottom → top). */
const COLUMNS = [
  { x: 0.6, w: 0.95, ys: [0, 0.85, 1.7, 2.55] },
  { x: 1.55, w: 0.75, ys: [0, 0.63, 1.27, 1.9] },
  { x: 2.3, w: 0.95, ys: [0, 0.8, 1.6, 2.35, 3.15] },
  { x: 3.25, w: 0.85, ys: [0, 0.9, 1.8, 2.7] },
];
const DEPTH = 0.44;
const T = 0.05;

function canvasTexture(w, h, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Hover label, like "RÉSUMÉ" over a bay. */
function Tag({ position, name, title }) {
  return (
    <Html position={position} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
      <div className="studio-tag">
        <b>{name}</b>
        {title ? <span>{title}</span> : null}
      </div>
    </Html>
  );
}

// A whole bay that acts as one button: a see-through hit box behind the items, and a label.
const SECTIONS = {
  resume: { name: "Résumé", box: { pos: [-0.275, 0.345, -0.19], size: [0.9, 0.72, 0.02] }, tag: [-0.45, 0.78, 0] },
};

function Clickable({ hotspot, onSelect, children, ...props }) {
  const [hover, setHover] = useState(false);
  const section = SECTIONS[hotspot.id];
  return (
    <group
      position={hotspot.position}
      scale={hover && !section ? 1.05 : 1}
      onClick={(event) => {
        event.stopPropagation();
        if (event.delta > 8) return; // was a swipe, not a tap
        onSelect(hotspot.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "auto";
      }}
      {...props}
    >
      {children}
      {section ? (
        <mesh position={section.box.pos}>
          <boxGeometry args={section.box.size} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
      {section && hover ? <Tag position={section.tag} name={section.name} /> : null}
    </group>
  );
}


const PICK = 2; // which book in a work row is the clickable one (a bit thicker and taller)

function layoutBooks(colors, h, seed, pick = -1) {
  let x = 0;
  return colors.map((color, i) => {
    const w = (0.055 + ((i * 37 + seed) % 3) * 0.013) * (i === pick ? 2.2 : 1);
    const bh = h * (0.8 + ((i * 53 + seed) % 5) * 0.045) * (i === pick ? 1.06 : 1);
    const cx = x + w / 2;
    x += w + 0.004;
    return { color, w, bh, cx };
  });
}

function BookBody({ w, bh, color, children }) {
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, bh, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {[-0.36, 0.38].map((f) => (
        <mesh key={f} position={[0, bh * f, 0.151]}>
          <planeGeometry args={[w * 0.9, 0.014]} />
          <meshStandardMaterial color={BAND} roughness={0.5} />
        </mesh>
      ))}
      {children}
    </>
  );
}

/** Upright books starting at x = 0 on a shelf surface (y = 0). Book `pick` is clickable. */
function Books({ colors, h = 0.62, lean = 0, seed = 0, pick = -1, hide = false, tag, onPick }) {
  const [hover, setHover] = useState(false);
  return (
    <group rotation={[0, 0, lean]}>
      {layoutBooks(colors, h, seed, pick).map(({ color, w, bh, cx }, i) => {
        const mine = i === pick;
        if (mine && hide) return null; // it is out of the shelf, in the reader's hands
        return (
          <group
            key={i}
            position={[cx, bh / 2, mine && hover ? 0.3 : 0.25]}
            onClick={
              mine
                ? (e) => {
                    e.stopPropagation();
                    if (e.delta <= 8) onPick();
                  }
                : undefined
            }
            onPointerOver={
              mine
                ? (e) => {
                    e.stopPropagation();
                    setHover(true);
                    document.body.style.cursor = "pointer";
                  }
                : undefined
            }
            onPointerOut={
              mine
                ? () => {
                    setHover(false);
                    document.body.style.cursor = "auto";
                  }
                : undefined
            }
          >
            <BookBody w={w} bh={bh} color={color} />
            {mine && hover && tag ? <Tag position={[0, bh / 2 + 0.1, 0.2]} {...tag} /> : null}
          </group>
        );
      })}
    </group>
  );
}

const rowProps = (hotspot) => ({
  colors: hotspot.book?.colors || fillColors(0, 4),
  h: hotspot.book?.h,
  lean: hotspot.book?.lean || 0,
  seed: hotspot.id.length,
});

const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);

// The HTML book that takes over (see .studio-book in Studio.css): height min(76svh, 640px), pages 0.775 wide.
const READ_VH = 0.76;
const READ_PX = 640;
const PAGE_ASPECT = 0.775;

/** A real hardcover: two boards, a spine and a block of pages, cover art on the front board. */
function HardBook({ w, bh, color, map }) {
  const t = 0.014;
  const board = <meshStandardMaterial color={color} roughness={0.65} />;
  return (
    <>
      <mesh position={[w / 2 - t / 2, 0, 0]} castShadow>
        <boxGeometry args={[t, bh, 0.3]} />
        {board}
      </mesh>
      <mesh position={[-w / 2 + t / 2, 0, 0]} castShadow>
        <boxGeometry args={[t, bh, 0.3]} />
        {board}
      </mesh>
      <mesh position={[0, 0, 0.15 - t / 2]} castShadow>
        <boxGeometry args={[w, bh, t]} />
        {board}
      </mesh>
      <mesh position={[0, 0, (0.006 - t) / 2]}>
        <boxGeometry args={[w - 2 * t, bh - 0.024, 0.294 - t]} />
        <meshStandardMaterial color="#f1e6cf" roughness={0.9} />
      </mesh>
      {[-0.36, 0.38].map((f) => (
        <mesh key={f} position={[0, bh * f, 0.151]}>
          <planeGeometry args={[w * 0.9, 0.014]} />
          <meshStandardMaterial color={BAND} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[w / 2 + 0.0008, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.3, bh]} />
        {/* new material once the cover arrives: three won't recompile a material that gains a map */}
        <meshBasicMaterial key={map ? "cover" : "wait"} map={map} color={map ? "#ffffff" : color} toneMapped={false} />
      </mesh>
    </>
  );
}

/** The picked book leaves the shelf, flies in front of the camera and shows its cover. */
function FlyBook({ hotspot, open, onGone }) {
  const { colors, h, seed } = rowProps(hotspot);
  const { color, w, bh, cx } = layoutBooks(colors, h, seed, PICK)[PICK];
  const ref = useRef();
  const t = useRef(0);
  const [map, setMap] = useState(null);
  const start = useMemo(
    () => new THREE.Vector3(hotspot.position[0] + cx, hotspot.position[1] + bh / 2, hotspot.position[2] + 0.25),
    [hotspot, cx, bh]
  );
  const goal = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const src = hotspot.project?.image;

  useEffect(() => {
    if (!src) return undefined;
    let alive = true;
    const loader = new THREE.TextureLoader().setCrossOrigin("anonymous");
    loader.load(src, (tex) => {
      // crop to the reading cover's shape, like object-fit: cover
      const ia = tex.image.width / tex.image.height;
      if (ia > PAGE_ASPECT) {
        tex.repeat.set(PAGE_ASPECT / ia, 1);
        tex.offset.set((1 - PAGE_ASPECT / ia) / 2, 0);
      } else {
        tex.repeat.set(1, ia / PAGE_ASPECT);
        tex.offset.set(0, (1 - ia / PAGE_ASPECT) / 2);
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      if (alive) setMap(tex);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  useFrame(({ camera, size }, dt) => {
    t.current = THREE.MathUtils.clamp(t.current + ((open ? 1 : -1) * dt) / 0.8, 0, 1);
    const pull = easeInOut(Math.min(t.current / 0.3, 1));
    const fly = easeInOut(THREE.MathUtils.clamp((t.current - 0.22) / 0.78, 0, 1));
    const arc = Math.sin(fly * Math.PI);
    const view = 2 * 5 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); // world height 5 units away
    const read = (Math.min(READ_VH * size.height, READ_PX) / size.height) * view; // size of the HTML book
    goal.copy(camera.position).addScaledVector(camera.getWorldDirection(dir), 5);
    ref.current.position
      .copy(start)
      .add(dir.set(0, 0.03 * pull + 0.3 * arc, 0.5 * pull + 0.6 * arc))
      .lerp(goal, fly);
    ref.current.rotation.set(0.2 * arc, (-Math.PI / 2) * fly, 0.1 * arc);
    // the cover grows from a spine into a full page, so it lands exactly under the HTML book
    ref.current.scale.set(
      1 + ((read / bh) * 0.6 - 1) * fly,
      1 + (read / bh - 1) * fly,
      1 + ((PAGE_ASPECT * read) / 0.3 - 1) * fly
    );
    if (!open && t.current === 0) onGone();
  });

  return (
    <group ref={ref} position={start}>
      <HardBook w={w} bh={bh} color={color} map={map} />
    </group>
  );
}

function fillColors(seed, count) {
  return Array.from({ length: count }, (_, i) => FILL_PALETTE[(seed + i * 5) % FILL_PALETTE.length]);
}

function Bookshelf() {
  const yellow = <meshStandardMaterial color={YELLOW} roughness={0.55} />;
  return (
    <group>
      {COLUMNS.map((col) => {
        const h = col.ys[col.ys.length - 1];
        const cx = col.x + col.w / 2;
        return (
          <group key={col.x}>
            {[col.x + T / 2, col.x + col.w - T / 2].map((x) => (
              <mesh key={x} position={[x, h / 2, DEPTH / 2]} castShadow receiveShadow>
                <boxGeometry args={[T, h + T, DEPTH]} />
                {yellow}
              </mesh>
            ))}
            <mesh position={[cx, h / 2, 0.02]} receiveShadow>
              <boxGeometry args={[col.w, h, 0.03]} />
              <meshStandardMaterial color={YELLOW_BACK} roughness={0.7} />
            </mesh>
            {col.ys.map((y) => (
              <mesh key={y} position={[cx, Math.max(y, T / 2), DEPTH / 2]} castShadow receiveShadow>
                <boxGeometry args={[col.w - 2 * T, T, DEPTH]} />
                {yellow}
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Decorative fill so every bay feels lived in */}
      <group position={[3.3, 0.03, 0]}>
        <Books colors={fillColors(7, 8)} h={0.72} seed={1} />
      </group>
    </group>
  );
}

/** One draw call for all the vine leaves instead of one per leaf. */
function Leaves({ leaves }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    leaves.forEach((leaf, i) => {
      o.position.set(...leaf.p);
      o.rotation.set(...leaf.r);
      o.scale.set(1, 0.55, 0.18);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      ref.current.setColorAt(i, c.set(leaf.c));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, [leaves]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, leaves.length]} castShadow>
      <sphereGeometry args={[0.055, 8, 6]} />
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  );
}

function Plant({ hotspot, onSelect }) {
  const leaves = useMemo(() => {
    const out = [];
    const vines = 16;
    for (let i = 0; i < vines; i += 1) {
      const a = (i / vines) * Math.PI * 2;
      const drop = 0.3 + ((i * 7) % 6) * 0.32;
      const len = 10 + ((i * 3) % 8);
      for (let k = 0; k < len; k += 1) {
        const t = k / (len - 1);
        out.push({
          p: [
            Math.cos(a) * (0.12 + 0.28 * t) + Math.sin(k * 1.7 + i) * 0.04,
            0.28 + 0.1 * Math.sin(t * Math.PI) - t * t * drop,
            Math.sin(a) * 0.08 + 0.05 + 0.32 * Math.sqrt(t),
          ],
          r: [Math.sin(k + i) * 0.8, a, Math.cos(k * 2 + i) * 0.9],
          c: (i + k) % 3 === 0 ? "#9dbf6a" : (i + k) % 3 === 1 ? "#5f9442" : "#3f7232",
        });
      }
    }
    return out;
  }, []);

  return (
    <Clickable hotspot={hotspot} onSelect={onSelect}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.3, 24]} />
        <meshStandardMaterial color="#1e1a17" roughness={0.6} />
      </mesh>
      <Leaves leaves={leaves} />
    </Clickable>
  );
}

function Frame({ src, w, h, mat = 0.03 }) {
  const map = useTexture(src);
  map.colorSpace = THREE.SRGBColorSpace;
  return (
    <group rotation={[-0.08, 0, 0]}>
      <RoundedBox args={[w, h, 0.035]} radius={0.008} castShadow position={[0, h / 2, 0]}>
        <meshStandardMaterial color="#a97c4f" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, h / 2, 0.019]}>
        <planeGeometry args={[w - 0.04, h - 0.04]} />
        <meshStandardMaterial color="#f3ead8" />
      </mesh>
      <mesh position={[0, h / 2, 0.02]}>
        <planeGeometry args={[w - 0.04 - mat * 2, h - 0.04 - mat * 2]} />
        <meshStandardMaterial map={map} />
      </mesh>
    </group>
  );
}

function WallShelf() {
  return (
    <mesh position={[-2.45, 2.75, 0.15]} castShadow receiveShadow>
      <boxGeometry args={[2.5, 0.09, 0.3]} />
      <meshStandardMaterial color={YELLOW} roughness={0.55} />
    </mesh>
  );
}

function Poster() {
  const map = useTexture("/work-kozzi.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  return (
    <group>
      <mesh position={[0, 0, 0.005]} castShadow>
        <boxGeometry args={[0.62, 0.88, 0.01]} />
        <meshStandardMaterial color="#efe6d2" />
      </mesh>
      <mesh position={[0, -0.03, 0.012]}>
        <planeGeometry args={[0.54, 0.74]} />
        <meshStandardMaterial map={map} />
      </mesh>
    </group>
  );
}

function Corkboard({ clients }) {
  const map = useMemo(
    () =>
      canvasTexture(1040, 720, (ctx, w, h) => {
        ctx.fillStyle = "#c79a62";
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 2400; i += 1) {
          ctx.fillStyle = i % 2 ? "rgba(90,55,25,0.18)" : "rgba(255,235,200,0.12)";
          ctx.fillRect((i * 97) % w, (i * 61) % h, 3, 3);
        }
        ctx.fillStyle = "#f5ecd9";
        ctx.fillRect(60, 40, 260, 64);
        ctx.fillStyle = "#4a3a2c";
        ctx.font = "600 34px Karla, sans-serif";
        ctx.fillText("Worked with", 84, 84);
        const notes = ["#f7efc6", "#e9f1d8", "#f6e3c9", "#e1ecef"];
        const labels = clients.map((c) => c.name);
        for (let i = 0; i < 8; i += 1) {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const x = 60 + col * 240;
          const y = 150 + row * 270;
          ctx.save();
          ctx.translate(x + 100, y + 110);
          ctx.rotate(((i * 7) % 5 - 2) * 0.02);
          ctx.fillStyle = notes[i % notes.length];
          ctx.shadowColor = "rgba(0,0,0,0.25)";
          ctx.shadowBlur = 8;
          ctx.fillRect(-100, -110, 200, 220);
          ctx.shadowBlur = 0;
          ctx.fillStyle = ["#d9534f", "#3d6fb6", "#e0a526", "#5a9a5a"][i % 4];
          ctx.beginPath();
          ctx.arc(0, -90, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#4a3a2c";
          ctx.font = "500 24px Caveat, cursive";
          const text = labels[i] || "";
          text.split(" ").forEach((word, j) => ctx.fillText(word, -80, -40 + j * 30));
          ctx.fillStyle = "rgba(74,58,44,0.25)";
          for (let l = 0; l < 3; l += 1) ctx.fillRect(-80, 50 + l * 22, 150 - l * 30, 3);
          ctx.restore();
        }
      }),
    [clients]
  );
  return (
    <group>
      <RoundedBox args={[1.3, 0.9, 0.04]} radius={0.01} castShadow>
        <meshStandardMaterial color="#a8763f" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[1.22, 0.83]} />
        <meshStandardMaterial map={map} roughness={1} />
      </mesh>
    </group>
  );
}

function Postcard() {
  const map = useMemo(
    () =>
      canvasTexture(512, 360, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#f2b48a");
        g.addColorStop(1, "#e88f5c");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#6b3f2a";
        ctx.beginPath();
        ctx.moveTo(0, h);
        [[0, 250], [60, 250], [60, 200], [110, 200], [130, 150], [150, 200], [220, 210], [240, 120],
          [262, 120], [280, 210], [360, 220], [380, 180], [430, 180], [450, 230], [w, 230], [w, h]]
          .forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.fill();
        ctx.fillStyle = "#fff7ec";
        ctx.font = "italic 600 26px 'Playfair Display', serif";
        ctx.fillText("Greetings from", 24, 48);
        ctx.font = "600 52px 'Playfair Display', serif";
        ctx.fillText("PAKISTAN", 24, 104);
        ctx.strokeStyle = "#fff7ec";
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, w - 10, h - 10);
      }),
    []
  );
  return (
    <group rotation={[0, 0, 0.06]}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.35, 0.006]} />
        <meshStandardMaterial color="#f3ead8" />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[0.48, 0.33]} />
        <meshStandardMaterial map={map} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.22, 0.16, 0.006]} rotation={[0, 0, s * 0.6]}>
          <planeGeometry args={[0.12, 0.04]} />
          <meshStandardMaterial color="#f1e2b8" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Cat() {
  const tail = useRef();
  useFrame(({ clock }) => {
    if (tail.current) tail.current.rotation.y = Math.sin(clock.elapsedTime * 1.6) * 0.35;
  });
  const white = <meshStandardMaterial color="#f1ebe0" roughness={0.9} />;
  const dark = <meshStandardMaterial color="#2a2420" roughness={0.9} />;
  const ginger = <meshStandardMaterial color="#8a6a4a" roughness={0.9} />;
  return (
    <group>
      <mesh position={[0, 0.27, 0]} scale={[1, 1.3, 0.9]} castShadow>
        <sphereGeometry args={[0.2, 24, 20]} />
        {white}
      </mesh>
      <mesh position={[-0.1, 0.36, -0.08]} scale={[0.8, 1, 0.8]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        {ginger}
      </mesh>
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.05, 0.12]} scale={[1, 0.7, 1.4]} castShadow>
          <sphereGeometry args={[0.055, 12, 10]} />
          {x < 0 ? white : dark}
        </mesh>
      ))}
      <group position={[0, 0.62, 0.04]}>
        <mesh castShadow scale={[1.1, 1, 1]}>
          <sphereGeometry args={[0.15, 24, 20]} />
          {white}
        </mesh>
        <mesh position={[-0.06, 0.06, 0.04]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.1, 16, 12]} />
          {ginger}
        </mesh>
        <mesh position={[0.07, 0.07, 0.02]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.09, 16, 12]} />
          {dark}
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.09, 0.15, 0]} rotation={[0, 0, -s * 0.35]} castShadow>
            <coneGeometry args={[0.05, 0.11, 4]} />
            {s < 0 ? ginger : dark}
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.055, 0.01, 0.13]}>
            <mesh>
              <sphereGeometry args={[0.028, 12, 10]} />
              <meshStandardMaterial color="#b9c46a" />
            </mesh>
            <mesh position={[0, 0, 0.022]} scale={[0.4, 1, 0.4]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.04, 0.15]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#d98b8b" />
        </mesh>
      </group>
      <group ref={tail} position={[0.12, 0.03, -0.1]}>
        <mesh position={[0.15, 0, 0.05]} rotation={[Math.PI / 2, 0, -1.2]} castShadow>
          <capsuleGeometry args={[0.03, 0.3, 4, 10]} />
          {dark}
        </mesh>
      </group>
    </group>
  );
}

function Globe() {
  const spin = useRef();
  const map = useMemo(() => earthTexture(1024), []);
  useFrame((_, dt) => {
    spin.current.rotation.y += dt * 0.6;
  });
  return (
    <group>
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.03, 18]} />
        <meshStandardMaterial color="#b98a4a" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 6]} />
        <meshStandardMaterial color="#b98a4a" metalness={0.4} />
      </mesh>
      <group position={[0, 0.2, 0]} rotation={[0, 0, 0.4]}>
        <group ref={spin}>
          <Earth radius={0.12} map={map} pin={1.8} />
        </group>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.135, 0.006, 6, 32, Math.PI]} />
          <meshStandardMaterial color="#b98a4a" metalness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function Llama() {
  const white = <meshStandardMaterial color="#f3ede2" roughness={0.8} />;
  return (
    <group>
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.06, 0.12, 4, 10]} />
        {white}
      </mesh>
      {[[-0.07, 0.05], [0.07, 0.05], [-0.07, -0.04], [0.07, -0.04]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.08, z]}>
          <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
          {white}
        </mesh>
      ))}
      <mesh position={[0.08, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.035, 0.18, 4, 10]} />
        {white}
      </mesh>
      <mesh position={[0.11, 0.47, 0]} rotation={[0, 0, -1.3]}>
        <capsuleGeometry args={[0.035, 0.05, 4, 10]} />
        {white}
      </mesh>
      {[-0.02, 0.02].map((z) => (
        <mesh key={z} position={[0.07, 0.53, z]}>
          <coneGeometry args={[0.012, 0.05, 6]} />
          {white}
        </mesh>
      ))}
      <mesh position={[0.02, 0.27, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.065, 0.01, 6, 20]} />
        <meshStandardMaterial color="#d9584a" />
      </mesh>
    </group>
  );
}

function Lamp({ mode }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity =
        mode === "off" ? 0 : 0.55 + Math.sin(clock.elapsedTime * 2) * 0.06;
    }
  });
  return (
    <group>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.06, 18]} />
        <meshStandardMaterial color="#b98a4a" roughness={0.5} />
      </mesh>
      <mesh ref={ref} position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.15, 32, 24]} />
        <meshStandardMaterial
          color={mode === "cool" ? "#e6f1ff" : "#fbf5ea"}
          emissive={mode === "cool" ? "#9ecbff" : "#ffe3b0"}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}

function Chess() {
  const map = useMemo(
    () =>
      canvasTexture(256, 256, (ctx) => {
        for (let r = 0; r < 8; r += 1)
          for (let c = 0; c < 8; c += 1) {
            ctx.fillStyle = (r + c) % 2 ? "#6b4a2e" : "#efe2c6";
            ctx.fillRect(c * 32, r * 32, 32, 32);
          }
      }),
    []
  );
  return (
    <group rotation={[-0.12, 0, 0]}>
      <mesh position={[0, 0.27, 0]} castShadow>
        <boxGeometry args={[0.54, 0.54, 0.03]} />
        <meshStandardMaterial color="#5a3d26" />
      </mesh>
      <mesh position={[0, 0.27, 0.016]}>
        <planeGeometry args={[0.48, 0.48]} />
        <meshStandardMaterial map={map} />
      </mesh>
    </group>
  );
}

function Tube() {
  return (
    <group>
      <mesh position={[0, 0.33, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.065, 0.66, 20]} />
        <meshStandardMaterial color="#5f5a78" roughness={0.6} />
      </mesh>
      {[0.03, 0.64].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 20]} />
          <meshStandardMaterial color="#5f5a78" roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, 0.066]}>
        <circleGeometry args={[0.02, 16]} />
        <meshStandardMaterial color={BAND} />
      </mesh>
    </group>
  );
}

const SCENE_ITEMS = {
  about: () => <Frame src="/khizar.jpg" w={0.5} h={0.64} />,
  poster: () => <Poster />,
  contact: () => (
    <group scale={0.34}>
      <PhoneModel />
    </group>
  ),
  resume: () => (
    <>
      <Tube />
      <group position={[-0.69, 0, -0.24]}>
        <Books colors={fillColors(4, 4)} h={0.6} seed={5} />
      </group>
    </>
  ),
  chess: () => <Chess />,
  globe: () => <Globe />,
  cat: () => <Cat />,
};

// Narrow screens see a 4.6-unit slice of the room and swipe between these camera x limits.
const NARROW_W = 5;
const PAN_MIN = -2.2;
const PAN_MAX = 1.85;

function Rig() {
  const { camera, size, gl } = useThree();
  const goal = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(0.25, 1.75, 0), []);
  const panX = useRef(PAN_MAX);
  const narrow = size.width / size.height < 1;

  useEffect(() => {
    if (!narrow) return undefined;
    const el = gl.domElement;
    let start = null;
    const down = (e) => {
      start = { x: e.clientX, pan: panX.current };
    };
    const move = (e) => {
      if (!start) return;
      const next = start.pan - ((e.clientX - start.x) * NARROW_W) / size.width;
      panX.current = THREE.MathUtils.clamp(next, PAN_MIN, PAN_MAX);
    };
    const up = () => {
      start = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl, narrow, size.width]);

  useFrame((state) => {
    const aspect = size.width / size.height;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const fitW = narrow ? NARROW_W : 9.4;
    const cx = narrow ? panX.current : 0.25;
    const dist = Math.min(22, Math.max(narrow ? 0 : 9.5, fitW / 2 / (tan * aspect)));
    // Touch "pointer" jumps to the tap point, so mouse parallax is desktop only.
    const px = narrow ? 0 : state.pointer.x * 0.3;
    const py = narrow ? 0 : state.pointer.y * 0.12;
    // Narrow screens aim lower so the floor clears the welcome text.
    const lookY = narrow ? 1.2 : 1.75;
    goal.set(cx + px, lookY + 0.45 + py, dist);
    camera.position.lerp(goal, 0.08);
    look.lerp(goal.set(cx, lookY, 0), 0.08);
    camera.lookAt(look);
  });
  return null;
}

function SceneContent({ hotspots, clients, lampMode, activeId, low, onSelect }) {
  const byId = useMemo(() => Object.fromEntries(hotspots.map((h) => [h.id, h])), [hotspots]);
  const work = hotspots.filter((h) => h.kind === "work");
  const lampOn = lampMode !== "off";
  const [flyId, setFlyId] = useState(null); // the book that is out of the shelf, until it is back
  const flying = work.find((h) => h.id === flyId);
  const frame = useRef(0);

  // Demand frameloop: draw 30 times a second at rest (the room barely moves), 60 while a book flies.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const id = setInterval(invalidate, flyId ? 16 : 33);
    return () => clearInterval(id);
  }, [invalidate, flyId]);

  // The room barely moves, so redraw the shadow map every 8th frame, and every frame while a book flies.
  useFrame(({ gl }) => {
    frame.current += 1;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = flyId !== null || frame.current < 3 || frame.current % 8 === 0;
  });

  useEffect(() => {
    if (work.some((h) => h.id === activeId)) setFlyId(activeId);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <color attach="background" args={[WALL]} />
      <Rig />

      <hemisphereLight args={["#fff1dc", "#3a2a1e", lampOn ? 1.25 : 0.7]} />
      <directionalLight
        key={low ? "low" : "hi"}
        castShadow
        position={[-6, 7, 6]}
        intensity={lampOn ? 3.2 : 1.8}
        color="#ffe6c4"
        shadow-mapSize={low ? [1536, 1536] : [3072, 3072]}
        shadow-radius={low ? 3 : 5}
        shadow-blurSamples={8}
        shadow-bias={-0.0002}
        shadow-normalBias={0.008}
        shadow-camera-near={1}
        shadow-camera-far={25}
        shadow-camera-left={-5.5}
        shadow-camera-right={5.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-2}
      />
      <pointLight
        position={[1.08, 2.85, 0.6]}
        intensity={lampMode === "off" ? 0 : 1.6}
        color={lampMode === "cool" ? "#9ecbff" : "#ffcf8a"}
        distance={3.5}
      />

      <mesh position={[0, 3, 0]} receiveShadow>
        <planeGeometry args={[40, 12]} />
        <meshStandardMaterial color={WALL} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 6]} receiveShadow>
        <planeGeometry args={[40, 12]} />
        <meshStandardMaterial color={FLOOR} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.06, 0.01]} receiveShadow>
        <boxGeometry args={[40, 0.12, 0.02]} />
        <meshStandardMaterial color="#4a3a2d" roughness={0.9} />
      </mesh>

      <Bookshelf />
      <WallShelf />
      <group position={[-1.55, 2.795, 0.14]}>
        <Frame src="/work-event.jpg" w={0.42} h={0.52} />
      </group>
      <group position={[-1.12, 1.62, 0.01]}>
        <Postcard />
      </group>
      <group position={[1.85, 1.3, 0.24]} rotation={[0, -0.5, 0]}>
        <Llama />
      </group>

      {work.map((hotspot) => (
        <group key={hotspot.id} position={hotspot.position}>
          <Books
            {...rowProps(hotspot)}
            pick={PICK}
            tag={{ name: hotspot.section, title: hotspot.project?.title }}
            hide={hotspot.id === flyId}
            onPick={() => onSelect(hotspot.id)}
          />
        </group>
      ))}
      {flying && (
        <FlyBook key={flyId} hotspot={flying} open={activeId === flyId} onGone={() => setFlyId(null)} />
      )}

      {Object.entries(SCENE_ITEMS).map(([id, Item]) =>
        byId[id] ? (
          <Clickable key={id} hotspot={byId[id]} onSelect={onSelect}>
            <Item />
          </Clickable>
        ) : null
      )}

      {byId.skills && <Plant hotspot={byId.skills} onSelect={onSelect} />}
      {byId.clients && (
        <Clickable hotspot={byId.clients} onSelect={onSelect}>
          <Corkboard clients={clients} />
        </Clickable>
      )}
      {byId.lamp && (
        <Clickable hotspot={byId.lamp} onSelect={onSelect}>
          <Lamp mode={lampMode} />
        </Clickable>
      )}
    </>
  );
}

export default function StudioScene({ hotspots, clients, lampMode, activeId, onSelect, ready, paused }) {
  const [low, setLow] = useState(false); // the machine can't keep up: drop sharpness for speed
  return (
    <div className={`studio-canvas${ready ? " is-ready" : ""}`}>
      <Canvas
        shadows
        dpr={low ? 1 : [1, 1.5]}
        frameloop={paused ? "never" : "demand"}
        camera={{ position: [0.1, 2.1, 11], fov: 30, near: 1, far: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
        onPointerMissed={() => onSelect(null)}
      >
        <PerformanceMonitor bounds={() => [22, 70]} onDecline={() => setLow(true)} />
        <SceneContent
          hotspots={hotspots}
          clients={clients}
          lampMode={lampMode}
          activeId={activeId}
          low={low}
          onSelect={onSelect}
        />
      </Canvas>
    </div>
  );
}
