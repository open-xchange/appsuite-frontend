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
*/

// Update like this: grunt tinymce_update --vs=4.1.5

'use strict';

module.exports = function (grunt) {

    grunt.config.merge({
        copy: {
            build_tinymce: {
                files: [
                    {
                        expand: true,
                        src: ['**/*'],
                        cwd: 'lib/tinymce/',
                        dest: 'build/apps/3rd.party/tinymce/'
                    }
                ]
            }
        }
    });

    var plugins = ['autolink', 'oximage', 'link', 'paste', 'textcolor', 'emoji'],
        path = require('path'),

        isUsed = function (list, subPath) {
            var res = false;
            for (var i = 0; i < list.length && !res; i++) {
                if (subPath.indexOf(path.sep + list[i]) > -1) {
                    res = true;
                }
            }
            return res;
        },

        extractPart = function (filepath, trimpath) {
            var fp = path.dirname(filepath);
            if (fp.indexOf(trimpath) > -1) {
                var subPath = fp.substr(trimpath.length);
                // just extract plugins we need
                if (subPath.indexOf('plugins' + path.sep) > -1 && !isUsed(plugins, subPath)) return null;
                return subPath + path.sep + path.basename(filepath);
            }
            return null;
        };

    grunt.registerTask('tinymceLanguagePack', 'Fetches TinyMCE language files', function () {
        var fs = require('fs'),
            request = require('request'),
            done = this.async();

        request('http://archive.tinymce.com/i18n/index.php', function (error, response, body) {
            if (error) grunt.fail.warn(error);

            if (!error && response.statusCode === 200) {
                var re = /download\[\]" value="(.*)"/g,
                    languages = body.match(re).map(function (str) {
                        str = str.replace(re, '$1');
                        // remove corrupt languages
                        if (/zh_CN\.GB2312|ru@petr1708/.test(str)) return;
                        return str;
                    }),
                    writeStream = fs.createWriteStream('tmp/tinymce_language_pack.zip');
                request({
                    url: 'http://archive.tinymce.com/i18n/download.php',
                    method: 'POST',
                    form: {
                        'download': languages
                    }
                }, function cb(error) {
                    if (error) grunt.fail.warn(error);
                }).pipe(writeStream);
                writeStream.on('close', done);
                writeStream.on('error', done);
            }
        });
    });

    grunt.config.merge({
        unzip: {
            tinymceLanguagePack: {
                router: function (filepath) {
                    return extractPart(filepath, 'langs');
                },
                src: 'tmp/tinymce_language_pack.zip',
                dest: 'lib/tinymce/langs/'
            }
        }
    });

    grunt.registerTask('tinymce_update', ['tinymceLanguagePack', 'unzip:tinymceLanguagePack', 'copy:build_tinymce']);

    grunt.loadNpmTasks('grunt-zip');
};
