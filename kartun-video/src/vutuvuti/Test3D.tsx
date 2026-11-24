import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Person3D } from "./Person3D";
import { VUTI, VUTU } from "./looks";
import { celebrate, idle, jump, mix, run, shrug, wave } from "./poses";

const FONT = '"Baloo 2", "Nunito", "Inter", system-ui, sans-serif';
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) };

// Timeline (seconds)
const TURN_END = 3.5;
const LAP_START = 3.5;
const LAP_DUR = 2.8;
const LAP_END = LAP_START + LAP_DUR;
const END = 10.5;

const VUTU_HOME: [number, number, number] = [-0.9, 0, 0];
const VUTI_HOME: [number, number, number] = [0.9, 0, 0];
const LAP_R = 1.8;

const CameraRig: React.FC<{ t: number }> = ({ t }) => {
  const { camera } = useThree();
  const lap = interpolate(t, [LAP_START - 0.4, LAP_START + 0.3, LAP_END - 0.3, LAP_END + 0.4], [0, 1, 1, 0], ez);
  const x = Math.sin(t * 0.4) * 0.4 + lap * 0.9;
  const z = 6.3 + lap * 2.6 - interpolate(t, [LAP_END + 2, END], [0, 0.8], ez);
  const y = 1.55 + lap * 0.6;
  useLayoutEffect(() => {
    camera.position.set(x, y, z);
    camera.lookAt(lap * 0.9, 1.15, 0);
    camera.updateProjectionMatrix();
  }, [camera, x, y, z, lap]);
  return null;
};

const Ground: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[14, 64]} />
      <meshStandardMaterial color="#4CAF50" roughness={0.9} />
    </mesh>
    {new Array(7).fill(0).map((_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-12 + i * 4, 0.002, 0]} receiveShadow>
        <planeGeometry args={[2, 28]} />
        <meshStandardMaterial color="#43A047" roughness={0.9} />
      </mesh>
    ))}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
      <ringGeometry args={[3.0, 3.08, 96]} />
      <meshStandardMaterial color="white" roughness={0.8} />
    </mesh>
  </group>
);

export const VutuVuti3DTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // --- Vutu ---
  let vuPos: [number, number, number] = VUTU_HOME;
  let vuYaw = 0;
  let vuPose = idle(t, "playful", 1);
  if (t < TURN_END) {
    vuYaw = interpolate(t, [0.3, TURN_END - 0.2], [0, Math.PI * 2], ez);
  } else if (t < LAP_END) {
    const tau = t - LAP_START;
    const w = (Math.PI * 2) / LAP_DUR;
    const th = Math.PI - w * tau;
    vuPos = [VUTI_HOME[0] + LAP_R * Math.cos(th), 0, LAP_R * Math.sin(th)];
    const dx = LAP_R * w * Math.sin(th);
    const dz = -LAP_R * w * Math.cos(th);
    vuYaw = Math.atan2(dx, dz);
    vuPose = mix(idle(t, "playful", 1), run(tau, 1), Math.min(1, tau / 0.25));
    vuPose = mix(vuPose, idle(t, "playful", 1), Math.max(0, (tau - LAP_DUR + 0.2) / 0.2));
  } else {
    const k = t - LAP_END;
    vuYaw = 0;
    if (k < 1.4) vuPose = jump(Math.min(1, k / 1.3), 230, "playful");
    else if (k < 2.2) vuPose = celebrate(k, 1);
    else vuPose = mix(celebrate(k, 1), wave(k, "playful", 1), (k - 2.2) / 0.3);
  }

  // --- Vuti ---
  let viYaw = 0;
  let viPose = idle(t, "chill", 2);
  if (t < TURN_END) {
    viYaw = interpolate(t, [0.5, TURN_END], [0, Math.PI * 2], ez);
  } else if (t < LAP_END + 0.6) {
    // Lazily turns to keep an eye on Vutu
    const tau = t - LAP_START;
    const w = (Math.PI * 2) / LAP_DUR;
    const lag = Math.min(LAP_DUR - 0.35, Math.max(0, tau - 0.35));
    const follow = Math.PI / 2 - (Math.PI - w * lag);
    const inW = Math.min(1, tau / 0.4);
    viYaw = tau < LAP_DUR ? (1 - inW) * 0 + inW * follow : interpolate(tau, [LAP_DUR, LAP_DUR + 0.6], [follow, Math.PI * 2], ez);
  } else {
    const k = t - LAP_END - 0.6;
    viYaw = 0;
    if (k < 1.6) viPose = mix(idle(t, "chill", 2), shrug(Math.min(1, k / 1.5)), Math.min(1, k * 3));
    else viPose = mix(idle(t, "chill", 2), wave(t, "chill", 2), (k - 1.6) / 0.4);
  }

  const label =
    t < TURN_END ? "3D: putar 360°" : t < LAP_END ? "Vutu lari muterin Vuti" : t < LAP_END + 2.2 ? "Lompat & selebrasi" : "Dadah!";

  return (
    <AbsoluteFill style={{ background: "linear-gradient(#6EC6FF 0%, #BDE6FF 55%, #E9F7FF 100%)" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 32, position: [0, 1.5, 7.4] }}>
        <CameraRig t={t} />
        <hemisphereLight args={["#DDF2FF", "#3E7B3E", 0.9]} />
        <directionalLight
          position={[3, 6, 5]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-4, 3, -4]} intensity={0.8} color="#FFD8F0" />
        <Ground />
        <Person3D look={VUTU} pose={vuPose} position={vuPos} yaw={vuYaw} />
        <Person3D look={VUTI} pose={viPose} position={VUTI_HOME} yaw={viYaw} />
      </ThreeCanvas>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 60,
          padding: "16px 36px",
          borderRadius: 999,
          background: "rgba(20,20,40,0.75)",
          color: "white",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 54,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};
