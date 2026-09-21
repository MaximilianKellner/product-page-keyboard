"use strict";

/* ---------- Helpers ---------- */

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/* ---------- Init ---------- */

function init() {
  // hier kommt der Seiten-Code rein
}

document.addEventListener("DOMContentLoaded", init);
