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

    var momentLanguages = [];
    grunt.file.expand({ cwd: 'bower_components/moment/locale/' }, '*.js').forEach(function (file) {
        momentLanguages.push(file.split('.').shift());
    });

    grunt.config.merge({
        assemble: {
            options: {
                version: '<%= pkg.version %>.' + grunt.template.date(new Date(), 'yyyymmdd.hhMMss'),
                revision: '<%= String(pkg.version.slice(pkg.version.indexOf("-") + 1)) %>',
                enable_debug: '<%= String(local.debug) %>',
                base: 'v=<%= assemble.options.version %>',
                cap: '<%= String(local.cap || "") %>',
                momentLanguages:  '["' + momentLanguages.join('","') + '"]'
            },
            base: {
                options: {
                    layout: false,
                    ext: '',
                    partials: ['html/core_*.html']
                },
                files: [
                    {
                        src: ['index.html'],
                        expand: true,
                        cwd: 'html/',
                        rename: function (dest) {
                            return dest;
                        },
                        dest: 'build/ui'
                    },
                    {
                        src: ['index.html'],
                        expand: true,
                        cwd: 'html/',
                        rename: function (dest) {
                            return dest;
                        },
                        dest: 'build/core'
                    },
                    {
                        src: ['index.html'],
                        expand: true,
                        cwd: 'html/',
                        rename: function (dest) {
                            return dest;
                        },
                        dest: 'build/signin'
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
