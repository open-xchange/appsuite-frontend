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

    grunt.config.extend('compile-handlebars', {

        build_less: {
            partials: ['lib/node_modules/less/lib/less/*.js'],
            helpers: ['lib/helpers/*.js'],
            files: [
                {
                    expand: true,
                    cwd: 'apps/',
                    src: '**/*.hbs',
                    dest: 'build/apps/',
                    ext: '.js'
                }
            ]
        }
    });

    grunt.registerTask('build',
        ['copy_build', 'compile_po', 'newer:compile-handlebars', 'newer:concat', 'newer:less']);

    grunt.registerTask('dist:build', 'build a distribution ready version into dist/',
        ['clean', 'build', 'copy_dist', 'uglify']
    );

    grunt.loadNpmTasks('grunt-compile-handlebars');
};

