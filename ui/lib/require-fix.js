
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
        if (ox.manifests) {
            deps = ox.manifests.withPluginsFor(name, deps);
        }
        define(name + ':init', { load: getLoader(name, deps, callback) });
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
            return originalDefine.apply(this, $.makeArray(arguments));
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
            if (name === 'io.ox/core/notifications') {
                console.log(dependencies, ox.manifests.withPluginsFor(name, dependencies));
                return originalDefine(name, ox.manifests.withPluginsFor(name, dependencies), definitionFunction);
            } else {
                return originalDefine(name, ox.manifests.withPluginsFor(name, dependencies), definitionFunction);
            }
        }

        // Just delegate everything else
        return originalDefine.apply(this, $.makeArray(arguments));
    };

    $.extend(window.define, originalDefine);

})();
