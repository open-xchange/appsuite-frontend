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

    function isTranslationModule(file) {
        return file.match(/\.([a-zA-Z]+_[a-zA-Z]+)\.js$/) && grunt.file.isFile(file);
    }

    grunt.config.merge({
        copy: {
            dist_custom: {
                files: [
                    {
                        src: ['readme.txt'],
                        dest: 'dist/appsuite/'
                    },
                    {
                        expand: true,
                        src: ['.htaccess'],
                        cwd: 'html/',
                        dest: 'dist/appsuite/'
                    }
                ]
            },
            dist_touchAppsuite: {
                options: {
                    mode: parseInt('755', 8) //0755 is not allowed in strict mode o.O
                },
                files: [
                    {
                        expand: true,
                        src: ['touch-appsuite'],
                        cwd: 'bin/',
                        dest: 'dist/sbin/'
                    }
                ]
            }
        }
    });

    grunt.config.merge({
        uglify: {
            dist_rootfolder: {
                files: [{
                    src: ['*.js', 'static/**/*.js'],
                    cwd: 'build/',
                    dest: 'dist/appsuite/',
                    filter: function (f) {
                        return !isTranslationModule(f) && grunt.file.isFile(f);
                    },
                    expand: true
                }]
            }
        }
    });

    grunt.registerMultiTask('create_i18n_properties', 'Create properties files for i18n configuration', function () {
        this.files.forEach(function (file) {
            var lang = file.src[0].match(/([a-zA-Z]+_[a-zA-Z]+).po$/)[1],
                _ = require('underscore'),
                languageNames = _.extend(
                    grunt.file.readJSON('i18n/languagenames.json'),
                    grunt.file.readJSON('i18n/overrides.json')
                ),
                content;

            content = 'io.ox/appsuite/languages/';
            content += lang + '=';
            if (!languageNames[lang]) {
                grunt.fail.warn('Language name not found for: ' + lang);
                return;
            }
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
                dest: 'dist/etc/languages/appsuite/',
                filter: isPackagedLanguage,
                flatten: true,
                rename: function (dest, src) {
                    var path = require('path');
                    var lang = src.toLowerCase().replace(/_/g, '-');
                    lang = lang.replace(/\.po$/, '');
                    return path.join(dest, '<%= pkg.name %>-l10n-' + lang + '.properties');
                }
            }]
        }
    });

};
