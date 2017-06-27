'use strict';

module.exports = function (grunt) {

    grunt.config.extend('compile-handlebars', {

        build_less: {
            partials: ['lib/node_modules/less/lib/less/*.js'],
            helpers: ['lib/helpers/*.js'],
            files: [
                {
                    src: 'apps/io.ox/dynamic-theme/register.hbs',
                    dest: 'build/apps/io.ox/dynamic-theme/register.js'
                }
            ]
        }
    });

    grunt.registerTask('build',
        ['lint', 'copy_build', 'compile_po', 'newer:compile-handlebars', 'newer:concat', 'newer:less']);

    grunt.loadNpmTasks('grunt-compile-handlebars');
};

