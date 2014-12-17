'use strict';

module.exports = function (grunt) {
    grunt.config.extend('copy', {
        dist_binaries: {
            options: {
                mode: parseInt('755', 8)
            },
            files: [{
                expand: true,
                src: 'update-dynamic-theme',
                cwd: 'bin/',
                dest: 'dist/sbin/'
            }]
        },
        dist_libs: {
            files: [{
                expand: true,
                src: 'lib/**/*',
                dest: 'dist/dynamic-theme/'
            }]
         }
    });
};

