'use strict';
module.exports = function (grunt) {
    grunt.config.extend('less', {
        bootstrap: {
            options: {
                lessrc: '.lessrc'
            },
            files: [
                {
                    src: [
                        'bower_components/bootstrap/less/bootstrap.less'
                    ],
                    expand: true,
                    rename: function (dest) { return dest; },
                    dest: 'build/help-drive/bootstrap.min.css'
                }
            ]
        }
    });
};

