import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { VUTI, VUTU } from "../vutuvuti/looks";
import { mix } from "../vutuvuti/poses";
import { Pose } from "../vutuvuti/types";
import { Human } from "./Human";
import { RUN_SPEED, idleR, jumpR, runR, waveR, walkR, walkSpeed } from "./realPoses";

const FONT = '"Baloo 2", "Nunito", "Inter", system-ui, sans-serif';
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) };

// ---------------------------------------------------------------------------
// Choreography (seconds)
// ---------------------------------------------------------------------------

const T_TURN = 3.5; // turn away from camera
const T_WALK = 4.0; // start walking down the street
const T_RUN = 7.0; // Vutu starts running
const T_STOP = 9.0; // Vutu stops
const T_VUTI_STOP = 11.6;
const END = 13;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

type State = { z: number; x: number; yaw: number; pose: Pose };

const vutuAt = (t: number): State => {
  const x = -0.6;
  if (t < T_TURN) return { x, z: 0, yaw: 0, pose: idleR(t, "playful", 1) };
  if (t < T_WALK) {
    const k = (t - T_TURN) / (T_WALK - T_TURN);
    return { x, z: 0, yaw: lerp(0, Math.PI, k), pose: idleR(t, "playful", 1) };
  }
  const vw = walkSpeed("playful");
  if (t < T_RUN) {
    const tw = t - T_WALK;
    return { x, z: -vw * tw, yaw: Math.PI, pose: mix(idleR(t, "playful", 1), walkR(tw, "playful", 1), tw / 0.3) };
  }
  const zRun0 = -vw * (T_RUN - T_WALK);
  if (t < T_STOP) {
    const tr = t - T_RUN;
    // smooth acceleration from walk speed to run speed
    const acc = Math.min(1, tr / 0.5);
    const dist = tr < 0.5 ? vw * tr + ((RUN_SPEED - vw) * tr * tr) / (2 * 0.5) : vw * 0.5 + ((RUN_SPEED - vw) * 0.5) / 2 + RUN_SPEED * (tr - 0.5);
    return { x, z: zRun0 - dist, yaw: Math.PI, pose: mix(walkR(t - T_WALK, "playful", 1), runR(tr, 1), acc) };
  }
  const runDist = vw * 0.5 + ((RUN_SPEED - vw) * 0.5) / 2 + RUN_SPEED * (T_STOP - T_RUN - 0.5);
  const tsBrake = t - T_STOP;
  const brake = Math.min(0.45, tsBrake);
  const zStop = zRun0 - runDist - RUN_SPEED * (brake - (brake * brake) / (2 * 0.45));
  // Turn round to face the camera, jump, then wave
  const yaw = Math.PI; // already facing the front camera
  let pose = mix(runR(T_STOP - T_RUN, 1), idleR(t, "playful", 1), tsBrake / 0.45);
  if (tsBrake > 0.9 && tsBrake < 2.2) pose = jumpR((tsBrake - 0.9) / 1.3);
  if (tsBrake >= 2.2) pose = mix(idleR(t, "playful", 1), waveR(t, "playful", 1), (tsBrake - 2.2) / 0.3);
  return { x, z: zStop, yaw, pose };
};

const vutiAt = (t: number): State => {
  const x = 0.6;
  if (t < T_TURN + 0.15) return { x, z: 0, yaw: 0, pose: idleR(t, "chill", 2) };
  if (t < T_WALK + 0.3) {
    const k = (t - T_TURN - 0.15) / (T_WALK - T_TURN + 0.15);
    return { x, z: 0, yaw: lerp(0, Math.PI, Math.min(1, k)), pose: idleR(t, "chill", 2) };
  }
  const v = walkSpeed("chill");
  const tw = Math.min(t, T_VUTI_STOP) - (T_WALK + 0.3);
  const z = -v * tw;
  if (t < T_VUTI_STOP) {
    return { x, z, yaw: Math.PI, pose: mix(idleR(t, "chill", 2), walkR(tw, "chill", 2), tw / 0.4) };
  }
  const k = t - T_VUTI_STOP;
  const yaw = Math.PI;
  const pose = k < 0.7 ? mix(walkR(tw, "chill", 2), idleR(t, "chill", 2), k / 0.4) : mix(idleR(t, "chill", 2), waveR(t, "chill", 2), (k - 0.7) / 0.4);
  return { x, z, yaw, pose };
};

// ---------------------------------------------------------------------------
// Camera: orbit → chase from behind → front shot
// ---------------------------------------------------------------------------

const CameraRig: React.FC<{ t: number; vu: State; vi: State }> = ({ t, vu, vi }) => {
  const { camera } = useThree();
  const zMid = (vu.z + vi.z) / 2;

  // Orbit around the pair at the start
  const orbitA = interpolate(t, [0, T_TURN], [0.75, -0.45], ez);
  const orbit = new THREE.Vector3(Math.sin(orbitA) * 4.4, 1.35, Math.cos(orbitA) * 4.4);
  const orbitLook = new THREE.Vector3(0, 1.15, 0);

  // Third-person chase cam
  const chase = new THREE.Vector3(0.6, 1.95, zMid + 3.9);
  const chaseLook = new THREE.Vector3(0, 1.25, zMid - 2.5);

  // Front shot, waiting ahead of where Vutu stops
  const front = new THREE.Vector3(1.3, 1.45, -15.6);
  const frontLook = new THREE.Vector3(0, 1.15, -11.2);

  const w1 = interpolate(t, [T_TURN - 0.3, T_WALK + 0.6], [0, 1], ez);
  const w2 = interpolate(t, [T_RUN + 0.2, T_STOP - 0.1], [0, 1], ez);

  const pos = orbit.clone().lerp(chase, w1).lerp(front, w2);
  const look = orbitLook.clone().lerp(chaseLook, w1).lerp(frontLook, w2);
  const fov = lerp(lerp(34, 42, w1), 36, w2);

  useLayoutEffect(() => {
    camera.position.copy(pos);
    camera.lookAt(look);
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.updateProjectionMatrix();
  });
  return null;
};

// Sun follows the action so shadows stay crisp
const Sun: React.FC<{ cx: number; cz: number }> = ({ cx, cz }) => {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    if (!light.current) return;
    light.current.position.set(cx + 10, 10, cz - 3);
    target.position.set(cx, 0, cz);
    target.updateMatrixWorld();
    light.current.target = target;
  });
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        intensity={2.6}
        color="#FFD6A8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Street (original, low-poly 2000s game look)
// ---------------------------------------------------------------------------

const windowTexture = (base: string) => {
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 512;
  const g = cv.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 512);
  for (let y = 24; y < 512; y += 64) {
    for (let x = 20; x < 256; x += 60) {
      const lit = Math.sin(x * 12.9 + y * 7.1) > 0.55;
      g.fillStyle = lit ? "#FFE4A8" : "#3C4E63";
      g.fillRect(x, y, 34, 36);
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

const Street: React.FC = () => {
  const textures = useMemo(() => ["#D9B99B", "#C9A27E", "#B8C4C9", "#E0C7A5", "#C7B08A"].map(windowTexture), []);
  const buildings = useMemo(() => {
    const out: { x: number; z: number; w: number; h: number; d: number; i: number }[] = [];
    let i = 0;
    for (const side of [-1, 1]) {
      for (let z = 8; z > -48; z -= 7.5) {
        const h = 6 + ((i * 37) % 9);
        out.push({ x: side * 11.5, z, w: 6, h, d: 6.8, i: i++ });
      }
    }
    return out;
  }, []);
  return (
    <group>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -18]} receiveShadow>
        <planeGeometry args={[9, 80]} />
        <meshStandardMaterial color="#3B3B40" roughness={0.95} />
      </mesh>
      {/* Center dashes */}
      {new Array(24).fill(0).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 8 - i * 3.2]} receiveShadow>
          <planeGeometry args={[0.14, 1.6]} />
          <meshStandardMaterial color="#E8C547" roughness={0.8} />
        </mesh>
      ))}
      {/* Sidewalks */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 6.5, 0.08, -18]} receiveShadow castShadow>
          <boxGeometry args={[4, 0.16, 80]} />
          <meshStandardMaterial color="#9C9890" roughness={0.9} />
        </mesh>
      ))}
      {/* Buildings */}
      {buildings.map((b) => {
        const tex = textures[b.i % textures.length].clone();
        tex.repeat.set(1.5, b.h / 6);
        tex.needsUpdate = true;
        return (
          <mesh key={b.i} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial map={tex} roughness={0.85} />
          </mesh>
        );
      })}
      {/* Palm trees */}
      {[-1, 1].map((s) =>
        new Array(6).fill(0).map((_, i) => {
          const z = 4 - i * 9 - (s > 0 ? 4 : 0);
          return (
            <group key={`${s}-${i}`} position={[s * 5.6, 0.16, z]}>
              <mesh position={[0, 3.2, 0]} rotation={[0, 0, s * 0.06]} castShadow>
                <cylinderGeometry args={[0.13, 0.2, 6.4, 8]} />
                <meshStandardMaterial color="#7A5A3A" roughness={0.9} />
              </mesh>
              {new Array(8).fill(0).map((__, k) => (
                <mesh
                  key={k}
                  position={[Math.sin((k / 8) * Math.PI * 2) * 0.9 + s * 0.2, 6.25, Math.cos((k / 8) * Math.PI * 2) * 0.9]}
                  rotation={[0, (k / 8) * Math.PI * 2, 0.55]}
                  castShadow
                >
                  <boxGeometry args={[0.35, 0.04, 2.0]} />
                  <meshStandardMaterial color="#3E7D3A" roughness={0.8} />
                </mesh>
              ))}
            </group>
          );
        }),
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------

export const VutuVutiStreet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const vu = vutuAt(t);
  const vi = vutiAt(t);

  const caption =
    t < T_TURN
      ? "Vutu & Vuti"
      : t < T_RUN
        ? "Jalan santai..."
        : t < T_STOP + 0.9
          ? "Vutu: \"Balapan yuk!\""
          : t < T_VUTI_STOP
            ? "Vuti: \"...gak.\""
            : "";

  return (
    <AbsoluteFill style={{ background: "linear-gradient(#5D7FB8 0%, #E9A97A 55%, #F6CFA0 100%)" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 34, position: [0, 1.5, 6], near: 0.05, far: 200 }}>
        <fog attach="fog" args={["#EEBD93", 18, 70]} />
        <CameraRig t={t} vu={vu} vi={vi} />
        <hemisphereLight args={["#FFE7CC", "#5A4E44", 1.15]} />
        <Sun cx={(vu.x + vi.x) / 2} cz={(vu.z + vi.z) / 2} />
        <directionalLight position={[-6, 4, -8]} intensity={0.7} color="#9FB6FF" />
        <Street />
        <Human look={VUTU} pose={vu.pose} position={[vu.x, 0, vu.z]} yaw={vu.yaw} />
        <Human look={VUTI} pose={vi.pose} position={[vi.x, 0, vi.z]} yaw={vi.yaw} />
      </ThreeCanvas>
      {caption ? (
        <div
          style={{
            position: "absolute",
            bottom: 70,
            width: "100%",
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 60,
            color: "white",
            textShadow: "0 4px 0 rgba(0,0,0,0.65), 0 0 12px rgba(0,0,0,0.4)",
            opacity: interpolate(t % 100, [0, 0.2], [0, 1], clamp),
          }}
        >
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const STREET_SECONDS = END;
