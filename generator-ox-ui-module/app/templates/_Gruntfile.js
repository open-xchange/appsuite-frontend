'use strict';

module.exports = function (grunt) {

    // make grunt config extendable
    grunt.config.extend = function (k, v) {
        grunt.config(k, require('underscore').extend({}, grunt.config(k), v));
    };

    grunt.config('pkg', grunt.file.readJSON('package.json'));

    grunt.config('local', require('underscore').extend(
        grunt.file.readJSON('grunt/local.conf.default.json'),
        grunt.file.exists('grunt/local.conf.json') ? grunt.file.readJSON('grunt/local.conf.json') : {}
    ));

    // load installed grunt tasks from specified folder
    grunt.loadTasks('grunt/tasks');

    // custom tasks
    grunt.registerTask('manifests', ['newer:jsonlint:manifests', 'concat:manifests']);
    grunt.registerTask('lint', ['newer:parallelize:jshint:all', 'newer:jsonlint:manifests']);

    // testing stuff
    grunt.registerTask('test', ['default', 'karma:unit:start', 'watch']);

    // steps to build the ui (ready for development)
    grunt.registerTask('build', ['lint', 'copy_build', 'newer:concat', 'newer:less', 'newer:compile_po']);
    // create a package ready version of the ui (aka what jenkins does)
    grunt.registerTask('dist', ['uglify', 'copy:dist', 'assemble:dist', 'create_i18n_properties', 'compress:source']);
    // default task
    grunt.registerTask('default', ['build']);
};
