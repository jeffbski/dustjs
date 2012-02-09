({
  baseUrl: "../",
  optimize: "none",
  wrap: false,
  name: "vendor/almond.js",
  include: [
    "lib/dust",
    "lib/compiler",
    "lib/parser"
  ],
  out: "../dist/dust-full.js"
})