if (typeof define !== 'function') {
  var define = require('../vendor/amdefine')(module);
}

define(function (require, exports, module) {


  var path = require('path'),
    parser = require('./parser'),
    compiler = require('./compiler'),
    vm = require('vm');

  module.exports = function (dust) {
    compiler.parse = parser.parse;
    dust.compile = compiler.compile;

    dust.loadSource = function (source, path) {
      return vm.runInNewContext(source, {dust: dust}, path);
    };

    dust.nextTick = process.nextTick;

    // expose optimizers in commonjs env too
    dust.optimizers = compiler.optimizers;
  };

});