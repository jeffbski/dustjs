({
  baseUrl: "../",
  optimize: "none",
  name: "dust",
  include: [
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