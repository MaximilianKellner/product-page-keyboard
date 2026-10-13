"use strict";

import { initExploded } from "./exploded.js";

/* ---------- Helpers ---------- */

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/* ---------- Farbvarianten ---------- */

// new URL(…, import.meta.url): Vite nimmt die Bilder so in den Build auf.
const asset = (file) => new URL(`../assets/images/${file}`, import.meta.url).href;

// Bilder je Farbe. Fehlt eine Farbe (z. B. Violet), bleibt die Standardvariante.
const VARIANTS = {
  sunset: {
    keyboard: [asset("keyboard.webp"), 1719, 709],
    swoosh: [asset("swoosh.webp"), 1745, 899],
    tip: asset("swoosh-tip.svg"),
    alt: "Keychron Q6 Max in Schwarz mit roten, weißen und orangen Keycaps, schräg von oben",
  },
  "ice-blue": {
    keyboard: [asset("keyboard-blue.webp"), 1718, 710],
    swoosh: [asset("swoosh-blue.webp"), 1745, 899],
    tip: asset("swoosh-tip-blue.png"),
    alt: "Keychron Q6 Max in Schwarz mit weißen, hellblauen und dunkelblauen Keycaps, schräg von oben",
  },
  olive: {
    keyboard: [asset("keyboard-olive.webp"), 1693, 703],
    swoosh: [asset("swoosh-olive.webp"), 1745, 899],
    tip: asset("swoosh-tip-olive.png"),
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

  // Bilder der anderen Varianten vorladen, damit der Wechsel ohne Flackern läuft –
  // erst nach dem Seiten-Load, damit sie nicht mit dem Hero-Bild konkurrieren
  const preload = () => {
    Object.values(VARIANTS).forEach(({ keyboard, swoosh, tip }) => {
      [keyboard[0], swoosh[0], tip].forEach((file) => {
        new Image().src = file;
      });
    });
  };

  if (document.readyState === "complete") preload();
  else window.addEventListener("load", preload, { once: true });
}

/* ---------- Init ---------- */

function init() {
  initColorVariants();
  initExploded();
}

document.addEventListener("DOMContentLoaded", init);
