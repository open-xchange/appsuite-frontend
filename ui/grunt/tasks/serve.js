module.exports = function (grunt) {
    var key = grunt.config('local.appserver.key');
    var cert = grunt.config('local.appserver.cert');
    var ca = grunt.config('local.appserver.ca');

    if (key && grunt.file.exists(key)) key = grunt.file.read(key);
    if (cert && grunt.file.exists(cert)) cert = grunt.file.read(cert);
    if (ca && grunt.file.exists(ca)) ca = grunt.file.read(ca);
    grunt.config.set('connect.server.options.key', key || grunt.file.read('ssl/host.key').toString());
    grunt.config.set('connect.server.options.cert', cert || grunt.file.read('ssl/host.crt').toString());
    grunt.config.set('connect.server.options.ca', ca || grunt.file.read('ssl/rootCA.crt').toString());

    if (grunt.isPeerDependencyInstalled('appserver') && grunt.isPeerDependencyInstalled('@open-xchange/mock-middleware')) {
        var _ = require('underscore'),
            mockMiddleware = require('@open-xchange/mock-middleware/src/server')({
                proxy: false,
                path: 'nightwatch/fixtures',
                standalone: false
            });

        grunt.config.set('connect.server.options.middleware', _.wrap(grunt.config.get('connect.server.options.middleware'), function (func, connect, options, middlewares) {
            var mws = func.call(this, connect, options, middlewares);
            if (this.flags.mock === true) mws.unshift(mockMiddleware);
            return mws;
        }));
    }
};
