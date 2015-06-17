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

    grunt.config.merge({
        less: {
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
            },
            login: {
                options: { lessrc: '.lessrc' },
                files: [
                    {
                        src: [
                            'bower_components/bootstrap/less/normalize.less',
                            'bower_components/bootstrap/less/scaffolding.less',
                            'bower_components/bootstrap/less/type.less',
                            'bower_components/bootstrap/less/grid.less',
                            'bower_components/bootstrap/less/forms.less',
                            'bower_components/bootstrap/less/buttons.less',
                            'bower_components/bootstrap/less/utilities.less',
                            'bower_components/bootstrap/less/dropdowns.less',
                            'apps/themes/login/login.less'
                        ],
                        expand: true,
                        rename: function (dest) { return dest; },
                        dest: 'build/apps/themes/login/login.css'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('assemble-less');
};
