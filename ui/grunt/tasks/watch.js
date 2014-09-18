'use strict';

module.exports = function (grunt) {

    if (!grunt.isPeerDependencyInstalled('grunt-contrib-watch')) {
        grunt.verbose.warn('Skipping optional watch tasks');
        return;
    }

    var watchConfig = grunt.config('watch');
    watchConfig.all = {
        files: [
        'apps/**/*.{js,less}',
        'src/*',
        'lib/**/*.js',
        'bower.json',
        'package.json'
        ],
        tasks: ['default', 'force_update', 'send_livereload'],
        options: {}
    };
    grunt.config('watch', watchConfig);

    grunt.loadNpmTasks('grunt-contrib-watch');
};
