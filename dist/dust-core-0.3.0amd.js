//
// Dust - Asynchronous Templating v0.3.0amd
// http://akdubya.github.com/dustjs
//
// Copyright (c) 2010, Aleksander Williams
// Released under the MIT License.
//
// Modifications by Jeff Barczewski
//


/**
 * almond 0.0.3 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
/*jslint strict: false, plusplus: false */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {

    var defined = {},
        waiting = {},
        aps = [].slice,
        main, req;

    if (typeof define === "function") {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseName = baseName.split("/");
                baseName = baseName.slice(0, baseName.length - 1);

                name = baseName.concat(name.split("/"));

                //start trimDots
                var i, part;
                for (i = 0; (part = name[i]); i++) {
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }
        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            main.apply(undef, args);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    main = function (name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, i, ret, map;

        //Use name if no relName
        if (!relName) {
            relName = name;
        }

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Default to require, exports, module if no deps if
            //the factory arg has any arguments specified.
            if (!deps.length && callback.length) {
                deps = ['require', 'exports', 'module'];
            }

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            for (i = 0; i < deps.length; i++) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name]
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw name + ' missing ' + depName;
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef) {
                    defined[name] = cjsModule.exports;
                } else if (!usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {

            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            //Drop the config stuff on the ground.
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = arguments[2];
            } else {
                deps = [];
            }
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function () {
        return req;
    };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (define.unordered) {
            waiting[name] = [name, deps, callback];
        } else {
            main(name, deps, callback);
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("vendor/almond.js", function(){});



define('lib/dust',[],function () {

  var dust = {};

  dust.cache = {};

  dust.register = function(name, tmpl) {
    if (!name) return;
    dust.cache[name] = tmpl;
  };

  dust.render = function(name, context, callback) {
    var chunk = new Stub(callback).head;
    dust.load(name, chunk, Context.wrap(context)).end();
  };

  dust.stream = function(name, context) {
    var stream = new Stream();
    dust.nextTick(function() {
      dust.load(name, stream.head, Context.wrap(context)).end();
    });
    return stream;
  };

  dust.renderSource = function(source, context, callback) {
    return dust.compileFn(source)(context, callback);
  };

  dust.compileFn = function(source, name) {
    var tmpl = dust.loadSource(dust.compile(source, name));
    return function(context, callback) {
      var master = callback ? new Stub(callback) : new Stream();
      dust.nextTick(function() {
        tmpl(master.head, Context.wrap(context)).end();
      });
      return master;
    }
  };

  dust.load = function(name, chunk, context) {
    var tmpl = dust.cache[name];
    if (tmpl) {
      return tmpl(chunk, context);
    } else {
      if (dust.onLoad) {
        return chunk.map(function(chunk) {
          dust.onLoad(name, function(err, src) {
            if (err) return chunk.setError(err);
            if (!dust.cache[name]) dust.loadSource(dust.compile(src, name));
            dust.cache[name](chunk, context).end();
          });
        });
      }
      return chunk.setError(new Error("Template Not Found: " + name));
    }
  };

  dust.loadSource = function(source, path) {
    return eval(source);
  };

  if (Array.isArray) {
    dust.isArray = Array.isArray;
  } else {
    dust.isArray = function(arr) {
      return Object.prototype.toString.call(arr) == "[object Array]";
    };
  }

  dust.nextTick = function(callback) {
    setTimeout(callback, 0);
  }

  dust.isEmpty = function(value) {
    if (dust.isArray(value) && !value.length) return true;
    if (value === 0) return false;
    return (!value);
  };

  dust.filter = function(string, auto, filters) {
    if (filters) {
      for (var i=0, len=filters.length; i<len; i++) {
        var name = filters[i];
        if (name === "s") {
          auto = null;
        } else {
          string = dust.filters[name](string);
        }
      }
    }
    if (auto) {
      string = dust.filters[auto](string);
    }
    return string;
  };

  dust.filters = {
    h: function(value) { return dust.escapeHtml(value); },
    j: function(value) { return dust.escapeJs(value); },
    u: encodeURI,
    uc: encodeURIComponent
  }

  function Context(stack, global, blocks) {
    this.stack  = stack;
    this.global = global;
    this.blocks = blocks;
  }

  dust.makeBase = function(global) {
    return new Context(new Stack(), global);
  }

  Context.wrap = function(context) {
    if (context instanceof Context) {
      return context;
    }
    return new Context(new Stack(context));
  }

  Context.prototype.get = function(key) {
    var ctx = this.stack, value;

    while(ctx) {
      if (ctx.isObject) {
        value = ctx.head[key];
        if (!(value === undefined)) {
          return value;
        }
      }
      ctx = ctx.tail;
    }
    return this.global ? this.global[key] : undefined;
  };

  Context.prototype.getPath = function(cur, down) {
    var ctx = this.stack,
    len = down.length;

    if (cur && len === 0) return ctx.head;
    if (!ctx.isObject) return undefined;
    ctx = ctx.head;
    var i = 0;
    while(ctx && i < len) {
      ctx = ctx[down[i]];
      i++;
    }
    return ctx;
  };

  Context.prototype.push = function(head, idx, len) {
    return new Context(new Stack(head, this.stack, idx, len), this.global, this.blocks);
  };

  Context.prototype.rebase = function(head) {
    return new Context(new Stack(head), this.global, this.blocks);
  };

  Context.prototype.current = function() {
    return this.stack.head;
    };

  Context.prototype.getBlock = function(key) {
    var blocks = this.blocks;

    if (!blocks) return;
    var len = blocks.length, fn;
    while (len--) {
      fn = blocks[len][key];
      if (fn) return fn;
    }
  }

  Context.prototype.shiftBlocks = function(locals) {
    var blocks = this.blocks;

    if (locals) {
      if (!blocks) {
        newBlocks = [locals];
      } else {
        newBlocks = blocks.concat([locals]);
      }
      return new Context(this.stack, this.global, newBlocks);
    }
    return this;
  }

  function Stack(head, tail, idx, len) {
    this.tail = tail;
    this.isObject = !dust.isArray(head) && head && typeof head === "object";
    this.head = head;
    this.index = idx;
    this.of = len;
  }

  function Stub(callback) {
    this.head = new Chunk(this);
    this.callback = callback;
    this.out = '';
  }

  Stub.prototype.flush = function() {
    var chunk = this.head;

    while (chunk) {
      if (chunk.flushable) {
        this.out += chunk.data;
      } else if (chunk.error) {
        this.callback(chunk.error);
        this.flush = function() {};
        return;
      } else {
        return;
      }
      chunk = chunk.next;
      this.head = chunk;
    }
    this.callback(null, this.out);
  }

  function Stream() {
    this.head = new Chunk(this);
  }

  Stream.prototype.flush = function() {
    var chunk = this.head;

    while(chunk) {
      if (chunk.flushable) {
        this.emit('data', chunk.data);
      } else if (chunk.error) {
        this.emit('error', chunk.error);
        this.flush = function() {};
        return;
      } else {
        return;
      }
      chunk = chunk.next;
      this.head = chunk;
    }
    this.emit('end');
  }

  Stream.prototype.emit = function(type, data) {
    var events = this.events;

    if (events && events[type]) {
      events[type](data);
    }
  }

  Stream.prototype.on = function(type, callback) {
    if (!this.events) {
      this.events = {};
    }
    this.events[type] = callback;
    return this;
  }

  function Chunk(root, next, taps) {
    this.root = root;
    this.next = next;
    this.data = '';
    this.flushable = false;
    this.taps = taps;
  }

  Chunk.prototype.write = function(data) {
    var taps  = this.taps;

    if (taps) {
      data = taps.go(data);
    }
    this.data += data;
    return this;
  }

  Chunk.prototype.end = function(data) {
    if (data) {
      this.write(data);
    }
    this.flushable = true;
    this.root.flush();
    return this;
  }

  Chunk.prototype.map = function(callback) {
    var cursor = new Chunk(this.root, this.next, this.taps),
    branch = new Chunk(this.root, cursor, this.taps);

    this.next = branch;
    this.flushable = true;
    callback(branch);
    return cursor;
  }

  Chunk.prototype.tap = function(tap) {
    var taps = this.taps;

    if (taps) {
      this.taps = taps.push(tap);
    } else {
      this.taps = new Tap(tap);
    }
    return this;
  }

  Chunk.prototype.untap = function() {
    this.taps = this.taps.tail;
    return this;
  }

  Chunk.prototype.render = function(body, context) {
    return body(this, context);
  }

  Chunk.prototype.reference = function(elem, context, auto, filters) {
    if (typeof elem === "function") {
      elem = elem(this, context, null, {auto: auto, filters: filters});
      if (elem instanceof Chunk) {
        return elem;
      }
    }
    if (!dust.isEmpty(elem)) {
      return this.write(dust.filter(elem, auto, filters));
    } else {
      return this;
    }
  };

  Chunk.prototype.section = function(elem, context, bodies, params) {
    if (typeof elem === "function") {
      elem = elem(this, context, bodies, params);
      if (elem instanceof Chunk) {
        return elem;
      }
    }

    var body = bodies.block,
    skip = bodies['else'];

    if (params) {
      context = context.push(params);
    }

    if (dust.isArray(elem)) {
      if (body) {
        var len = elem.length, chunk = this;
        for (var i=0; i<len; i++) {
          chunk = body(chunk, context.push(elem[i], i, len));
        }
        return chunk;
      }
    } else if (elem === true) {
      if (body) return body(this, context);
    } else if (elem || elem === 0) {
      if (body) return body(this, context.push(elem));
    } else if (skip) {
      return skip(this, context);
    }
    return this;
  };

  Chunk.prototype.exists = function(elem, context, bodies) {
    var body = bodies.block,
    skip = bodies['else'];

    if (!dust.isEmpty(elem)) {
      if (body) return body(this, context);
    } else if (skip) {
      return skip(this, context);
    }
    return this;
  }

  Chunk.prototype.notexists = function(elem, context, bodies) {
    var body = bodies.block,
    skip = bodies['else'];

    if (dust.isEmpty(elem)) {
      if (body) return body(this, context);
    } else if (skip) {
      return skip(this, context);
    }
    return this;
  }

  Chunk.prototype.block = function(elem, context, bodies) {
    var body = bodies.block;

    if (elem) {
      body = elem;
    }

    if (body) {
      return body(this, context);
    }
    return this;
  };

  Chunk.prototype.partial = function(elem, context) {
    if (typeof elem === "function") {
      return this.capture(elem, context, function(name, chunk) {
        dust.load(name, chunk, context).end();
      });
    }
    return dust.load(elem, this, context);
  };

  Chunk.prototype.helper = function(name, context, bodies, params) {
    return dust.helpers[name](this, context, bodies, params);
  };

  Chunk.prototype.capture = function(body, context, callback) {
    return this.map(function(chunk) {
      var stub = new Stub(function(err, out) {
        if (err) {
          chunk.setError(err);
        } else {
          callback(out, chunk);
        }
      });
      body(stub.head, context).end();
    });
  };

  Chunk.prototype.setError = function(err) {
      this.error = err;
    this.root.flush();
    return this;
  };

  dust.helpers = {
    sep: function(chunk, context, bodies) {
      if (context.stack.index === context.stack.of - 1) {
        return chunk;
      }
      return bodies.block(chunk, context);
    },

    idx: function(chunk, context, bodies) {
        return bodies.block(chunk, context.push(context.stack.index));
    }
    }

  function Tap(head, tail) {
    this.head = head;
    this.tail = tail;
  }

  Tap.prototype.push = function(tap) {
    return new Tap(tap, this);
  };

  Tap.prototype.go = function(value) {
    var tap = this;

    while(tap) {
      value = tap.head(value);
      tap = tap.tail;
    }
    return value;
  };

  var HCHARS = new RegExp(/[&<>\"]/),
  AMP    = /&/g,
  LT     = /</g,
  GT     = />/g,
  QUOT   = /\"/g;

  dust.escapeHtml = function(s) {
    if (typeof s === "string") {
      if (!HCHARS.test(s)) {
        return s;
      }
      return s.replace(AMP,'&amp;').replace(LT,'&lt;').replace(GT,'&gt;').replace(QUOT,'&quot;');
    }
    return s;
  };

  var BS = /\\/g,
  CR = /\r/g,
  LS = /\u2028/g,
  PS = /\u2029/g,
  NL = /\n/g,
  LF = /\f/g,
  SQ = /'/g,
  DQ = /"/g,
  TB = /\t/g;

  dust.escapeJs = function(s) {
    if (typeof s === "string") {
      return s
        .replace(BS, '\\\\')
        .replace(DQ, '\\"')
        .replace(SQ, "\\'")
        .replace(CR, '\\r')
        .replace(LS, '\\u2028')
        .replace(PS, '\\u2029')
        .replace(NL, '\\n')
        .replace(LF, '\\f')
        .replace(TB, "\\t");
    }
    return s;
  };

  return dust;
});

