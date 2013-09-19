/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

'use strict';

module.exports = function (grunt) {

    var srcFiles = ['Gruntfile.js', 'apps/**/*.js'],
        jsonFiles = ['apps/**/*.json'];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            options: {
                interrupt: true,
                spawn: true
            },
            jsonlint: {
                files: jsonFiles,
                tasks: ['newer:jsonlint:manifests']
            },
            all: {
                files: ['<%= jshint.all.src %>'],
                tasks: ['newer:jshint:all'],
                options: { nospawn: true }
            }
        },
        clean: ['build/', 'node_modules/grunt-newer/.cache'],
        jshint: {
            all: {
                src: srcFiles,
                options: {
                    jshintrc: '.jshintrc',
                    ignores: ['apps/io.ox/core/date.js'] // date.js has some funky include stuff we have to figure out
                }
            }
        },
        jsonlint: {
            manifests: {
                src: jsonFiles
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-newer');

    grunt.registerTask('lint', ['newer:jshint:all', 'newer:jsonlint:manifests']);

    grunt.registerTask('default', ['lint']);
};
