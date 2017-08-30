/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

'use strict';

module.exports = function (grunt) {
    if (!grunt.isPeerDependencyInstalled('nightwatch')) return;

    var nightwatch = require('nightwatch');
    var _ = require('underscore');
    nightwatch.initGrunt(grunt);

    var config = grunt.config('local.nightwatch') || { test_settings: {} };

    if (!grunt.config('local.appserver.fixturesPath')) {
        grunt.config('local.appserver.fixturesPath', 'e2e/fixtures');
    }

    grunt.config.merge({
        copy: {
            specs_nightwatch: {
                files: [{
                    expand: true,
                    src: ['fixtures/**/*'],
                    dest: 'build/e2e',
                    cwd: 'nightwatch/'
                }]
            }
        }
    });

    if (process.env.LAUNCH_URL) {
        config.test_settings['default'] = _.extend(
            {},
            config.test_settings['default'],
            {
                launch_url: process.env.LAUNCH_URL
            }
        );
    }

    grunt.config.merge({
        nightwatch: {
            options: config
        }
    });

    grunt.loadNpmTasks('grunt-nightwatch');

};
