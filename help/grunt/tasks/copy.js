/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

'use strict';
module.exports = function (grunt) {

    grunt.config.merge({ copy: {
        build_thirdparty: {
            files: [{
                src: ['bootstrap.min.js'],
                expand: true,
                cwd: 'node_modules/bootstrap/dist/js',
                dest: 'build/help'
            }, {
                src: ['jquery.min.js'],
                expand: true,
                cwd: 'node_modules/jquery/dist',
                dest: 'build/help'
            }]
        },
        build_help: {
            files: [
                {
                    src: ['help/**/*'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                }
            ]
        },
        dist_help: {
            files: [
                {
                    src: ['help/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'build/',
                    dest: 'dist/appsuite/'
                }
            ]
        },
        local_install_static: {
            files: [
                {
                    src: ['**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'dist/',
                    dest: grunt.option('htdoc')
                }
            ]
        }
    } });

    // add dist l10n copy tasks
    grunt.registerTask('install:languages', []);
    grunt.loadNpmTasks('grunt-contrib-copy');
};
