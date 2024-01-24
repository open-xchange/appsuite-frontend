/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

'use strict';

module.exports = function (grunt) {

    grunt.config.merge({
        less: {
            bootstrap: {
                options: { lessrc: '.lessrc' },
                files: [
                    {
                        src: ['node_modules/bootstrap/less/bootstrap.less'],
                        expand: true,
                        rename: function (dest) { return dest; },
                        dest: 'build/apps/io.ox/core/bootstrap/css/bootstrap.min.css'
                    }
                ]
            },
            login: {
                options: {
                    lessrc: '.lessrc',
                    rootpath: grunt.config('oxbase') + '/'
                },
                files: [
                    {
                        src: ['apps/themes/login/login.less'],
                        expand: true,
                        rename: function (dest) { return dest; },
                        dest: 'build/apps/themes/login/login.css'
                    }
                ]
            },
            busy: {
                options: {
                    lessrc: '.lessrc',
                    rootpath: grunt.config('oxbase') + '/'
                },
                files: [
                    {
                        src: ['apps/themes/busy/busy.less'],
                        expand: true,
                        rename: function (dest) { return dest; },
                        dest: 'build/apps/themes/busy/busy.css'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('assemble-less');
};
