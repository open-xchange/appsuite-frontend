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
            tasks: ['manifests', 'force_update'],
            options: { livereload: true }
        },
        karma: {
            files: ['spec/**/*_spec.js'],
            tasks: ['newer:jshint:specs', 'newer:concat:specs', 'karma:unit:run']
        },
        less: {
            files: ['apps/**/*.less', 'bower_components/**/*.less'],
            tasks: ['newer:less', 'force_update'],
            options: { livereload: true }
        },
        bootjs: {
            files: ['src/*.js'],
            tasks: ['concat:bootjs', 'force_update'],
            options: { livereload: true }
        },
        all: {
            files: ['Gruntfile.js', 'grunt/tasks/*.js', 'apps/**/*.js', 'bower_components/**/*.js'],
            tasks: ['default'],
            options: { livereload: true }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
};
