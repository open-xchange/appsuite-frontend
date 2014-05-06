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
                    dest: 'dist/appsuite/'
                }
            ]
        },
        local_install_dynamic: {
            files: [
                {
                    src: [],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'dist/',
                    dest: grunt.option('prefix')
                }
            ]
        },
        local_install_static: {
            files: [
                {
                    src: ['**/*', '!appsuite/help/l10n/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'dist/',
                    dest: grunt.option('htdoc')
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
                    dest: 'dist/appsuite/'
                }
            ]
        };
        config['local_install_' + Lang] = {
            files: [
                {
                    src: ['appsuite/help/l10n/' + Lang + '/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'dist/',
                    dest: grunt.option('htdoc')
                }
            ]
        };

        grunt.config.extend('copy', config);
        grunt.registerTask('install:' + Lang, 'install language directory into a custom location', function () {
            if (!grunt.option('htdoc')) {
                grunt.fail.fatal('Need --htdoc option to be set');
            }
            grunt.log.writeln('Installing into:', grunt.option('htdoc'));
            grunt.task.run('copy:local_install_' + Lang);
        });
    });
    grunt.loadNpmTasks('grunt-contrib-copy');
};
