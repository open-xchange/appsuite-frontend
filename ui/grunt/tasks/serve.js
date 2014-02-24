/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

'use strict';

module.exports = function (grunt) {
    var appserver = require('appserver');

    grunt.config('connect', {
        server: {
            options: {
                port: 8337,
                base: ['build/'],
                livereload: true,
                middleware: function (connect, options, middlewares) {
                    var config = grunt.config().local.appserver;
                    if (config.server === '') {
                        grunt.log.error('Server not specified in grunt/local.conf.json');
                        grunt.log.writeln('Hint: If this is a new setup you may want to copy the file grunt/local.conf.defaults.json to grunt/local.conf.json and change its values according to your setup.');
                        grunt.fail.fatal('Please adjust your local.conf.json');
                    }

                    config.prefixes = (config.prefixes || []).concat([options.base, options.base + '/apps/']);
                    config.manifests = (config.manifests || []).concat(options.base + '/manifests/');
                    config = appserver.tools.unifyOptions(config);

                    middlewares.push(appserver.middleware.appsload(config));
                    middlewares.push(appserver.middleware.manifests(config));
                    middlewares.push(appserver.middleware.localfiles(config));
                    middlewares.push(appserver.middleware.proxy(config));
                    return middlewares;
                }
            }
        }
    });

    grunt.registerTask('serve', ['connect:server:keepalive']);

    grunt.loadNpmTasks('grunt-contrib-connect');
};
