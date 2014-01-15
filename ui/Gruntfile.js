/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

'use strict';

module.exports = function (grunt) {

    // displays the execution time of grunt tasks
    if (grunt.option('benchmark')) require('time-grunt')(grunt);

    // load installed npm tasks
    require('load-grunt-tasks')(grunt, { pattern: ['grunt-*', 'assemble*'] });

    // load all configuration files
    grunt.initConfig(require('require-grunt-configs')(grunt));

    // custom tasks
    grunt.registerTask('manifests', ['newer:jsonlint:manifests', 'concat:manifests']);
    grunt.registerTask('lint', ['newer:parallelize:jshint:all']);
    grunt.registerTask('force_update', ['assemble:base', 'assemble:appcache']);
    grunt.registerTask('bootjs', ['newer:assemble:ox', 'newer:concat:bootjs']);

    // testing stuff
    grunt.registerTask('test', ['default', 'karma:unit:start', 'watch']);

    // default task
    grunt.registerTask('default', ['lint', 'newer:copy', 'newer:assemble', 'newer:concat', 'newer:less', 'force_update', 'newer:uglify']);
};
