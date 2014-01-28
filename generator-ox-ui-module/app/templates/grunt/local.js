'use strict';

module.exports = function (grunt) {

    grunt.config('local', grunt.file.exists('grunt/local.conf.json') ? grunt.file.readJSON('grunt/local.conf.json') : {});
};
