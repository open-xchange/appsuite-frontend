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

    // make grunt config extendable
    grunt.config.extend = function (k, v) {
        grunt.config(k, require('underscore').extend(grunt.config(k), v));
    };

    grunt.config('pkg', grunt.file.readJSON('package.json'));
    grunt.config('local', grunt.file.exists('grunt/local.conf.json') ? grunt.file.readJSON('grunt/local.conf.json') : {});

    // load installed grunt tasks from specified folder
    grunt.loadTasks('grunt/tasks');

    // custom tasks
    grunt.registerTask('manifests', ['newer:jsonlint:manifests', 'concat:manifests']);
    grunt.registerTask('lint', ['newer:parallelize:jshint:all']);
    grunt.registerTask('force_update', ['assemble:base', 'assemble:appcache']);
    grunt.registerTask('bootjs', ['newer:assemble:ox', 'newer:concat:bootjs']);
    grunt.registerTask('tinymce_update', ['curl:tinymceMain', 'curl:tinymceLanguagePack', 'unzip:tinymceMain', 'unzip:tinymceLanguagePack', 'copy:tinymce']);

    // testing stuff
    grunt.registerTask('test', ['default', 'karma:unit:start', 'watch']);

    // build the ui (aka what jenkins does)
    grunt.registerTask('build', ['jshint:all', 'jsonlint:manifests', 'concat:manifests', 'copy', 'assemble', 'concat', 'less', 'compile_po', 'uglify']);
    // default task
    grunt.registerTask('default', ['checkDependencies', 'lint', 'newer:copy', 'newer:assemble', 'newer:concat', 'newer:less', 'newer:compile_po', 'force_update', 'newer:uglify']);
};
