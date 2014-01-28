'use strict';

module.exports = function (grunt) {

    grunt.config('jsonlint', {

        manifests: {
            src: ['apps/**/*.json']
        }

    });

    grunt.loadNpmTasks('grunt-jsonlint');
};
