'use strict';

module.exports = function (grunt) {

    grunt.config('concat', {
        manifests: {
            options: {
                banner: '[',
                footer: ']',
                separator: ',',
                process: function (data, filepath) {
                    var manifest = [],
                        data = JSON.parse(data),
                        prefix = /^apps[\\\/](.*)[\\\/]manifest\.json$/.exec(filepath)[1].replace(/\\/g, '/') + '/';
                    if (data && (data.constructor !== Array)) data = [data];
                    for (var i = 0; i < data.length; i++) {
                        if (!data[i].path) {
                            if (data[i].namespace) {
                                // Assume Plugin
                                if (grunt.file.exists('apps/' + prefix + 'register.js')) data[i].path = prefix + 'register';
                            } else {
                                // Assume App
                                if (grunt.file.exists('apps/' + prefix + 'main.js')) data[i].path = prefix + 'main';
                            }
                        }
                        manifest.push(data[i]);
                    }
                    return manifest.map(JSON.stringify);
                },
            },
            files: [
                {
                    src: ['apps/**/manifest.json'],
                    dest: 'build/manifests/<%= pkg.name %>.json',
                }
            ]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
};
