import React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Interactive,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Character } from "./Character";

const FONT =
  '"Comic Sans MS", "Chalkboard SE", "Baloo 2", "Nunito", system-ui, sans-serif';

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------- Background ----------

const Sun: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name="Matahari"
      style={{
        position: "absolute",
        right: 180,
        top: 110,
        width: 200,
        height: 200,
        rotate: `${frame * 0.6}deg`,
      }}
    >
      <svg width={200} height={200} viewBox="0 0 200 200">
        {new Array(12).fill(0).map((_, i) => (
          <rect
            key={i}
            x={94}
            y={0}
            width={12}
            height={34}
            rx={6}
            fill="#FFB300"
            transform={`rotate(${i * 30} 100 100)`}
          />
        ))}
        <circle cx={100} cy={100} r={58} fill="#FFD54F" stroke="#FFB300" strokeWidth={6} />
      </svg>
    </Interactive.Div>
  );
};

const Cloud: React.FC<{ readonly y: number; readonly speed: number; readonly offset: number; readonly size: number }> = ({
  y,
  speed,
  offset,
  size,
}) => {
  const frame = useCurrentFrame();
  const x = ((offset + frame * speed) % 2300) - 300;
  return (
    <div style={{ position: "absolute", left: x, top: y, scale: String(size) }}>
      <svg width={260} height={120} viewBox="0 0 260 120">
        <g fill="white">
          <circle cx={70} cy={75} r={42} />
          <circle cx={125} cy={55} r={52} />
          <circle cx={185} cy={75} r={40} />
          <rect x={60} y={70} width={140} height={46} rx={23} />
        </g>
      </svg>
    </div>
  );
};

const Background: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#7FD3FF, #CFF1FF)" }}>
      <Sun />
      <Cloud y={90} speed={1.2} offset={200} size={1.1} />
      <Cloud y={210} speed={0.8} offset={1100} size={0.8} />
      <Cloud y={140} speed={1.0} offset={1700} size={0.95} />
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <path d="M0 760 Q 480 600 960 740 T 1920 720 V1080 H0 Z" fill="#8BC34A" />
        <path d="M0 850 Q 560 760 1100 850 T 1920 830 V1080 H0 Z" fill="#66BB6A" />
        {/* Little flowers */}
        {[160, 420, 1380, 1620, 1820].map((fx, i) => (
          <g key={fx} transform={`translate(${fx} ${910 + (i % 2) * 40})`}>
            <rect x={-3} y={0} width={6} height={40} fill="#2E7D32" />
            {[0, 72, 144, 216, 288].map((a) => (
              <circle
                key={a}
                cx={Math.cos((a * Math.PI) / 180) * 14}
                cy={Math.sin((a * Math.PI) / 180) * 14}
                r={10}
                fill={i % 2 ? "#FF80AB" : "#FFF176"}
              />
            ))}
            <circle cx={0} cy={0} r={8} fill="#FF7043" />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Character performance ----------

const AnimatedKid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Walking in: first 1.6s
  const walking = frame < 1.6 * fps;
  const legSwing = walking ? Math.sin(frame * 0.6) * 18 : 0;
  const bob = walking ? Math.abs(Math.sin(frame * 0.6)) * -18 : 0;

  // Waving between 1.8s and 4s
  const waving = frame > 1.8 * fps && frame < 4 * fps;
  const armAngle = waving ? -150 + Math.sin(frame * 0.5) * 25 : 0;

  // Talking between 2s-4s and 4.5s-7.5s
  const talking =
    (frame > 2 * fps && frame < 4 * fps) ||
    (frame > 4.5 * fps && frame < 7.5 * fps);
  const mouthOpen = talking ? Math.abs(Math.sin(frame * 0.7)) : 0.15;

  // Blink every 2.7s for 5 frames
  const cycle = frame % Math.round(2.7 * fps);
  const blink = cycle < 5 ? Math.sin((cycle / 5) * Math.PI) : 0;

  // Happy jump 7.6s - 9.2s
  const jumpStart = 7.6 * fps;
  const jumpLocal = frame - jumpStart;
  const jump =
    jumpLocal > 0 && jumpLocal < 1.6 * fps
      ? -Math.abs(Math.sin((jumpLocal / (0.8 * fps)) * Math.PI)) * 140
      : 0;
  const jumpArms = jumpLocal > 0 && jumpLocal < 1.6 * fps ? -160 : armAngle;

  return (
    <Interactive.Div
      name="Karakter"
      style={{
        position: "absolute",
        left: 0,
        top: 330,
        translate: interpolate(frame, [0, 1.6 * fps], ["-500px 0px", "750px 0px"], {
          ...clamp,
          easing: Easing.bezier(0.25, 0.8, 0.3, 1),
        }),
      }}
    >
      <div style={{ translate: `0px ${bob + jump}px` }}>
        <Character
          armAngle={jumpArms}
          mouthOpen={mouthOpen}
          blink={blink}
          legSwing={legSwing}
        />
      </div>
    </Interactive.Div>
  );
};

// ---------- Speech bubble ----------

const SpeechBubble: React.FC<{ readonly text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Interactive.Div
      name="Balon Kata"
      style={{
        position: "absolute",
        left: 1180,
        top: 200,
        transformOrigin: "0% 100%",
        scale: interpolate(frame, [0, 0.4 * fps], [0, 1], {
          ...clamp,
          easing: Easing.spring({ damping: 12 }),
          output: "perceptual-scale",
        }),
      }}
    >
      <div
        style={{
          background: "white",
          border: "6px solid #2B2B2B",
          borderRadius: 48,
          padding: "36px 56px",
          fontFamily: FONT,
          fontSize: 64,
          fontWeight: 800,
          color: "#2B2B2B",
          maxWidth: 620,
          lineHeight: 1.15,
          boxShadow: "0 12px 0 rgba(0,0,0,0.12)",
        }}
      >
        {text}
      </div>
      <svg width={80} height={70} style={{ position: "absolute", left: 30, bottom: -62 }}>
        <path d="M0 0 L60 0 L8 64 Z" fill="white" stroke="#2B2B2B" strokeWidth={6} strokeLinejoin="round" />
        <rect x={4} y={-6} width={54} height={10} fill="white" />
      </svg>
    </Interactive.Div>
  );
};

// ---------- Confetti stars ----------

const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = ["#FF5252", "#FFD740", "#69F0AE", "#40C4FF", "#E040FB"];
  return (
    <AbsoluteFill>
      {new Array(18).fill(0).map((_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const dist = interpolate(frame, [0, 1.2 * fps], [0, 420 + (i % 3) * 80], {
          ...clamp,
          easing: Easing.bezier(0.2, 0.9, 0.3, 1),
        });
        const opacity = interpolate(frame, [0.9 * fps, 1.6 * fps], [1, 0], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + Math.cos(angle) * dist,
              top: 520 + Math.sin(angle) * dist,
              fontSize: 56,
              color: colors[i % colors.length],
              opacity,
              rotate: `${frame * 8 + i * 20}deg`,
            }}
          >
            ★
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Ending title ----------

const EndTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 112, 67, 0.92)",
        opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
      }}
    >
      <Interactive.Div
        name="Judul Akhir"
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 120,
          color: "white",
          textAlign: "center",
          textShadow: "0 10px 0 rgba(0,0,0,0.2)",
          scale: interpolate(frame, [0, 0.6 * fps], [0.4, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 10 }),
            output: "perceptual-scale",
          }),
        }}
      >
        Sampai jumpa!
        <div style={{ fontSize: 52, fontWeight: 700, marginTop: 24 }}>
          Dibuat dengan Remotion + Claude Code
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};

// ---------- Main scene ----------

export const KartunScene: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background />
      <AnimatedKid />
      <Sequence name="Balon: Halo" from={2 * fps} durationInFrames={2 * fps}>
        <SpeechBubble text="Halo semuanya!" />
      </Sequence>
      <Sequence name="Balon: Perkenalan" from={4.5 * fps} durationInFrames={3 * fps}>
        <SpeechBubble text="Aku kartun pertama buatan Claude!" />
      </Sequence>
      <Sequence name="Bintang" from={7.6 * fps} durationInFrames={1.8 * fps}>
        <Stars />
      </Sequence>
      <Sequence name="Judul Akhir" from={9.5 * fps}>
        <EndTitle />
      </Sequence>
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="Kartun"
      component={KartunScene}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

