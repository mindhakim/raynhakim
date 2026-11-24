// Builds a realistic-proportion human as ONE continuous skinned mesh (no stacked spheres).
// The skin bends with a bone skeleton, like a game character.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Look } from "../vutuvuti/types";

export type BoneName =
  | "hips"
  | "spine"
  | "chest"
  | "neck"
  | "head"
  | "uaA"
  | "faA"
  | "hA"
  | "uaB"
  | "faB"
  | "hB"
  | "thA"
  | "shA"
  | "ftA"
  | "thB"
  | "shB"
  | "ftB";

type BoneDef = { name: BoneName; parent: BoneName | null; pos: [number, number, number] };

// Rest pose: standing, arms hanging. Meters. Side A = -x, side B = +x.
export const BONE_DEFS: BoneDef[] = (() => {
  const d: BoneDef[] = [
    { name: "hips", parent: null, pos: [0, 0.95, 0] },
    { name: "spine", parent: "hips", pos: [0, 1.08, 0] },
    { name: "chest", parent: "spine", pos: [0, 1.28, 0] },
    { name: "neck", parent: "chest", pos: [0, 1.49, 0] },
    { name: "head", parent: "neck", pos: [0, 1.57, 0] },
  ];
  const sides: ["A" | "B", number][] = [
    ["A", -1],
    ["B", 1],
  ];
  for (const [S, s] of sides) {
    d.push({ name: `ua${S}` as BoneName, parent: "chest", pos: [s * 0.2, 1.44, 0] });
    d.push({ name: `fa${S}` as BoneName, parent: `ua${S}` as BoneName, pos: [s * 0.23, 1.16, 0] });
    d.push({ name: `h${S}` as BoneName, parent: `fa${S}` as BoneName, pos: [s * 0.245, 0.935, 0] });
    d.push({ name: `th${S}` as BoneName, parent: "hips", pos: [s * 0.095, 0.92, 0] });
    d.push({ name: `sh${S}` as BoneName, parent: `th${S}` as BoneName, pos: [s * 0.095, 0.51, 0] });
    d.push({ name: `ft${S}` as BoneName, parent: `sh${S}` as BoneName, pos: [s * 0.095, 0.09, 0] });
  }
  return d;
})();

const boneIndex = (n: BoneName) => BONE_DEFS.findIndex((b) => b.name === n);

type Ring = { x: number; y: number; z: number; rx: number; rz: number; col: string; w: [BoneName, number][] };

const SIDES = 16;

class MeshBuilder {
  pos: number[] = [];
  col: number[] = [];
  si: number[] = [];
  sw: number[] = [];
  idx: number[] = [];

  private vert(x: number, y: number, z: number, c: THREE.Color, w: [BoneName, number][]) {
    this.pos.push(x, y, z);
    this.col.push(c.r, c.g, c.b);
    const ww = [...w, ["hips", 0], ["hips", 0], ["hips", 0]].slice(0, 4) as [BoneName, number][];
    const total = ww.reduce((a, b) => a + b[1], 0) || 1;
    for (const [b, v] of ww) {
      this.si.push(boneIndex(b));
      this.sw.push(v / total);
    }
    return this.pos.length / 3 - 1;
  }

  tube(rings: Ring[], capStart: boolean, capEnd: boolean) {
    const base = this.pos.length / 3;
    for (const r of rings) {
      const c = new THREE.Color(r.col);
      for (let i = 0; i < SIDES; i++) {
        const a = (i / SIDES) * Math.PI * 2;
        this.vert(r.x + r.rx * Math.sin(a), r.y, r.z + r.rz * Math.cos(a), c, r.w);
      }
    }
    for (let k = 0; k < rings.length - 1; k++) {
      for (let i = 0; i < SIDES; i++) {
        const a = base + k * SIDES + i;
        const b = base + k * SIDES + ((i + 1) % SIDES);
        const c2 = a + SIDES;
        const d = b + SIDES;
        // Orientation so normals face outward for rings ordered top → bottom or bottom → top
        if (rings[k + 1].y < rings[k].y) {
          this.idx.push(a, b, c2, b, d, c2);
        } else {
          this.idx.push(a, c2, b, b, c2, d);
        }
      }
    }
    const cap = (k: number, flip: boolean) => {
      const r = rings[k];
      const center = this.vert(r.x, r.y + (flip ? -0.004 : 0.004), r.z, new THREE.Color(r.col), r.w);
      for (let i = 0; i < SIDES; i++) {
        const a = base + k * SIDES + i;
        const b = base + k * SIDES + ((i + 1) % SIDES);
        if (flip) this.idx.push(center, b, a);
        else this.idx.push(center, a, b);
      }
    };
    const down = rings[rings.length - 1].y < rings[0].y;
    if (capStart) cap(0, !down);
    if (capEnd) cap(rings.length - 1, down);
  }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(this.si, 4));
    g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(this.sw, 4));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

const R = (y: number, rx: number, rz: number, col: string, w: [BoneName, number][], x = 0, z = 0): Ring => ({
  x,
  y,
  z,
  rx,
  rz,
  col,
  w,
});

// ---------------------------------------------------------------------------
// Face texture (equirectangular, painted on the head sphere)
// ---------------------------------------------------------------------------

const FONT = '"Baloo 2", "Nunito", "Inter", system-ui, sans-serif';

export const paintFace = (look: Look, blink: boolean, mouth: number) => {
  const W = 1024;
  const H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  g.fillStyle = look.skin;
  g.fillRect(0, 0, W, H);
  const cx = 256; // face center (u = 0.25 faces +z)
  const playful = look.personality === "playful";
  const dark = "#24160F";

  // Hair line / stubble
  if (look.hairStyle === "mohawk") {
    g.fillStyle = "rgba(40,110,70,0.55)";
    g.fillRect(0, 0, W, 150);
    g.beginPath();
    g.ellipse(768, 150, 330, 120, 0, 0, Math.PI * 2);
    g.fill();
  } else {
    g.fillStyle = look.hairShade;
    g.fillRect(0, 0, W, 120);
    g.beginPath();
    g.ellipse(768, 140, 360, 140, 0, 0, Math.PI * 2);
    g.fill();
  }

  // Soft cheek / jaw shading
  g.fillStyle = "rgba(0,0,0,0.07)";
  g.beginPath();
  g.ellipse(cx, 390, 120, 60, 0, 0, Math.PI * 2);
  g.fill();
  if (playful) {
    g.fillStyle = "rgba(255,110,140,0.22)";
    g.beginPath();
    g.ellipse(cx - 70, 300, 26, 14, 0, 0, Math.PI * 2);
    g.ellipse(cx + 70, 300, 26, 14, 0, 0, Math.PI * 2);
    g.fill();
  }

  // Eyes
  const eyeY = 243;
  for (const s of [-1, 1]) {
    const ex = cx + s * 52;
    if (blink) {
      g.strokeStyle = dark;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(ex - 20, eyeY + 2);
      g.quadraticCurveTo(ex, eyeY + 8, ex + 20, eyeY + 2);
      g.stroke();
      continue;
    }
    g.fillStyle = "#FBF7F2";
    g.beginPath();
    g.ellipse(ex, eyeY, 21, playful ? 11 : 9, 0, 0, Math.PI * 2);
    g.fill();
    const lk = playful ? 0 : s * 2 + 4;
    g.fillStyle = "#4A2A17";
    g.beginPath();
    g.arc(ex + lk, eyeY + 1, 8.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#120A06";
    g.beginPath();
    g.arc(ex + lk, eyeY + 1, 4.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "white";
    g.beginPath();
    g.arc(ex + lk + 3, eyeY - 2, 2, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = dark;
    g.lineWidth = 3.5;
    g.beginPath();
    g.ellipse(ex, eyeY, 21, playful ? 11 : 9, 0, Math.PI, Math.PI * 2);
    g.stroke();
  }
  if (!playful) {
    // Half lids for the chill look
    for (const s of [-1, 1]) {
      const ex = cx + s * 52;
      g.fillStyle = look.skin;
      g.beginPath();
      g.ellipse(ex, eyeY - 4, 24, 9, 0, Math.PI, Math.PI * 2);
      g.rect(ex - 24, eyeY - 14, 48, 10);
      g.fill();
      g.strokeStyle = dark;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(ex - 22, eyeY - 3);
      g.lineTo(ex + 22, eyeY - 3);
      g.stroke();
    }
  }

  // Brows
  g.strokeStyle = look.hairStyle === "mohawk" ? "#1E3B22" : "#3A1E14";
  g.lineCap = "round";
  g.lineWidth = 8;
  for (const s of [-1, 1]) {
    const ex = cx + s * 52;
    g.beginPath();
    if (playful) {
      const lift = s === 1 ? 8 : 0;
      g.moveTo(ex - 22, 220 - lift + 4);
      g.quadraticCurveTo(ex, 210 - lift, ex + 22, 218 - lift + 2);
    } else {
      g.moveTo(ex - 22, 222);
      g.lineTo(ex + 22, 223);
    }
    g.stroke();
  }

  // Mouth
  const my = 338;
  g.lineWidth = 4;
  g.strokeStyle = "#5A2418";
  if (playful) {
    const open = 6 + mouth * 9;
    g.fillStyle = "#5E1A1F";
    g.beginPath();
    g.moveTo(cx - 34, my - 4);
    g.quadraticCurveTo(cx, my + 2, cx + 34, my - 4);
    g.quadraticCurveTo(cx + 26, my + open + 6, cx, my + open + 8);
    g.quadraticCurveTo(cx - 26, my + open + 6, cx - 34, my - 4);
    g.fill();
    g.fillStyle = "#F4F1EA";
    g.beginPath();
    g.moveTo(cx - 28, my - 2);
    g.quadraticCurveTo(cx, my + 3, cx + 28, my - 2);
    g.lineTo(cx + 26, my + 4);
    g.quadraticCurveTo(cx, my + 8, cx - 26, my + 4);
    g.fill();
    g.stroke();
  } else if (mouth < 0.5) {
    g.beginPath();
    g.moveTo(cx - 20, my + 2);
    g.quadraticCurveTo(cx + 4, my + 5, cx + 22, my - 4);
    g.stroke();
  } else {
    g.fillStyle = "#5E1A1F";
    g.beginPath();
    g.ellipse(cx + 2, my + 2, 12, 3 + mouth * 4, 0, 0, Math.PI * 2);
    g.fill();
  }
  // Philtrum / nose shadow
  g.fillStyle = "rgba(0,0,0,0.12)";
  g.beginPath();
  g.ellipse(cx, 300, 14, 6, 0, 0, Math.PI * 2);
  g.fill();

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

// ---------------------------------------------------------------------------
// Text printed on the jersey
// ---------------------------------------------------------------------------

export const textTexture = (text: string, size: number) => {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 256;
  const g = cv.getContext("2d")!;
  g.font = `900 ${size}px ${FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  g.lineWidth = size * 0.12;
  g.strokeStyle = "rgba(20,10,8,0.85)";
  g.strokeText(text, 256, 128);
  g.fillStyle = "white";
  g.fillText(text, 256, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

// ---------------------------------------------------------------------------
// Hair
// ---------------------------------------------------------------------------

const afroGeometry = (look: Look) => {
  const g = new THREE.IcosahedronGeometry(1, 5);
  const p = g.attributes.position as THREE.BufferAttribute;
  const colors: number[] = [];
  const c1 = new THREE.Color(look.hair);
  const c2 = new THREE.Color(look.hairShade);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const n =
      0.09 * Math.sin(13 * v.x + 1.3) * Math.sin(13 * v.y + 0.7) * Math.sin(13 * v.z + 2.1) +
      0.0 * Math.sin(11 * v.x + 1.3) * Math.sin(11 * v.y + 0.7) * Math.sin(11 * v.z + 2.1) +
      0.035 * Math.sin(27 * v.x + 0.4) * Math.sin(25 * v.y + 1.9) * Math.sin(29 * v.z + 0.2);
    let r = 1 + n;
    const sm = (a: number, b: number, x: number) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };
    const faceMask = sm(0.1, 0.45, v.z) * (1 - sm(0.25, 0.55, v.y));
    const bottomMask = 1 - sm(-0.65, -0.3, v.y);
    r *= 1 - 0.5 * Math.max(faceMask, bottomMask); // keep the face clear
    p.setXYZ(i, v.x * r, v.y * r, v.z * r);
    const k = Math.min(1, Math.max(0, 0.5 + n * 8));
    const c = c2.clone().lerp(c1, k);
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.scale(0.165, 0.16, 0.172);
  g.translate(0, 0.062, -0.018);
  g.computeVertexNormals();
  return g;
};

const mohawkGeometry = () => {
  const shape = new THREE.Shape();
  const N = 6;
  const from = 0.45;
  const to = 2.75;
  const surf = (phi: number, k: number) => ({ z: 0.118 * Math.cos(phi) * k, y: 0.128 * Math.sin(phi) * k + 0.004 });
  const start = surf(from, 0.9);
  shape.moveTo(-start.z, start.y);
  for (let i = 0; i <= N; i++) {
    const phi = from + ((to - from) * i) / N;
    const b = surf(phi, 0.98);
    shape.lineTo(-b.z, b.y);
    if (i < N) {
      const pm = phi + (to - from) / N / 2 + 0.06;
      const h = 1.65 + 0.35 * Math.sin(i * 1.9 + 0.5) - i * 0.06;
      const tip = surf(pm, h);
      shape.lineTo(-tip.z, tip.y);
    }
  }
  for (let i = N; i >= 0; i--) {
    const phi = from + ((to - from) * i) / N;
    const b = surf(phi, 0.85);
    shape.lineTo(-b.z, b.y);
  }
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 2,
  });
  g.translate(0, 0, -0.025);
  g.rotateY(Math.PI / 2);
  g.computeVertexNormals();
  return g;
};

// ---------------------------------------------------------------------------
// Assemble the character
// ---------------------------------------------------------------------------

export type HumanRig = {
  root: THREE.Group;
  bones: Record<BoneName, THREE.Bone>;
  faceMat: THREE.MeshStandardMaterial;
  faces: Map<string, THREE.Texture>;
};

export const buildHuman = (look: Look): HumanRig => {
  const SK = look.skin;
  const JE = look.jersey;
  const SH = look.shorts;
  const SO = look.socks;
  const WH = "#F3F3F0";
  const mb = new MeshBuilder();

  // Torso (crotch → neck)
  mb.tube(
    [
      R(0.875, 0.165, 0.112, SH, [["hips", 1]]),
      R(0.9, 0.186, 0.124, SH, [["hips", 1]]),
      R(0.97, 0.182, 0.122, SH, [
        ["hips", 0.8],
        ["spine", 0.2],
      ]),
      R(1.0, 0.168, 0.116, SH, [
        ["hips", 0.6],
        ["spine", 0.4],
      ]),
      R(1.002, 0.176, 0.124, JE, [
        ["hips", 0.6],
        ["spine", 0.4],
      ]),
      R(1.08, 0.158, 0.11, JE, [["spine", 1]]),
      R(1.18, 0.163, 0.113, JE, [
        ["spine", 0.6],
        ["chest", 0.4],
      ]),
      R(1.28, 0.178, 0.122, JE, [["chest", 1]], 0, 0.008),
      R(1.36, 0.186, 0.12, JE, [["chest", 1]], 0, 0.005),
      R(1.41, 0.182, 0.108, JE, [["chest", 1]]),
      R(1.445, 0.16, 0.096, JE, [["chest", 1]]),
      R(1.465, 0.115, 0.082, JE, [["chest", 1]]),
      R(1.475, 0.076, 0.068, JE, [
        ["chest", 0.7],
        ["neck", 0.3],
      ]),
      R(1.477, 0.072, 0.065, WH, [
        ["chest", 0.7],
        ["neck", 0.3],
      ]),
      R(1.486, 0.066, 0.062, WH, [
        ["chest", 0.5],
        ["neck", 0.5],
      ]),
      R(1.488, 0.062, 0.06, SK, [
        ["chest", 0.4],
        ["neck", 0.6],
      ]),
      R(1.54, 0.056, 0.058, SK, [["neck", 1]]),
      R(1.6, 0.055, 0.058, SK, [
        ["neck", 0.5],
        ["head", 0.5],
      ]),
    ],
    true,
    false,
  );

  for (const [S, s] of [
    ["A", -1],
    ["B", 1],
  ] as ["A" | "B", number][]) {
    const th = `th${S}` as BoneName;
    const sh = `sh${S}` as BoneName;
    const ft = `ft${S}` as BoneName;
    const ua = `ua${S}` as BoneName;
    const fa = `fa${S}` as BoneName;
    const h = `h${S}` as BoneName;
    const lx = s * 0.095;

    // Leg
    mb.tube(
      [
        R(0.92, 0.05, 0.055, SH, [[th, 1]], lx * 0.85),
        R(0.9, 0.08, 0.086, SH, [[th, 1]], lx),
        R(0.84, 0.088, 0.092, SH, [[th, 1]], lx),
        R(0.74, 0.081, 0.086, SH, [[th, 1]], lx),
        R(0.738, 0.072, 0.077, SK, [[th, 1]], lx),
        R(0.64, 0.066, 0.071, SK, [[th, 1]], lx, 0.004),
        R(0.54, 0.053, 0.058, SK, [
          [th, 0.5],
          [sh, 0.5],
        ], lx),
        R(0.47, 0.055, 0.062, SK, [[sh, 1]], lx, -0.006),
        R(0.42, 0.057, 0.064, SK, [[sh, 1]], lx, -0.01),
        R(0.418, 0.06, 0.067, SO, [[sh, 1]], lx, -0.01),
        R(0.37, 0.058, 0.065, SO, [[sh, 1]], lx, -0.01),
        R(0.368, 0.058, 0.065, WH, [[sh, 1]], lx, -0.01),
        R(0.345, 0.055, 0.062, WH, [[sh, 1]], lx, -0.008),
        R(0.343, 0.055, 0.062, SO, [[sh, 1]], lx, -0.008),
        R(0.25, 0.044, 0.05, SO, [[sh, 1]], lx, -0.004),
        R(0.16, 0.036, 0.041, SO, [[sh, 1]], lx),
        R(0.12, 0.037, 0.042, SO, [
          [sh, 0.5],
          [ft, 0.5],
        ], lx),
        R(0.08, 0.04, 0.045, SO, [[ft, 1]], lx),
      ],
      true,
      true,
    );

    // Arm (sleeve → hand)
    const ax = (y: number) => s * (0.185 + ((1.46 - y) / (1.46 - 0.8)) * 0.06);
    mb.tube(
      [
        R(1.475, 0.03, 0.035, JE, [
          [ua, 0.4],
          ["chest", 0.6],
        ], s * 0.17),
        R(1.462, 0.05, 0.056, JE, [
          [ua, 0.45],
          ["chest", 0.55],
        ], s * 0.178),
        R(1.44, 0.058, 0.064, JE, [
          [ua, 0.5],
          ["chest", 0.5],
        ], ax(1.47)),
        R(1.4, 0.062, 0.066, JE, [[ua, 1]], ax(1.4)),
        R(1.32, 0.058, 0.062, JE, [[ua, 1]], ax(1.32)),
        R(1.318, 0.046, 0.05, SK, [[ua, 1]], ax(1.318)),
        R(1.24, 0.044, 0.048, SK, [[ua, 1]], ax(1.24)),
        R(1.16, 0.036, 0.04, SK, [
          [ua, 0.5],
          [fa, 0.5],
        ], ax(1.16)),
        R(1.08, 0.039, 0.042, SK, [[fa, 1]], ax(1.08)),
        R(0.96, 0.024, 0.028, SK, [
          [fa, 0.7],
          [h, 0.3],
        ], ax(0.96)),
        R(0.93, 0.022, 0.045, SK, [[h, 1]], ax(0.93)),
        R(0.87, 0.021, 0.047, SK, [[h, 1]], ax(0.87)),
        R(0.83, 0.019, 0.042, SK, [[h, 1]], ax(0.83)),
        R(0.805, 0.015, 0.03, SK, [[h, 1]], ax(0.805)),
      ],
      true,
      true,
    );
  }

  const geo = mb.geometry();
  const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0 });
  const mesh = new THREE.SkinnedMesh(geo, bodyMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  // Bones
  const bones = {} as Record<BoneName, THREE.Bone>;
  const list: THREE.Bone[] = [];
  for (const def of BONE_DEFS) {
    const b = new THREE.Bone();
    b.name = def.name;
    b.rotation.order = "ZXY";
    const p = def.parent ? BONE_DEFS.find((x) => x.name === def.parent)!.pos : [0, 0, 0];
    b.position.set(def.pos[0] - p[0], def.pos[1] - p[1], def.pos[2] - p[2]);
    if (def.parent) bones[def.parent].add(b);
    bones[def.name] = b;
    list.push(b);
  }
  mesh.add(bones.hips);
  mesh.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(list));

  // Head (rigid, follows the head bone)
  const headGeo = new THREE.SphereGeometry(1, 28, 22);
  {
    const p = headGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i);
      let y = p.getY(i);
      let z = p.getZ(i);
      if (y < 0) {
        const t = -y;
        if (look.jaw === "square") {
          x *= 1 - 0.1 * t * t;
          if (y < -0.72) y = -0.72 + (y + 0.72) * 0.35;
        } else {
          x *= 1 - 0.32 * t * t;
        }
        if (z > 0) z *= 1 + 0.06 * t;
      }
      if (z < 0) z *= 0.95;
      p.setXYZ(i, x * 0.103, y * 0.125, z * 0.115);
    }
    headGeo.computeVertexNormals();
  }
  const faces = new Map<string, THREE.Texture>();
  const faceKey = (b: boolean, m: number) => `${b ? 1 : 0}-${m}`;
  for (const b of [false, true]) {
    for (const m of [0, 1, 2, 3]) faces.set(faceKey(b, m), paintFace(look, b, m / 3));
  }
  const faceMat = new THREE.MeshStandardMaterial({ map: faces.get(faceKey(false, 0))!, roughness: 0.7 });
  const head = new THREE.Mesh(headGeo, faceMat);
  head.position.set(0, 0.11, 0.008);
  head.castShadow = true;
  bones.head.add(head);

  const skinMat = new THREE.MeshStandardMaterial({ color: look.skin, roughness: 0.7 });
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.04, 8), skinMat);
  nose.geometry.rotateX(Math.PI / 2);
  nose.position.set(0, -0.012, 0.116);
  nose.scale.set(1, 0.85, 1);
  head.add(nose);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), skinMat);
    ear.scale.set(0.014, 0.03, 0.02);
    ear.position.set(s * 0.101, 0.0, -0.006);
    head.add(ear);
  }

  // Hair
  if (look.hairStyle === "curly") {
    const hair = new THREE.Mesh(
      afroGeometry(look),
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }),
    );
    hair.castShadow = true;
    head.add(hair);
  } else {
    const hair = new THREE.Mesh(
      mohawkGeometry(),
      new THREE.MeshStandardMaterial({ color: look.hair, roughness: 0.8, flatShading: true }),
    );
    hair.castShadow = true;
    head.add(hair);
  }

  // Shoes
  for (const S of ["A", "B"] as const) {
    const shoe = new THREE.Mesh(
      new RoundedBoxGeometry(0.1, 0.08, 0.26, 3, 0.03),
      new THREE.MeshStandardMaterial({ color: look.boots, roughness: 0.35 }),
    );
    shoe.position.set(0, -0.045, 0.06);
    shoe.castShadow = true;
    bones[`ft${S}`].add(shoe);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.014, 0.25), new THREE.MeshStandardMaterial({ color: "#EDEDED" }));
    sole.position.set(0, -0.083, 0.06);
    bones[`ft${S}`].add(sole);
  }

  // Jersey prints, attached to the chest bone so they move with the body
  const print = (text: string, size: number, yLocal: number, h: number, t0: number, tl: number, rx: number, rz: number) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, h, 48, 1, true, t0, tl),
      new THREE.MeshStandardMaterial({
        map: textTexture(text, size),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        roughness: 0.6,
      }),
    );
    m.scale.set(rx, 1, rz);
    m.position.set(0, yLocal, 0.008);
    bones.chest.add(m);
  };
  print(look.sponsor, 150, 0.03, 0.11, -0.8, 1.6, 0.181, 0.126);
  print(look.number, 220, -0.04, 0.17, Math.PI - 0.85, 1.7, 0.181, 0.124);
  print(look.name.toUpperCase(), 120, 0.1, 0.06, Math.PI - 0.85, 1.7, 0.187, 0.123);

  const root = new THREE.Group();
  root.add(mesh);
  return { root, bones, faceMat, faces };
};
