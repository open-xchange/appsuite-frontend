'use strict';

module.exports = function (grunt) {

    grunt.config('less', {

        default: {
            options: { lessrc: '.lessrc' },
            files: [
                {
                    src: ['**/*.less', '!themes/**/*.less', '!themes/*.less'],
                    expand: true,
                    ext: '.css',
                    cwd: 'apps/',
                    dest: 'build/apps/themes/default/'
                }
            ]
        }

    });

    grunt.loadNpmTasks('assemble-less');
};
