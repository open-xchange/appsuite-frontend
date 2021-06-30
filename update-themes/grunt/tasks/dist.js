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
                    expand: true,
                    src: [
                        'package.json',
                        'lib/**/*',
                        '!lib/rhino/**/*'],
                    dest: 'dist/appsuite/share/update-themes/',
                    filter: function (f) {
                        return !/\.bak$/.test(f);
                    }
                },
                {
                    expand: true,
                    src: ['**/*'],
                    dest: 'dist/appsuite/share/update-themes/node_modules',
                    cwd: 'deps/',
                    filter: function (f) {
                        return !/\.bak$/.test(f);
                    }
                },
                {
                    expand: true,
                    src: ['share/**/*'],
                    cwd: 'build/',
                    dest: 'dist/appsuite/'
                }
            ]
        },
        dist_executables: {
            options: {
                mode: parseInt('755', 8) //0755 is not allowed in strict mode o.O
            },
            files: [
                {
                    src: ['bin/update-themes'],
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
