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

    grunt.config('watch', {

        options: {
            interrupt: true,
            spawn: true
        },
        manifests: {
            files: 'apps/**/manifest.json',
            tasks: ['manifests']
        },
        karma: {
            files: ['spec/**/*_spec.js', 'build/core'],
            tasks: ['newer:jshint:specs', 'newer:concat:specs', 'karma:unit:run']
        },
        less: {
            files: 'apps/**/*.less',
            tasks: ['less']
        },
        bootjs: {
            files: ['src/*.js'],
            tasks: ['concat:bootjs', 'uglify:bootjs']
        },
        all: {
            files: ['<%= jshint.all.src %>'],
            tasks: ['default'],
            options: { nospawn: true }
        },
        livereload: {
            options: { livereload: true, nospawn: true },
            files: ['build/core.appcache']
        }

    });

    grunt.loadNpmTasks('grunt-contrib-watch');
};
