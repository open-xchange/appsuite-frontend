/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

'use strict';

module.exports = function (grunt) {
    if (!grunt.isPeerDependencyInstalled('grunt-retire')) return;

    grunt.config.merge({
        retire: {
            js: ['**/*.js'], /** Which js-files to scan. **/
            node: ['.'], /** Which node directories to scan (containing package.json). **/
            options: {
                verbose: false
            }
        }
    });

    grunt.loadNpmTasks('grunt-retire');

};
