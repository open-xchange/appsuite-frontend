/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

'use strict';

module.exports = function (grunt) {
    function isPackagedLanguage(file) {
        //filter all languages that should not be packaged
        //those will have something like ""X-Package: no\n"" in their header
        var content = grunt.file.read(file),
        included = !/^\s*"X-Package: (?:off|no|false|0)(?:\\n)?"\s*$/im.test(content);
        if (!included) {
            grunt.verbose.writeln('Filtered file: ', file);
        }
        return included;
    }

    grunt.config.extend('copy', {
        dist: {
            files: [
                {
                    expand: true,
                    src: ['apps/**/*', 'manifests/**/*', '*.*', '{core,signin}', '.*'],
                    cwd: 'build/',
                    dest: 'dist/<%= pkg.name %>-<%= pkg.version %>/'
                },
                {
                    src: ['help/**/*', 'help-drive/**/*', 'bower_components/**/*', 'bin/touch-appsuite', 'readme.txt', '.htaccess', 'apps/themes/.htaccess'],
                    dest: 'dist/<%= pkg.name %>-<%= pkg.version %>/'
                },
                {
                    src: ['debian/**/*', '*.spec'],
                    dest: 'dist/package/'
                }
            ]
        },
        dist_i18n: {
            files: [
                {
                    src: ['i18n/**/*.po'],
                    dest: 'dist/<%= pkg.name %>-<%= pkg.version %>/',
                    filter: isPackagedLanguage
                }
            ]
        }
    });

    grunt.registerMultiTask('create_i18n_properties', 'Create properties files for i18n configuration', function () {
        this.files.forEach(function (file) {
            var lang = file.src[0].match(/([a-zA-Z_]*).po$/)[1],
                _ = require('underscore'),
                languageNames = _.extend(
                    grunt.file.readJSON('i18n/languagenames.json'),
                    grunt.file.readJSON('i18n/overrides.json')
                ),
                content;

            content = 'io.ox/appsuite/languages/';
            content += lang + '=';
            content += languageNames[lang].replace(/[^\x21-\x7e]/g, function (c) {
                if (c === ' ') return '\\ ';
                var hex = c.charCodeAt(0).toString(16);
                return '\\u0000'.slice(0, -hex.length) + hex;
            });

            grunt.file.write(file.dest, content);
        });
    });

    grunt.config('create_i18n_properties', {
        all: {
            files: [{
                expand: true,
                src: ['i18n/**/*.po'],
                dest: 'dist/<%= pkg.name %>-<%= pkg.version %>',
                filter: isPackagedLanguage,
                flatten: true,
                rename: function (dest, src) {
                    var path = require('path');
                    var lang = src.toLowerCase().replace(/_/g, '-');
                    lang = lang.replace(/\.po$/, '');
                    return path.join(dest, 'i18n', '<%= pkg.name %>-l10n-' + lang + '.properties');
                }
            }]
        }
    });

    grunt.config.extend('compress', {
        dist: {
            options: {
                archive: 'dist/<%= pkg.name %>_<%= pkg.version %>.orig.tar.gz',
                pretty: true
            },
            files: [{
                expand: true,
                src: '<%= pkg.name %>-<%= pkg.version %>/**/*',
                cwd: 'dist/'
            }]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');
};
