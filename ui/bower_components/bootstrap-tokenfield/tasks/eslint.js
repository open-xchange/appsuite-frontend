module.exports = function (grunt) {
    'use strict';

    grunt.config.merge({
        eslint: {
            target: ['Gruntfile.js', '{js,tasks}/*.js']
        }
    });
};
