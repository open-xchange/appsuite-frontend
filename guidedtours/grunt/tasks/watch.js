'use strict';

module.exports = function (grunt) {

    grunt.config('watch', {

        options: {
            interrupt: true,
            spawn: true
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
        },
        livereload: {
            options: { livereload: true, nospawn: true },
            files: ['build/core.appcache']
        }

    });

    grunt.loadNpmTasks('grunt-contrib-watch');
};
