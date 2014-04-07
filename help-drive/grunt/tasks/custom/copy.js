'use strict';

module.exports = function (grunt) {

    grunt.config.extend('copy', {
        help: {
            files: [
                {
                    src: ['help-drive/**/*'],
                    expand: true,
                    filter: 'isFile',
                    dest: 'build/'
                }
            ]
        },
        dist_help_common: {
            files: [
                {
                    src: ['help-drive/**/*', '!help-drive/l10n/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'build/',
                    dest: 'dist/appsuite/'
                }
            ]
        },
        local_install_static: {
            files: [
                {
                    src: ['**/*', '!appsuite/help-drive/l10n/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'dist/',
                    dest: grunt.option('htdoc')
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
         }
    });

    grunt.registerTask('copy_build', [
        'newer:copy:apps',
        'newer:copy:themes',
        'newer:copy:help'
    ]);

    // add dist l10n copy tasks

    grunt.file.expand({
        cwd: 'help-drive/l10n',
        filter: 'isDirectory'
    }, '*').forEach(function (Lang) {
        var lang = Lang.toLowerCase().replace(/_/g, '-'),
            config = {};

        config['dist_help_' + Lang] = {
            files: [
                {
                    src: ['appsuite/help-drive/l10n/' + Lang + '/**/*'],
                    expand: true,
                    filter: 'isFile',
                    cwd: 'build/',
                    dest: 'dist/'
                }
            ]
        };
        config['local_install_' + Lang] = {
            files: [
                {
                    src: ['appsuite/help-drive/l10n/' + Lang + '/**/*'],
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
