'use strict';
module.exports = function (grunt) {
    grunt.config.merge({ less: {
        bootstrap: {
            options: {
                lessrc: '.lessrc'
            },
            files: [
                {
                    src: [
                        'node_modules/bootstrap/less/bootstrap.less'
                    ],
                    expand: true,
                    rename: function (dest) { return dest; },
                    dest: 'build/help/bootstrap.min.css'
                }
            ]
        }
    }});
};

