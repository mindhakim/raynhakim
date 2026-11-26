import React from "react";
import { Arm, Leg, Look, Pose, View } from "./types";

// ---------------------------------------------------------------------------
// Rig constants. Root (0,0) = hips. Feet touch the ground at y = GROUND.
// ---------------------------------------------------------------------------

export const GROUND = 232;
const OUT = "#2A1B17";
const OW = 6;
const LU = 86; // upper arm
const LF = 78; // forearm
const LT = 105; // thigh
const LS = 100; // shin
const FOOT = 40;

const FONT = '"Baloo 2", "Nunito", "Inter", system-ui, sans-serif';

type P = { x: number; y: number };
const d2r = (d: number) => (d * Math.PI) / 180;
const rotP = (p: P, a: number): P => {
  const r = d2r(a);
  return { x: p.x * Math.cos(r) - p.y * Math.sin(r), y: p.x * Math.sin(r) + p.y * Math.cos(r) };
};
const add = (a: P, b: P): P => ({ x: a.x + b.x, y: a.y + b.y });
const lerp = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const fs = (deg: number) => {
  const c = Math.cos(d2r(deg));
  return Math.sign(c || 1) * Math.max(Math.abs(c), 0.22);
};

// A rounded "capsule" segment with an outline
const Seg: React.FC<{ a: P; b: P; w: number; c: string; outline?: boolean }> = ({ a, b, w, c, outline = true }) => (
  <>
    {outline ? (
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={OUT} strokeWidth={w + OW * 2} strokeLinecap="round" />
    ) : null}
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c} strokeWidth={w} strokeLinecap="round" />
  </>
);

// ---------------------------------------------------------------------------
// Limbs
// ---------------------------------------------------------------------------

const ArmView: React.FC<{ S: P; E: P; H: P; look: Look }> = ({ S, E, H, look }) => {
  const M = lerp(S, E, 0.55);
  return (
    <g>
      <Seg a={S} b={E} w={28} c={look.skin} />
      <Seg a={E} b={H} w={25} c={look.skin} />
      <circle cx={H.x} cy={H.y} r={17} fill={look.skin} stroke={OUT} strokeWidth={OW} />
      {/* Sleeve */}
      <Seg a={S} b={M} w={44} c={look.jersey} />
    </g>
  );
};

const LegView: React.FC<{ H: P; K: P; A: P; toe: P | null; side: number; look: Look }> = ({
  H,
  K,
  A,
  toe,
  side,
  look,
}) => {
  const sockTop = lerp(K, A, 0.3);
  const shortsEnd = lerp(H, K, 0.62);
  return (
    <g>
      <Seg a={H} b={K} w={38} c={look.skin} />
      <Seg a={K} b={A} w={32} c={look.skin} />
      <Seg a={sockTop} b={A} w={38} c={look.socks} />
      <line
        x1={lerp(sockTop, A, 0.15).x - 18}
        y1={lerp(sockTop, A, 0.15).y}
        x2={lerp(sockTop, A, 0.15).x + 18}
        y2={lerp(sockTop, A, 0.15).y}
        stroke="white"
        strokeWidth={5}
        opacity={0.8}
      />
      <Seg a={H} b={shortsEnd} w={56} c={look.shorts} />
      {toe ? (
        <>
          <Seg a={add(A, { x: (A.x - toe.x) * 0.25, y: (A.y - toe.y) * 0.25 + 6 })} b={toe} w={26} c={look.boots} />
          <line x1={A.x - 8} y1={A.y + 18} x2={toe.x + 6} y2={toe.y + 16} stroke="#FFD54F" strokeWidth={4} strokeLinecap="round" />
        </>
      ) : (
        <ellipse
          cx={A.x + side * 6}
          cy={A.y + 12}
          rx={25}
          ry={15}
          fill={look.boots}
          stroke={OUT}
          strokeWidth={OW}
        />
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Heads
// ---------------------------------------------------------------------------

const Eye: React.FC<{ x: number; y: number; look: number; blink: number; lid: number; skin: string; rx?: number }> = ({
  x,
  y,
  look,
  blink,
  lid,
  skin,
  rx = 15,
}) => {
  const lidY = -24 + 44 * lid;
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${Math.max(0.08, 1 - blink)})`}>
      <ellipse rx={rx} ry={19} fill="white" stroke={OUT} strokeWidth={5} />
      <circle cx={look * 5} cy={3} r={9} fill="#2B1A12" />
      <circle cx={look * 5 + 3} cy={-1} r={3} fill="white" />
      {lid > 0 ? (
        <>
          <path d={`M ${-rx - 5} -26 L ${rx + 5} -26 L ${rx + 5} ${lidY} L ${-rx - 5} ${lidY} Z`} fill={skin} />
          <line x1={-rx - 2} y1={lidY} x2={rx + 2} y2={lidY} stroke={OUT} strokeWidth={5} strokeLinecap="round" />
        </>
      ) : null}
    </g>
  );
};

const curlyBumps = (cx: number, cy: number, R: number, from: number, to: number, step: number) => {
  const pts: { x: number; y: number; i: number }[] = [];
  let i = 0;
  for (let a = from; a <= to; a += step) {
    pts.push({ x: cx + R * Math.cos(d2r(a)), y: cy - R * Math.sin(d2r(a)), i: i++ });
  }
  return pts;
};

const Blob: React.FC<{ pts: { x: number; y: number; i: number }[]; r: number; c: string; shade: string; path?: string }> = ({
  pts,
  r,
  c,
  shade,
  path,
}) => (
  <g>
    {path ? <path d={path} fill={OUT} stroke={OUT} strokeWidth={OW * 2} strokeLinejoin="round" /> : null}
    {pts.map((p) => (
      <circle key={`o${p.i}`} cx={p.x} cy={p.y} r={r + OW} fill={OUT} />
    ))}
    {path ? <path d={path} fill={c} /> : null}
    {pts.map((p) => (
      <circle key={`f${p.i}`} cx={p.x} cy={p.y} r={r} fill={p.i % 3 === 0 ? shade : c} />
    ))}
    {pts
      .filter((p) => p.i % 2 === 0)
      .map((p) => (
        <path
          key={`s${p.i}`}
          d={`M ${p.x - r * 0.4} ${p.y - r * 0.1} q ${r * 0.4} ${-r * 0.5} ${r * 0.8} 0`}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
      ))}
  </g>
);

const mohawkSpikes = (cx: number, cy: number, R: number, from: number, to: number, n: number, h: number) => {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    const base = (aa: number) => ({ x: cx + R * Math.cos(d2r(aa)), y: cy - R * Math.sin(d2r(aa)) });
    const w = ((to - from) / n) * 0.55;
    const b1 = base(a - w);
    const b2 = base(a + w);
    const hh = h * (0.75 + 0.25 * Math.sin(i * 1.7 + 1));
    const tip = { x: cx + (R + hh) * Math.cos(d2r(a + 4)), y: cy - (R + hh) * Math.sin(d2r(a + 4)) };
    d += `${i === 0 ? "M" : "L"} ${b1.x} ${b1.y} L ${tip.x} ${tip.y} L ${b2.x} ${b2.y} `;
  }
  return d;
};

const HeadFront: React.FC<{ look: Look; pose: Pose; back: boolean }> = ({ look, pose, back }) => {
  const square = look.jaw === "square";
  const face = square
    ? "M -88 -128 Q -88 -205 0 -205 Q 88 -205 88 -128 L 88 -52 Q 88 -14 48 -11 L -48 -11 Q -88 -14 -88 -52 Z"
    : "M -84 -124 Q -84 -205 0 -205 Q 84 -205 84 -124 Q 84 -10 0 -8 Q -84 -10 -84 -124 Z";
  const playful = look.personality === "playful";
  const o = playful ? 0.3 + 0.7 * pose.mouth : pose.mouth;
  const hv = pose.hairV;

  const hair =
    look.hairStyle === "curly" ? (
      <g transform={`translate(0 ${hv * 0.6})`}>
        <Blob
          pts={
            back
              ? [
                  ...curlyBumps(0, -122, 90, -40, 220, 16),
                  ...curlyBumps(0, -122, 55, 0, 360, 45),
                  { x: 0, y: -120, i: 99 },
                  { x: -40, y: -70, i: 98 },
                  { x: 40, y: -70, i: 97 },
                ]
              : [
                  ...curlyBumps(0, -124, 92, -18, 198, 16),
                  ...[-66, -33, 0, 33, 66].map((x, i) => ({ x, y: -166 + Math.abs(x) * 0.12, i: 50 + i })),
                ]
          }
          r={back ? 28 : 24}
          c={look.hair}
          shade={look.hairShade}
          path={
            back
              ? "M -90 -130 Q -94 -218 0 -218 Q 94 -218 90 -130 L 86 -62 Q 0 -40 -86 -62 Z"
              : "M -92 -118 Q -96 -218 0 -218 Q 96 -218 92 -118 Q 70 -168 0 -166 Q -70 -168 -92 -118 Z"
          }
        />
      </g>
    ) : (
      <g transform={`translate(0 ${hv * 0.6})`}>
        {/* Shaved sides */}
        <path
          d={
            back
              ? "M -82 -110 Q -84 -203 0 -203 Q 84 -203 82 -110 Q 80 -60 0 -52 Q -80 -60 -82 -110 Z"
              : "M -82 -128 Q -84 -203 0 -203 Q 84 -203 82 -128 Q 40 -160 0 -160 Q -40 -160 -82 -128 Z"
          }
          fill={look.hairShade}
          opacity={0.45}
        />
        {/* Mohawk crest */}
        <g transform={`rotate(${hv * 1.5} 0 -200)`}>
          <path
            d="M -30 -196 L -40 -262 L -18 -238 L -12 -304 L 4 -246 L 20 -296 L 22 -238 L 42 -256 L 30 -194 Q 0 -206 -30 -196 Z"
            fill={look.hair}
            stroke={OUT}
            strokeWidth={OW}
            strokeLinejoin="round"
          />
          <path d="M -8 -210 L -10 -280 M 10 -214 L 16 -276" stroke={look.hairShade} strokeWidth={6} strokeLinecap="round" />
        </g>
      </g>
    );

  return (
    <g>
      {/* Ears */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={s * 86} cy={-102} r={19} fill={look.skin} stroke={OUT} strokeWidth={OW} />
          <circle cx={s * 88} cy={-102} r={8} fill={look.skinShade} />
        </g>
      ))}
      <path d={face} fill={look.skin} stroke={OUT} strokeWidth={OW} strokeLinejoin="round" />
      {back ? null : (
        <>
          {look.beard ? (
            <path d="M -74 -66 Q -70 2 0 6 Q 70 2 74 -66 Q 50 -30 0 -36 Q -50 -30 -74 -66 Z" fill={look.beard} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
          ) : null}
          {/* Jaw shading */}
          <path
            d={square ? "M -70 -30 Q 0 -6 70 -30" : "M -56 -30 Q 0 -4 56 -30"}
            stroke={look.skinShade}
            strokeWidth={6}
            fill="none"
            opacity={0.5}
            strokeLinecap="round"
          />
          {playful ? (
            <>
              <ellipse cx={-56} cy={-74} rx={13} ry={7} fill="#FF7FA8" opacity={0.55} />
              <ellipse cx={56} cy={-74} rx={13} ry={7} fill="#FF7FA8" opacity={0.55} />
            </>
          ) : null}
          <Eye x={-36} y={-104} look={pose.look} blink={pose.blink} lid={playful ? 0 : 0.42} skin={look.skin} />
          <Eye x={36} y={-104} look={pose.look} blink={pose.blink} lid={playful ? 0 : 0.42} skin={look.skin} />
          {/* Nose */}
          <path d="M -3 -86 Q 9 -76 -2 -70" stroke={OUT} strokeWidth={4} fill="none" strokeLinecap="round" />
          {/* Mouth */}
          {playful ? (
            <g>
              <path
                d={`M -32 -54 Q 0 -46 32 -54 Q 28 ${-50 + o * 30} 0 ${-46 + o * 34} Q -28 ${-50 + o * 30} -32 -54 Z`}
                fill="#7A1F2B"
                stroke={OUT}
                strokeWidth={5}
                strokeLinejoin="round"
              />
              <path d="M -25 -52 Q 0 -45 25 -52 L 23 -46 Q 0 -40 -23 -46 Z" fill="white" />
              {o > 0.45 ? <ellipse cx={0} cy={-50 + o * 24} rx={13} ry={3 + o * 4} fill="#E86A7A" /> : null}
            </g>
          ) : pose.mouth < 0.12 ? (
            <path d="M -20 -50 Q 4 -45 24 -56" stroke={OUT} strokeWidth={5} fill="none" strokeLinecap="round" />
          ) : (
            <ellipse cx={3} cy={-50} rx={9 + pose.mouth * 5} ry={3 + pose.mouth * 12} fill="#7A1F2B" stroke={OUT} strokeWidth={5} />
          )}
        </>
      )}
      {hair}
      {back ? null : (
        <g transform={`translate(0 ${-pose.brow * 6})`}>
          {playful ? (
            <>
              <path d="M -54 -138 Q -38 -150 -20 -140" stroke={OUT} strokeWidth={7} fill="none" strokeLinecap="round" />
              <path d="M 20 -146 Q 38 -158 54 -144" stroke={OUT} strokeWidth={7} fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M -54 -132 L -20 -134" stroke={OUT} strokeWidth={7} strokeLinecap="round" />
              <path d="M 20 -134 L 54 -132" stroke={OUT} strokeWidth={7} strokeLinecap="round" />
            </>
          )}
        </g>
      )}
    </g>
  );
};

// Side head, facing +x
const HeadSide: React.FC<{ look: Look; pose: Pose }> = ({ look, pose }) => {
  const square = look.jaw === "square";
  const playful = look.personality === "playful";
  const face = square
    ? "M -78 -118 Q -82 -205 8 -205 Q 90 -205 92 -124 L 92 -96 L 108 -80 L 92 -72 L 92 -44 Q 90 -12 52 -10 L -18 -10 Q -60 -20 -78 -60 Z"
    : "M -76 -118 Q -80 -205 6 -205 Q 86 -205 88 -124 L 88 -96 L 102 -82 L 88 -74 Q 92 -22 40 -10 Q -10 -6 -40 -24 Q -76 -50 -76 -118 Z";
  const o = playful ? 0.3 + 0.7 * pose.mouth : pose.mouth;
  const hv = pose.hairV;
  return (
    <g>
      <path d={face} fill={look.skin} stroke={OUT} strokeWidth={OW} strokeLinejoin="round" />
      {/* Ear */}
      <circle cx={-12} cy={-100} r={19} fill={look.skin} stroke={OUT} strokeWidth={OW} />
      <circle cx={-10} cy={-100} r={8} fill={look.skinShade} />
      {/* Eye */}
      <g transform={`translate(54 -104) scale(1 ${Math.max(0.08, 1 - pose.blink)})`}>
        <ellipse rx={10} ry={18} fill="white" stroke={OUT} strokeWidth={5} />
        <circle cx={4} cy={3} r={7} fill="#2B1A12" />
        {playful ? null : (
          <>
            <path d="M -15 -24 L 15 -24 L 15 -6 L -15 -6 Z" fill={look.skin} />
            <line x1={-12} y1={-6} x2={13} y2={-6} stroke={OUT} strokeWidth={5} strokeLinecap="round" />
          </>
        )}
      </g>
      {playful ? <ellipse cx={58} cy={-72} rx={11} ry={6} fill="#FF7FA8" opacity={0.55} /> : null}
      {look.beard ? (
        <path d="M 94 -70 Q 92 -4 40 -4 Q -14 -2 -34 -40 Q 20 -28 64 -46 Z" fill={look.beard} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      ) : null}
      {/* Mouth */}
      {playful ? (
        <path
          d={`M 58 -54 Q 78 -50 94 -58 Q 90 ${-52 + o * 22} 70 ${-46 + o * 20} Z`}
          fill="#7A1F2B"
          stroke={OUT}
          strokeWidth={5}
          strokeLinejoin="round"
        />
      ) : pose.mouth < 0.12 ? (
        <path d="M 68 -52 L 88 -56" stroke={OUT} strokeWidth={5} strokeLinecap="round" />
      ) : (
        <ellipse cx={80} cy={-52} rx={7} ry={3 + pose.mouth * 10} fill="#7A1F2B" stroke={OUT} strokeWidth={5} />
      )}
      {/* Hair */}
      <g transform={`translate(0 ${hv * 0.6})`}>
        {look.hairStyle === "curly" ? (
          <Blob
            pts={curlyBumps(-8, -122, 90, 32, 230, 15)}
            r={25}
            c={look.hair}
            shade={look.hairShade}
            path="M 72 -168 Q 40 -220 -20 -214 Q -98 -200 -94 -110 Q -92 -66 -70 -52 L -30 -96 Q -10 -158 72 -168 Z"
          />
        ) : (
          <>
            <path
              d="M 70 -172 Q 40 -205 -10 -205 Q -78 -200 -78 -118 Q -76 -70 -54 -46 L -36 -96 Q -10 -160 70 -172 Z"
              fill={look.hairShade}
              opacity={0.45}
            />
            <g transform={`rotate(${hv * 1.5} -10 -200)`}>
              <path
                d={mohawkSpikes(-4, -112, 92, 78, 178, 6, 62) + " Z"}
                fill={look.hair}
                stroke={OUT}
                strokeWidth={OW}
                strokeLinejoin="round"
              />
            </g>
          </>
        )}
      </g>
      {/* Brow */}
      <path
        d={playful ? `M 38 ${-136 - pose.brow * 6} Q 54 ${-148 - pose.brow * 6} 70 ${-140 - pose.brow * 6}` : `M 38 ${-130 - pose.brow * 6} L 70 ${-132 - pose.brow * 6}`}
        stroke={OUT}
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Torso
// ---------------------------------------------------------------------------

const SIDE_JERSEY = "M -32 -172 Q 10 -184 36 -168 Q 54 -100 46 8 Q 0 16 -40 8 Q -48 -90 -32 -172 Z";
const FRONT_JERSEY = "M -66 -170 Q -42 -182 -22 -176 L 0 -148 L 22 -176 Q 42 -182 66 -170 L 76 -138 L 62 10 Q 0 20 -62 10 L -76 -138 Z";
const BACK_JERSEY = "M -66 -170 Q 0 -160 66 -170 L 76 -138 L 62 10 Q 0 20 -62 10 L -76 -138 Z";

// Club-style vertical stripes, clipped to the shirt, with the outline drawn again on top
const VStripes: React.FC<{ look: Look; d: string; id: string }> = ({ look, d, id }) => {
  const cols = look.vstripes ?? [];
  const w = 26;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {new Array(8).fill(0).map((_, i) => (
          <rect key={i} x={-104 + i * w} y={-190} width={w + 0.5} height={220} fill={cols[i % cols.length]} />
        ))}
      </g>
      <path d={d} fill="none" stroke={OUT} strokeWidth={OW} strokeLinejoin="round" />
    </g>
  );
};

// Small chest badge. "generic" draws a plain shield; anything else is an image URL.
const Crest: React.FC<{ src: string; x: number; y: number }> = ({ src, x, y }) =>
  src === "generic" ? (
    <g transform={`translate(${x} ${y})`}>
      <path d="M -15 -16 L 15 -16 L 15 2 Q 15 14 0 20 Q -15 14 -15 2 Z" fill="#FFD23F" stroke={OUT} strokeWidth={3.5} />
      <path d="M -11 -4 L 11 -4 L 11 3 Q 11 11 0 16 Q -11 11 -11 3 Z" fill="#004D98" />
      <path d="M -4 -4 L 4 -4 L 4 15 Q 0 16.5 -4 15 Z" fill="#A50044" />
      <path d="M -11 -13 L 11 -13 L 11 -7 L -11 -7 Z" fill="white" />
    </g>
  ) : (
    <image href={src} x={x - 20} y={y - 22} width={40} height={44} preserveAspectRatio="xMidYMid meet" />
  );

const Torso: React.FC<{ look: Look; view: "front" | "back" | "side" }> = ({ look, view }) => {
  if (view === "side") {
    return (
      <g>
        <path d="M -40 -6 Q 0 -14 42 -6 L 46 34 Q 0 42 -44 34 Z" fill={look.shorts} stroke={OUT} strokeWidth={OW} strokeLinejoin="round" />
        <path
          d={SIDE_JERSEY}
          fill={look.jersey}
          stroke={OUT}
          strokeWidth={OW}
          strokeLinejoin="round"
        />
        {look.vstripes ? <VStripes look={look} d={SIDE_JERSEY} id="jclip-side" /> : null}
        <path d="M -38 -40 Q 0 -30 44 -40" stroke={look.jerseyShade} strokeWidth={8} fill="none" opacity={0.6} />
        {(look.stripes ?? []).map((c, i) => (
          <line key={c + i} x1={-34} y1={-150 + i * 8} x2={42} y2={-150 + i * 8} stroke={c} strokeWidth={8} />
        ))}
      </g>
    );
  }
  const back = view === "back";
  return (
    <g>
      <path
        d="M -64 -4 L 64 -4 L 70 40 L 8 40 L 0 26 L -8 40 L -70 40 Z"
        fill={look.shorts}
        stroke={OUT}
        strokeWidth={OW}
        strokeLinejoin="round"
      />
      <path d={back ? BACK_JERSEY : FRONT_JERSEY} fill={look.jersey} stroke={OUT} strokeWidth={OW} strokeLinejoin="round" />
      {look.vstripes ? <VStripes look={look} d={back ? BACK_JERSEY : FRONT_JERSEY} id={back ? "jclip-back" : "jclip-front"} /> : null}
      {back ? (
        <path d="M -40 -168 Q 0 -158 40 -168" stroke={look.jerseyShade} strokeWidth={8} fill="none" />
      ) : (
        <path d="M -24 -174 L 0 -148 L 24 -174" stroke="white" strokeWidth={6} fill="none" strokeLinejoin="round" />
      )}
      {/* Side stripes */}
      <path d="M -70 -120 L -60 4 M 70 -120 L 60 4" stroke={look.jerseyShade} strokeWidth={10} />
      {(look.stripes ?? []).map((c, i) => (
        <line key={c + i} x1={-72} y1={-134 + i * 8} x2={72} y2={-134 + i * 8} stroke={c} strokeWidth={8} />
      ))}
      {back ? (
        <>
          <text x={0} y={-124} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={26} fill={look.textColor ?? "white"} stroke={OUT} strokeWidth={5} paintOrder="stroke">
            {look.name.toUpperCase()}
          </text>
          <text x={0} y={-40} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={74} fill={look.textColor ?? "white"} stroke={OUT} strokeWidth={6} paintOrder="stroke">
            {look.number}
          </text>
        </>
      ) : (
        <>
          <text x={0} y={-82} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill={look.textColor ?? "white"} stroke={OUT} strokeWidth={6} paintOrder="stroke">
            {look.sponsor}
          </text>
          {look.crest ? <Crest src={look.crest} x={36} y={-136} /> : null}
        </>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Full character
// ---------------------------------------------------------------------------

const frontArm = (S: P, arm: Arm, s: number) => {
  const v1 = { x: s * Math.sin(d2r(arm.ab)) * LU, y: Math.cos(d2r(arm.ab)) * LU * fs(arm.sh) };
  const E = add(S, v1);
  const a2 = arm.ab + arm.elAb;
  const v2 = { x: s * Math.sin(d2r(a2)) * LF, y: Math.cos(d2r(a2)) * LF * fs(arm.sh + arm.el) };
  return { E, H: add(E, v2) };
};

const frontLeg = (Hp: P, leg: Leg, s: number) => {
  const K = add(Hp, { x: s * Math.sin(d2r(leg.ab)) * LT, y: Math.cos(d2r(leg.ab)) * LT * fs(leg.hip) });
  const A = add(K, { x: s * Math.sin(d2r(leg.ab)) * LS, y: Math.cos(d2r(leg.ab)) * LS * fs(leg.hip - leg.knee) });
  return { K, A };
};

const sideArm = (S: P, arm: Arm, lean: number) => {
  const a1 = d2r(lean + arm.sh);
  const E = add(S, { x: LU * Math.sin(a1), y: LU * Math.cos(a1) });
  const a2 = a1 + d2r(arm.el);
  return { E, H: add(E, { x: LF * Math.sin(a2), y: LF * Math.cos(a2) }) };
};

const sideLeg = (Hp: P, leg: Leg) => {
  const t1 = d2r(leg.hip);
  const K = add(Hp, { x: LT * Math.sin(t1), y: LT * Math.cos(t1) });
  const t2 = d2r(leg.hip - leg.knee);
  const A = add(K, { x: LS * Math.sin(t2), y: LS * Math.cos(t2) });
  const tf = t2 + d2r(leg.foot);
  const toe = add(A, { x: FOOT * Math.cos(tf), y: -FOOT * Math.sin(tf) + 8 });
  return { K, A, toe };
};

export const Person: React.FC<{
  look: Look;
  pose: Pose;
  view: View;
  x: number;
  groundY: number;
  scale?: number;
}> = ({ look, pose, view, x, groundY, scale = 1 }) => {
  const side = view === "left" || view === "right";
  const ta = side ? pose.lean : pose.tilt;
  const sq = pose.squash;
  const sx = 1 + (1 - sq) * 0.6;

  let body: React.ReactNode;

  if (side) {
    const S = rotP({ x: 4, y: -150 }, ta);
    const Hp = { x: 0, y: 12 };
    const near = sideArm(S, pose.armA, pose.lean);
    const far = sideArm(S, pose.armB, pose.lean);
    const nearL = sideLeg(Hp, pose.legA);
    const farL = sideLeg(Hp, pose.legB);
    const neckTop = rotP({ x: 6, y: -178 }, ta);
    body = (
      <>
        <g style={{ filter: "brightness(0.8)" }}>
          <ArmView S={S} E={far.E} H={far.H} look={look} />
          <LegView H={Hp} K={farL.K} A={farL.A} toe={farL.toe} side={1} look={look} />
        </g>
        <Seg a={rotP({ x: 4, y: -160 }, ta)} b={add(neckTop, { x: 0, y: -14 })} w={34} c={look.skin} />
        <LegView H={Hp} K={nearL.K} A={nearL.A} toe={nearL.toe} side={1} look={look} />
        <g transform={`rotate(${ta})`}>
          <Torso look={look} view="side" />
        </g>
        <g transform={`translate(${neckTop.x} ${neckTop.y}) rotate(${ta * 0.6 + pose.head})`}>
          <HeadSide look={look} pose={pose} />
        </g>
        <ArmView S={S} E={near.E} H={near.H} look={look} />
      </>
    );
  } else {
    const back = view === "back";
    const SA = rotP({ x: -60, y: -150 }, ta);
    const SB = rotP({ x: 60, y: -150 }, ta);
    const aA = frontArm(SA, pose.armA, -1);
    const aB = frontArm(SB, pose.armB, 1);
    const HA = { x: -30, y: 12 };
    const HB = { x: 30, y: 12 };
    const lA = frontLeg(HA, pose.legA, -1);
    const lB = frontLeg(HB, pose.legB, 1);
    const neckTop = rotP({ x: 0, y: -178 }, ta);
    body = (
      <>
        <Seg a={rotP({ x: 0, y: -160 }, ta)} b={add(neckTop, { x: 0, y: -14 })} w={36} c={look.skin} />
        <LegView H={HA} K={lA.K} A={lA.A} toe={null} side={-1} look={look} />
        <LegView H={HB} K={lB.K} A={lB.A} toe={null} side={1} look={look} />
        <g transform={`rotate(${ta})`}>
          <Torso look={look} view={back ? "back" : "front"} />
        </g>
        <ArmView S={SA} E={aA.E} H={aA.H} look={look} />
        <ArmView S={SB} E={aB.E} H={aB.H} look={look} />
        <g transform={`translate(${neckTop.x} ${neckTop.y}) rotate(${ta + pose.head})`}>
          <HeadFront look={look} pose={pose} back={back} />
        </g>
      </>
    );
  }

  const mirror = view === "left" ? -1 : 1;

  return (
    <g transform={`translate(${x + pose.x} ${groundY}) scale(${scale})`}>
      {/* Ground shadow */}
      <ellipse cx={0} cy={4} rx={90 * Math.min(1, 1 + pose.y / 600)} ry={14} fill="rgba(0,0,0,0.22)" />
      <g transform={`translate(0 ${pose.y}) scale(${mirror * sx} ${sq}) translate(0 ${-GROUND})`}>{body}</g>
    </g>
  );
};
