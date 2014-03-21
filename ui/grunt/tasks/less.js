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
    var wrench = require('wrench');
    wrench.readdirSyncRecursive('apps/themes').filter(function (file) {
        return file.match(/\/definitions.less$/);
    }).forEach(function (file) {
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
                paths: ['apps/themes', 'bower_components/bootstrap/less', 'bower_components/font-awesome/less'],
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
                    dest: 'build/apps/themes/' + themeName + '/common.css'
                },
                {
                    src: [
                        'bower_components/bootstrap/less/bootstrap.less',
                        'bower_components/bootstrap-datepicker/less/datepicker3.less',
                        'bower_components/font-awesome/less/font-awesome.less',
                        'apps/themes/' + themeName + '/style.less'
                    ],
                    expand: true,
                    rename: function (dest) { return dest; },
                    dest: 'build/apps/themes/' + themeName + '/style.css'
                },
                {
                    src: ['**/*.less', '!themes/**/*.less', '!themes/*.less'],
                    expand: true,
                    ext: '.css',
                    cwd: 'apps/',
                    dest: 'build/apps/themes/' + themeName + '/'
                }
            ]
        };
        grunt.config.extend('less', theme);
    });

    grunt.config.extend('less', {

        bootstrap: {
            options: { lessrc: '.lessrc' },
            files: [
                {
                    src: ['bower_components/bootstrap/less/bootstrap.less'],
                    expand: true,
                    rename: function (dest) { return dest; },
                    dest: 'build/apps/io.ox/core/bootstrap/css/bootstrap.min.css'
                }
            ]
        }

    });

    grunt.loadNpmTasks('assemble-less');
};
