import { defineConfig } from "vite";

export default defineConfig({
  // relative Pfade, damit der Build auch unter
  // https://<user>.github.io/<repo>/ funktioniert
  base: "./",
});
