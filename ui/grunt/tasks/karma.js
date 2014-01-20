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

    grunt.config('karma', {

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

    });

    grunt.loadNpmTasks('grunt-karma');
};
