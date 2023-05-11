module.exports = function (grunt) {
    'use strict';

    grunt.config.merge({
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js'
                }
            },
            docs: {
                files: {
                    'docs-assets/js/docs.min.js': 'docs-assets/js/docs.js'
                }
            }
        }
    });
};
