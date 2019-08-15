'use strict';
var path = require('path');
module.exports = function (grunt) {

    grunt.config.merge({ copy: {
        build_thirdparty: {
            files: [{
                src: ['bootstrap.min.js'],
                expand: true,
                cwd: 'node_modules/bootstrap/dist/js',
                dest: 'build/help'
            }, {
                src: ['jquery.min.js'],
                expand: true,
                cwd: 'node_modules/jquery/dist',
                dest: 'build/help'
            }]
        },
        build_help: {
            files: [
                {
                    src: ['help/**/*'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                }
            ]
        },
        dist_help: {
            files: [
                {
                    src: ['help/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'build/',
                    dest: 'dist/appsuite/'
                }
            ]
        },
        local_install_static: {
            files: [
                {
                    src: ['**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'dist/',
                    dest: grunt.option('htdoc')
                }
            ]
        }
    } });

    // add dist l10n copy tasks
    grunt.registerTask('install:languages', []);
    grunt.loadNpmTasks('grunt-contrib-copy');
};
