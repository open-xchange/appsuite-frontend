'use strict';

module.exports = function (grunt) {

    grunt.config('parallelize', {

        jshint: {
            all: 4
        }

    });

    grunt.loadNpmTasks('grunt-parallelize');
};
