module.exports = function (grunt) {
    'use strict';

    grunt.config.merge({
        watch: {
            default: {
                files: ['Gruntfile.js', '{js,tasks}/*.js'],
                tasks: ['default']
            },
            less: {
                files: 'less/**/*',
                tasks: ['less']
            },
            jekyll: {
                files: ['dist/**/*', 'index.html', 'docs-assets/**/*'],
                tasks: ['uglify:docs', 'jekyll']
            },
            livereload: {
                options: { livereload: true },
                files: ['dist/**/*'],
            }
        }
    });
};
