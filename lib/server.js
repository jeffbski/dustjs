/*global define:true */

if (typeof define !== 'function') {
  var define = require('../vendor/amdefine')(module);
}

define(['./full', 'path', 'vm'],
       function (dust, path, vm) {

  dust.loadSource = function (source, path) {
    return vm.runInNewContext(source, {dust: dust}, path);
  };

  dust.nextTick = process.nextTick;
  
  return dust;
});