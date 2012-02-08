var peg  = require('pegjs'),
    fs   = require('fs'),
    path = require('path'),
    root = path.join(path.dirname(__filename), "..");

var parser = peg.buildParser(fs.readFileSync(path.join(root, 'src', 'dust.pegjs'), 'utf8'));

fs.writeFileSync(path.join(root, 'lib', 'parser.js'),
  "if (typeof define !== 'function') { var define = require('../vendor/amdefine')(module); }\n\n" +
  "define(['./dust'], function (dust) {\n\n" +
  "var parser = " +
  parser.toSource().replace('this.SyntaxError', 'SyntaxError') + ";\n\n" +
  "dust.parse = parser.parse;\n\n" +
  "  return dust;\n});"
);







