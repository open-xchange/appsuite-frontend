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

    var momentLanguages = [];
    grunt.file.expand({ cwd: 'bower_components/moment/locale/' }, '*.js').forEach(function (file) {
        momentLanguages.push(file.split('.').shift());
    });

    var version = String(grunt.config('pkg.version') + '.' + grunt.template.date(new Date(), 'yyyymmdd.HHMMss'));

    var process_options = {
        version: version,
        revision: String(grunt.config('pkg.version').slice(grunt.config('pkg.version').indexOf('-') + 1)),
        enable_debug: String(grunt.config('local.debug')),
        base: 'v=' + version,
        cap: String(grunt.config('local.cap') || ''),
        momentLanguages:  '[\'' + momentLanguages.join('\',\'') + '\']'
    };

    grunt.config.set('oxbase', process_options.base);

    grunt.config.merge({
        'copy': {
            base: {
                options: {
                    process: function (content, srcpath) {
                        if (/.html$/.test(srcpath)) {
                            content = content
                                .replace(/<!--[\s\S]*?-->/g, '') // remove html comments
                                .replace(/\/\*([\s\S]*?)\*\//g, '') // remove js comments
                                .replace(/\s{2,}/g, '') // remove spacing
                                .replace(/\'/g, '"') // replace single quotes
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
                    }
                ]
            },
            ox: {
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
                        src: ['.*', '*', '!*.{ejs,hbs}', '!{core_*,index,signin}.html'],
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

    grunt.registerTask('copy_build_base', ['newer:copy:base', 'newer:copy:ox']);

    grunt.loadNpmTasks('grunt-contrib-copy');
};
