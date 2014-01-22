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

    grunt.config('assemble', {

        options: {
            version: '<%= pkg.version %>-<%= pkg.revision %>.' + grunt.template.date(new Date(), 'yyyymmdd.hhMMss'),
            enable_debug: String(grunt.option('debug') ? grunt.option('debug') : false),
            revision: '<%= pkg.revision %>',
            base: 'v=<%= assemble.options.version %>'
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
        },
        appcache: {
            options: {
                layout: false,
                ext: '.appcache'
            },
            files: [
                {
                    src: ['*.appcache.hbs'],
                    expand: true,
                    cwd: 'html/',
                    ext: '.appcache',
                    dest: 'build/'
                }
            ]
        }

    });

    grunt.loadNpmTasks('assemble');
};
