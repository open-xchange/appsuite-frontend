'use strict';

module.exports = function (grunt) {
    var path = require('path');

    // base needs to be relative to the current working directory, because less doesn't like absolute paths
    // for @import statements (see http://stackoverflow.com/questions/10715214/lessc-with-an-absolute-path-in-importing)
    var scriptBase = path.relative(process.cwd(), path.join(path.dirname(__filename), '../..'));

    grunt.config('pkg', grunt.file.readJSON(path.join(scriptBase, 'package.json')));

    // make grunt config extendable
    grunt.config.extend = function (k, v) {
        grunt.config(k, require('underscore').extend({}, grunt.config(k), v));
    };

    grunt.config.extend('clean', {
        default: {}
    });
    grunt.file.expand({cwd: 'apps/themes/'}, '*/common.css').forEach(function (file) {
        //directories with a common.css file are themes that need to be cleaned
        //this way, css files of already uninstalled themes get removed by update-themes
        var themeName = file.replace(/\/common.css$/, '');
        grunt.verbose.writeln('found theme', themeName);
        var cleanConfig = {};
        cleanConfig[themeName] = ['apps/themes/' + themeName + '/**/*.css'];
        grunt.config.extend('clean', cleanConfig);
    });

    grunt.config.extend('less', {
        default: {}
    });
    grunt.file.expand({cwd: 'apps/themes/'}, '*/definitions.less').forEach(function (file) {
        //directories with a definitions.less file are themes that need to be built
        var themeName = file.replace(/\/definitions.less$/, '');
        grunt.verbose.writeln('found theme', themeName);
        var theme = {};
        theme[themeName] = {
            options: {
                compress: true,
                cleancss: true,
                ieCompat: false,
                syncImport: true,
                strictMath: false,
                strictUnits: false,
                relativeUrls: false,
                rootpath: 'v=<%= pkg.version %>.' + grunt.template.date(new Date(), 'yyyymmdd.hhMMss') + '/',
                paths: [
                    'apps/3rd.party/bootstrap/less',
                    'apps/3rd.party/font-awesome/less',
                    'apps/themes'
                ],
                imports: {
                    reference: [
                        'variables.less',
                        'mixins.less'
                    ],
                    less: [
                        'definitions.less',
                        themeName + '/definitions.less'
                    ]
                }
            },
            files: [
                {
                    src: [
                        'apps/3rd.party/bootstrap/less/bootstrap.less',
                        'apps/3rd.party/bootstrap-datepicker/less/datepicker3.less',
                        'apps/3rd.party/font-awesome/less/font-awesome.less',
                        'apps/themes/style.less'
                    ],
                    expand: true,
                    rename: function (dest) { return dest; },
                    dest: 'apps/themes/' + themeName + '/common.css',
                    nonull: true
                },
                {
                    src: [
                        'apps/themes/' + themeName + '/style.less'
                    ],
                    expand: true,
                    rename: function (dest) { return dest; },
                    filter: function () {
                        //only generate this file if there is a style.less for this theme
                        return grunt.file.exists('apps/themes/' + themeName + '/style.less');
                    },
                    dest: 'apps/themes/' + themeName + '/style.css'
                },
                {
                    src: [
                        '**/*.less',
                        '!themes/**/*.less',
                        '!themes/*.less',
                        //those are compiled into common.css
                        '!3rd.party/bootstrap/less/*.less',
                        '!3rd.party/font-awesome/less/*.less',
                        '!3rd.party/bootstrap-datepicker/less/*.less'
                    ],
                    expand: true,
                    ext: '.css',
                    cwd: 'apps/',
                    dest: 'apps/themes/' + themeName + '/'
                }
            ]
        };
        grunt.config.extend('less', theme);
    });

    grunt.registerTask('default', ['clean', 'less']);
};
