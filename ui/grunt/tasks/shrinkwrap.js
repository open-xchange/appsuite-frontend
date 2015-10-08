'use strict';

module.exports = function (grunt) {
    grunt.registerTask('shrinkwrap', 'Generate a new npm-shrinkwrap file based on latest vorsions', function () {
        var npm = require('npm');
        var fs = require('fs');
        var done = this.async();

        fs.renameSync('node_modules/', 'node_modules_old/');
        npm.load({
            production: true,
            'no-shrinkwrap': true
        }, function (err, npm) {
            console.log(err);
            npm.commands.install([], function () {
                npm.commands.shrinkwrap('', function () {
                    done();
                });
            });
        });
    });
};
