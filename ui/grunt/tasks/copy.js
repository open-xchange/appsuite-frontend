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
        build_static: {
            files: [
                {
                    src: ['.*', '*', '!*.hbs', '!{core_*,index,signin}.html'],
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
                    src: ['apps/**/*.{json,yml,tmpl}', '!apps/io.ox/core/date/*.json', '!apps/**/manifest.json'],
                    dest: 'build/'
                }
            ]
        },
        build_dateData: {
            files: [
                {
                    src: ['apps/io.ox/core/date/*.json'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                }
            ]
        },
        build_specs: {
            files: [
                {
                    src: ['spec/**/*.js'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                },
                {
                    src: ['spec/fixtures/**/*'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                }
            ]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
};
