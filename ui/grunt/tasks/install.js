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

    var staticSrc = grunt.config('copy.local_install_static.files.0.src');
    staticSrc.push('appsuite/**/.htaccess');
    staticSrc.push('appsuite/static/**/*');
    staticSrc.push('sbin/touch-appsuite');
    grunt.config('copy.local_install_static.files.0.src', staticSrc);

    //exclude language properties files from main install target
    var dynamicSrc = grunt.config('copy.local_install_dynamic.files.0.src');
    dynamicSrc.push('!etc/languages/**/*');
    dynamicSrc.push('!appsuite/static/**/*');
    dynamicSrc.push('!sbin/touch-appsuite');
    grunt.config('copy.local_install_dynamic.files.0.src', dynamicSrc);

    // add language properties file to each language package, override the default "Lang" copy task
    var languages = grunt.file.expand('i18n/*.po').map(function (fileName) {
        return fileName.match(/([a-zA-Z]+_[a-zA-Z]+).po$/)[1];
    });
    languages.forEach(function (Lang) {
        var config = {},
            prefix = grunt.option('prefix') || 'no_prefix_set/',
            lang = Lang.toLowerCase().replace(/_/g, '-');

        config['local_install_' + Lang] = {
            files: [{
                src: ['etc/languages/appsuite/*-' + lang + '.properties'],
                expand: true,
                filter: 'isFile',
                cwd: 'dist/',
                dest: prefix
            }]
        };

        grunt.config.merge({
            copy: config
        });
    });

    grunt.registerTask('install:languages', languages.map(function (l) { return 'copy:local_install_' + l; }));

};
