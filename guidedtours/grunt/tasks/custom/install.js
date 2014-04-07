'use strict';

module.exports = function (grunt) {

   grunt.config.extend('copy', {
       local_install_dynamic: {
            files: [{
                expand: true,
                src: ['**/*'],
                cwd: 'dist/',
                filter: 'isFile',
                dest: grunt.option('prefix')
            }]
        }
    });
};
