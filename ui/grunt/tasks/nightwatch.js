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

    var nightwatch = require('nightwatch');
    nightwatch.initGrunt(grunt);

    var config = grunt.config('local.nightwatch') || {};

    grunt.config.merge({
        nightwatch: {
            options: config
        }
    });

    grunt.loadNpmTasks('grunt-nightwatch');

};
