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
        bower: {
            options: { copy: false },
            install: {}
        },
        watch: {
            options: {
                interrupt: true,
                spawn: true
            },
            manifests: {
                files: 'apps/**/manifest.json',
                tasks: ['manifests']
            },
            karma: {
                files: ['spec/**/*_spec.js', 'build/core'],
                tasks: ['newer:jshint:specs', 'newer:concat:specs', 'karma:unit:run']
            },
            less: {
                files: 'apps/**/*.less',
                tasks: ['less']
            },
            bootjs: {
                files: ['<%= jshint.bootjs.src %>'],
                tasks: ['concat:bootjs', 'uglify:bootjs']
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
            options: {
                jshintrc: true,
                ignores: ['apps/io.ox/core/date.js', 'spec/io.ox/core/date_spec.js'] // date.js has some funky include stuff we have to figure out
            },
            bootjs: {
                src: ['src/*.js']
            },
            specs: {
                src: ['spec/**/*_spec.js']
            },
            all: {
                src: ['Gruntfile.js', 'apps/**/*.js']
            }
        },
        jsonlint: {
            manifests: {
                src: ['apps/**/*.json']
            }
        },
        copy: {
            fonts: {
                files: [
                    {
                        expand: true,
                        src: ['*', '!*.otf'],
                        cwd: 'bower_components/font-awesome/fonts/',
                        dest: 'build/apps/fonts/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        src: ['*', '!*.otf'],
                        cwd: 'bower_components/open-sans-fontface/fonts/Light/',
                        dest: 'build/apps/fonts/',
                        filter: 'isFile'
                    }
                ]
            },
            thirdparty: {
                files: [
                    {
                        expand: true,
                        src: ['Chart.js/Chart.js', 'jquery-imageloader/jquery.imageloader.js'],
                        cwd: 'bower_components/',
                        dest: 'build/apps/3rd.party/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        src: ['*.{js,png,svg,swf,gif,css,xap}', '!{jquery,*.min}.js'],
                        cwd: 'bower_components/mediaelement/build/',
                        dest: 'build/apps/3rd.party/mediaelement/',
                        filter: 'isFile'
                    }
                ]
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
            ox: {
                options: {
                    layout: false,
                    ext: ''
                },
                files: [
                    {
                        src: ['ox.js.hbs'],
                        expand: true,
                        cwd: 'src/',
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
                options: { lessrc: '.lessrc' },
                files: [
                    {
                        src: ['apps/themes/style.less'],
                        expand: true,
                        rename: function (dest) { return dest; },
                        dest: 'build/apps/themes/default/common.css'
                    },
                    {
                        src: [
                            'apps/themes/libs.less',
                            'apps/themes/default/style.less'
                        ],
                        expand: true,
                        rename: function (dest) { return dest; },
                        dest: 'build/apps/themes/default/style.css'
                    },
                    {
                        src: ['lib/bootstrap/less/bootstrap.less'],
                        expand: true,
                        rename: function (dest) { return dest; },
                        dest: 'build/apps/io.ox/core/bootstrap/css/bootstrap.min.css'
                    },
                    {
                        src: ['**/*.less', '!themes/**/*.less', '!themes/*.less'],
                        expand: true,
                        ext: '.css',
                        cwd: 'apps/',
                        dest: 'build/apps/themes/default/'
                    }
                ]
            }
        },
        modernizr: {

            // [REQUIRED] Path to the build you're using for development.
            devFile : 'node_modules/grunt-modernizr/lib/modernizr-dev.js',

            // [REQUIRED] Path to save out the built file.
            outputFile : 'lib/modernizr.js',

            // Based on default settings on http://modernizr.com/download/
            extra : {
                shiv : true,
                printshiv : false,
                load : true,
                mq : false,
                cssclasses : true
            },

            // Based on default settings on http://modernizr.com/download/
            extensibility : {
                addtest : false,
                prefixed : true,
                teststyles : false,
                testprops : false,
                testallprops : false,
                hasevents : false,
                prefixes : false,
                domprefixes : false
            },

            // By default, source is uglified before saving
            uglify : true,

            // Define any tests you want to implicitly include.
            tests : [],

            // By default, this task will crawl your project for references to Modernizr tests.
            // Set to false to disable.
            parseFiles : true,

            // When parseFiles = true, this task will crawl all *.js, *.css, *.scss files, except files that are in node_modules/.
            // You can override this by defining a files array below.
            files : ['apps/**/*.js', 'src/*.js', 'apps/**/*.less'],

            // When parseFiles = true, matchCommunityTests = true will attempt to
            // match user-contributed tests.
            matchCommunityTests : false,

            // Have custom Modernizr tests? Add paths to their location here.
            customTests : []
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
                        src: ['bower_components/jquery/jquery.js',
                             'lib/jquery.mobile.touch.min.js',
                             'bower_components/underscore/underscore.js', // load this before require.js to keep global object
                             'build/ox.js',
                             //add backbone and dot.js may be a AMD-variant would be better
                             'bower_components/backbone/backbone.js',
                             'bower_components/Backbone.ModelBinder/Backbone.ModelBinder.js',
                             'bower_components/Backbone.ModelBinder/Backbone.CollectionBinder.js',
                             'bower_components/backbone-validation/dist/backbone-validation.js',
                             'bower_components/requirejs/require.js',
                             'lib/require-fix.js',
                             'lib/modernizr.js',
                             'bower_components/bigscreen/bigscreen.js',
                             'bower_components/jquery-placeholder/jquery.placeholder.js',
                             'bower_components/doT/doT.js',
                             'bower_components/textarea-helper/textarea-helper.js',
                             'src/util.js',
                             'src/browser.js',
                             'src/plugins.js',
                             'src/jquery.plugins.js',
                             'apps/io.ox/core/gettext.js',
                             'src/boot.js',
                             // add bootstrap JavaScript
                             'bower_components/bootstrap/js/transition.js',
                             'bower_components/bootstrap/js/alert.js',
                             'bower_components/bootstrap/js/button.js',
                             'bower_components/bootstrap/js/carousel.js',
                             'bower_components/bootstrap/js/collapse.js',
                             'lib/bootstrap-custom-dropdown/custom-dropdown.js',
                             'bower_components/bootstrap/js/modal.js',
                             'bower_components/bootstrap/js/tooltip.js',
                             'bower_components/bootstrap/js/popover.js',
                             'bower_components/bootstrap/js/scrollspy.js',
                             'bower_components/bootstrap/js/tab.js',
                             'bower_components/bootstrap/js/affix.js',
                             // add bootstrap plugins
                             'bower_components/bootstrap-typeahead/bootstrap3-typeahead.js',
                             'bower_components/bootstrap-datepicker/js/bootstrap-datepicker.js',
                             'lib/bootstrap-combobox.js'
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
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-modernizr');
    grunt.loadNpmTasks('grunt-devtools');
    grunt.loadNpmTasks('grunt-bower-task');

    grunt.registerTask('manifests', ['newer:jsonlint:manifests', 'concat:manifests']);
    grunt.registerTask('lint', ['newer:jshint:all']);

    // Custom tasks
    grunt.registerTask('force_update', ['assemble:base', 'assemble:appcache']);
    grunt.registerTask('bootjs', ['newer:assemble:ox', 'newer:concat:bootjs']);

    // Testing stuff
    grunt.loadNpmTasks('grunt-karma');
    grunt.registerTask('test', ['default', 'karma:unit:start', 'watch']);

    grunt.registerTask('default', ['lint', 'newer:copy', 'newer:assemble', 'newer:concat', 'newer:less', 'force_update', 'newer:uglify']);
};
