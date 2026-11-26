import React from "react";

// 2.5D stage helpers: the world is built from flat CSS planes in 3D (y is down, ground at y = 0).

export const OUT = "#2A1B17";
export const FONT = '"Baloo 2", "Nunito", "Inter", system-ui, sans-serif';
export const PINK = "#FF3D8B";
export const GREEN = "#00E676";
export const GARNET = "#A50044";
export const BLUE = "#004D98";

export const d2r = (d: number) => (d * Math.PI) / 180;
export const r2d = (r: number) => (r * 180) / Math.PI;
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
export const smooth = (x: number) => {
  const k = clamp01(x);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
// Overshoot ease for things that pop or drop in
export const backOut = (x: number) => {
  const k = clamp01(x);
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};

export type Cam = { x: number; y: number; z: number; yaw: number; pitch: number; roll: number; focus: number; dof: number };

export const lookAt = (x: number, y: number, z: number, tx: number, ty: number, tz: number, roll = 0, dof = 0.0025): Cam => {
  const dx = tx - x;
  const dy = ty - y;
  const dz = tz - z;
  return {
    x,
    y,
    z,
    yaw: r2d(Math.atan2(dx, -dz)),
    pitch: r2d(Math.atan2(-dy, Math.hypot(dx, dz))),
    roll,
    focus: Math.hypot(dx, dy, dz),
    dof,
  };
};

export const blurFor = (cam: Cam, x: number, y: number, z: number) => {
  const d = Math.hypot(x - cam.x, y - cam.y, z - cam.z);
  return Math.min(10, Math.abs(d - cam.focus) * cam.dof);
};

const base: React.CSSProperties = { position: "absolute", left: 0, top: 0 };

// Upright plane with its bottom-centre at (x, y, z), turned by ry degrees (0 = faces +z, the camera side)
export const Plane: React.FC<{
  x: number;
  y?: number;
  z: number;
  w: number;
  h: number;
  ry?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y = 0, z, w, h, ry = 0, style, children }) => (
  <div
    style={{
      ...base,
      width: w,
      height: h,
      transformOrigin: `${w / 2}px ${h}px`,
      transform: `translate3d(${x - w / 2}px, ${y - h}px, ${z}px) rotateY(${ry}deg)`,
      ...style,
    }}
  >
    {children}
  </div>
);

// Flat horizontal plane centred on (x, y, z); the top edge of the content is the near (+z) side
export const Floor: React.FC<{ x: number; y?: number; z: number; w: number; d: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  x,
  y = 0,
  z,
  w,
  d,
  style,
  children,
}) => (
  <div
    style={{
      ...base,
      width: w,
      height: d,
      transformOrigin: "0 0",
      transform: `translate3d(${x - w / 2}px, ${y}px, ${z + d / 2}px) rotateX(-90deg)`,
      ...style,
    }}
  >
    {children}
  </div>
);

// Flat cut-out that always faces the camera, standing with its bottom-centre at (x, y, z)
export const Billboard: React.FC<{
  cam: Cam;
  x: number;
  y?: number;
  z: number;
  w: number;
  h: number;
  blur?: boolean;
  children: React.ReactNode;
}> = ({ cam, x, y = 0, z, w, h, blur = true, children }) => {
  const b = blur ? blurFor(cam, x, y - h / 2, z) : 0;
  return (
    <div
      style={{
        ...base,
        width: w,
        height: h,
        transformOrigin: `${w / 2}px ${h}px`,
        transform: `translate3d(${x - w / 2}px, ${y - h}px, ${z}px) rotateY(${-cam.yaw}deg)`,
        filter: b > 0.4 ? `blur(${b.toFixed(2)}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};
