/* This file has been generated by ox-ui-module generator.
 * Please only apply minor changes (better no changes at all) to this file
 * if you want to be able to run the generator again without much trouble.
 *
 * If you really have to change this file for whatever reason, try to contact
 * the core team and describe your use-case. May be, your changes can be
 * integrated into the templates to be of use for everybody.
 */
'use strict';

module.exports = function (grunt) {

    try {
        require('dotenv').config();
    } catch (e) {
        // silently ignore if no dotenv module is installed,
        // makes the module optional
        if (e.code !== 'MODULE_NOT_FOUND') throw e;
    }

    grunt.loadNpmTasks('@open-xchange/shared-grunt-config');

    // load custom tasks
    // those can be used to override configuration from shared-grunt-config
    if (grunt.file.isDir('grunt/tasks/')) {
        grunt.loadTasks('grunt/tasks/');
    }
};
