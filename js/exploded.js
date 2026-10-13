/* Explosionsansicht der Q6 Max: SVG aus Lagen, die beim Scrollen
   auseinanderfahren. Maße in mm nach dem Blender-Modell (Keychron Q6, ISO-DE):
   Gehäuse 442 × 145, Deckel um 5,2° gekippt, x von links, y von vorn. */

/* ---------- Projektion ---------- */

const VB = { w: 1600, h: 1220 }; // Höhe mit Luft oben und unten für Knopf und Unterteil
const SCALE = 1.85; // px pro mm
const YAW = (18 * Math.PI) / 180; // Tastatur gedreht: rechtes Ende kommt nach vorn
const ELEVATION = (13 * Math.PI) / 180; // Blick leicht von oben
const SLOPE = Math.tan((5.2 * Math.PI) / 180); // Neigung des Deckels und aller Lagen darin

const KB = { w: 442, d: 145 };
const GAP = 31; // Abstand der Lagen im Explosionszustand (mm)

// Welt-Höhe eines Punkts in Lagen-Koordinaten (alles im Gehäuse ist um 5,2° gekippt)
const worldZ = (y, z) => z + SLOPE * y;
const CX = KB.w / 2;
const CY = KB.d / 2;
// Drehung um die Hochachse, dann Parallelprojektion von leicht oben.
// depth: größer = weiter hinten; sichtbar sind Vorderseite, rechte Seite und Oberseite.
const depth = (x, y) => -(x - CX) * Math.sin(YAW) + (y - CY) * Math.cos(YAW);
const screen = (x, y, zw) => [
  ORIGIN[0] + SCALE * ((x - CX) * Math.cos(YAW) + (y - CY) * Math.sin(YAW)),
  ORIGIN[1] - SCALE * (zw * Math.cos(ELEVATION) + depth(x, y) * Math.sin(ELEVATION)),
];
const pt = (x, y, z) => screen(x, y, worldZ(y, z));
const ptFlat = (x, y, zw) => screen(x, y, zw); // waagerechte Unterseite

let ORIGIN = [0, 0];
{
  // Mitte der zusammengebauten Tastatur in die Mitte der viewBox
  const [cx, cy] = screen(KB.w / 2, KB.d / 2, worldZ(KB.d / 2, 30));
  ORIGIN = [VB.w / 2 - cx, VB.h / 2 - cy];
}

const fmt = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const poly = (points, fill, extra = "") => `<path d="M${points.map(fmt).join("L")}Z" fill="${fill}"${extra}/>`;

// Seitenfläche bei x zwischen z0 und z1 (über die ganze Tiefe)
const sideFace = (x, y, d, z0, z1, fill) => poly([pt(x, y, z0), pt(x, y + d, z0), pt(x, y + d, z1), pt(x, y, z1)], fill);

// Quader in Lagen-Koordinaten: sichtbare Seitenflächen, Vorderseite, Oberseite
function box(x, y, z, w, d, h, color) {
  const out = [];
  if (h > 0) {
    out.push(sideFace(x + w, y, d, z, z + h, color.side));
    out.push(poly([pt(x, y, z), pt(x + w, y, z), pt(x + w, y, z + h), pt(x, y, z + h)], color.front));
  }
  out.push(poly([pt(x, y, z + h), pt(x + w, y, z + h), pt(x + w, y + d, z + h), pt(x, y + d, z + h)], color.top));
  return out.join("");
}

const flat = (x, y, z, w, d, fill) => poly([pt(x, y, z), pt(x + w, y, z), pt(x + w, y + d, z), pt(x, y + d, z)], fill);
const rect = (x, y, w, d) => [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];
const ring = (points, z) => points.map(([x, y]) => pt(x, y, z));
const path = (points) => `M${points.map(fmt).join("L")}Z`;

// Inhalt auf eine Öffnung beschneiden (Innenleben einer Wanne)
const clipped = (id, points, content) =>
  `<clipPath id="exploded-${id}"><path d="${path(points)}"/></clipPath><g clip-path="url(#exploded-${id})">${content}</g>`;

function hull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const out = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

/* ---------- Farben (Materialien aus dem Modell, nach sRGB) ---------- */

const shade = (top, front, side) => ({ top, front, side });
const C = {
  case: shade("#3a3a3f", "#1f1f22", "#2b2b2f"),
  plate: shade("#45464c", "#26272b", "#333438"),
  foam: shade("#323235", "#1b1b1d", "#252527"),
  ixpe: shade("#4a4a4f", "#28282b", "#38383c"),
  pet: shade("#5e5e64", "#38383c", "#48484d"),
  pcb: shade("#26392d", "#14201a", "#1c2c22"),
  latex: shade("#3f3f43", "#222225", "#2f2f32"),
  gasket: shade("#5a5a61", "#36363b", "#46464c"), // heller als im Modell, sonst auf Schwarz unsichtbar
  battery: shade("#55555b", "#2f2f33", "#424247"),
  hole: "#0c0c0d",
  w: { ...shade("#eeeeec", "#bdbdba", "#d4d4d1"), dish: "#e4e4e1" },
  n: { ...shade("#2b3a5a", "#18213a", "#212d48"), dish: "#27354f" },
  t: { ...shade("#47c0b8", "#2a8a84", "#37a59e"), dish: "#41b2ab" },
  switchTop: shade("#f0f0ec", "#b8b8b4", "#d6d6d2"),
  stem: shade("#ee1e2c", "#a5101b", "#cc1724"),
};

/* ---------- Tasten: Mittelpunkte aus dem Modell ---------- */

// [x, y, Breite in u, Höhe in u, Farbe] – "iso" ist der ISO-Enter
const KEYS = [
  [16.21, 127.54, 1, 1, "t"],
  [49.55, 127.54, 1, 1, "w"],
  [68.60, 127.54, 1, 1, "w"],
  [87.65, 127.54, 1, 1, "w"],
  [106.70, 127.54, 1, 1, "w"],
  [130.51, 127.54, 1, 1, "n"],
  [149.56, 127.54, 1, 1, "n"],
  [168.61, 127.54, 1, 1, "n"],
  [187.66, 127.54, 1, 1, "n"],
  [211.47, 127.54, 1, 1, "w"],
  [230.53, 127.54, 1, 1, "w"],
  [249.57, 127.54, 1, 1, "w"],
  [268.63, 127.54, 1, 1, "w"],
  [306.73, 127.54, 1, 1, "n"],
  [325.77, 127.54, 1, 1, "n"],
  [344.82, 127.54, 1, 1, "n"],
  [368.64, 127.54, 1, 1, "w"],
  [387.69, 127.54, 1, 1, "w"],
  [406.74, 127.54, 1, 1, "w"],
  [425.79, 127.54, 1, 1, "w"],
  [16.21, 101.82, 1, 1, "w"],
  [35.26, 101.82, 1, 1, "w"],
  [54.31, 101.82, 1, 1, "w"],
  [73.36, 101.82, 1, 1, "w"],
  [92.41, 101.82, 1, 1, "w"],
  [111.46, 101.82, 1, 1, "w"],
  [130.51, 101.82, 1, 1, "w"],
  [149.56, 101.82, 1, 1, "w"],
  [168.61, 101.82, 1, 1, "w"],
  [187.66, 101.82, 1, 1, "w"],
  [206.71, 101.82, 1, 1, "w"],
  [225.76, 101.82, 1, 1, "w"],
  [244.81, 101.82, 1, 1, "w"],
  [273.39, 101.82, 2, 1, "n"],
  [306.73, 101.82, 1, 1, "n"],
  [325.77, 101.82, 1, 1, "n"],
  [344.82, 101.82, 1, 1, "n"],
  [368.64, 101.82, 1, 1, "w"],
  [387.69, 101.82, 1, 1, "w"],
  [406.74, 101.82, 1, 1, "w"],
  [425.79, 101.82, 1, 1, "w"],
  [20.97, 82.77, 1.5, 1, "n"],
  [44.79, 82.77, 1, 1, "w"],
  [63.84, 82.77, 1, 1, "w"],
  [82.89, 82.77, 1, 1, "w"],
  [101.94, 82.77, 1, 1, "w"],
  [120.99, 82.77, 1, 1, "w"],
  [140.04, 82.77, 1, 1, "w"],
  [159.09, 82.77, 1, 1, "w"],
  [178.14, 82.77, 1, 1, "w"],
  [197.19, 82.77, 1, 1, "w"],
  [216.24, 82.77, 1, 1, "w"],
  [235.29, 82.77, 1, 1, "w"],
  [254.34, 82.77, 1, 1, "w"],
  [306.73, 82.77, 1, 1, "n"],
  [325.77, 82.77, 1, 1, "n"],
  [344.82, 82.77, 1, 1, "n"],
  [368.64, 82.77, 1, 1, "w"],
  [387.69, 82.77, 1, 1, "w"],
  [406.74, 82.77, 1, 1, "w"],
  ["iso", 278.15, 73.24, 0, 0, "n"],
  [425.79, 73.24, 1, 2, "w"],
  [23.36, 63.72, 1.75, 1, "n"],
  [49.55, 63.72, 1, 1, "w"],
  [68.60, 63.72, 1, 1, "w"],
  [87.65, 63.72, 1, 1, "w"],
  [106.70, 63.72, 1, 1, "w"],
  [125.75, 63.72, 1, 1, "w"],
  [144.80, 63.72, 1, 1, "w"],
  [163.85, 63.72, 1, 1, "w"],
  [182.90, 63.72, 1, 1, "w"],
  [201.95, 63.72, 1, 1, "w"],
  [221.00, 63.72, 1, 1, "w"],
  [240.05, 63.72, 1, 1, "w"],
  [259.10, 63.72, 1, 1, "w"],
  [368.64, 63.72, 1, 1, "w"],
  [387.69, 63.72, 1, 1, "w"],
  [406.74, 63.72, 1, 1, "w"],
  [18.59, 44.67, 1.25, 1, "n"],
  [40.02, 44.67, 1, 1, "w"],
  [59.07, 44.67, 1, 1, "w"],
  [78.12, 44.67, 1, 1, "w"],
  [97.18, 44.67, 1, 1, "w"],
  [116.23, 44.67, 1, 1, "w"],
  [135.27, 44.67, 1, 1, "w"],
  [154.33, 44.67, 1, 1, "w"],
  [173.37, 44.67, 1, 1, "w"],
  [192.43, 44.67, 1, 1, "w"],
  [211.47, 44.67, 1, 1, "w"],
  [230.53, 44.67, 1, 1, "w"],
  [266.24, 44.67, 2.75, 1, "n"],
  [325.77, 44.67, 1, 1, "w"],
  [368.64, 44.67, 1, 1, "w"],
  [387.69, 44.67, 1, 1, "w"],
  [406.74, 44.67, 1, 1, "w"],
  [425.79, 35.14, 1, 2, "w"],
  [18.59, 25.62, 1.25, 1, "n"],
  [42.41, 25.62, 1.25, 1, "n"],
  [66.22, 25.62, 1.25, 1, "n"],
  [137.66, 25.62, 6.25, 1, "w"],
  [209.09, 25.62, 1.25, 1, "n"],
  [232.91, 25.62, 1.25, 1, "n"],
  [256.72, 25.62, 1.25, 1, "n"],
  [280.53, 25.62, 1.25, 1, "n"],
  [306.73, 25.62, 1, 1, "w"],
  [325.77, 25.62, 1, 1, "w"],
  [344.82, 25.62, 1, 1, "w"],
  [378.16, 25.62, 2, 1, "w"],
  [406.74, 25.62, 1, 1, "w"]
];

const U = 19.05;
const KNOB = { x: 287.67, y: 123.46, r: 8 };

// Grundriss einer Kappe als Polygon (gegen den Uhrzeigersinn, von vorn rechts)
function capOutline([x, y, u, h]) {
  if (x === "iso") {
    const cx = y, cy = u; // beim ISO-Enter stehen die Mittelpunkte an Stelle 1 und 2
    return [[cx + 13.74, cy - 18.5], [cx + 13.74, cy + 18.5], [cx - 13.74, cy + 18.5], [cx - 13.74, cy + 0.55], [cx - 8.98, cy + 0.55], [cx - 8.98, cy - 18.5]];
  }
  const w = U * u - 1.05;
  const d = U * h - 1.05;
  return rect(x - w / 2, y - d / 2, w, d);
}

// Rechtwinkliges Polygon nach innen versetzen (funktioniert auch an der Innenecke des ISO-Enters)
function inset(points, by) {
  const n = points.length;
  return points.map((p, i) => {
    const prev = points[(i + n - 1) % n];
    const next = points[(i + 1) % n];
    const a = [p[0] - prev[0], p[1] - prev[1]];
    const b = [next[0] - p[0], next[1] - p[1]];
    const la = Math.hypot(...a) || 1;
    const lb = Math.hypot(...b) || 1;
    // links der Laufrichtung = innen (gegen den Uhrzeigersinn)
    return [p[0] + by * (-a[1] / la - b[1] / lb), p[1] + by * (a[0] / la + b[0] / lb)];
  });
}

const CAP_Z = 35;
const CAP_H = 10.4;

function cap(key) {
  const color = C[key[0] === "iso" ? key[5] : key[4]];
  const base = capOutline(key);
  const top = inset(base, 2.6);
  const z1 = CAP_Z + CAP_H;
  // sichtbare Seiten: nach vorn (-y) oder nach rechts (+x)
  const faces = [];
  base.forEach((p, i) => {
    const q = base[(i + 1) % base.length];
    const dx = q[0] - p[0], dy = q[1] - p[1];
    const normal = [dy, -dx]; // außen bei gegen den Uhrzeigersinn
    if (normal[1] < -1e-6 || normal[0] > 1e-6) faces.push({ depth: depth((p[0] + q[0]) / 2, (p[1] + q[1]) / 2), fill: normal[1] < 0 ? color.front : color.side, points: [pt(p[0], p[1], CAP_Z), pt(q[0], q[1], CAP_Z), pt(top[(i + 1) % top.length][0], top[(i + 1) % top.length][1], z1), pt(top[i][0], top[i][1], z1)] });
  });
  faces.sort((a, b) => b.depth - a.depth);
  return faces.map((f) => poly(f.points, f.fill)).join("") + poly(ring(top, z1), color.top) + poly(ring(inset(top, 2.2), z1 - 0.6), color.dish);
}

const keyCenter = (key) => (key[0] === "iso" ? [key[1], key[2] - 4] : [key[0], key[1]]);
// von hinten nach vorn in Blickrichtung
const KEYS_SORTED = [...KEYS].sort((a, b) => depth(...keyCenter(b)) - depth(...keyCenter(a)));

/* ---------- Lagen (von unten nach oben), Höhen aus dem Modell ---------- */

const FOOT = { x: 5.7, y: 11, w: 430.6, d: 123 }; // Grundfläche von Platte, Schaum und PCB
const BOTTOM_WORLD = 12.9; // waagerechte Unterseite (Welt-z)
const SEAM = 21.3; // Naht Unter-/Oberteil (Lagen-z)
const TOP = 33.2; // Oberkante Gehäuse (Lagen-z)

const keyHoles = (size, fill) => (z) =>
  KEYS_SORTED.map((key) => {
    const [cx, cy] = keyCenter(key);
    return flat(cx - size / 2, cy - size / 2, z, size, size, fill);
  }).join("");

const sheet = (z, h, color, holes) => () => box(FOOT.x, FOOT.y, z, FOOT.w, FOOT.d, h, color) + (holes ? holes(z + h) : "");

const LAYERS = [
  {
    name: "Gehäuseunterteil",
    z: BOTTOM_WORLD,
    h: SEAM - BOTTOM_WORLD,
    draw() {
      const { w, d } = KB;
      const bottom = (x, y) => ptFlat(x, y, BOTTOM_WORLD);
      const chamfer = 4.8; // Fase an der Unterkante
      const out = [
        // Vorderseite mit Fase
        poly([bottom(4.2, 4.2), bottom(w - 4.2, 4.2), ptFlat(w, 0, BOTTOM_WORLD + chamfer), ptFlat(0, 0, BOTTOM_WORLD + chamfer)], "#18181b"),
        poly([ptFlat(0, 0, BOTTOM_WORLD + chamfer), ptFlat(w, 0, BOTTOM_WORLD + chamfer), pt(w, 0, SEAM), pt(0, 0, SEAM)], C.case.front),
        // rechte Seite: Keil, hinten höher
        ...[[w, w - 4.2]].flatMap(([x, xi]) => [
          poly([bottom(xi, 4.2), bottom(xi, d - 4.2), ptFlat(x, d, BOTTOM_WORLD + chamfer), ptFlat(x, 0, BOTTOM_WORLD + chamfer)], "#1d1d20"),
          poly([ptFlat(x, 0, BOTTOM_WORLD + chamfer), ptFlat(x, d, BOTTOM_WORLD + chamfer), pt(x, d, SEAM), pt(x, 0, SEAM)], C.case.side),
        ]),
      ];
      // Wanne: Rand oben, Boden, hintere und linke Innenwand
      const wall = 3;
      const opening = rect(wall, wall, w - 2 * wall, d - 2 * wall);
      out.push(`<path d="${path(ring(rect(0, 0, w, d), SEAM))}${path(ring(opening, SEAM))}" fill="${C.case.top}" fill-rule="evenodd"/>`);
      const floor = 9.5;
      out.push(clipped("tray", ring(opening, SEAM), [
        poly(ring(opening, floor), "#121214"),
        poly([pt(wall, d - wall, floor), pt(w - wall, d - wall, floor), pt(w - wall, d - wall, SEAM), pt(wall, d - wall, SEAM)], "#232327"),
        sideFace(wall, wall, d - 2 * wall, floor, SEAM, "#1a1a1d"),
        // Akkufach und Schraubdome
        flat(164, 82.5, floor, 114, 44, "#1c1c1f"),
        ...[[28, 30], [221, 30], [414, 30], [28, 118], [414, 118]].map(([x, y]) => box(x - 3, y - 3, floor, 6, 6, 5, C.plate)),
      ].join("")));
      return out.join("");
    },
    anchor: { left: [16, 0, SEAM] },
  },
  {
    name: "Akku",
    z: 10.1,
    h: 5,
    draw: () => box(166, 84.5, 10.1, 110, 40, 5, C.battery) + flat(172, 112, 15.1, 36, 8, "#7a7a80") + box(266, 100, 15.1, 6, 10, 1, C.stem),
    anchor: { right: [276, 84.5, 15.1] },
  },
  {
    name: "Silikon-Gaskets",
    z: 14.6,
    h: 1,
    draw: () =>
      [28, 103, 178, 253, 328, 403]
        .flatMap((x) => [[x, 120.5], [x, 20.5]])
        .map(([x, y]) => box(x, y, 14.6, 16, 4, 1, C.gasket))
        .join(""),
    anchor: { left: [28, 20.5, 15.6] },
  },
  {
    name: "PET-Folie Gehäuseboden",
    z: 15.1,
    h: 0.2,
    draw: sheet(15.1, 0.2, C.pet),
  },
  {
    name: "Akustikschaum Gehäuseboden",
    z: 15.3,
    h: 2.5,
    draw: sheet(15.3, 2.5, C.foam),
  },
  {
    name: "Latex-Bodenpad",
    z: 17.8,
    h: 2,
    draw: sheet(17.8, 2, C.latex, keyHoles(6, "#1f1f22")),
  },
  {
    name: "Platine (PCB)",
    z: 19.8,
    h: 1.6,
    draw: sheet(19.8, 1.6, C.pcb, (z) =>
      KEYS_SORTED.map((key) => {
        const [cx, cy] = keyCenter(key);
        // Hot-Swap-Sockel (kupferfarbene Pads) und Mittelloch
        return flat(cx - 5, cy + 2, z, 3.4, 3.4, "#b77a3e") + flat(cx + 1.6, cy + 4.4, z, 3.4, 3.4, "#b77a3e") + flat(cx - 2, cy - 2, z, 4, 4, "#0e1510");
      }).join(""),
    ),
  },
  {
    name: "PET-Folie",
    z: 21.4,
    h: 0.1,
    draw: sheet(21.4, 0.1, C.pet, keyHoles(5, "#2a2a2e")),
  },
  {
    name: "IXPE-Schaum",
    z: 21.5,
    h: 0.5,
    draw: sheet(21.5, 0.5, C.ixpe, keyHoles(8, C.hole)),
  },
  {
    name: "Schalldämmschaum",
    z: 22,
    h: 3.5,
    draw: sheet(22, 3.5, C.foam, keyHoles(14, C.hole)),
  },
  {
    name: "Platte",
    z: 25.5,
    h: 1.5,
    draw: sheet(25.5, 1.5, C.plate, keyHoles(14, C.hole)),
  },
  {
    name: "Gaskets",
    z: 27,
    h: 2.2,
    draw: () =>
      [41, 111, 181, 251, 321, 391]
        .flatMap((x) => [[x, 131], [x, 11.2]])
        .map(([x, y]) => box(x, y, 27, 20, 2.8, 2.2, C.gasket))
        .join(""),
    anchor: { left: [41, 11.2, 29.2] },
  },
  {
    name: "Gehäuseoberteil",
    z: SEAM - 0.1,
    h: TOP - SEAM + 0.1,
    draw() {
      const { w, d } = KB;
      const z0 = SEAM - 0.1;
      // Ausschnitt über dem Tastenfeld (Tasten + 1 mm)
      const opening = rect(6.2, 15.1, 429.6, 122.4);
      const out = [
        poly([pt(0, 0, z0), pt(w, 0, z0), pt(w, 0, TOP - 1.2), pt(0, 0, TOP - 1.2)], C.case.front),
        sideFace(w, 0, d, z0, TOP - 1.2, C.case.side),
        // Fase an der Oberkante
        poly([pt(0, 0, TOP - 1.2), pt(w, 0, TOP - 1.2), pt(w - 1.2, 1.2, TOP), pt(1.2, 1.2, TOP)], "#4a4a50"),
        poly([pt(w, 0, TOP - 1.2), pt(w, d, TOP - 1.2), pt(w - 1.2, d - 1.2, TOP), pt(w - 1.2, 1.2, TOP)], "#3f3f45"),
        `<path d="${path(ring(rect(1.2, 1.2, w - 2.4, d - 2.4), TOP))}${path(ring(opening, TOP))}" fill="${C.case.top}" fill-rule="evenodd"/>`,
      ];
      const [x0, y0] = opening[0];
      const [x1, y1] = opening[2];
      out.push(clipped("frame", ring(opening, TOP), [
        poly(ring(opening, 27), "#0f0f11"),
        poly([pt(x0, y1, 27), pt(x1, y1, 27), pt(x1, y1, TOP), pt(x0, y1, TOP)], "#222226"),
        sideFace(x0, y0, y1 - y0, 27, TOP, "#19191c"),
      ].join("")));
      // Sockel des Drehknopfs (gehört zum Oberteil)
      out.push(box(KNOB.x - 8.6, KNOB.y - 8.6, 27, 17.2, 17.2, TOP - 0.1 - 27, C.case));
      return out.join("");
    },
    anchor: { left: [16, 0, TOP] },
  },
  {
    name: "Switches",
    z: 27,
    h: 10,
    draw: () =>
      KEYS_SORTED.map((key) => {
        const [cx, cy] = keyCenter(key);
        return box(cx - 7, cy - 7, 27, 14, 14, 5, C.switchTop) + box(cx - 5.5, cy - 5.5, 32, 11, 11, 1.6, C.switchTop) + box(cx - 2, cy - 2, 33.6, 4, 4, 3.6, C.stem);
      }).join(""),
    anchor: { right: [KB.w - 20, 16, 37] },
  },
  {
    name: "Tastenkappen",
    z: CAP_Z,
    h: CAP_H,
    draw: () => KEYS_SORTED.map(cap).join(""),
    anchor: { left: [10, 16, CAP_Z + CAP_H] },
  },
  {
    name: "Drehknopf",
    z: TOP,
    h: 13,
    draw() {
      const steps = 48;
      const circle = (z, r) => Array.from({ length: steps }, (_, i) => {
        const a = (i / steps) * Math.PI * 2;
        return pt(KNOB.x + Math.cos(a) * r, KNOB.y + Math.sin(a) * r, z);
      });
      const bottom = circle(TOP, KNOB.r);
      const top = circle(TOP + 13, KNOB.r);
      // Rändelung: Linien auf der sichtbaren Vorderhälfte
      const knurl = [];
      for (let i = 0; i < steps; i += 2) {
        const a = (i / steps) * Math.PI * 2;
        if (Math.sin(a) > -0.15) continue;
        knurl.push(`M${fmt(bottom[i])}L${fmt(top[i])}`);
      }
      return poly(hull([...bottom, ...top]), "#232326") + `<path d="${knurl.join("")}" stroke="#4c4c52" stroke-width="1.2"/>` + poly(top, "#3c3c42") + poly(circle(TOP + 13, KNOB.r - 1.6), "#2f2f34");
    },
    anchor: { right: [KNOB.x + KNOB.r, KNOB.y, TOP + 8] },
  },
];

const N = LAYERS.length;
LAYERS.forEach((layer, index) => {
  // Unterteil ist höher als die übrigen Lagen – darüber etwas mehr Luft
  layer.explodedZ = index === 0 ? layer.z : BOTTOM_WORLD + 16 + index * GAP;
  layer.side = layer.anchor ? Object.keys(layer.anchor)[0] : index % 2 === 0 ? "left" : "right";
});
// Kamera: die Mitte des zerlegten Stapels wandert in die Bildmitte

/* ---------- SVG ---------- */

function layerLabel(layer) {
  const top = layer.z + layer.h;
  const anchor = layer.anchor?.[layer.side] || (layer.side === "left" ? [FOOT.x + 12, FOOT.y, top] : [FOOT.x + FOOT.w - 12, FOOT.y, top]);
  const [ax, ay] = pt(...anchor);
  if (layer.side === "left") {
    return `<g class="exploded__label"><path d="M60 ${ay.toFixed(1)}H${ax.toFixed(1)}"/><text x="60" y="${(ay - 10).toFixed(1)}">${layer.name}</text></g>`;
  }
  return `<g class="exploded__label"><path d="M${ax.toFixed(1)} ${ay.toFixed(1)}H${VB.w - 60}"/><text x="${VB.w - 60}" y="${(ay - 10).toFixed(1)}" text-anchor="end">${layer.name}</text></g>`;
}

function svgMarkup() {
  // Innere Lagen sind zusammengebaut verdeckt und werden erst beim Auseinanderfahren eingeblendet
  const outer = ["Gehäuseunterteil", "Gehäuseoberteil", "Tastenkappen", "Drehknopf"];
  const groups = LAYERS.map((layer, index) => `<g class="exploded__layer" data-layer="${index}"${outer.includes(layer.name) ? "" : " data-inner"}>${layer.draw()}${layerLabel(layer)}</g>`).join("");
  return `<svg class="exploded__svg" viewBox="0 0 ${VB.w} ${VB.h}" role="img" aria-label="Explosionsansicht der Keychron Q6 Max mit ${N} Lagen, von den Tastenkappen bis zum Gehäuseunterteil"><g class="exploded__camera">${groups}</g></svg>`;
}

/* ---------- Scroll-Animation ---------- */

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function initExploded() {
  const section = document.querySelector("[data-exploded]");
  if (!section) return;
  const stage = section.querySelector("[data-exploded-stage]");
  stage.innerHTML = svgMarkup();

  const svg = stage.querySelector("svg");
  const groups = [...svg.querySelectorAll(".exploded__layer")];
  const camera = svg.querySelector(".exploded__camera");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 700px)");

  // Mobil: nur die Tastatur zeigen, Beschriftung steht in der Liste darunter
  const fit = () => svg.setAttribute("viewBox", narrow.matches ? `330 0 ${VB.w - 660} ${VB.h}` : `0 0 ${VB.w} ${VB.h}`);
  fit();
  narrow.addEventListener("change", fit);

  function render(progress) {
    const shares = LAYERS.map((_, index) => {
      // obere Lagen lösen sich zuerst
      const start = ((N - 1 - index) / (N - 1)) * 0.3;
      return smooth(start, start + 0.7, progress);
    });
    // Kamera hält den Stapel in jedem Moment mittig: Mitte zwischen Unterteil und Knopf
    const lifted = (index) => LAYERS[index].z + shares[index] * (LAYERS[index].explodedZ - LAYERS[index].z);
    const shift = (lifted(0) + lifted(N - 1) - LAYERS[0].z - LAYERS[N - 1].z) / 2;
    // zusammengebaut näher heran, zerlegt passt der ganze Stapel ins Bild
    const zoom = 1.45 - 0.45 * smooth(0, 0.6, progress);
    camera.setAttribute("transform", `translate(${VB.w / 2} ${VB.h / 2}) scale(${zoom.toFixed(4)}) translate(${-VB.w / 2} ${-VB.h / 2})`);
    groups.forEach((group, index) => {
      const layer = LAYERS[index];
      const share = shares[index];
      const lift = share * (layer.explodedZ - layer.z) - shift;
      group.setAttribute("transform", `translate(0 ${(-lift * SCALE).toFixed(2)})`);
      group.style.setProperty("--share", share.toFixed(3));
    });
    section.style.setProperty("--progress", progress.toFixed(3));
    // Beschriftung erst, wenn der Zoom fast zurück ist – sonst ragt sie aus dem Bild
    section.style.setProperty("--labels", smooth(0.45, 0.65, progress).toFixed(3));
  }

  if (still.matches) {
    section.classList.add("is-static");
    render(1);
    return;
  }

  /* Zwei Antriebe: Scrollen (Standard) oder die Buttons. Wer nach Play/Reset
     merklich weiterscrollt, gibt die Steuerung wieder ans Scrollen zurück. */
  const DURATION = 5000; // ms für einmal ganz auseinander
  const controls = section.querySelector("[data-exploded-controls]");
  const playButton = controls.querySelector("[data-exploded-play]");
  const resetButton = controls.querySelector("[data-exploded-reset]");
  controls.hidden = false;

  let progress = 0;
  let manual = false; // Buttons steuern, Scrollen wird ignoriert
  let manualScroll = 0;
  let playing = false;
  let playFrame = 0;
  let last = 0;

  const setPlaying = (state) => {
    playing = state;
    playButton.querySelector("[data-icon]").textContent = state ? "❚❚" : "▶";
    playButton.querySelector("[data-label]").textContent = state ? "Pause" : "Abspielen";
    playButton.setAttribute("aria-pressed", String(state));
    if (!state) {
      cancelAnimationFrame(playFrame);
      playFrame = 0;
    }
  };

  const takeOver = () => {
    cancelAnimationFrame(catchFrame);
    catchFrame = 0;
    catchUp = false;
    manual = true;
    manualScroll = window.scrollY;
  };

  const step = (now) => {
    const dt = last ? now - last : 16;
    last = now;
    progress = Math.min(1, progress + dt / DURATION);
    render(progress);
    if (progress >= 1) setPlaying(false);
    else playFrame = requestAnimationFrame(step);
  };

  playButton.addEventListener("click", () => {
    takeOver();
    if (playing) {
      setPlaying(false);
      return;
    }
    if (progress >= 1) progress = 0; // am Ende: von vorn
    setPlaying(true);
    last = 0;
    playFrame = requestAnimationFrame(step);
  });

  resetButton.addEventListener("click", () => {
    takeOver();
    setPlaying(false);
    progress = 0;
    render(0);
  });

  // Nach Play/Reset springt das Scrollen nicht hart auf seinen Stand,
  // sondern der Fortschritt läuft schnell dorthin nach
  let catchUp = false;
  let catchFrame = 0;
  let catchLast = 0;
  const scrollProgress = () => {
    const box = section.getBoundingClientRect();
    const sticky = stage.parentElement;
    // 0, sobald der Sticky-Teil andockt, 1, wenn er sich wieder löst
    const offset = parseFloat(getComputedStyle(sticky).top) || 0;
    const range = box.height - sticky.offsetHeight;
    return range > 0 ? Math.min(1, Math.max(0, (offset - box.top) / range)) : 1;
  };
  const follow = (now) => {
    const dt = catchLast ? Math.min(now - catchLast, 50) : 16;
    catchLast = now;
    const target = scrollProgress();
    progress += (target - progress) * (1 - Math.exp(-dt / 140));
    if (Math.abs(target - progress) < 0.002) {
      progress = target;
      catchUp = false;
      catchFrame = 0;
    } else {
      catchFrame = requestAnimationFrame(follow);
    }
    render(progress);
  };

  let frame = 0;
  const update = () => {
    frame = 0;
    if (manual) {
      if (Math.abs(window.scrollY - manualScroll) < 40) return;
      manual = false;
      setPlaying(false);
      catchUp = true;
    }
    if (catchUp) {
      if (!catchFrame) {
        catchLast = 0;
        catchFrame = requestAnimationFrame(follow);
      }
      return;
    }
    progress = scrollProgress();
    render(progress);
  };
  const request = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  update();
}
