'use strict';

module.exports = function (grunt) {

    // we want to install everything, including languages during dist
    grunt.config.extend('copy', {
        local_install_dist: {
            files: [{
                expand: true,
                src: ['**/*'],
                cwd: 'dist/',
                filter: 'isFile',
                dest: grunt.option('dest')
            }]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
};
