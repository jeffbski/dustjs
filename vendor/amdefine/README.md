# amdefine

A module that can be used to implement AMD's define() in Node. This allows you
to code to the AMD API and have the module work in node programs without
requiring those other programs to use AMD.

## Usage

**1)** Update your package.json to indicate amdefine as a dependency:

```javascript
    "dependencies": {
        "amdefine": ">=0.0.1"
    }
```

Then run `npm install` to get amdefine into your project.

**2)** At the top of each module that uses define(), place this code:

```javascript
    if (typeof define !== 'function') { var define = require('amdefine')(module) }
```

**Only use this snippet** for loading amdefine. If you preserve the basic structure,
with the braces, it will be stripped out when using the [RequireJS optimizer](#optimizer).

You can add spaces, line breaks and even require amdefine with a local path, but
keep the rest of the structure to get the stripping behavior.

If you want to deliver amdefine.js with your code but not use the npm/node_modules-installed
option, then just download the latest release and refer to it using a relative path:

[Version 0.0.1](https://github.com/jrburke/amdefine/raw/0.0.1/amdefine.js)

## define() usage

It is best if you use the anonymous forms of define() in your module:

```javascript
    define(function (require) {
        var dependency = require('dependency');
    });
```

or

```javascript
    define(['dependency'], function (dependency) {

    });
```

## RequireJS optimizer integration. <a name="optimizer"></name>

Version 1.0.3 of the [RequireJS optimizer](http://requirejs.org/docs/optimization.html)
will have support for stripping the `if (typeof define !== 'function')` check
mentioned above, so you can include this snippet for code that runs in the
browser, but avoid taking the cost of the if() statement once the code is
optimized for deployment.

## Limitations

### Synchronous vs Asynchronous

amdefine creates a define() function that is callable by your code. It will
execute and trace dependencies and call the factory function *synchronously*,
to keep the behavior in line with Node's synchronous dependency tracing.

The exception: calling AMD's callback-style require() from inside a factory
function. The require callback is called on process.nextTick():

```javascript
    define(function (require) {
        require(['a'], function(a) {
            //'a' is loaded synchronously, but
            //this callback is called on process.nextTick().
        });
    });
```

### Loader Plugins

Loader plugins are supported as long as they call their load() callbacks
synchronously. So ones that do network requests will not work. However plugins
like [text](http://requirejs.org/docs/api.html#text) can load text files locally.

The plugin API's `load.fromText()` is **not supported** in amdefine, so this means
transpiler plugins like the [CoffeeScript loader plugin](https://github.com/jrburke/require-cs)
will not work. This may be fixable, but it is a bit complex, and I do not have
enough node-fu to figure it out yet. See the source for amdefine.js if you want
to get an idea of the issues involved.

## Tests

To run the tests, cd to **tests** and run:

    node all.js

## License

New BSD and MIT. Check the LICENSE file for all the details.
