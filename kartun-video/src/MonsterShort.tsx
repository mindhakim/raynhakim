import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  staticFile,
  Easing,
  Interactive,
  Sequence,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ---------------------------------------------------------------------------
// Layout constants (1080 x 1920 vertical)
// ---------------------------------------------------------------------------

const MONSTER_X = 40;
const MONSTER_Y = 1000;
const SHOULDER_R = { x: 530, y: 470 }; // local, monster svg
const SHOULDER_L = { x: 110, y: 470 };
const ARM_BASE = 300;
const FIRE = { x: 870, y: 1690 };
const SPIT_Y = 1470;

const FONT =
  '"Baloo 2", "Nunito", "Inter", system-ui, -apple-system, sans-serif';

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const kf = (f: number, i: number[], o: number[]) =>
  interpolate(f, i, o, {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });

const handPos = (deg: number, s: number) => {
  const r = (deg * Math.PI) / 180;
  return {
    x: MONSTER_X + SHOULDER_R.x - ARM_BASE * s * Math.sin(r),
    y: MONSTER_Y + SHOULDER_R.y + ARM_BASE * s * Math.cos(r),
  };
};

// Pseudo random, deterministic
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Soft "fur tuft" outline around an ellipse
const furPath = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tufts: number,
  spike: number,
  seed: number,
) => {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < tufts * 2; i++) {
    const a = (i / (tufts * 2)) * Math.PI * 2;
    const k = i % 2 === 0 ? 1 : 1 + (spike / rx) * (0.6 + 0.6 * rand(i + seed));
    pts.push({ x: cx + rx * k * Math.cos(a), y: cy + ry * k * Math.sin(a) });
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i += 2) {
    const c = pts[i];
    const e = pts[(i + 1) % pts.length];
    d += ` Q ${c.x} ${c.y} ${e.x} ${e.y}`;
  }
  return d + " Z";
};

// ---------------------------------------------------------------------------
// Timeline (frames @ 30fps)
// ---------------------------------------------------------------------------

const STRIKES = [85, 103, 121, 139, 157];
const BITES = [525, 560, 595, 630];

const rightArm = (f: number) => {
  if (f < 80) return { a: kf(f, [60, 80], [8, -67]), s: kf(f, [60, 80], [0.8, 1]) };
  if (f < 170)
    return { a: -67 + 12 * Math.sin((2 * Math.PI * (f - 80)) / 18), s: 1 };
  if (f < 200) return { a: kf(f, [170, 195], [-67, 8]), s: kf(f, [170, 195], [1, 0.8]) };
  if (f < 225) return { a: kf(f, [200, 222], [8, -25]), s: kf(f, [200, 222], [0.8, 1]) };
  if (f < 260) return { a: kf(f, [225, 258], [-25, -90]), s: 1 };
  if (f < 450)
    return {
      a: kf(f, [262, 285], [-90, 8]) + (f > 285 ? Math.sin(f * 0.08) * 3 : 0),
      s: kf(f, [262, 285], [1, 0.8]),
    };
  if (f < 477) return { a: kf(f, [450, 473], [8, -90]), s: kf(f, [450, 473], [0.8, 1]) };
  if (f < 512) return { a: kf(f, [477, 508], [-90, 95]), s: kf(f, [477, 508], [1, 0.7]) };
  if (f < 640) {
    const p = (((f - BITES[0]) % 35) + 35) % 35;
    const off = f >= BITES[0] - 13 && p >= 22 ? kf(p, [22, 30, 35], [0, -10, 0]) : 0;
    return { a: 95 + off, s: 0.7 };
  }
  return { a: kf(f, [640, 670], [95, 40]), s: kf(f, [640, 670], [0.7, 0.85]) };
};

const leftArmAngle = (f: number) => {
  const rub = (f > 300 && f < 440) || f > 660;
  const base = rub ? -55 + Math.sin(f * 0.35) * 8 : 6 + Math.sin(f * 0.07) * 3;
  const to = (f > 285 && f < 300) || (f > 640 && f < 660);
  if (to) return kf(f, f < 400 ? [285, 300] : [640, 660], [6, -55]);
  if (f >= 440 && f < 455) return kf(f, [440, 455], [-55, 6]);
  return base;
};

const mouthOpen = (f: number) => {
  if (f < BITES[0] - 13 || f > 660) return f > 660 ? 0.15 : 0;
  const p = (((f - BITES[0]) % 35) + 35) % 35;
  if (p >= 22) return kf(p, [22, 30, 34], [0, 1, 0]);
  return 0.35 * Math.abs(Math.sin(p * 0.55)); // chewing
};

const bitesTaken = (f: number) => BITES.filter((b) => f >= b).length;

const fireScale = (f: number) =>
  interpolate(f, [150, 210], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.2, 1.4, 0.4, 1),
  });

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

const Tree: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly s: number;
  readonly color: string;
  readonly seed: number;
}> = ({ x, y, s, color, seed }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame * 0.03 + seed) * 1.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${sway})`}>
      <rect x={-22} y={-420} width={44} height={440} rx={14} fill="#2A1A14" />
      <path d={furPath(0, -470, 150, 110, 14, 30, seed)} fill={color} />
      <path d={furPath(-70, -390, 110, 80, 12, 24, seed + 3)} fill={color} />
      <path d={furPath(80, -380, 110, 80, 12, 24, seed + 7)} fill={color} />
    </g>
  );
};

const Jungle: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(#1E1238 0%, #4B2463 30%, #C4566B 62%, #F7A56A 78%)",
        }}
      />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        {/* Stars */}
        {new Array(30).fill(0).map((_, i) => (
          <circle
            key={i}
            cx={rand(i) * 1080}
            cy={rand(i + 50) * 600}
            r={1.5 + rand(i + 9) * 2.5}
            fill="white"
            opacity={0.4 + 0.5 * Math.abs(Math.sin(frame * 0.05 + i))}
          />
        ))}
        {/* Moon */}
        <circle cx={860} cy={600} r={80} fill="#FFF3D6" opacity={0.95} />
        <circle cx={835} cy={585} r={16} fill="#F1DDB5" />
        <circle cx={885} cy={625} r={11} fill="#F1DDB5" />

        {/* Far mountains */}
        <path
          d="M0 1080 L140 860 L300 1010 L470 800 L640 1000 L800 840 L1080 1060 V1400 H0 Z"
          fill="#3B2350"
        />

        {/* Far trees */}
        {[60, 260, 470].map((x, i) => (
          <Tree key={x} x={x} y={1300} s={0.9} color="#1F3B2D" seed={i * 11} />
        ))}

        {/* Cave rock formation */}
        <path
          d="M540 1330 Q560 1010 700 900 Q820 800 980 860 Q1080 900 1080 960 V1330 Z"
          fill="#5B4A5E"
        />
        <path
          d="M600 1330 Q620 1100 720 1000 Q800 930 900 960 Q980 990 1000 1100 L1010 1330 Z"
          fill="#463848"
        />
        {/* Cave opening */}
        <path
          d="M700 1330 Q700 1140 800 1080 Q880 1040 940 1110 Q980 1170 975 1330 Z"
          fill="#120A14"
        />
        {/* Moss and vines */}
        <path d="M660 960 Q700 900 780 900 Q720 930 690 990 Z" fill="#3E6B3A" />
        {[740, 800, 870, 930].map((x, i) => (
          <path
            key={x}
            d={`M${x} ${960 + i * 8} q ${10 + Math.sin(frame * 0.05 + i) * 8} 80 0 ${150 + i * 25}`}
            stroke="#3E6B3A"
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {/* Ground */}
        <path d="M0 1300 Q 540 1240 1080 1300 V1920 H0 Z" fill="#2F4A2A" />
        <path d="M0 1500 Q 600 1430 1080 1520 V1920 H0 Z" fill="#3A5A31" />

        {/* Near trees, left */}
        <Tree x={-40} y={1420} s={1.4} color="#244E30" seed={5} />

        {/* Fireflies */}
        {new Array(14).fill(0).map((_, i) => {
          const x = (rand(i + 100) * 1080 + Math.sin(frame * 0.02 + i) * 60) % 1080;
          const y = 900 + rand(i + 200) * 600 + Math.cos(frame * 0.03 + i * 2) * 40;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={5}
              fill="#F4FF81"
              opacity={0.3 + 0.7 * Math.abs(Math.sin(frame * 0.08 + i))}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const ForegroundLeaves: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      {[
        { x: -30, y: 1930, r: -30, s: 1.3 },
        { x: 60, y: 1940, r: -10, s: 1 },
        { x: 1110, y: 1930, r: 30, s: 1.3 },
        { x: 1010, y: 1950, r: 12, s: 1 },
      ].map((l, i) => (
        <g
          key={i}
          transform={`translate(${l.x} ${l.y}) rotate(${l.r + Math.sin(frame * 0.05 + i) * 4}) scale(${l.s})`}
        >
          <path d="M0 0 Q -70 -150 0 -300 Q 70 -150 0 0 Z" fill="#1E3A22" />
          <path d="M0 0 L0 -290" stroke="#16301B" strokeWidth={5} />
        </g>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Fire
// ---------------------------------------------------------------------------

const Flame: React.FC<{ readonly scale: number }> = ({ scale }) => {
  const frame = useCurrentFrame();
  const fl = (k: number) => 1 + Math.sin(frame * 0.9 + k) * 0.08 + Math.sin(frame * 1.7 + k * 2) * 0.05;
  const layers = [
    { c: "#E53935", w: 120, h: 230, k: 0 },
    { c: "#FB8C00", w: 95, h: 190, k: 1 },
    { c: "#FFD54F", w: 60, h: 130, k: 2 },
    { c: "#FFF8E1", w: 28, h: 70, k: 3 },
  ];
  return (
    <g transform={`translate(${FIRE.x} ${FIRE.y - 10}) scale(${scale})`}>
      {layers.map((l) => {
        const h = l.h * fl(l.k);
        const lean = Math.sin(frame * 0.4 + l.k) * 14;
        return (
          <path
            key={l.k}
            d={`M ${-l.w / 2} 0 Q ${-l.w / 2} ${-h * 0.5} ${lean} ${-h} Q ${l.w / 2} ${-h * 0.5} ${l.w / 2} 0 Z`}
            fill={l.c}
          />
        );
      })}
    </g>
  );
};

const FirePit: React.FC = () => {
  const frame = useCurrentFrame();
  const s = fireScale(frame);
  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {/* Logs */}
      <rect x={FIRE.x - 110} y={FIRE.y - 20} width={220} height={34} rx={17} fill="#5D3A1A" transform={`rotate(14 ${FIRE.x} ${FIRE.y})`} />
      <rect x={FIRE.x - 110} y={FIRE.y - 20} width={220} height={34} rx={17} fill="#6D4421" transform={`rotate(-14 ${FIRE.x} ${FIRE.y})`} />
      {/* Embers */}
      <ellipse cx={FIRE.x} cy={FIRE.y + 4} rx={70} ry={14} fill="#FF7043" opacity={s * (0.7 + 0.3 * Math.sin(frame))} />
      <Flame scale={s} />
      {/* Stones ring */}
      {new Array(9).fill(0).map((_, i) => {
        const a = (i / 8) * Math.PI;
        return (
          <ellipse
            key={i}
            cx={FIRE.x - Math.cos(a) * 140}
            cy={FIRE.y + 30 + Math.sin(a) * 26}
            rx={34}
            ry={24}
            fill={i % 2 ? "#6E6A72" : "#85808A"}
            stroke="#3D3A40"
            strokeWidth={4}
          />
        );
      })}
    </svg>
  );
};

const Spit: React.FC = () => (
  <svg
    width={1080}
    height={1920}
    viewBox="0 0 1080 1920"
    style={{ position: "absolute", left: 0, top: 0 }}
  >
    {[FIRE.x - 140, FIRE.x + 140].map((x) => (
      <g key={x}>
        <rect x={x - 9} y={SPIT_Y} width={18} height={FIRE.y - SPIT_Y + 20} rx={8} fill="#4E342E" />
        <path d={`M${x} ${SPIT_Y + 30} L${x - 28} ${SPIT_Y - 18} M${x} ${SPIT_Y + 30} L${x + 28} ${SPIT_Y - 18}`} stroke="#4E342E" strokeWidth={14} strokeLinecap="round" />
      </g>
    ))}
    <rect x={FIRE.x - 175} y={SPIT_Y - 7} width={350} height={14} rx={7} fill="#795548" />
  </svg>
);

const Sparks: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      {/* Striking sparks */}
      {STRIKES.map((s, si) => {
        const t = frame - s;
        if (t < 0 || t > 14) return null;
        return new Array(12).fill(0).map((_, i) => {
          const a = -Math.PI * (0.1 + 0.8 * rand(i + si * 20));
          const d = t * (9 + rand(i + 7) * 10);
          return (
            <circle
              key={`${si}-${i}`}
              cx={FIRE.x - 20 + Math.cos(a) * d}
              cy={FIRE.y - 30 + Math.sin(a) * d + t * t * 0.4}
              r={5}
              fill={i % 2 ? "#FFEB3B" : "#FF9800"}
              opacity={1 - t / 14}
            />
          );
        });
      })}
      {/* Rising embers once the fire is lit */}
      {frame > 180
        ? new Array(10).fill(0).map((_, i) => {
            const life = 50;
            const t = (frame + i * 7) % life;
            return (
              <circle
                key={`e${i}`}
                cx={FIRE.x + (rand(i) - 0.5) * 120 + Math.sin(t * 0.2 + i) * 15}
                cy={FIRE.y - 60 - t * 6}
                r={4}
                fill="#FFCA28"
                opacity={1 - t / life}
              />
            );
          })
        : null}
    </svg>
  );
};

const FireLight: React.FC = () => {
  const frame = useCurrentFrame();
  const s = fireScale(frame);
  const flick = 0.85 + Math.sin(frame * 0.7) * 0.08 + Math.sin(frame * 1.9) * 0.07;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${FIRE.x}px ${FIRE.y - 120}px, rgba(255,150,50,0.55) 0px, rgba(255,120,40,0.18) 420px, rgba(0,0,0,0) 800px)`,
        opacity: s * flick,
        mixBlendMode: "screen",
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Chicken
// ---------------------------------------------------------------------------

const Chicken: React.FC = () => {
  const frame = useCurrentFrame();
  const bites = bitesTaken(frame);

  // Position
  let pos = { x: 697, y: 1742 };
  if (frame >= 225 && frame < 260) {
    const r = rightArm(frame);
    pos = handPos(r.a, r.s);
  } else if (frame >= 260 && frame < 477) {
    pos = { x: FIRE.x, y: SPIT_Y };
  } else if (frame >= 477) {
    const r = rightArm(frame);
    const h = handPos(r.a, r.s);
    pos = { x: h.x + kf(frame, [477, 508], [0, 60]), y: h.y };
  }

  const cook = interpolate(frame, [270, 440], [0, 1], clamp);
  const meat = interpolateColors(cook, [0, 0.5, 1], ["#F7C6B5", "#E9A15E", "#B8611F"]);
  const dark = interpolateColors(cook, [0, 1], ["#E0A090", "#7A3B0E"]);
  const spinning = frame >= 260 && frame < 450;
  const spin = spinning ? 0.72 + 0.28 * Math.cos(frame * 0.18) : 1;
  const steam = cook > 0.4;

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x - 120,
        top: pos.y - 85,
        width: 240,
        height: 170,
      }}
    >
      {bites >= 4 ? (
        <svg width={240} height={170} viewBox="0 0 240 170" style={{ overflow: "visible" }}>
          <g transform="rotate(-20 120 85)">
            <rect x={60} y={74} width={120} height={22} rx={11} fill="#FFF8E1" stroke="#5D4037" strokeWidth={5} />
            <circle cx={58} cy={72} r={16} fill="#FFF8E1" stroke="#5D4037" strokeWidth={5} />
            <circle cx={58} cy={98} r={16} fill="#FFF8E1" stroke="#5D4037" strokeWidth={5} />
            <circle cx={182} cy={72} r={16} fill="#FFF8E1" stroke="#5D4037" strokeWidth={5} />
            <circle cx={182} cy={98} r={16} fill="#FFF8E1" stroke="#5D4037" strokeWidth={5} />
          </g>
        </svg>
      ) : (
        <svg
          width={240}
          height={170}
          viewBox="0 0 240 170"
          style={{ overflow: "visible", scale: `1 ${spin}` }}
        >
          <defs>
            <mask id="bites">
              <rect x={-50} y={-50} width={340} height={270} fill="white" />
              {[
                { x: 38, y: 70, r: 34 },
                { x: 52, y: 118, r: 36 },
                { x: 80, y: 52, r: 40 },
              ]
                .slice(0, bites)
                .map((b, i) => (
                  <g key={i}>
                    <circle cx={b.x} cy={b.y} r={b.r} fill="black" />
                    <circle cx={b.x + b.r * 0.7} cy={b.y - b.r * 0.6} r={b.r * 0.35} fill="black" />
                    <circle cx={b.x + b.r * 0.8} cy={b.y + b.r * 0.4} r={b.r * 0.35} fill="black" />
                  </g>
                ))}
            </mask>
          </defs>
          <g mask="url(#bites)">
            {/* Legs */}
            <g transform="rotate(-35 170 70)">
              <ellipse cx={180} cy={60} rx={30} ry={46} fill={meat} stroke={dark} strokeWidth={5} />
              <rect x={172} y={0} width={16} height={30} rx={8} fill="#FFF8E1" stroke="#8D6E63" strokeWidth={4} />
            </g>
            <g transform="rotate(25 190 110)">
              <ellipse cx={195} cy={110} rx={28} ry={42} fill={meat} stroke={dark} strokeWidth={5} />
              <rect x={210} y={125} width={30} height={16} rx={8} fill="#FFF8E1" stroke="#8D6E63" strokeWidth={4} />
            </g>
            {/* Body */}
            <ellipse cx={115} cy={92} rx={98} ry={64} fill={meat} stroke={dark} strokeWidth={6} />
            {/* Wing */}
            <path d="M70 80 Q 110 60 140 95 Q 105 110 70 80 Z" fill={dark} opacity={0.45} />
            {/* Shine */}
            <ellipse cx={95} cy={62} rx={36} ry={12} fill="white" opacity={0.35} />
            {/* Grill marks */}
            {cook > 0.3
              ? [70, 110, 150].map((x) => (
                  <path key={x} d={`M${x} 40 L${x - 20} 140`} stroke={dark} strokeWidth={6} opacity={cook * 0.6} strokeLinecap="round" />
                ))
              : null}
          </g>
        </svg>
      )}
      {/* Steam puffs */}
      {steam && bites < 4
        ? new Array(3).fill(0).map((_, i) => {
            const life = 45;
            const t = (frame + i * 15) % life;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 70 + i * 40 + Math.sin(t * 0.15 + i) * 10,
                  top: -t * 3,
                  width: 30 + t,
                  height: 30 + t,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.5)",
                  opacity: 1 - t / life,
                }}
              />
            );
          })
        : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Monster
// ---------------------------------------------------------------------------

const FUR = "#6D4C8F";
const FUR_DARK = "#4A2F66";
const BELLY = "#B79BD6";
const OUT = "#24152F";

const Arm: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly len: number;
  readonly holdStone?: boolean;
}> = ({ x, y, angle, len, holdStone }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <path d={furPath(0, len / 2, 46, len / 2 + 14, 12, 14, 3)} fill={FUR_DARK} />
    <path d={furPath(0, len / 2, 40, len / 2 + 6, 12, 12, 4)} fill={FUR} />
    {/* Hand */}
    <path d={furPath(0, len, 52, 48, 10, 12, 9)} fill={FUR} stroke={OUT} strokeWidth={4} />
    {[-28, 0, 28].map((cx) => (
      <path key={cx} d={`M${cx - 9} ${len + 38} L${cx} ${len + 68} L${cx + 9} ${len + 38} Z`} fill="#FFF3E0" stroke={OUT} strokeWidth={3} />
    ))}
    {holdStone ? <ellipse cx={0} cy={len + 40} rx={34} ry={26} fill="#8D8892" stroke={OUT} strokeWidth={4} /> : null}
  </g>
);

const Eye: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly blink: number;
  readonly lookX: number;
  readonly lookY: number;
  readonly happy: number;
}> = ({ cx, cy, r, blink, lookX, lookY, happy }) => {
  if (happy > 0.5) {
    return (
      <path
        d={`M${cx - r} ${cy + 6} Q ${cx} ${cy - r} ${cx + r} ${cy + 6}`}
        stroke={OUT}
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  const sy = 1 - blink * 0.92;
  return (
    <g transform={`translate(0 ${cy}) scale(1 ${sy}) translate(0 ${-cy})`}>
      <circle cx={cx} cy={cy} r={r} fill="white" stroke={OUT} strokeWidth={6} />
      <circle cx={cx + lookX * r * 0.35} cy={cy + lookY * r * 0.35} r={r * 0.55} fill="#C6FF00" />
      <circle cx={cx + lookX * r * 0.4} cy={cy + lookY * r * 0.4} r={r * 0.28} fill={OUT} />
      <circle cx={cx + lookX * r * 0.4 + r * 0.15} cy={cy + lookY * r * 0.4 - r * 0.15} r={r * 0.1} fill="white" />
    </g>
  );
};

const Monster: React.FC = () => {
  const frame = useCurrentFrame();
  const r = rightArm(frame);
  const la = leftArmAngle(frame);
  const open = mouthOpen(frame);

  const cyc = frame % 95;
  const blink = cyc < 6 ? Math.sin((cyc / 6) * Math.PI) : 0;
  const happy = frame > 655 || (frame > 210 && frame < 240) ? 1 : 0;

  // Where to look
  let lx = 0;
  let ly = 0;
  if (frame > 60 && frame < 260) {
    lx = 0.8;
    ly = 0.7;
  } else if (frame >= 260 && frame < 477) {
    lx = 0.9;
    ly = 0.3;
  } else if (frame >= 477 && frame < 655) {
    lx = 0.6;
    ly = 0.5;
  }

  const breathe = 1 + Math.sin(frame * 0.12) * 0.015;
  const lowerLip = 520 + open * 90;

  return (
    <Interactive.Div
      name="Monster"
      style={{
        position: "absolute",
        left: MONSTER_X,
        top: MONSTER_Y,
        width: 640,
        height: 760,
        transformOrigin: "320px 760px",
        scale: `1 ${breathe}`,
      }}
    >
      <svg width={640} height={760} viewBox="0 0 640 760" style={{ overflow: "visible" }}>
        {/* Shadow */}
        <ellipse cx={320} cy={765} rx={260} ry={30} fill="rgba(0,0,0,0.35)" />

        {/* Feet */}
        {[210, 430].map((x) => (
          <g key={x}>
            <path d={furPath(x, 720, 90, 48, 10, 12, x)} fill={FUR_DARK} stroke={OUT} strokeWidth={4} />
            {[-40, 0, 40].map((d) => (
              <path key={d} d={`M${x + d - 10} 752 L${x + d} 778 L${x + d + 10} 752 Z`} fill="#FFF3E0" stroke={OUT} strokeWidth={3} />
            ))}
          </g>
        ))}

        {/* Body */}
        <path d={furPath(320, 420, 275, 315, 30, 34, 1)} fill={FUR_DARK} />
        <path d={furPath(320, 420, 258, 298, 30, 26, 2)} fill={FUR} stroke={OUT} strokeWidth={5} />
        <path d={furPath(320, 600, 150, 120, 16, 14, 6)} fill={BELLY} />
        {/* Fur texture strokes */}
        {new Array(16).fill(0).map((_, i) => {
          const x = 120 + rand(i + 300) * 400;
          const y = 170 + rand(i + 400) * 450;
          if (Math.hypot(x - 320, y - 380) < 150) return null;
          return (
            <path key={i} d={`M${x} ${y} q 8 -14 0 -28`} stroke={FUR_DARK} strokeWidth={5} fill="none" strokeLinecap="round" />
          );
        })}

        {/* Tufts on head */}
        <path d="M250 140 Q 270 60 300 130 Q 320 40 345 128 Q 375 70 390 140 Z" fill={FUR} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />

        {/* Three eyes */}
        <Eye cx={215} cy={310} r={40} blink={blink} lookX={lx} lookY={ly} happy={happy} />
        <Eye cx={320} cy={235} r={50} blink={blink} lookX={lx} lookY={ly} happy={happy} />
        <Eye cx={425} cy={310} r={40} blink={blink} lookX={lx} lookY={ly} happy={happy} />

        {/* Always-smiling mouth */}
        <path
          d={`M180 410 Q 320 470 460 410 Q 320 ${lowerLip} 180 410 Z`}
          fill="#3A0D1A"
          stroke={OUT}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {/* Tongue */}
        <ellipse cx={320} cy={420 + (lowerLip - 420) * 0.72} rx={60} ry={14 + open * 14} fill="#E57373" />
        {/* Small teeth */}
        {[285, 320, 355].map((x) => (
          <path key={x} d={`M${x - 14} 442 L${x} 462 L${x + 14} 442 Z`} fill="white" stroke={OUT} strokeWidth={3} />
        ))}
        {/* Big fangs */}
        {[235, 405].map((x) => (
          <path key={x} d={`M${x - 18} 428 L${x} 490 L${x + 18} 430 Z`} fill="white" stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
        ))}
        {/* Blush */}
        <ellipse cx={160} cy={380} rx={30} ry={14} fill="#F48FB1" opacity={0.6} />
        <ellipse cx={480} cy={380} rx={30} ry={14} fill="#F48FB1" opacity={0.6} />

        {/* Arms */}
        <Arm x={SHOULDER_L.x} y={SHOULDER_L.y} angle={la} len={240} />
        <Arm
          x={SHOULDER_R.x}
          y={SHOULDER_R.y}
          angle={r.a}
          len={ARM_BASE * r.s}
          holdStone={frame > 70 && frame < 175}
        />
      </svg>
    </Interactive.Div>
  );
};

// ---------------------------------------------------------------------------
// Extras
// ---------------------------------------------------------------------------

const Rock: React.FC = () => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
    <ellipse cx={697} cy={1800} rx={110} ry={36} fill="#6E6A72" stroke="#3D3A40" strokeWidth={5} />
    <path d="M610 1790 Q 697 1760 790 1790 Q 697 1815 610 1790 Z" fill="#4CAF50" />
  </svg>
);

const Hearts: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {[0, 1, 2, 3].map((i) => {
        const t = frame - i * 8;
        if (t < 0) return null;
        return (
          <svg
            key={i}
            width={80}
            height={80}
            viewBox="0 0 40 40"
            style={{
              position: "absolute",
              left: 220 + i * 70 + Math.sin(t * 0.1 + i) * 20,
              top: 1150 - t * 5,
              opacity: interpolate(t, [0, 10, 50, 70], [0, 1, 1, 0], clamp),
            }}
          >
            <path d="M20 35 C 5 25 0 15 8 8 C 14 3 20 8 20 12 C 20 8 26 3 32 8 C 40 15 35 25 20 35 Z" fill="#FF4081" />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

const Caption: React.FC<{ readonly text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 220 }}>
      <Interactive.Div
        name="Caption"
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 74,
          color: "white",
          textAlign: "center",
          maxWidth: 900,
          lineHeight: 1.1,
          padding: "24px 44px",
          borderRadius: 36,
          background: "rgba(20, 10, 30, 0.6)",
          textShadow: "0 6px 0 rgba(0,0,0,0.5)",
          scale: interpolate(frame, [0, 0.35 * fps], [0.6, 1], {
            ...clamp,
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [0, 0.2 * fps], [0, 1], clamp),
        }}
      >
        {text}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const World: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        transformOrigin: "480px 1450px",
        scale: String(
          interpolate(frame, [0, 60, 470, 520, 650, 700], [1.12, 1, 1, 1.15, 1.15, 1.05], {
            ...clamp,
            easing: Easing.bezier(0.45, 0, 0.25, 1),
          }),
        ),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const MonsterShort: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#1E1238" }}>
      <World>
        <Jungle />
        <Rock />
        <Spit />
        <FirePit />
        <Monster />
        <Chicken />
        <Sparks />
        <FireLight />
        <Sequence name="Hearts" from={655}>
          <Hearts />
        </Sequence>
        <ForegroundLeaves />
      </World>

      {/* Voiceover */}
      <Sequence name="VO 1" from={0.1 * fps}>
        <Audio src={staticFile("vo/vo1.mp3")} playbackRate={1.15} />
      </Sequence>
      <Sequence name="VO 2" from={3.5 * fps}>
        <Audio src={staticFile("vo/vo2.mp3")} />
      </Sequence>
      <Sequence name="VO 3" from={8.1 * fps}>
        <Audio src={staticFile("vo/vo3.mp3")} />
      </Sequence>
      <Sequence name="VO 5" from={15.3 * fps}>
        <Audio src={staticFile("vo/vo5.mp3")} />
      </Sequence>
      <Sequence name="VO 6" from={21.3 * fps}>
        <Audio src={staticFile("vo/vo6.mp3")} />
      </Sequence>

      <Sequence name="Caption 1" from={0} durationInFrames={2.5 * fps}>
        <Caption text="Di hutan belantara, dekat sebuah gua..." />
      </Sequence>
      <Sequence name="Caption 2" from={2.5 * fps} durationInFrames={4.2 * fps}>
        <Caption text="Nyalain api dulu..." />
      </Sequence>
      <Sequence name="Caption 3" from={6.7 * fps} durationInFrames={2.8 * fps}>
        <Caption text="Ayamnya ditaruh di atas api" />
      </Sequence>
      <Sequence name="Caption 4" from={9.5 * fps} durationInFrames={5.5 * fps}>
        <Caption text="Dipanggang sampai kecokelatan..." />
      </Sequence>
      <Sequence name="Caption 5" from={15 * fps} durationInFrames={6.4 * fps}>
        <Caption text="Waktunya makan! Nyam nyam!" />
      </Sequence>
      <Sequence name="Caption 6" from={21.4 * fps}>
        <Caption text="Kenyang deh!" />
      </Sequence>
    </AbsoluteFill>
  );
};
