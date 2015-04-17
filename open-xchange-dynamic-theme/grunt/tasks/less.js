'use strict';

module.exports = function (grunt) {

    grunt.config.extend('assemble', {

        build_less: {
            options: {
                layout: false,
                ext: '.js',
                partials: ['lib/node_modules/less/lib/less/*.js']
            },
            files: [
                {
                    src: ['apps/io.ox/dynamic-theme/register.hbs'],
                    expand: true,
                    dest: 'build/'
                }
            ]
        }
    });

    grunt.registerTask('build',
        ['lint', 'copy_build', 'compile_po', 'assemble', 'newer:concat',
         'newer:less']);

    grunt.loadNpmTasks('assemble');
};

