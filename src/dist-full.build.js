({
  baseUrl: "../",
  optimize: "none",
  name: "dust",
  include: [
     "core",
     "compiler",
     "parser"
  ],
  paths: {
    "core": "lib/core",
    "compiler": "lib/compiler",
    "parser": "lib/parser",  
    "dust": "lib/full"
  },
  out: "../dist/dust-full.js"
})