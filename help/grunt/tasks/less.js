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
                        'help/compile.less'
                    ],
                    expand: true,
                    rename: function (dest) { return dest; },
                    dest: 'build/help/bootstrap.min.css'
                }
            ]
        }
    } });
};

