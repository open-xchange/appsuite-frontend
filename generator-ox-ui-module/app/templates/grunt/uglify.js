'use strict';

module.exports = function (grunt) {

    grunt.config('uglify', {
        apps: {
            options: {
                sourceMap: function (path) { return path.replace(/^build\//, 'build/maps/').replace(/\.js$/, '.js.map'); },
                sourceMapRoot: '/appsuite/<%= base %>',
                sourceMappingURL: function (path) { return '/appsuite/' + grunt.config.get('base') + path.replace(/^build\//, '/maps/').replace(/\.js$/, '.js.map'); },
                sourceMapPrefix: 1
            },
            files: [{
                src: 'apps/**/*.js',
                cwd: 'build/src/',
                dest: 'build/',
                filter: 'isFile',
                expand: true
            }]
        }

    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
};
