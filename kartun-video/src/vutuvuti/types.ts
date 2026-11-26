// Shared types for the Vutu & Vuti 2D character rig.

export type View = "front" | "back" | "left" | "right";

// Angles are in degrees.
// sh   = shoulder swing forward (+) / backward (-)  (0 = hanging down)
// el   = elbow bend (+ bends the forearm forward / up)
// ab   = arm raised out to the side, as seen from the front (0 = down, 90 = sideways, 180 = up)
// elAb = extra sideways bend of the forearm, as seen from the front
export type Arm = { sh: number; el: number; ab: number; elAb: number };

// hip  = thigh swing forward (+) / backward (-)
// knee = knee bend (+ bends the shin backward)
// ab   = leg spread to the side, as seen from the front
// foot = ankle angle
export type Leg = { hip: number; knee: number; ab: number; foot: number };

// "A" limbs are the near limbs in side views and the screen-left limbs in front/back views.
export type Pose = {
  x: number; // root offset (px)
  y: number; // root offset (px, negative = up)
  lean: number; // torso lean forward (side views)
  tilt: number; // torso tilt sideways (front/back views)
  head: number; // extra head rotation
  armA: Arm;
  armB: Arm;
  legA: Leg;
  legB: Leg;
  mouth: number; // 0 closed .. 1 wide open
  blink: number; // 0 open .. 1 closed
  brow: number; // -1 frown .. 1 raised
  look: number; // pupils -1 left .. 1 right
  squash: number; // 1 normal, <1 squashed, >1 stretched
  hairV: number; // hair bounce offset (secondary motion)
};

export type Look = {
  name: string;
  skin: string;
  skinShade: string;
  hair: string;
  hairShade: string;
  hairStyle: "curly" | "mohawk";
  jaw: "square" | "round";
  jersey: string;
  jerseyShade: string;
  sponsor: string;
  number: string;
  shorts: string;
  socks: string;
  boots: string;
  personality: "playful" | "chill";
  // Optional national-style trim: colored bands across the chest, and the color of the jersey text
  stripes?: string[];
  textColor?: string;
  // Optional club-style kit: vertical stripes across the whole shirt (colors repeat left to right)
  vstripes?: string[];
  // Small badge on the left chest: an image URL, or "generic" for a plain striped shield
  crest?: string;
  // Optional beard color (older supporting characters)
  beard?: string;
};
