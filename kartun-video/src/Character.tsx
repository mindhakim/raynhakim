import React from "react";

type Props = {
  // Rotation of the waving (right) arm in degrees
  readonly armAngle: number;
  // 0 = closed, 1 = wide open
  readonly mouthOpen: number;
  // 0 = eyes open, 1 = fully closed
  readonly blink: number;
  // Leg swing in degrees while walking
  readonly legSwing: number;
};

const SKIN = "#FFD3A5";
const SHIRT = "#FFC93C";
const PANTS = "#3D5AFE";
const HAIR = "#4E342E";
const OUTLINE = "#2B2B2B";

export const Character: React.FC<Props> = ({
  armAngle,
  mouthOpen,
  blink,
  legSwing,
}) => {
  const eyeScaleY = 1 - blink * 0.9;
  const mouthHeight = 6 + mouthOpen * 34;

  return (
    <svg width={420} height={620} viewBox="0 0 420 620">
      {/* Shadow */}
      <ellipse cx={210} cy={600} rx={110} ry={16} fill="rgba(0,0,0,0.18)" />

      {/* Legs */}
      <g transform={`rotate(${legSwing} 175 430)`}>
        <rect x={150} y={420} width={50} height={150} rx={22} fill={PANTS} stroke={OUTLINE} strokeWidth={6} />
        <ellipse cx={170} cy={578} rx={42} ry={20} fill={OUTLINE} />
      </g>
      <g transform={`rotate(${-legSwing} 245 430)`}>
        <rect x={220} y={420} width={50} height={150} rx={22} fill={PANTS} stroke={OUTLINE} strokeWidth={6} />
        <ellipse cx={250} cy={578} rx={42} ry={20} fill={OUTLINE} />
      </g>

      {/* Left arm (resting) */}
      <g transform="rotate(18 120 300)">
        <rect x={95} y={290} width={42} height={140} rx={21} fill={SHIRT} stroke={OUTLINE} strokeWidth={6} />
        <circle cx={116} cy={440} r={26} fill={SKIN} stroke={OUTLINE} strokeWidth={6} />
      </g>

      {/* Body */}
      <rect x={120} y={270} width={180} height={190} rx={70} fill={SHIRT} stroke={OUTLINE} strokeWidth={6} />
      <circle cx={210} cy={360} r={22} fill="#FF7043" stroke={OUTLINE} strokeWidth={5} />

      {/* Right arm (waving) */}
      <g transform={`rotate(${armAngle} 300 300)`}>
        <rect x={283} y={290} width={42} height={140} rx={21} fill={SHIRT} stroke={OUTLINE} strokeWidth={6} />
        <circle cx={304} cy={440} r={26} fill={SKIN} stroke={OUTLINE} strokeWidth={6} />
      </g>

      {/* Head */}
      <circle cx={210} cy={170} r={125} fill={SKIN} stroke={OUTLINE} strokeWidth={6} />
      {/* Ears */}
      <circle cx={88} cy={180} r={24} fill={SKIN} stroke={OUTLINE} strokeWidth={6} />
      <circle cx={332} cy={180} r={24} fill={SKIN} stroke={OUTLINE} strokeWidth={6} />
      {/* Hair */}
      <path
        d="M 95 140 Q 100 40 210 42 Q 320 40 325 140 Q 290 95 250 110 Q 220 70 185 105 Q 140 85 95 140 Z"
        fill={HAIR}
        stroke={OUTLINE}
        strokeWidth={6}
        strokeLinejoin="round"
      />

      {/* Eyes */}
      <g transform={`translate(0 165) scale(1 ${eyeScaleY}) translate(0 -165)`}>
        <ellipse cx={165} cy={165} rx={20} ry={26} fill="white" stroke={OUTLINE} strokeWidth={5} />
        <ellipse cx={255} cy={165} rx={20} ry={26} fill="white" stroke={OUTLINE} strokeWidth={5} />
        <circle cx={170} cy={170} r={11} fill={OUTLINE} />
        <circle cx={260} cy={170} r={11} fill={OUTLINE} />
        <circle cx={174} cy={165} r={4} fill="white" />
        <circle cx={264} cy={165} r={4} fill="white" />
      </g>

      {/* Cheeks */}
      <ellipse cx={130} cy={215} rx={20} ry={12} fill="#FF8A80" opacity={0.7} />
      <ellipse cx={290} cy={215} rx={20} ry={12} fill="#FF8A80" opacity={0.7} />

      {/* Mouth */}
      <ellipse
        cx={210}
        cy={235}
        rx={34 - mouthOpen * 8}
        ry={mouthHeight / 2}
        fill="#8B1E1E"
        stroke={OUTLINE}
        strokeWidth={5}
      />
      {mouthOpen > 0.3 ? (
        <ellipse cx={210} cy={235 + mouthHeight / 4} rx={14} ry={mouthHeight / 5} fill="#FF6F91" />
      ) : null}
    </svg>
  );
};
