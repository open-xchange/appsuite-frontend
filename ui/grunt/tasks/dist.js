/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
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
                    },
                    {
                        src: ['static/**/*.min.js'],
                        cwd: 'build/',
                        dest: 'dist/appsuite/',
                        filter: function (f) {
                            return !isTranslationModule(f) && grunt.file.isFile(f);
                        },
                        expand: true
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

    var fileList = grunt.config('uglify.dist.files.0.src'),
        largeFiles = [
            'apps/3rd.party/tinymce/tinymce.js',
            'apps/io.ox/mail/compose/bundle.js',
            'boot.js',
            'precore.js'
        ],
        uglifySkipList = [
            // as long as we support IE11, we need the ES5 legacy version,
            // which doesn't offer minifyed versions
            // 'apps/pdfjs-dist/build/pdf.js',
            // 'apps/pdfjs-dist/build/pdf.worker.js'
        ],
        ignoreList = uglifySkipList.concat(largeFiles).map(function (f) { return '!' + f; });
    grunt.config(
        'uglify.dist.files.0.src',
        fileList.concat(
            //ignore the uglify skip list and large files list
            ignoreList
        )
    );
    grunt.config.merge({
        uglify: {
            //uglify large files in 2nd uglify subtask (run in 2nd ci job)
            dist_largeFiles: {
                files: [{
                    src: largeFiles,
                    cwd: 'build/',
                    dest: 'dist/appsuite/',
                    expand: true
                }]
            }
        }
    });
    grunt.config.merge({
        copy: {
            //copy js files which are not uglified
            dist_uglifySkiplist: {
                src: uglifySkipList,
                cwd: 'build/',
                dest: 'dist/appsuite/',
                expand: true
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
