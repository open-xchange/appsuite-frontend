/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

    var momentLanguages = [];
    grunt.file.expand({ cwd: 'node_modules/moment/locale/' }, '*.js').forEach(function (file) {
        momentLanguages.push(file.split('.').shift());
    });

    var buildDate = grunt.template.date(new Date(), 'yyyymmdd.hhMMss'),
        pkgVersion = process.env.VERSION || grunt.config('pkg.version'),
        version = String(pkgVersion + '.' + buildDate);

    grunt.config('pkg.buildDate', buildDate);

    var process_options = {
        version: version,
        revision: String(pkgVersion.split('-')[1] || process.env.CI_COMMIT_SHORT_SHA || ''),
        enable_debug: String(grunt.config('local.debug')),
        base: 'v=' + version,
        cap: String(grunt.config('local.cap') || ''),
        momentLanguages:  '[\'' + momentLanguages.join('\',\'') + '\']'
    };

    grunt.config.set('oxbase', process_options.base);

    grunt.config.merge({
        'copy': {
            build_base: {
                options: {
                    process: function (content, srcpath) {
                        if (/.html$/.test(srcpath)) {
                            content = content
                                .replace(/<!--[\s\S]*?-->/g, '') // remove html comments
                                .replace(/\/\*([\s\S]*?)\*\//g, '') // remove js comments
                                .replace(/\s{2,}/g, '') // remove spacing
                                .replace(/\n/g, '') + '\n'; // strip nl
                        }
                        return grunt.template.process(content, { data: process_options });
                    }
                },
                files: [
                    {
                        src: 'html/index.html',
                        dest: 'build/ui'
                    },
                    {
                        src: 'html/index.html',
                        dest: 'build/core'
                    },
                    {
                        src: 'html/index.html',
                        dest: 'build/signin'
                    },
                    {
                        src: 'html/busy.html',
                        dest: 'build/busy.html'
                    }
                ]
            },
            build_ox: {
                options: {
                    process: function (content) {
                        return grunt.template.process(content, { data: process_options });
                    }
                },
                files: [
                    {
                        src: 'src/ox.ejs',
                        dest: 'build/ox.js'
                    }
                ]
            },
            build_static: {
                files: [
                    {
                        src: ['.*', '*', '!*.{ejs,hbs}', '!{core_*,index,signin,busy}.html'],
                        expand: true,
                        cwd: 'html/',
                        dest: 'build/'
                    },
                    {
                        src: ['o{n,ff}line.js'],
                        expand: true,
                        cwd: 'src/',
                        dest: 'build/'
                    },
                    {
                        src: ['src/browser.js'],
                        expand: true,
                        dest: 'build/'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
};
