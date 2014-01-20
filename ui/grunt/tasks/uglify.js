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

module.exports = function(grunt) {

    grunt.config('uglify', {

        bootjs: {
            options: {
                sourceMap: 'build/maps/boot.js.map',
                sourceMapRoot: '/appsuite/<%= assemble.options.base %>',
                sourceMappingURL: '/appsuite/<%= assemble.options.base %>/maps/boot.js.map',
                sourceMapPrefix: 1
            },
            files: {
                'build/boot.js': ['build/src/boot.js']
            }
        },

        apps: {
            options: {
                sourceMap: function (path) { return path.replace(/^build\//, 'build/maps/').replace(/\.js$/, '.js.map'); },
                sourceMapRoot: '/appsuite/<%= assemble.options.base %>',
                sourceMappingURL: function (path) { return '/appsuite/' + grunt.config.get('assemble.options.base') + path.replace(/^build\//, '/maps/').replace(/\.js$/, '.js.map'); },
                sourceMapPrefix: 1
            },
            files: [{
                src: 'apps/**/*.js',
                cwd: 'build/src/',
                dest: 'build/',
                filter: 'isFile',
                expand: true
            }]
        }

    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
};
