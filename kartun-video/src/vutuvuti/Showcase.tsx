import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Person } from "./Person";
import { VUTI, VUTU } from "./looks";
import {
  celebrate,
  idle,
  jump,

  kick,
  laugh,
  mix,
  poke,
  run,
  shrug,
  sneak,
  talk,
  walk,
  wave,
} from "./poses";
import { View } from "./types";

const FONT = '"Baloo 2", "Nunito", "Inter", system-ui, sans-serif';
const W = 1920;
const H = 1080;
const GY = 930; // ground line

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------------------
// Scenery
// ---------------------------------------------------------------------------

const Pitch: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6EC6FF" />
          <stop offset="1" stopColor="#D6F0FF" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#sky)" />
      {/* Clouds */}
      {[0, 1, 2].map((i) => {
        const x = ((frame * (0.6 + i * 0.25) + i * 700) % (W + 400)) - 200;
        return (
          <g key={i} transform={`translate(${x} ${90 + i * 60})`} fill="white" opacity={0.9}>
            <circle cx={0} cy={30} r={36} />
            <circle cx={45} cy={14} r={46} />
            <circle cx={95} cy={32} r={34} />
            <rect x={0} y={30} width={95} height={36} rx={18} />
          </g>
        );
      })}
      {/* Stands */}
      <rect x={0} y={430} width={W} height={260} fill="#3B4A6B" />
      {new Array(4).fill(0).map((_, r) => (
        <rect key={r} x={0} y={450 + r * 60} width={W} height={6} fill="#2E3A55" />
      ))}
      {new Array(140).fill(0).map((_, i) => {
        const x = (i * 97) % W;
        const y = 470 + ((i * 53) % 4) * 60;
        const colors = ["#FF4F9A", "#2FC872", "#FFD54F", "#FFFFFF", "#90CAF9"];
        return (
          <circle
            key={i}
            cx={x + Math.sin(frame * 0.2 + i) * 2}
            cy={y + Math.abs(Math.sin(frame * 0.15 + i * 0.7)) * -4}
            r={9}
            fill={colors[i % colors.length]}
            opacity={0.85}
          />
        );
      })}
      {/* Pitch */}
      <rect x={0} y={690} width={W} height={H - 690} fill="#4CAF50" />
      {new Array(8).fill(0).map((_, i) => (
        <rect key={i} x={i * 240} y={690} width={120} height={H - 690} fill="#43A047" />
      ))}
      <line x1={0} y1={700} x2={W} y2={700} stroke="white" strokeWidth={6} opacity={0.8} />
      <ellipse cx={W / 2} cy={870} rx={360} ry={80} stroke="white" strokeWidth={6} fill="none" opacity={0.6} />
    </svg>
  );
};

const Label: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Interactive.Div
      name="Label"
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
        scale: interpolate(frame, [0, 0.3 * fps], [0.6, 1], {
          ...clamp,
          easing: Easing.spring({ damping: 12 }),
          output: "perceptual-scale",
        }),
        transformOrigin: "0% 50%",
      }}
    >
      {text}
    </Interactive.Div>
  );
};

const Bubble: React.FC<{ text: string; x: number; y: number }> = ({ text, x, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: "-50% -100%",
        background: "white",
        border: "5px solid #2A1B17",
        borderRadius: 30,
        padding: "14px 30px",
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 46,
        color: "#2A1B17",
        whiteSpace: "nowrap",
        scale: interpolate(frame, [0, 0.25 * fps], [0, 1], {
          ...clamp,
          easing: Easing.spring({ damping: 11 }),
          output: "perceptual-scale",
        }),
        transformOrigin: "50% 100%",
      }}
    >
      {text}
    </div>
  );
};

const NameTag: React.FC<{ name: string; color: string; x: number; y: number }> = ({ name, color, x, y }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: "-50% 0",
      background: color,
      color: "white",
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: 48,
      padding: "6px 34px",
      borderRadius: 999,
      border: "5px solid #2A1B17",
    }}
  >
    {name}
  </div>
);

const Ball: React.FC<{ x: number; y: number; rot: number }> = ({ x, y, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <circle r={30} fill="white" stroke="#2A1B17" strokeWidth={5} />
    <path d="M 0 -12 L 11 -4 L 7 10 L -7 10 L -11 -4 Z" fill="#2A1B17" />
    {[0, 72, 144, 216, 288].map((a) => (
      <path key={a} d="M 0 -12 L 0 -29" stroke="#2A1B17" strokeWidth={4} transform={`rotate(${a})`} />
    ))}
  </g>
);

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);

// ---------------------------------------------------------------------------
// Scenes (each uses its own local time)
// ---------------------------------------------------------------------------

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const IntroScene: React.FC = () => {
  const t = useT();
  return (
    <>
      <Stage>
        <Person look={VUTU} pose={idle(t, "playful", 1)} view="front" x={720} groundY={GY} />
        <Person look={VUTI} pose={idle(t, "chill", 2)} view="front" x={1200} groundY={GY} />
      </Stage>
      <NameTag name="Vutu" color={VUTU.jersey} x={720} y={960} />
      <NameTag name="Vuti" color={VUTI.jersey} x={1200} y={960} />
      <Label text="Kenalan: Vutu & Vuti" />
    </>
  );
};

const VIEWS: View[] = ["front", "right", "back", "left"];
const VIEW_NAMES = ["Depan", "Kanan", "Belakang", "Kiri"];

const TurnScene: React.FC = () => {
  const t = useT();
  const i = Math.min(3, Math.floor(t / 1));
  const local = t - i;
  const pop = 1 - Math.max(0, 0.12 - local) * 0.6;
  const vu = idle(t, "playful", 1);
  const vi = idle(t, "chill", 2);
  vu.squash *= pop;
  vi.squash *= pop;
  return (
    <>
      <Stage>
        <Person look={VUTU} pose={vu} view={VIEWS[i]} x={720} groundY={GY} />
        <Person look={VUTI} pose={vi} view={VIEWS[i]} x={1200} groundY={GY} />
      </Stage>
      <Label text={`Putar: ${VIEW_NAMES[i]}`} />
    </>
  );
};

const TalkScene: React.FC<{ who: "vutu" | "vuti" }> = ({ who }) => {
  const t = useT();
  const look = who === "vutu" ? VUTU : VUTI;
  const pose = talk(t, look.personality, 3);
  return (
    <>
      <Stage>
        <Person look={look} pose={pose} view="front" x={W / 2} groundY={1640} scale={2.3} />
      </Stage>
      <Label text="Talking head" />
      <div
        style={{
          position: "absolute",
          bottom: 70,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 64,
          color: "white",
          textShadow: "0 5px 0 rgba(0,0,0,0.6)",
        }}
      >
        {who === "vutu" ? "Halo! Aku Vutu, siap bikin rusuh!" : "...aku Vuti. Udah gitu aja."}
      </div>
    </>
  );
};

const WalkScene: React.FC = () => {
  const t = useT();
  return (
    <>
      <Stage>
        <Person look={VUTI} pose={walk(t, "chill", 2)} view="right" x={-150 + t * 235} groundY={GY - 40} scale={0.9} />
        <Person look={VUTU} pose={walk(t, "playful", 1)} view="right" x={-420 + t * 345} groundY={GY} />
      </Stage>
      <Label text="Jalan" />
    </>
  );
};

const RunScene: React.FC = () => {
  const t = useT();
  return (
    <>
      <Stage>
        <Person look={VUTI} pose={idle(t, "chill", 2)} view="front" x={1600} groundY={GY - 40} scale={0.9} />
        <Person look={VUTU} pose={run(t, 1)} view="right" x={-300 + t * 900} groundY={GY} />
      </Stage>
      <Label text="Lari" />
    </>
  );
};

const JumpScene: React.FC = () => {
  const t = useT();
  const u1 = (t % 1.3) / 1.3;
  const viU = t > 1 && t < 2.6 ? (t - 1) / 1.6 : 0;
  return (
    <>
      <Stage>
        <Person look={VUTU} pose={jump(u1, 230, "playful")} view="front" x={720} groundY={GY} />
        <Person look={VUTI} pose={viU > 0 ? jump(viU, 55, "chill") : idle(t, "chill", 2)} view="front" x={1200} groundY={GY} />
      </Stage>
      <Label text="Lompat" />
    </>
  );
};

const KickScene: React.FC = () => {
  const t = useT();
  const kickStart = 0.6;
  const dur = 1.4;
  const u = Math.min(1, Math.max(0, (t - kickStart) / dur));
  const pose = t < kickStart ? idle(t, "playful", 1) : kick(u);
  // Ball
  const contact = kickStart + 0.47 * dur;
  let bx = 760;
  let by = GY - 30;
  let rot = 0;
  if (t > contact) {
    const k = t - contact;
    bx = 760 + k * 1500;
    by = GY - 30 - (k * 900 - 0.5 * 1400 * k * k);
    by = Math.min(GY - 30, by);
    rot = k * 900;
  }
  const viLook = t > contact ? Math.min(1, (t - contact) * 3) : 0;
  const vi = idle(t, "chill", 2);
  vi.look = viLook;
  vi.head = 7 + viLook * 6;
  return (
    <>
      <Stage>
        <Person look={VUTI} pose={vi} view="front" x={1500} groundY={GY - 40} scale={0.9} />
        <Person look={VUTU} pose={pose} view="right" x={620} groundY={GY} />
        <Ball x={bx} y={by} rot={rot} />
      </Stage>
      <Label text="Tendang bola" />
      {t > contact + 0.9 ? <Bubble text="...lewat." x={1500} y={430} /> : null}
    </>
  );
};

const PrankScene: React.FC = () => {
  const t = useT();
  // Vutu sneaks in (side view), pokes, then laughs (front view)
  const sneakEnd = 2.2;
  const pokeEnd = 2.8;
  let vuView: View = "right";
  let vuX = 250 + Math.min(t, sneakEnd) * 295;
  let vuPose = sneak(t);
  if (t >= sneakEnd && t < pokeEnd) {
    vuPose = poke((t - sneakEnd) / (pokeEnd - sneakEnd));
  } else if (t >= pokeEnd) {
    vuView = "front";
    vuX = 250 + sneakEnd * 295 - 40;
    vuPose = mix(poke(1), laugh(t - pokeEnd), (t - pokeEnd) / 0.2);
  }
  // Vuti: jolt on poke, then a slow, unbothered shrug
  const pokeHit = sneakEnd + 0.3;
  let vi = idle(t, "chill", 2);
  if (t > pokeHit) {
    const j = t - pokeHit;
    vi = j < 1.5 ? mix(vi, shrug(Math.min(1, j / 1.5)), Math.min(1, j * 4)) : idle(t, "chill", 2);
    vi.squash *= 1 - Math.max(0, 0.15 - j) * 0.4;
    vi.look = -0.8;
    vi.head = 4;
  }
  return (
    <>
      <Stage>
        <Person look={VUTI} pose={vi} view="front" x={1150} groundY={GY} />
        <Person look={VUTU} pose={vuPose} view={vuView} x={vuX} groundY={GY} />
      </Stage>
      <Label text="Jahil" />
      {t > pokeHit && t < pokeHit + 1.2 ? <Bubble text="*colek*" x={1000} y={360} /> : null}
      {t > pokeHit + 0.6 ? <Bubble text="..." x={1250} y={300} /> : null}
      {t > pokeEnd + 0.4 ? <Bubble text="HAHAHA!" x={vuX} y={330} /> : null}
    </>
  );
};

const OutroScene: React.FC = () => {
  const t = useT();
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <>
      <Stage>
        <Person look={VUTU} pose={t > 1.6 ? celebrate(t, 1) : wave(t, "playful", 1)} view="front" x={720} groundY={GY} />
        <Person look={VUTI} pose={wave(t, "chill", 2)} view="front" x={1200} groundY={GY} />
      </Stage>
      <div
        style={{
          position: "absolute",
          top: 90,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 120,
          color: "white",
          textShadow: "0 8px 0 rgba(0,0,0,0.35)",
          scale: interpolate(frame, [0, 0.5 * fps], [0.5, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 10 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <span style={{ color: VUTU.jersey, WebkitTextStroke: "4px #2A1B17" }}>VUTU</span>{" "}
        <span style={{ WebkitTextStroke: "4px #2A1B17" }}>&</span>{" "}
        <span style={{ color: VUTI.jersey, WebkitTextStroke: "4px #2A1B17" }}>VUTI</span>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Compositions
// ---------------------------------------------------------------------------

export const VutuVutiShowcase: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Pitch />
      <Sequence name="Intro" from={0} durationInFrames={3 * fps}>
        <IntroScene />
      </Sequence>
      <Sequence name="Putar" from={3 * fps} durationInFrames={4 * fps}>
        <TurnScene />
      </Sequence>
      <Sequence name="Talking Vutu" from={7 * fps} durationInFrames={3 * fps}>
        <TalkScene who="vutu" />
      </Sequence>
      <Sequence name="Talking Vuti" from={10 * fps} durationInFrames={3 * fps}>
        <TalkScene who="vuti" />
      </Sequence>
      <Sequence name="Jalan" from={13 * fps} durationInFrames={5 * fps}>
        <WalkScene />
      </Sequence>
      <Sequence name="Lari" from={18 * fps} durationInFrames={3 * fps}>
        <RunScene />
      </Sequence>
      <Sequence name="Lompat" from={21 * fps} durationInFrames={3 * fps}>
        <JumpScene />
      </Sequence>
      <Sequence name="Tendang" from={24 * fps} durationInFrames={4 * fps}>
        <KickScene />
      </Sequence>
      <Sequence name="Jahil" from={28 * fps} durationInFrames={5.5 * fps}>
        <PrankScene />
      </Sequence>
      <Sequence name="Outro" from={33.5 * fps} durationInFrames={3.5 * fps}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// Turnaround sheet: both characters from 4 sides
export const VutuVutiSheet: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#FFF8EE" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <line x1={60} y1={540} x2={W - 60} y2={540} stroke="#E8DCC8" strokeWidth={4} />
        {[VUTU, VUTI].map((look, row) =>
          VIEWS.map((v, i) => (
            <Person
              key={`${row}-${v}`}
              look={look}
              pose={{ ...idle(0.3, look.personality, row), blink: 0 }}
              view={v}
              x={420 + i * 400}
              groundY={515 + row * 525}
              scale={0.64}
            />
          )),
        )}
      </svg>
      {[VUTU, VUTI].map((look, row) => (
        <div
          key={look.name}
          style={{
            position: "absolute",
            left: 50,
            top: 230 + row * 525,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 64,
            color: look.jersey,
            WebkitTextStroke: "3px #2A1B17",
          }}
        >
          {look.name}
        </div>
      ))}
      {VIEW_NAMES.map((n, i) => (
        <div
          key={n}
          style={{
            position: "absolute",
            left: 420 + i * 400,
            top: 6,
            translate: "-50% 0",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 34,
            color: "#6D5D4B",
          }}
        >
          {n}
        </div>
      ))}
    </AbsoluteFill>
  );
};

