module.exports = function (grunt) {
    'use strict';

    grunt.config.merge({
        less: {
            compile: {
                files: {
                    'dist/css/<%= pkg.name %>.css': 'less/<%= pkg.name %>.less',
                    'dist/css/tokenfield-typeahead.css': 'less/tokenfield-typeahead.less'
                }
            },
            minify: {
                options: {
                    cleancss: true,
                    compress: true,
                    report: 'min'
                },
                files: {
                    'dist/css/<%= pkg.name %>.min.css': 'dist/css/<%= pkg.name %>.css',
                    'dist/css/tokenfield-typeahead.min.css': 'dist/css/tokenfield-typeahead.css'
                }
            }
        }
    });
};
