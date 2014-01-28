'use strict';

module.exports = function (grunt) {

    // make grunt config extendable
    grunt.config.extend = function (k, v) {
        grunt.config(k, require('underscore').extend(grunt.config(k), v));
    };

    // load installed grunt tasks from specified folder
    grunt.loadTasks('grunt/tasks');

    // custom tasks
    grunt.registerTask('manifests', ['newer:jsonlint:manifests', 'concat:manifests']);
    grunt.registerTask('lint', ['newer:parallelize:jshint:all', 'newer:jsonlint:manifests']);

    // testing stuff
    grunt.registerTask('test', ['default', 'karma:unit:start', 'watch']);

    // default task
    grunt.registerTask('default', ['lint', 'newer:concat', 'newer:less', 'newer:compile_po', 'newer:uglify']);
};
