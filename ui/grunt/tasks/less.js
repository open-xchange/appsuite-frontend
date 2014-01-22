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

    grunt.config('less', {

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
                        'bower_components/bootstrap/less/bootstrap.less',
                        'bower_components/bootstrap-datepicker/less/datepicker3.less',
                        'bower_components/font-awesome/less/font-awesome.less',
                        'apps/themes/default/style.less'
                    ],
                    expand: true,
                    rename: function (dest) { return dest; },
                    dest: 'build/apps/themes/default/style.css'
                },
                {
                    src: ['bower_components/bootstrap/less/bootstrap.less'],
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

    });

    grunt.loadNpmTasks('assemble-less');
};
