'use strict';

module.exports = function (grunt) {

    grunt.config.extend('copy', {
        help: {
            files: [
                {
                    src: ['help/**/*'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                }
            ]
        },
        dist_help: {
            files: [
                {
                    src: ['help/**/*', '!help/l10n/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'build/',
                    dest: 'dist/<%= pkg.name %>-<%= pkg.version %>'
                }
            ]
        },
        local_install_dist: {
            files: [
                {
                    src: ['**/*', '!help/l10n/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'dist/<%= pkg.name %>-<%= pkg.version %>',
                    dest: grunt.option('dest')
                }
            ]
        }
    });

    grunt.registerTask('copy_build', [
        'newer:copy:apps',
        'newer:copy:themes',
        'newer:copy:help'
    ]);

    // add dist l10n copy tasks

    grunt.file.expand({
        cwd: 'help/l10n',
        filter: 'isDirectory'
    }, '*').forEach(function (Lang) {
        var lang = Lang.toLowerCase().replace(/_/g, '-'),
            config = {};

        config['dist_help_' + Lang] = {
            files: [
                {
                    src: ['help/l10n/' + Lang + '/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'build/',
                    dest: 'dist/<%= pkg.name %>-<%= pkg.version %>'
                }
            ]
        };
        config['local_install_' + Lang] = {
            files: [
                {
                    src: ['help/l10n/' + Lang + '/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'dist/<%= pkg.name %>-<%= pkg.version %>',
                    dest: grunt.option('dest')
                }
            ]
        };

        grunt.config.extend('copy', config);
        grunt.registerTask('install:' + Lang, 'install language directory into a custom location', function () {
            if (!grunt.option('dest')) {
                grunt.fail.fatal('Need --dest option to be set');
            }
            grunt.task.run('copy:local_install_' + Lang);
        });
    });
    grunt.loadNpmTasks('grunt-contrib-copy');
};
