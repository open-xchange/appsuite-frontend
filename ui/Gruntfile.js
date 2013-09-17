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
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            all: {
                files: ['<%= jshint.all.src %>'],
                tasks: ['jshint'],
                options: { nospawn: true }
            }
        },
        clean: ['build/'],
        jshint: {
            all: {
                src: ['Gruntfile.js', 'apps/**/*.js'],
                options: {
                    jshintrc: '.jshintrc',
                    ignores: ['apps/io.ox/core/date.js'] // date.js has some funky include stuff we have to figure out
                }
            }
        }
    });

    grunt.event.on('watch', function (action, filepath) {
        grunt.config(['jshint', 'all', 'src'], [filepath]);
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['jshint']);
};
