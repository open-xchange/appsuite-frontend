'use strict';

module.exports = function (grunt) {

    grunt.config('jshint', {

        options: {
            jshintrc: true
        },
        specs: {
            src: ['spec/**/*_spec.js']
        },
        all: {
            src: ['Gruntfile.js', 'grunt/tasks/*.js', 'apps/**/*.js']
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
};
