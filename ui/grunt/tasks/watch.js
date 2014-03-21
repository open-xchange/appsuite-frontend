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
            interval: 500,
            interrupt: true,
            debounceDelay: 500
        },
        manifests: {
            files: ['apps/**/*.json', '!apps/io.ox/core/date/*'],
            tasks: ['manifests', 'force_update'],
            options: { livereload: true }
        },
        karma: {
            files: ['spec/**/*.js'],
            tasks: ['newer:jshint:specs', 'newer:copy:specs', 'karma:unit:run']
        },
        configs: {
            options: { reload: true },
            files: [
                'Gruntfile.js',
                'grunt/tasks/*.js'
            ],
            tasks: ['default']
        },
        all: {
            files: [
                'apps/**/*.{js,less}',
                'src/*',
                'lib/**/*.js',
                'bower.json',
                'package.json'
            ],
            tasks: ['default', 'karma:unit:run'],
            options: { livereload: true }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
};
