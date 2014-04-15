'use strict';

module.exports = function () {
    var path = require('path');
    var grunt = require('grunt');
    require('grunt-contrib-clean/tasks/clean')(grunt);
    require('assemble-less/tasks/less')(grunt);

    grunt.cli({
        gruntfile: path.join(path.dirname(__filename), 'grunt/config.js'),
        base: process.cwd()
    });
};

