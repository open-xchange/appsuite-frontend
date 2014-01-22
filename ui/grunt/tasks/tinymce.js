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

'use strict';

module.exports = function (grunt) {

    var version = '3.5.10',
        languages = ['ar', 'az', 'be', 'bg', 'bn', 'br', 'bs', 'ca', 'ch', 'cn', 'cs', 'ct', 'cy', 'da', 'de', 'dv', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fa', 'fi', 'fr', 'gl', 'gu', 'he', 'hi', 'hr', 'hu', 'hy', 'ia', 'id', 'is', 'it', 'ja', 'ka', 'kb', 'kk', 'kl', 'km', 'ko', 'lb', 'lt', 'lv', 'mk', 'ml', 'mn', 'ms', 'my', 'nb', 'nl', 'nn', 'no', 'pl', 'ps', 'pt', 'ro', 'ru', 'sc', 'se', 'si', 'sk', 'sl', 'sq', 'sr', 'sv', 'sy', 'ta', 'te', 'th', 'tn', 'tr', 'tt', 'tw', 'uk', 'ur', 'vi', 'zh', 'zh-cn', 'zh-tw', 'zu'],
        plugins = ['advimage', 'autolink', 'inlinepopups', 'paste'],
        themes = ['advanced'],

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

                // just extract themes we need
                if (subPath.indexOf('themes' + path.sep) > -1 && !isUsed(themes, subPath)) return null;

                // just extract plugins we need
                if (subPath.indexOf('plugins' + path.sep) > -1 && !isUsed(plugins, subPath)) return null;

                return subPath + path.sep + path.basename(filepath);
            } else {
                return null;
            }
        };

    grunt.config('curl', {

        tinymceMain: {
            src: 'http://download.moxiecode.com/tinymce/tinymce_' + version + '_jquery.zip',
            dest: 'tmp/tinymce.zip'
        },

        tinymceLanguagePack: {
            src: {
                url: 'http://www.tinymce.com/i18n3x/index.php?ctrl=export&act=zip',
                method: 'POST',
                form: {
                    'act': 'zip',
                    'la': languages,
                    'la_export': 'js',
                    'pr_id': 7,
                    'submitted': 'Download'
                }
            },
            dest: 'tmp/tinymce_language_pack.zip'
        }
    });

    grunt.config('unzip', {
        tinymceMain: {
            router: function (filepath) {
                return extractPart(filepath, 'tinymce/jscripts/tiny_mce');
            },
            src: 'tmp/tinymce.zip',
            dest: 'lib/tiny_mce/'
        },
        tinymceLanguagePack: {
            router: function (filepath) {
                return extractPart(filepath, 'tinymce_language_pack');
            },
            src: 'tmp/tinymce_language_pack.zip',
            dest: 'lib/tiny_mce/'
        }
    });

    grunt.config.extend('copy', {
        tinymce: {
            files: [
                {
                    expand: true,
                    src: ['**/*', '!**/*_src.js', '!**/*.txt'],
                    cwd: 'lib/tiny_mce/',
                    dest: 'build/apps/3rd.party/tiny_mce/'
                },
                {
                    expand: true,
                    src: ['**/*'],
                    cwd: 'lib/tiny_mce_custom/',
                    dest: 'build/apps/3rd.party/tiny_mce/'
                }
            ]
        }
    });

    grunt.loadNpmTasks('grunt-curl');
    grunt.loadNpmTasks('grunt-zip');
};