import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Arm, Leg, Look, Pose } from "./types";

// 3D version of the Vutu & Vuti rig. Reuses the same Pose data as the 2D rig.
// Units are meters. The root sits on the ground between the feet.

const PX = 0.0042; // 2D pose pixels → meters
const HIP_Y = 0.92;
const d2r = (d: number) => (d * Math.PI) / 180;

const FONT = '"Baloo 2", "Nunito", "Inter", system-ui, sans-serif';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

type V3 = [number, number, number];

const Mat: React.FC<{ c: string; r?: number; o?: number }> = ({ c, r = 0.55, o }) => (
  <meshStandardMaterial
    color={c}
    roughness={r}
    metalness={0}
    transparent={o !== undefined}
    opacity={o ?? 1}
  />
);

const Capsule: React.FC<{ r: number; len: number; c: string; pos?: V3; rot?: V3; scale?: V3; rough?: number }> = ({
  r,
  len,
  c,
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  scale = [1, 1, 1],
  rough,
}) => (
  <mesh position={pos} rotation={rot} scale={scale} castShadow receiveShadow>
    <capsuleGeometry args={[r, len, 8, 20]} />
    <Mat c={c} r={rough} />
  </mesh>
);

const Ball: React.FC<{ r: number; c: string; pos?: V3; scale?: V3; rough?: number; o?: number; shadow?: boolean }> = ({
  r,
  c,
  pos = [0, 0, 0],
  scale = [1, 1, 1],
  rough,
  o,
  shadow = true,
}) => (
  <mesh position={pos} scale={scale} castShadow={shadow} receiveShadow>
    <sphereGeometry args={[r, 32, 24]} />
    <Mat c={c} r={rough} o={o} />
  </mesh>
);

const useTextTexture = (text: string, size: number, w = 512, h = 256) =>
  useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = "#2A1B17";
    ctx.strokeText(text, w / 2, h / 2);
    ctx.fillStyle = "white";
    ctx.fillText(text, w / 2, h / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, [text, size, w, h]);

// Text printed on a curved strip that hugs the jersey
const JerseyPrint: React.FC<{ text: string; size: number; y: number; h: number; theta0: number; thetaLen: number; r: number }> = ({
  text,
  size,
  y,
  h,
  theta0,
  thetaLen,
  r,
}) => {
  const tex = useTextTexture(text, size);
  return (
    <mesh position={[0, y, 0]} scale={[1.12, 1, 0.82]}>
      <cylinderGeometry args={[r, r, h, 48, 1, true, theta0, thetaLen]} />
      <meshStandardMaterial map={tex} transparent roughness={0.5} depthWrite={false} />
    </mesh>
  );
};

// Points spread evenly over a sphere
const fibonacci = (n: number) => {
  const pts: V3[] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rr = Math.sqrt(1 - y * y);
    pts.push([Math.cos(g * i) * rr, y, Math.sin(g * i) * rr]);
  }
  return pts;
};

// ---------------------------------------------------------------------------
// Limbs
// ---------------------------------------------------------------------------

const Arm3D: React.FC<{ arm: Arm; side: number; look: Look }> = ({ arm, side, look }) => (
  <group position={[side * 0.37, 0.62, 0]}>
    <group rotation={[0, 0, side * d2r(arm.ab)]}>
      <group rotation={[-d2r(arm.sh), 0, 0]}>
        <Ball r={0.13} c={look.jersey} pos={[0, -0.02, 0]} rough={0.45} />
        <Capsule r={0.075} len={0.2} c={look.skin} pos={[0, -0.17, 0]} />
        <Capsule r={0.112} len={0.06} c={look.jersey} pos={[0, -0.08, 0]} rough={0.45} />
        <group position={[0, -0.34, 0]}>
          <group rotation={[0, 0, side * d2r(arm.elAb)]}>
            <group rotation={[-d2r(arm.el), 0, 0]}>
              <Capsule r={0.068} len={0.2} c={look.skin} pos={[0, -0.15, 0]} />
              <Ball r={0.092} c={look.skin} pos={[0, -0.32, 0.01]} scale={[1, 1.05, 0.85]} />
              <Ball r={0.04} c={look.skin} pos={[-side * 0.07, -0.28, 0.04]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  </group>
);

const Leg3D: React.FC<{ leg: Leg; side: number; look: Look }> = ({ leg, side, look }) => (
  <group position={[side * 0.14, HIP_Y, 0]}>
    <group rotation={[0, 0, side * d2r(leg.ab)]}>
      <group rotation={[-d2r(leg.hip), 0, 0]}>
        <Capsule r={0.1} len={0.24} c={look.skin} pos={[0, -0.21, 0]} />
        <mesh position={[0, -0.11, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.14, 0.26, 24]} />
          <Mat c={look.shorts} r={0.6} />
        </mesh>
        <group position={[0, -0.42, 0]}>
          <group rotation={[d2r(leg.knee), 0, 0]}>
            <Capsule r={0.085} len={0.24} c={look.skin} pos={[0, -0.2, 0]} />
            <mesh position={[0, -0.27, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.098, 0.092, 0.24, 24]} />
              <Mat c={look.socks} r={0.6} />
            </mesh>
            <mesh position={[0, -0.18, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.025, 24]} />
              <Mat c="white" r={0.6} />
            </mesh>
            <group position={[0, -0.4, 0]}>
              <group rotation={[d2r(leg.foot), 0, 0]}>
                <Capsule r={0.085} len={0.13} c={look.boots} pos={[0, -0.03, 0.06]} rot={[Math.PI / 2, 0, 0]} rough={0.3} />
                <mesh position={[0, -0.105, 0.06]} castShadow>
                  <boxGeometry args={[0.14, 0.02, 0.28]} />
                  <Mat c="#FFD54F" r={0.4} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  </group>
);

// ---------------------------------------------------------------------------
// Head
// ---------------------------------------------------------------------------

const Eye3D: React.FC<{ x: number; pose: Pose; lid: boolean; skin: string }> = ({ x, pose, lid, skin }) => {
  const sy = Math.max(0.08, 1 - pose.blink);
  return (
    <group position={[x, 0.04, 0.33]} scale={[1, sy, 1]}>
      <Ball r={0.085} c="white" scale={[1, 1.2, 0.55]} rough={0.2} shadow={false} />
      <Ball r={0.05} c="#2B1A12" pos={[pose.look * 0.025, -0.005, 0.035]} scale={[1, 1.1, 0.6]} rough={0.2} shadow={false} />
      <Ball r={0.017} c="white" pos={[pose.look * 0.025 + 0.018, 0.025, 0.065]} rough={0.1} shadow={false} />
      {lid ? (
        <mesh scale={[1.08, 1.28, 0.62]} rotation={[-0.25, 0, 0]}>
          <sphereGeometry args={[0.088, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
          <Mat c={skin} />
        </mesh>
      ) : null}
    </group>
  );
};

const Head3D: React.FC<{ look: Look; pose: Pose }> = ({ look, pose }) => {
  const playful = look.personality === "playful";
  const o = playful ? 0.3 + 0.7 * pose.mouth : pose.mouth;
  const boxGeo = useMemo(() => new RoundedBoxGeometry(0.82, 0.8, 0.74, 6, 0.25), []);
  const hairPts = useMemo(
    () =>
      fibonacci(130).filter(
        ([x, y, z]) => y > 0.62 || (y > 0.32 && z < 0.5) || (z < 0.05 && y > -0.45) || (Math.abs(x) > 0.82 && y > -0.05 && z < 0.25),
      ),
    [],
  );
  const hv = pose.hairV * PX;

  return (
    <group position={[0, 0.4, 0]}>
      {/* Skull */}
      {look.jaw === "square" ? (
        <mesh geometry={boxGeo} castShadow receiveShadow>
          <Mat c={look.skin} />
        </mesh>
      ) : (
        <Ball r={0.42} c={look.skin} scale={[1, 1.02, 0.9]} />
      )}
      {/* Ears */}
      {[-1, 1].map((s) => (
        <Ball key={s} r={0.09} c={look.skin} pos={[s * 0.41, 0.0, -0.02]} scale={[0.55, 1, 0.8]} />
      ))}
      {/* Face */}
      <Eye3D x={-0.15} pose={pose} lid={!playful} skin={look.skin} />
      <Eye3D x={0.15} pose={pose} lid={!playful} skin={look.skin} />
      <Ball r={0.045} c={look.skinShade} pos={[0, -0.07, 0.385]} scale={[1, 0.9, 0.8]} />
      {playful ? (
        <>
          <Ball r={0.06} c="#FF7FA8" pos={[-0.25, -0.08, 0.32]} scale={[1.3, 0.7, 0.3]} o={0.6} shadow={false} />
          <Ball r={0.06} c="#FF7FA8" pos={[0.25, -0.08, 0.32]} scale={[1.3, 0.7, 0.3]} o={0.6} shadow={false} />
          {/* Brows: one raised, cheeky */}
          <Capsule r={0.02} len={0.1} c="#2A1B17" pos={[-0.15, 0.18 + pose.brow * 0.02, 0.35]} rot={[0, 0, Math.PI / 2 - 0.15]} />
          <Capsule r={0.02} len={0.1} c="#2A1B17" pos={[0.15, 0.21 + pose.brow * 0.02, 0.35]} rot={[0, 0, Math.PI / 2 + 0.25]} />
          {/* Open grin */}
          <group position={[0, -0.18, 0.34]}>
            <Ball r={0.11} c="#7A1F2B" scale={[1.55, 0.35 + 0.6 * o, 0.42]} rough={0.4} shadow={false} />
            <mesh position={[0, 0.018, 0.03]}>
              <boxGeometry args={[0.24, 0.035, 0.02]} />
              <Mat c="white" r={0.3} />
            </mesh>
            {o > 0.45 ? <Ball r={0.05} c="#E86A7A" pos={[0, -0.03 * o, 0.02]} scale={[1.2, 0.5, 0.5]} shadow={false} /> : null}
          </group>
        </>
      ) : (
        <>
          <Capsule r={0.02} len={0.11} c="#2A1B17" pos={[-0.15, 0.15 + pose.brow * 0.02, 0.36]} rot={[0, 0, Math.PI / 2]} />
          <Capsule r={0.02} len={0.11} c="#2A1B17" pos={[0.15, 0.15 + pose.brow * 0.02, 0.36]} rot={[0, 0, Math.PI / 2]} />
          {pose.mouth < 0.12 ? (
            <Capsule r={0.014} len={0.09} c="#2A1B17" pos={[0.02, -0.18, 0.37]} rot={[0, 0, Math.PI / 2 - 0.25]} />
          ) : (
            <Ball r={0.05} c="#7A1F2B" pos={[0.02, -0.18, 0.36]} scale={[0.9, 0.25 + pose.mouth * 0.8, 0.4]} shadow={false} />
          )}
        </>
      )}

      {/* Hair */}
      <group position={[0, hv * 0.5, 0]}>
        {look.hairStyle === "curly" ? (
          <>
            <mesh position={[0, 0.08, -0.03]} rotation={[-0.35, 0, 0]} scale={[1.04, 1.0, 1.0]} castShadow>
              <sphereGeometry args={[0.44, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
              <Mat c={look.hair} r={0.75} />
            </mesh>
            {hairPts.map(([x, y, z], i) => (
              <Ball
                key={i}
                r={0.12 + (i % 3) * 0.015}
                c={i % 4 === 0 ? look.hairShade : look.hair}
                pos={[x * 0.46, y * 0.46 + 0.04, z * 0.44 - 0.02]}
                rough={0.75}
              />
            ))}
          </>
        ) : (
          <>
            {/* Shaved sides */}
            <mesh scale={[1.02, 1.03, 0.93]} rotation={[-0.35, 0, 0]}>
              <sphereGeometry args={[0.425, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
              <Mat c={look.hairShade} r={0.9} o={0.55} />
            </mesh>
            {/* Mohawk crest */}
            {[-38, -18, 2, 22, 42, 62, 82, 102].map((a, i) => {
              const R = 0.39;
              const h = 0.32 + Math.sin(i * 1.7 + 1) * 0.07 + (i < 3 ? 0.06 : 0);
              const fan = (i % 2 ? 1 : -1) * 0.18;
              return (
                <mesh
                  key={a}
                  position={[0, R * Math.cos(d2r(a)) + (h / 2) * Math.cos(d2r(a)), -R * Math.sin(d2r(a)) - (h / 2) * Math.sin(d2r(a))]}
                  rotation={[-d2r(a) + pose.hairV * 0.004, 0, fan]}
                  castShadow
                >
                  <coneGeometry args={[0.09, h, 20]} />
                  <Mat c={i % 2 ? look.hairShade : look.hair} r={0.6} />
                </mesh>
              );
            })}
          </>
        )}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Whole character
// ---------------------------------------------------------------------------

export const Person3D: React.FC<{
  look: Look;
  pose: Pose;
  position: V3;
  yaw: number; // radians, 0 = facing the camera (+z)
}> = ({ look, pose, position, yaw }) => {
  const sq = pose.squash;
  const sx = 1 + (1 - sq) * 0.6;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* Contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} scale={[1 + pose.y * PX * 0.6, 1 + pose.y * PX * 0.6, 1]}>
        <circleGeometry args={[0.42, 32]} />
        <meshBasicMaterial color="black" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <group position={[pose.x * PX, -pose.y * PX, 0]} scale={[sx, sq, sx]}>
        <Leg3D leg={pose.legA} side={-1} look={look} />
        <Leg3D leg={pose.legB} side={1} look={look} />
        {/* Torso */}
        <group position={[0, HIP_Y, 0]} rotation={[d2r(pose.lean), 0, -d2r(pose.tilt)]}>
          {/* Shorts */}
          <mesh position={[0, 0.02, 0]} scale={[1.05, 1, 0.85]} castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.31, 0.24, 32]} />
            <Mat c={look.shorts} r={0.6} />
          </mesh>
          {/* Jersey */}
          <Capsule r={0.3} len={0.3} c={look.jersey} pos={[0, 0.38, 0]} scale={[1.12, 1, 0.82]} rough={0.45} />
          <mesh position={[0, 0.66, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.025, 12, 32]} />
            <Mat c="white" r={0.5} />
          </mesh>
          <JerseyPrint text={look.sponsor} size={150} y={0.42} h={0.2} theta0={-0.75} thetaLen={1.5} r={0.305} />
          <JerseyPrint text={look.number} size={210} y={0.32} h={0.28} theta0={Math.PI - 0.8} thetaLen={1.6} r={0.305} />
          <JerseyPrint text={look.name.toUpperCase()} size={110} y={0.56} h={0.12} theta0={Math.PI - 0.8} thetaLen={1.6} r={0.305} />
          {/* Neck */}
          <mesh position={[0, 0.76, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.1, 0.16, 20]} />
            <Mat c={look.skin} />
          </mesh>
          <Arm3D arm={pose.armA} side={-1} look={look} />
          <Arm3D arm={pose.armB} side={1} look={look} />
          <group position={[0, 0.82, 0]} rotation={[0, 0, -d2r(pose.head)]}>
            <Head3D look={look} pose={pose} />
          </group>
        </group>
      </group>
    </group>
  );
};
