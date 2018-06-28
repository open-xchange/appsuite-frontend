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

    if (!grunt.config('local.appserver.fixturesPath')) {
        grunt.config('local.appserver.fixturesPath', 'e2e/fixtures');
    }

    grunt.config.merge({
        copy: {
            specs_e2e_fixtures: {
                files: [{
                    expand: true,
                    src: ['fixtures/**/*'],
                    dest: 'build/e2e',
                    cwd: 'e2e/'
                }]
            }
        }
    });

    grunt.registerTask('serve:e2e', [
        'copy:specs_e2e_fixtures',
        'connect:server:mock',
        'watch'
    ]);

};
