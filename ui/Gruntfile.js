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
        jsonFiles = ['apps/**/*.json'],
        local = grunt.file.exists('local.conf.json') ? grunt.file.readJSON('local.conf.json') : {};

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
            lesslint: {
                files: ['apps/themes/style.less'],
                tasks: ['newer:recess:main']
            },
            all: {
                files: ['<%= jshint.all.src %>'],
                tasks: ['newer:jshint:all'],
                options: { nospawn: true }
            }
        },
        clean: ['build/', 'node_modules/grunt-newer/.cache'],
        local: local,
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
        },
        recess: {
            main: {
                options: grunt.file.readJSON('.recessrc'),
                src: ['apps/themes/style.less']
            }
        },
        assemble: {
            options: {
                version: '<%= pkg.version %>-<%= pkg.revision %>.<%= grunt.template.date(new Date(), "yyyymmdd.hhMMss") %>',
                enable_debug: String(local.debug || false),
                revision: '<%= pkg.revision %>',
                base: 'v=<%= pkg.version %>-<%= pkg.revision %>.<%= grunt.template.date(new Date(), "yyyymmdd.hhMMss") %>'
            },
            base: {
                options: {
                    layout: false,
                    ext: '',
                    partials: ['html/core_*.html']
                },
                files: [
                    {
                        src: ['index.html', 'signin.html'],
                        expand: true,
                        cwd: 'html/',
                        rename: function (dest, matchedSrcPath, options) {
                            var map = {
                                'index.html': 'core',
                                'signin.html': 'signin'
                            };
                            return dest + map[matchedSrcPath];
                        },
                        dest: 'build/'
                    }
                ]
            },
            appcache: {
                options: {
                    layout: false,
                    ext: '.appcache'
                },
                files: [
                    {
                        src: ['*.appcache.hbs'],
                        expand: true,
                        cwd: 'html/',
                        ext: '.appcache',
                        dest: 'build/'
                    }
                ]
            }
        },
        concat: {
            static: {
                files: [
                    {
                        src: [".htaccess", "blank.html", "busy.html", "unsupported.html", "print.html", "favicon.ico"],
                        expand: true,
                        cwd: 'html/',
                        dest: 'build/'
                    },
                    {
                        src: ['o{n,ff}line.js'],
                        expand: true,
                        cwd: 'src/',
                        dest: 'build/'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('assemble');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-recess');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-devtools');

    grunt.registerTask('lint', ['newer:jshint:all', 'newer:jsonlint:manifests']);

    grunt.registerTask('default', ['lint', 'newer:assemble', 'newer:concat']);
};
