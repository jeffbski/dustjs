({
  baseUrl: "../",
  optimize: "none",
  wrap: false,
  name: "vendor/almond.js",
  include: [
    "dust",
    "compiler",
    "parser"
  ],
  paths: {
    "dust": "lib/dust",
    "compiler": "lib/compiler",
    "parser": "lib/parser"  
  },
  out: "../dist/dust-full.js"
})