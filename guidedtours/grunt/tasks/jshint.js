/* Overwrite jshint task with noop. Only use local copy of bower components.
 */
'use strict';

module.exports = function (grunt) {

    grunt.registerTask('jshint', function () { console.log('skipping jshint') });
};
