/*global define:true */

if (typeof define !== 'function') {
  var define = require('../vendor/amdefine')(module);
}

/**
   load dust only with core functionality
  */

define(['core'],
       function (dust) {

  return dust;
});