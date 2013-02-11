
// jQuery AMD fix
define('jquery', function () { return $; });

/**
 * Asynchronous define (has same signature than define)
 * Callback must return deferred object.
 */
define.async = (function () {

    var getLoader = function (name, deps, callback) {
            return function (n, req, onLoad, config) {
                // resolve module dependencies
                req(deps, function () {
                    // get module (must return deferred object)
                    var def = callback.apply(null, arguments);
                    if (def && def.done) {
                        def.done(onLoad);
                    } else {
                        console.error('Module "' + name + '" does not return a deferred object!');
                    }
                    name = deps = callback = null;
                });
            };
        };

    return function (name, deps, callback) {
        // use loader plugin to defer module definition
        var wrapper = null;
        if (ox.manifests) {
            wrapper = ox.manifests.wrapperFor(name, deps, callback);
        } else {
            wrapper = {
                dependencies: deps,
                definitionFunction: callback
            };
        }
        define(name + ':init', { load: getLoader(name, wrapper.dependencies, wrapper.definitionFunction) });
        // define real module - will wait for promise
        define(name, [name + ':init!'], _.identity);
    };
}());

/**
* module definitions can be extended by plugins
**/
(function () {

    var originalDefine = define;

    window.define = function () {
        if (!ox.manifests) {
            return originalDefine.apply(this, arguments);
        }
        // Is this a define statement we understand?
        if (_.isString(arguments[0])) {
            var name = arguments[0];
            var dependencies = arguments[1];
            var definitionFunction = $.noop;
            if (_.isFunction(dependencies)) {
                definitionFunction = dependencies;
                dependencies = [];
            } else if (arguments.length > 2) {
                definitionFunction = arguments[2];
            }
            // already defined?
            if (!requirejs.defined(name)) {
                var wrapper = ox.manifests.wrapperFor(name, dependencies, definitionFunction);
                return originalDefine(name, wrapper.dependencies, wrapper.definitionFunction);
            } else {
                return;
            }
        }

        // Just delegate everything else
        return originalDefine.apply(this, arguments);
    };

    $.extend(window.define, originalDefine);

})();
