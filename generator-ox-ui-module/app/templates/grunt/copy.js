'use strict';

module.exports = function (grunt) {

    grunt.config('copy', {
        apps: {
            files: [
                {
                    src: ['apps/**/*.js'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                }
            ]
        },
        themes: {
            files: [
                {
                    expand: true,
                    src: ['**/*.{png,gif,ico,less,css}'],
                    cwd: 'apps/themes/',
                    dest: 'build/apps/themes/',
                    filter: 'isFile'
                }
            ]
        }
    });

    grunt.registerTask('copy_build', [
        'newer:copy:apps',
        'newer:copy:themes'
    ]);

    grunt.loadNpmTasks('grunt-contrib-copy');
};
