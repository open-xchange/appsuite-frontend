'use strict';

module.exports = function (grunt) {

   grunt.config.extend('copy', {
       local_install_static: {
            files: [{
                expand: true,
                src: [],
                cwd: 'dist/',
                filter: 'isFile',
                dest: grunt.option('htdoc')
            }]
        }
    });
};
