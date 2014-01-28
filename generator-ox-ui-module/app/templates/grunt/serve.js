'use strict';

module.exports = function (grunt) {

    grunt.config('serve', {

        options: {
            prefixes: ['build/', 'build/apps'],
            manifests: ['build/manifests/']
        }
    });

    grunt.registerTask('serve', 'Use the appserver to serve your apps', function () {
        this.async(); // run forever
        var server = require('../../lib/appserver/server.js');
        var _ = require('underscore');
        var config = _.extend(this.options(), grunt.config().local.appserver);

        server.create(config);
    });
};
