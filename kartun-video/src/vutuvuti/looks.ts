import { Look } from "./types";

// Vutu: warm brown skin, square jaw, curly pink hair, pink jersey. Playful and cheeky.
export const VUTU: Look = {
  name: "Vutu",
  skin: "#9C633C",
  skinShade: "#7A4A2A",
  hair: "#FF62A5",
  hairShade: "#DB3F86",
  hairStyle: "curly",
  jaw: "square",
  jersey: "#FF4F9A",
  jerseyShade: "#D13A7C",
  sponsor: "vutu",
  number: "7",
  shorts: "#FFFFFF",
  socks: "#FF4F9A",
  boots: "#222222",
  personality: "playful",
};

// Vuti: lighter brown skin, round jaw, green punk mohawk, green jersey. Calm and unbothered.
export const VUTI: Look = {
  name: "Vuti",
  skin: "#C78D60",
  skinShade: "#A26B43",
  hair: "#3DDC84",
  hairShade: "#1FA862",
  hairStyle: "mohawk",
  jaw: "round",
  jersey: "#2FC872",
  jerseyShade: "#1E9A55",
  sponsor: "vuti",
  number: "10",
  shorts: "#FFFFFF",
  socks: "#2FC872",
  boots: "#222222",
  personality: "chill",
};

// Swap the jersey for a different story context, e.g. withJersey(VUTU, "#1E88E5", "#1565C0").
export const withJersey = (look: Look, jersey: string, jerseyShade: string, socks = jersey): Look => ({
  ...look,
  jersey,
  jerseyShade,
  socks,
});

// Vutu in a Senegal-style kit: white with green-yellow-red trim
export const VUTU_SENEGAL: Look = {
  ...VUTU,
  jersey: "#F5F5F0",
  jerseyShade: "#D8D8D0",
  stripes: ["#00853F", "#FDEF42", "#E31B23"],
  textColor: "#00853F",
  shorts: "#F5F5F0",
  socks: "#F5F5F0",
};

// Vuti in a Morocco-style kit: red with green trim and green shorts
export const VUTI_MOROCCO: Look = {
  ...VUTI,
  jersey: "#C1272D",
  jerseyShade: "#93202A",
  stripes: ["#006233"],
  textColor: "#FFFFFF",
  shorts: "#006233",
  socks: "#C1272D",
};
