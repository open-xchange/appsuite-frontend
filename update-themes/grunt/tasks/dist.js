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
        local_install_dynamic: {
            options: {
                mode: true
            },
            files: [{
                expand: true,
                src: ['**/*'],
                cwd: 'dist/',
                filter: 'isFile',
                dest: grunt.option('prefix')
            }]
        },
        dist_custom: {
            options: {
                mode: true
            },
            files: [
                {
                    src: [
                        'bin/update-themes',
                        'lib/**/*',
                        'node_modules/grunt/**/*',
                        'node_modules/grunt-contrib-clean/**/*',
                        'node_modules/assemble-less/**/*',
                        'node_modules/underscore/**/*',
                        'bower_components/**/*'],
                    dest: 'dist/appsuite/share/update-themes/'
                },
                {
                    expand: true,
                    src: ['update-themes.sh'],
                    cwd: 'bin/',
                    dest: 'dist/appsuite/share'
                }
            ]
        }
    });

};
