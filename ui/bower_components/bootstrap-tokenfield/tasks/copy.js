module.exports = function (grunt) {
    'use strict';

    grunt.config.merge({
        copy: {
            dist: {
                files: {
                    'dist/<%= pkg.name %>.js': 'js/<%= pkg.name %>.js'
                }
            },
            assets: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: [
                        'bower_components/bootstrap/js/affix.js',
                        'bower_components/bootstrap/js/scrollspy.js',
                        'bower_components/typeahead.js/dist/typeahead.bundle.min.js'
                    ],
                    dest: 'docs-assets/js/'
                }]
            }
        }
    });
};
