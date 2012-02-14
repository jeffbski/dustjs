/*global define:true */

if (typeof define !== 'function') {
  var define = require('../vendor/amdefine')(module);
}

/**
   load dust with full compiler and parser
  */

define(['./core', './compiler', './parser'],
       function (dust, compiler, parser) {

  compiler(dust); // augment dust with compiler functions
  dust.parse = parser.parse; // augment dust with parser
         
  return dust;
});