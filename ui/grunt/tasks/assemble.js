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

    grunt.config.merge({
        assemble: {
            options: {
                version: '<%= pkg.version %>.' + grunt.template.date(new Date(), 'yyyymmdd.hhMMss'),
                revision: '<%= String(pkg.version.slice(pkg.version.indexOf("-") + 1)) %>',
                enable_debug: '<%= String(local.debug) %>',
                base: 'v=<%= assemble.options.version %>',
                cap: '<%= String(local.cap || "") %>',
            },
            base: {
                options: {
                    layout: false,
                    ext: '',
                    partials: ['html/core_*.html']
                },
                files: [
                    {
                        src: ['index.html', 'signin.html'],
                        expand: true,
                        cwd: 'html/',
                        rename: function (dest, matchedSrcPath) {
                            var map = {
                                'index.html': 'core',
                                'signin.html': 'signin'
                            };
                            return dest + map[matchedSrcPath];
                        },
                        dest: 'build/'
                    }
                ]
            },
            ox: {
                options: {
                    layout: false,
                    ext: ''
                },
                files: [
                    {
                        src: ['ox.js.hbs'],
                        expand: true,
                        cwd: 'src/',
                        dest: 'build/'
                    }
                ]
            }
        }
    });

    grunt.registerTask('assemble_build', ['newer:assemble:base', 'newer:assemble:ox']);

    grunt.loadNpmTasks('assemble');
};
