"use strict";

/* ---------- Helpers ---------- */

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/* ---------- Farbvarianten ---------- */

// new URL(…, import.meta.url): Vite nimmt die Bilder so in den Build auf.
const asset = (file) => new URL(`../assets/images/${file}`, import.meta.url).href;

// Bilder je Farbe. Fehlt eine Farbe (z. B. Violet), bleibt die Standardvariante.
const VARIANTS = {
  sunset: {
    keyboard: [asset("keyboard.png"), 1752, 897],
    swoosh: [asset("swoosh.svg"), 729, 375],
    tip: asset("swoosh-tip.svg"),
    alt: "Keychron Q6 Max in Schwarz mit roten, weißen und orangen Keycaps, schräg von oben",
  },
  "ice-blue": {
    keyboard: [asset("keyboard-blue.webp"), 1787, 735],
    swoosh: [asset("swoosh-blue.png"), 729, 376],
    tip: asset("swoosh-tip-blue.svg"),
    alt: "Keychron Q6 Max in Schwarz mit weißen, hellblauen und dunkelblauen Keycaps, schräg von oben",
  },
  olive: {
    keyboard: [asset("keyboard-olive.webp"), 1859, 772],
    swoosh: [asset("swoosh-olive.png"), 793, 409],
    tip: asset("swoosh-tip-olive.svg"),
    alt: "Keychron Q6 Max in Schwarz mit weißen und olivgrünen Keycaps, schräg von oben",
  },
};

function setImage(img, [file, width, height]) {
  img.src = file;
  img.width = width;
  img.height = height;
}

function showVariant(color) {
  const variant = VARIANTS[color] ?? VARIANTS.sunset;
  const stage = $(".stage");
  const keyboard = $(".stage__keyboard", stage);

  // Positionierung je Variante steuert das CSS über data-variant
  stage.dataset.variant = VARIANTS[color] ? color : "sunset";
  setImage(keyboard, variant.keyboard);
  setImage($(".stage__swoosh", stage), variant.swoosh);
  $(".stage__swoosh-tip", stage).src = variant.tip;
  keyboard.alt = variant.alt;
}

function initColorVariants() {
  const inputs = $$('.configurator input[name="color"]');
  if (!inputs.length || !$(".stage")) return;

  inputs.forEach((input) => {
    input.addEventListener("change", () => showVariant(input.value));
  });

  // Bilder der anderen Varianten vorladen, damit der Wechsel ohne Flackern läuft
  Object.values(VARIANTS).forEach(({ keyboard, swoosh, tip }) => {
    [keyboard[0], swoosh[0], tip].forEach((file) => {
      new Image().src = file;
    });
  });
}

/* ---------- Init ---------- */

function init() {
  initColorVariants();
}

document.addEventListener("DOMContentLoaded", init);
