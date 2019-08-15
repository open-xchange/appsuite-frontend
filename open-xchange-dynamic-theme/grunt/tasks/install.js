'use strict';

module.exports = function (grunt) {
    //disable installation of static files
    grunt.registerTask('install:static', []);
    //disable installation of language specific files
    grunt.registerTask('install:languages', []);
};

