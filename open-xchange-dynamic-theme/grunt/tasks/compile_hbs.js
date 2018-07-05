'use strict';

module.exports = function (grunt) {

    grunt.config.extend('compile-handlebars', {

        build_less: {
            partials: ['lib/node_modules/less/lib/less/*.js'],
            helpers: ['lib/helpers/*.js'],
            files: [
                {
                    expand: true,
                    cwd: 'apps/',
                    src: '**/*.hbs',
                    dest: 'build/apps/',
                    ext: '.js'
                }
            ]
        }
    });

    grunt.registerTask('build',
        ['copy_build', 'compile_po', 'newer:compile-handlebars', 'newer:concat', 'newer:less']);

    grunt.registerTask('dist:build', 'build a distribution ready version into dist/',
        ['clean', 'build', 'copy_dist', 'uglify']
    );

    grunt.loadNpmTasks('grunt-compile-handlebars');
};

