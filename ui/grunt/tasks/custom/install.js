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

    // Copy files into some arbitrary directory
    grunt.config.extend('copy', {
        local_install_help: {
            files: [{
                expand: true,
                src: 'help/**/*',
                cwd: 'dist/<%= pkg.name %>-<%= pkg.version %>/',
                filter: 'isFile',
                dest: grunt.option('dest')
            }]
        },
        local_install_help_drive: {
            files: [{
                expand: true,
                src: 'help-drive/**/*',
                cwd: 'dist/<%= pkg.name %>-<%= pkg.version %>/',
                filter: 'isFile',
                dest: grunt.option('dest')
            }]
        }
    });

    grunt.registerTask('install:help', 'install help directory into a custom location', function () {
        if (!grunt.option('dest')) {
            grunt.fail.fatal('Need --dest option to be set');
        }
        grunt.task.run('copy:local_install_help');
    });
    grunt.registerTask('install:help-drive', 'install drive help directory into a custom location', function () {
        if (!grunt.option('dest')) {
            grunt.fail.fatal('Need --dest option to be set');
        }
        grunt.task.run('copy:local_install_help_drive');
    });
};
