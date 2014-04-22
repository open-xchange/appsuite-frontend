'use strict';

module.exports = function (grunt) {
    var path = require('path');

    // base needs to be relative to the current working directory, because less doesn't like absolute paths
    // for @import statements (see http://stackoverflow.com/questions/10715214/lessc-with-an-absolute-path-in-importing)
    var scriptBase = path.relative(process.cwd(), path.join(path.dirname(__filename), '../..'));

    // make grunt config extendable
    grunt.config.extend = function (k, v) {
        grunt.config(k, require('underscore').extend({}, grunt.config(k), v));
    };

    grunt.config('clean', {
        theming: ['apps/themes/**/*.css']
    });

    grunt.file.expand({cwd: 'apps/themes/'}, '*/definitions.less').forEach(function (file) {
        var themeName = file.replace(/\/definitions.less$/, '');
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
                paths: [
                    'apps/themes',
                    path.join(scriptBase, 'bower_components/bootstrap/less'),
                    path.join(scriptBase, 'font-awesome/less')
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
                    src: ['apps/themes/style.less'],
                    expand: true,
                    rename: function (dest) { return dest; },
                    dest: 'apps/themes/' + themeName + '/common.css'
                },
                {
                    src: [
                        path.join(scriptBase, 'bower_components/bootstrap/less/bootstrap.less'),
                        path.join(scriptBase, 'bower_components/bootstrap-datepicker/less/datepicker3.less'),
                        path.join(scriptBase, 'bower_components/font-awesome/less/font-awesome.less'),
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
                    src: ['**/*.less', '!themes/**/*.less', '!themes/*.less', '!3rd.party/font-awesome/**/*.less'],
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
