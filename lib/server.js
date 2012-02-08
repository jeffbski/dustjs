if (typeof define !== 'function') {
  var define = require('../vendor/amdefine')(module);
}

define(['./dust', './parser', './compiler', 'path', 'vm'],
       function (dust, parser, compiler, path, vm) {

  compiler.parse = parser.parse;
  dust.compile = compiler.compile;

  dust.loadSource = function (source, path) {
    return vm.runInNewContext(source, {dust: dust}, path);
  };

  dust.nextTick = process.nextTick;
  
  // expose optimizers in commonjs env too
  dust.optimizers = compiler.optimizers;

  return dust;
});