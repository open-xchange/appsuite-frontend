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

    try {
        require('grunt-modernizr/tasks/modernizr');
    } catch (e) {
        grunt.verbose.warn('Skipping modernizr optional tasks');
        return;
    }

    grunt.config.merge({
        modernizr: {
            dist: {
                crawl: false,
                customTests: [],
                dest: 'lib/modernizr.js',
                tests: [
                    'applicationcache',
                    'audio',
                    'canvas',
                    'emoji',
                    'indexeddb',
                    'inputtypes',
                    'json',
                    'unicode',
                    'video',
                    'cssanimations',
                    'csstransforms3d',
                    'filereader',
                    'localstorage',
                    'websqldatabase'
                ],
                options: [
                    'prefixed',
                    'html5shiv',
                    'setClasses'
                ],
                uglify: true
            }
        }
    });

    grunt.config.merge({
        watch: {
            modernizr: {
                files: 'lib/modernizr.js',
                tasks: ['default', 'send_livereload', 'testrun'],
                options: {}
            }
        }
    });

    grunt.loadNpmTasks('grunt-modernizr');
};
