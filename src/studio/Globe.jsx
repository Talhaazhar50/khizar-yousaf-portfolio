import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import land from "./land.js";
import { PLACES } from "./hotspots";

const rad = THREE.MathUtils.degToRad;
const AUTO = 0.35; // resting spin, radians per second

/** Stylised earth: deep sea, olive land with a light edge, faint graticule. */
export function earthTexture(width = 2048) {
  const w = width;
  const h = width / 2;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const X = (lon) => ((lon + 180) / 360) * w;
  const Y = (lat) => ((90 - lat) / 180) * h;

  const sea = ctx.createLinearGradient(0, 0, 0, h);
  sea.addColorStop(0, "#0b2e50");
  sea.addColorStop(0.5, "#13497b");
  sea.addColorStop(1, "#0b2e50");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = w / 1024;
  ctx.beginPath();
  for (let lon = -180; lon <= 180; lon += 30) {
    ctx.moveTo(X(lon), 0);
    ctx.lineTo(X(lon), h);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.moveTo(0, Y(lat));
    ctx.lineTo(w, Y(lat));
  }
  ctx.stroke();

  ctx.beginPath();
  for (const ring of land) {
    ring.forEach(([lon, lat], i) => (i ? ctx.lineTo(X(lon), Y(lat)) : ctx.moveTo(X(lon), Y(lat))));
    ctx.closePath();
  }
  ctx.fillStyle = "#6f9238";
  ctx.fill("evenodd");
  ctx.lineJoin = "round";
  ctx.lineWidth = w / 380;
  ctx.strokeStyle = "#a6c25c";
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Point on a unit sphere that SphereGeometry maps an equirectangular texture to. */
function latLon(lat, lon) {
  const phi = rad(lon + 180);
  const la = rad(lat);
  return new THREE.Vector3(-Math.cos(la) * Math.cos(phi), Math.sin(la), Math.cos(la) * Math.sin(phi));
}

const UP = new THREE.Vector3(0, 1, 0);
const PINS = PLACES.map((p) => {
  const n = latLon(p.lat, p.lon);
  return { ...p, n, q: new THREE.Quaternion().setFromUnitVectors(UP, n) };
});

/** The sphere with a red pin on every place. `pin` scales the pins, `focus` enlarges one. */
export function Earth({ radius = 1, map, pin = 1, focus }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 64, 48]} />
        <meshStandardMaterial map={map} roughness={0.7} metalness={0.05} />
      </mesh>
      {PINS.map((p) => (
        <group
          key={p.id}
          position={p.n.clone().multiplyScalar(radius)}
          quaternion={p.q}
          scale={radius * pin * (focus === p.id ? 1.4 : 1)}
        >
          <mesh position={[0, 0.085, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.17, 6]} />
            <meshStandardMaterial color="#e3d3b0" />
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <sphereGeometry args={[0.04, 18, 14]} />
            <meshStandardMaterial color="#e8481c" roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** Spins by itself, can be dragged, and swings round to face `focus`. */
function Spinner({ focus }) {
  const gl = useThree((s) => s.gl);
  const tilt = useRef();
  const spin = useRef();
  const map = useMemo(() => earthTexture(2048), []);
  const st = useRef({ vy: AUTO, down: false, t: 0, goal: null, hold: 0 });

  useEffect(() => {
    const p = PINS.find((x) => x.id === focus);
    st.current.goal = p ? { y: -Math.atan2(p.n.x, p.n.z), x: rad(p.lat) * 0.6 } : null;
    st.current.hold = 0;
  }, [focus]);

  useEffect(() => {
    const el = gl.domElement;
    const s = st.current;
    let last = { x: 0, y: 0 };
    const down = (e) => {
      s.down = true;
      s.goal = null;
      last = { x: e.clientX, y: e.clientY };
      s.t = e.timeStamp;
    };
    const move = (e) => {
      if (!s.down) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      spin.current.rotation.y += dx * 0.008;
      tilt.current.rotation.x = THREE.MathUtils.clamp(tilt.current.rotation.x + dy * 0.005, -0.9, 0.9);
      const dt = Math.max(1, e.timeStamp - s.t) / 1000;
      s.vy = THREE.MathUtils.clamp((dx * 0.008) / dt, -6, 6);
      last = { x: e.clientX, y: e.clientY };
      s.t = e.timeStamp;
    };
    const up = () => {
      s.down = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const s = st.current;
    if (s.down) return;
    const k = Math.min(1, dt * 3.5);
    if (s.goal) {
      const dy = wrap(s.goal.y - spin.current.rotation.y);
      spin.current.rotation.y += dy * k;
      tilt.current.rotation.x += (s.goal.x - tilt.current.rotation.x) * k;
      if (Math.abs(dy) < 0.02) {
        s.hold += dt;
        if (s.hold > 3) s.goal = null; // looked long enough, carry on turning
      }
    } else {
      spin.current.rotation.y += s.vy * dt;
      s.vy += (AUTO - s.vy) * Math.min(1, dt * 1.5);
      tilt.current.rotation.x += (0.25 - tilt.current.rotation.x) * Math.min(1, dt * 1.5);
    }
  });

  return (
    <group ref={tilt} rotation={[0.25, 0, 0]}>
      <group ref={spin}>
        <Earth map={map} focus={focus} />
      </group>
      <mesh scale={1.05}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial color="#3f86d8" transparent opacity={0.22} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export default function GlobeView({ focus }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.9], fov: 30 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <hemisphereLight args={["#cfe3ff", "#1a1410", 1.1]} />
      <directionalLight position={[-3, 2, 4]} intensity={3} color="#fff1dc" />
      <directionalLight position={[4, 1, -2]} intensity={1.2} color="#7fb4ff" />
      <Spinner focus={focus} />
    </Canvas>
  );
}
