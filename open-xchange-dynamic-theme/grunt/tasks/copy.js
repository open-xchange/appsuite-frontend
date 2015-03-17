'use strict';

module.exports = function (grunt) {
    grunt.config.extend('copy', {
        build_custom: {
            files: [{
                expand: true,
                src: ['apps/**/*.in', 'apps/**/manifest.json'],
                dest: 'build/'
            }]
        }
    });
};

