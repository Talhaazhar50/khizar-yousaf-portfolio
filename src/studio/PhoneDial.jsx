import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// Rotary phone, front = +z, floor = y 0. Shared by the shelf and the "Say hello" panel.
const PINK = "#e9908c";
const R = 0.235; // dial radius
const RING = 0.165; // radius the finger holes sit on
const HOLE = 0.031;
const STOP = 120; // finger stop, degrees clockwise from 12 o'clock
const holeAngle = (n) => 75 - (n - 1) * 30; // digit n (1..10) sits here, 10 = "0"
const rad = THREE.MathUtils.degToRad;

const SLOPE_TOP = [0.1, 0.5]; // [z, y] where the dial slope starts and ends
const SLOPE_END = [0.5, 0.07];
const TILT = Math.atan2(SLOPE_TOP[1] - SLOPE_END[1], SLOPE_END[0] - SLOPE_TOP[0]);
const BEVEL = 0.05;

/** Digit under a point in the dial's local space, or null. */
function digitAt(point) {
  const r = Math.hypot(point.x, point.z);
  if (r < 0.1 || r > R) return null;
  const a = (Math.atan2(point.x, -point.z) * 180) / Math.PI;
  for (let n = 1; n <= 10; n += 1) {
    const d = Math.abs((((a - holeAngle(n)) % 360) + 540) % 360 - 180);
    if (d <= 15) return n % 10;
  }
  return null;
}

function dialFace() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const c = 512;
  const k = c / R;
  ctx.fillStyle = "#f1e9d8";
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.fillStyle = "#3a2a22";
  ctx.font = "700 92px 'Playfair Display', Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let n = 1; n <= 10; n += 1) {
    const a = rad(holeAngle(n));
    ctx.fillText(String(n % 10), c + Math.sin(a) * RING * k, c - Math.cos(a) * RING * k);
  }
  ctx.strokeStyle = "#b3ab9b";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(c, c, 0.1 * k, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#df6f6a";
  ctx.font = "700 58px 'Playfair Display', Georgia, serif";
  ctx.fillText("SAY", c, c - 34);
  ctx.fillText("HELLO", c, c + 34);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** The finger wheel: a ring with ten real holes. */
function wheelGeometry() {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = (x, y, r) => {
    const p = new THREE.Path();
    p.absarc(x, y, r, 0, Math.PI * 2, true);
    shape.holes.push(p);
  };
  hole(0, 0, 0.1);
  for (let n = 1; n <= 10; n += 1) {
    const a = rad(holeAngle(n));
    hole(Math.sin(a) * RING, Math.cos(a) * RING, HOLE);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.014,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 48,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/** Soft wedge body: dial slope at the front, flat top at the back for the handset. */
function baseGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.38, 0);
  s.lineTo(0.46, 0);
  s.lineTo(...SLOPE_END);
  s.lineTo(...SLOPE_TOP);
  s.lineTo(-0.2, 0.52);
  s.lineTo(-0.38, 0.4);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.8,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 10,
    curveSegments: 16,
  });
  geo.translate(0, 0, -0.4);
  geo.rotateY(-Math.PI / 2); // shape x -> world z, extrusion -> world x
  geo.computeVertexNormals();
  return geo;
}

/** Handset: an arched grip with flared ear and mouth pieces. */
function gripGeometry() {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.37, 0.13, 0),
    new THREE.Vector3(-0.24, 0.22, 0),
    new THREE.Vector3(0, 0.26, 0),
    new THREE.Vector3(0.24, 0.22, 0),
    new THREE.Vector3(0.37, 0.13, 0),
  ]);
  return new THREE.TubeGeometry(path, 48, 0.052, 20);
}

function cupGeometry() {
  const pts = [
    [0, 0],
    [0.118, 0],
    [0.126, 0.02],
    [0.108, 0.06],
    [0.082, 0.11],
    [0.066, 0.16],
    [0.058, 0.2],
    [0, 0.2],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 36);
}

function cordGeometry() {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.37, 0.64, -0.04),
    new THREE.Vector3(-0.5, 0.52, 0.02),
    new THREE.Vector3(-0.68, 0.34, 0.14),
    new THREE.Vector3(-0.66, 0.16, 0.24),
    new THREE.Vector3(-0.52, 0.12, 0.2),
  ]);
  const N = 320;
  const frames = path.computeFrenetFrames(N, false);
  const pts = [];
  for (let i = 0; i <= N; i += 1) {
    const a = (i / N) * Math.PI * 2 * 16;
    pts.push(
      path
        .getPointAt(i / N)
        .addScaledVector(frames.normals[i], Math.cos(a) * 0.03)
        .addScaledVector(frames.binormals[i], Math.sin(a) * 0.03)
    );
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 900, 0.0095, 8);
}

/** wheelRef: group the caller spins. onDigit: called with 0-9 when the dial is clicked. */
export function PhoneModel({ wheelRef, onDigit }) {
  const base = useMemo(baseGeometry, []);
  const grip = useMemo(gripGeometry, []);
  const cup = useMemo(cupGeometry, []);
  const cord = useMemo(cordGeometry, []);
  const wheel = useMemo(wheelGeometry, []);
  const face = useMemo(dialFace, []);
  const pink = <meshStandardMaterial color={PINK} roughness={0.32} />;
  const steel = <meshStandardMaterial color="#c4bfb4" metalness={0.8} roughness={0.28} />;
  const stopA = rad(STOP);
  const mid = [(SLOPE_TOP[0] + SLOPE_END[0]) / 2, (SLOPE_TOP[1] + SLOPE_END[1]) / 2];
  const lift = BEVEL + 0.003; // the bevel pushes the slope out along its normal

  return (
    <group>
      <mesh geometry={base} castShadow>
        {pink}
      </mesh>

      <group
        position={[0, mid[1] + Math.cos(TILT) * lift, mid[0] + Math.sin(TILT) * lift]}
        rotation={[TILT, 0, 0]}
        onClick={
          onDigit &&
          ((e) => {
            const n = digitAt(e.eventObject.worldToLocal(e.point.clone()));
            if (n !== null) {
              e.stopPropagation();
              onDigit(n);
            }
          })
        }
        onPointerMove={
          onDigit &&
          ((e) => {
            document.body.style.cursor = digitAt(e.eventObject.worldToLocal(e.point.clone())) === null ? "auto" : "pointer";
          })
        }
        onPointerOut={onDigit && (() => (document.body.style.cursor = "auto"))}
      >
        <mesh position={[0, -0.006, 0]}>
          <cylinderGeometry args={[R + 0.03, R + 0.04, 0.02, 64]} />
          <meshStandardMaterial color="#2f2420" roughness={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <circleGeometry args={[R, 64]} />
          <meshStandardMaterial map={face} roughness={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
          <torusGeometry args={[R + 0.014, 0.016, 12, 80]} />
          {steel}
        </mesh>
        <group ref={wheelRef} position={[0, 0.016, 0]}>
          <mesh geometry={wheel}>
            <meshStandardMaterial color="#f6efdf" roughness={0.3} transparent opacity={0.9} />
          </mesh>
        </group>
        <mesh position={[Math.sin(stopA) * (R + 0.002), 0.03, -Math.cos(stopA) * (R + 0.002)]} rotation={[0, Math.PI / 2 - stopA, 0]}>
          <boxGeometry args={[0.1, 0.016, 0.024]} />
          {steel}
        </mesh>
      </group>

      {/* handset resting on the top */}
      <group position={[0, 0.6, -0.08]}>
        <mesh geometry={grip} castShadow>
          {pink}
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={cup} position={[s * 0.37, 0, 0]} castShadow>
            {pink}
          </mesh>
        ))}
      </group>
      <mesh geometry={cord}>{pink}</mesh>
    </group>
  );
}

const ease = (u) => 1 - (1 - u) * (1 - u);

function DialRig({ request, onPress, onDone }) {
  const wheel = useRef();
  const spin = useRef(null);
  const sway = useRef();

  useEffect(() => {
    if (!request) return;
    const k = request.n === 0 ? 10 : request.n;
    const deg = STOP - holeAngle(k); // dial the hole round to the finger stop
    spin.current = { n: request.n, deg, t: 0, out: 0.3 + (deg / 360) * 0.6 };
  }, [request]);

  useFrame(({ clock }, dt) => {
    sway.current.rotation.y = 0.5 + Math.sin(clock.elapsedTime * 0.6) * 0.07;
    const s = spin.current;
    if (!s) return;
    s.t += dt;
    const back = s.out * 0.8;
    const angle = s.t < s.out ? s.deg * ease(s.t / s.out) : s.deg * Math.max(0, 1 - (s.t - s.out) / back);
    wheel.current.rotation.y = -rad(angle);
    if (s.t >= s.out + back) {
      spin.current = null;
      onDone(s.n);
    }
  });

  return (
    <group ref={sway} position={[0, -0.36, 0]}>
      <PhoneModel wheelRef={wheel} onDigit={(n) => !spin.current && onPress(n)} />
      <ContactShadows position={[0, 0.002, 0]} opacity={0.45} scale={3} blur={2.4} far={1.2} resolution={256} frames={1} />
    </group>
  );
}

export default function PhoneDial({ request, onPress, onDone }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.15, 3.2], fov: 30 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ camera }) => camera.lookAt(0, 0.02, 0)}
    >
      <hemisphereLight args={["#fff1dc", "#4a3a2e", 1.5]} />
      <directionalLight position={[-2.5, 4, 3]} intensity={2.6} color="#ffe6c4" />
      <directionalLight position={[3, 1.5, 2]} intensity={0.9} color="#cfe0ff" />
      <DialRig request={request} onPress={onPress} onDone={onDone} />
    </Canvas>
  );
}
