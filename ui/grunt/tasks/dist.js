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

    grunt.config.extend('copy', {
        dist: {
            files: [
                {
                    expand: true,
                    src: ['apps/**/*', 'manifests/**/*', '*.*', '{core,signin}', '.*'],
                    cwd: 'build/',
                    dest: 'dist/<%= pkg.name %>-<%= pkg.version %>/'
                },
                {
                    src: ['help/**/*', 'help-drive/**/*', 'bower_components/**/*', 'bin/touch-appsuite', 'readme.txt', '.htaccess', 'apps/themes/.htaccess'],
                    dest: 'dist/<%= pkg.name %>-<%= pkg.version %>/'
                },
                {
                    src: ['debian/**/*', '*.spec'],
                    dest: 'dist/package/'
                }
            ]
        },
        dist_i18n: {
            files: [
                {
                    src: ['i18n/**/*.po'],
                    dest: 'dist/<%= pkg.name %>-<%= pkg.version %>/',
                    filter: function (f) {
                        //filter all languages that should not be packaged
                        //those will have something like ""X-Package: no\n"" in their header
                        var content = grunt.file.read(f),
                            included = !/^\s*"X-Package: (?:off|no|false|0)(?:\\n)?"\s*$/im.test(content);
                        if (!included) {
                            grunt.verbose.writeln('Filtered file: ', f);
                        }
                        return included;
                    }
                }
            ]
        }
    });
};
