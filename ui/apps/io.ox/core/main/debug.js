define('io.ox/core/main/debug', [
], function () {
    // enable special logging to investigate why boot fails
    var debug = $.noop;

    if (/\bcore/.test(_.url.hash('debug'))) {
        debug = function () {
            var args = _(arguments).toArray(), t = _.now() - ox.t0;
            args.unshift('core (' + (t / 1000).toFixed(1) + 's): ');
            console.log.apply(console, args);
        };
    }

    return debug;
});
