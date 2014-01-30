'use strict';

module.exports = function (grunt) {

    grunt.config('karma', {

        options: {
            configFile: 'karma.conf.js',
            builddir: 'build/'
        },
        unit: {
            background: true,
            autoWatch: false
        },
        //continuous integration mode: run tests once in PhantomJS browser.
        continuous: {
            singleRun: true,
            browsers: ['PhantomJS'],
            reporters: ['junit']
        }

    });

    grunt.loadNpmTasks('grunt-karma');
};
