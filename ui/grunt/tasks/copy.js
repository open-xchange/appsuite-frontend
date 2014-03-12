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
        static: {
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
                    src: ['apps/**/*.json', '!apps/io.ox/core/date/*.json', '!apps/**/manifest.json'],
                    dest: 'build/'
                }
            ]
        },
        apps: {
            files: [
                {
                    src: ['apps/**/*.js'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                }
            ]
        },
        dateData: {
            files: [
                {
                    src: ['apps/io.ox/core/date/*.json'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                }
            ]
        },
        specs: {
            files: [
                {
                    src: ['spec/**/*.js'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                }
            ]
        },
        themes: {
            files: [
                {
                    expand: true,
                    src: ['**/*.{png,gif,ico,less,css}'],
                    cwd: 'apps/',
                    dest: 'build/apps/',
                    filter: 'isFile'
                }
            ]
        }
    });

    grunt.registerTask('copy_build', [
        'newer:copy:static',
        'newer:copy:apps',
        'newer:copy:dateData',
        'newer:copy:themes',
        'newer:copy:tinymce',
        'newer:copy:thirdparty'
    ]);

    grunt.loadNpmTasks('grunt-contrib-copy');
};
