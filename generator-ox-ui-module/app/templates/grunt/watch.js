'use strict';

module.exports = function (grunt) {

    grunt.config('watch', {

        options: {
            interrupt: true,
            spawn: true,
            debounceDelay: 1500
        },
        manifests: {
            files: 'apps/**/manifest.json',
            tasks: ['manifests']
        },
        less: {
            files: 'apps/**/*.less',
            tasks: ['less']
        },
        all: {
            files: ['<%= jshint.all.src %>'],
            tasks: ['default'],
            options: { nospawn: true }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
};
