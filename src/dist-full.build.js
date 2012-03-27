({
  baseUrl: "..",
  optimize: "none",
  packages: [
    {
      name: "dust",
      location: "lib",
      main: "full"
    }
  ],
  paths: {
    "compiler": "lib/compiler",
    "parser": "lib/parser"
  },  
  name: "dust",
  include: [
     "compiler",
     "parser"
  ],
  out: "../dist/dust-full.js"
})