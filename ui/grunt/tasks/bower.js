/* Overwrite bower task with noop. Only use local copy of bower components.
 */
'use strict';

module.exports = function (grunt) {

    grunt.registerTask('bower', function () { console.log('Bower install skipped. Using local bower components.'); });
};
