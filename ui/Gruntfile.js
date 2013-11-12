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

    var local = grunt.file.exists('local.conf.json') ? grunt.file.readJSON('local.conf.json') : {},
        now = grunt.template.date(new Date(), 'yyyymmdd.hhMMss');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            options: {
                interrupt: true,
                spawn: true
            },
            manifests: {
                files: 'apps/**/manifest.json',
                tasks: ['manifests']
            },
            lesslint: {
                files: ['apps/themes/style.less'],
                tasks: ['newer:recess:main']
            },
            karma: {
                files: ['spec/**/*_spec.js', 'build/core'],
                tasks: ['newer:concat:specs', 'karma:unit:run']
            },
            all: {
                files: ['<%= jshint.all.src %>'],
                tasks: ['default'],
                options: { nospawn: true }
            }
        },
        clean: ['build/', 'node_modules/grunt-newer/.cache'],
        local: local,
        jshint: {
            all: {
                src: ['Gruntfile.js', 'apps/**/*.js', 'src/*.js'],
                options: {
                    jshintrc: '.jshintrc',
                    ignores: ['apps/io.ox/core/date.js'] // date.js has some funky include stuff we have to figure out
                }
            }
        },
        jsonlint: {
            manifests: {
                src: ['apps/**/*.json']
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
                version: '<%= pkg.version %>-<%= pkg.revision %>.' + now,
                enable_debug: String(local.debug || false),
                revision: '<%= pkg.revision %>',
                base: 'v=<%= assemble.options.version %>'
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
                        rename: function (dest, matchedSrcPath) {
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
        less: {
            default: {
                options: {
                    compress: true,
                    paths: 'apps',
                    imports: {
                        less: [
                            'lib/bootstrap/less/variables.less',
                            'themes/definitions.less',
                            'themes/default/definitions.less',
                            'lib/bootstrap/less/mixins.less',
                            'themes/mixins.less'
                        ]
                    }
                },
                files: [
                    {
                        src: ['apps/themes/style.less'],
                        expand: true,
                        rename: function (dest) {
                            return dest;
                        },
                        dest: 'build/apps/themes/default/less/common.css'
                    },
                    {
                        src: ['lib/bootstrap/less/bootstrap.less', 'apps/themes/default/style.less'],
                        expand: true,
                        rename: function (dest) {
                            return dest;
                        },
                        dest: 'build/apps/themes/default/less/style.css'
                    },
                    {
                        src: ['lib/bootstrap/less/bootstrap.less'],
                        expand: true,
                        rename: function (dest) {
                            return dest;
                        },
                        dest: 'build/apps/io.ox/core/bootstrap/css/bootstrap.min.css'
                    },
                    {
                        src: ['**/*.less', '!themes/**/*.less', '!themes/*.less'],
                        expand: true,
                        cwd: 'apps/',
                        dest: 'build/apps/themes/default/less/'
                    }
                ]
            }
        },
        concat: {
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
                    }
                ]
            },
            bootjs: {
                options: {
                    banner: 'dependencies = {};\n'
                },
                files: [
                    {
                        src: ['lib/jquery/jquery.js',
                             'lib/jquery.mobile.touch.min.js',
                             'lib/underscore/underscore.js', // load this before require.js to keep global object
                             'lib/require.js',
                             'lib/require-fix.js',
                             'lib/modernizr.js',
                             'lib/bigscreen.js',
                             'lib/placeholder.min.js',
                             //add backbone and dot.js may be a AMD-variant would be better
                             'lib/backbone.js',
                             'lib/backbone.modelbinder.js',
                             'lib/backbone.collectionbinder.js',
                             'lib/backbone.validation.js',
                             'lib/backbone.custom.js',
                             'lib/doT.js',
                             'lib/textarea-helper.js',
                             'src/util.js',
                             'src/plugins.js',
                             'src/jquery.plugins.js',
                             'apps/io.ox/core/gettext.js',
                             'src/boot.js',
                             // add bootstrap JavaScript
                             'lib/bootstrap/js/transition.js',
                             'lib/bootstrap/js/alert.js',
                             'lib/bootstrap/js/button.js',
                             'lib/bootstrap/js/carousel.js',
                             'lib/bootstrap/js/collapse.js',
                             'lib/bootstrap-custom-dropdown/custom-dropdown.js',
                             'lib/bootstrap/js/modal.js',
                             'lib/bootstrap/js/tooltip.js',
                             'lib/bootstrap/js/popover.js',
                             'lib/bootstrap/js/scrollspy.js',
                             'lib/bootstrap/js/tab.js',
                             'lib/bootstrap/js/affix.js'
                        ],
                        dest: 'build/src/boot.js'
                    }
                ]
            },
            apps: {
                files: [
                    {
                        src: ['apps/**/*.js'],
                        expand: true,
                        filter: 'isFile',
                        dest: 'build/src/'
                    }
                ]
            },
            manifests: {
                options: {
                    banner: '[',
                    footer: ']',
                    separator: ',',
                    process: function (data, filepath) {
                        var manifest = [],
                            data = JSON.parse(data),
                            prefix = /^apps[\\\/](.*)[\\\/]manifest\.json$/.exec(filepath)[1].replace(/\\/g, '/') + '/';
                        if (data && (data.constructor !== Array)) data = [data];
                        for (var i = 0; i < data.length; i++) {
                            if (!data[i].path) {
                                if (data[i].namespace) {
                                    // Assume Plugin
                                    if (grunt.file.exists('apps/' + prefix + 'register.js')) data[i].path = prefix + 'register';
                                } else {
                                    // Assume App
                                    if (grunt.file.exists('apps/' + prefix + 'main.js')) data[i].path = prefix + 'main';
                                }
                            }
                            manifest.push(data[i]);
                        }
                        return manifest.map(JSON.stringify);
                    },
                },
                files: [
                    {
                        src: ['apps/**/manifest.json'],
                        dest: 'build/manifests/<%= pkg.name %>.json',
                    }
                ]
            },
            libs: {
                files: [
                    {
                        src: ['hopscotch/*'],
                        cwd: 'lib',
                        expand: true,
                        dest: 'build/apps/'
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
            }
        },
        uglify: {
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
        },
        karma: {
            options: {
                configFile: 'karma.conf.js',
                builddir: 'build/'
            },
            unit: {
                background: true,
                autoWatch: false
            },
            //continuous integration mode: run tests once in PhantomJS browser.
            continuous: {
                singleRun: true,
                browsers: ['PhantomJS'],
                reporters: ['junit']
            }
        }
    });

    grunt.loadNpmTasks('assemble');
    grunt.loadNpmTasks('assemble-less');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-recess');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-devtools');

    grunt.registerTask('manifests', ['newer:jsonlint:manifests', 'concat:manifests']);
    grunt.registerTask('lint', ['newer:jshint:all']);

    // Custom tasks
    grunt.registerTask('force_update', ['assemble:base', 'assemble:appcache']);

    // Testing stuff
    grunt.loadNpmTasks('grunt-karma');
    grunt.registerTask('test', ['default', 'karma:unit:start', 'watch']);

    grunt.registerTask('default', ['lint', 'newer:assemble', 'newer:concat', 'newer:less', 'force_update', 'newer:uglify']);
};
