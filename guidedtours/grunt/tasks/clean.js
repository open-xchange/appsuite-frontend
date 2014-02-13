'use strict';

module.exports = function (grunt) {
    grunt.config('clean', ['build/', 'node_modules/grunt-newer/.cache', 'tmp/']);

    grunt.loadNpmTasks('grunt-contrib-clean');
};
