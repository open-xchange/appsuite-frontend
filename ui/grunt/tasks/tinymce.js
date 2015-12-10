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

    try {
        require('grunt-curl/tasks/curl');
    } catch (e) {
        grunt.verbose.warn('Skipping tinymce optional tasks');
        return;
    }

    var languages = ['ar', 'ar_SA', 'az', 'be', 'bg_BG', 'bn_BD', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'de_AT', 'dv', 'el', 'en_CA', 'en_GB', 'es', 'et', 'eu', 'fa', 'fi', 'fo', 'fr_FR', 'gd', 'gl', 'he_IL', 'hr', 'hu_HU', 'hy', 'id', 'is_IS', 'it', 'ja', 'ka_GE', 'kk', 'km_KH', 'ko_KR', 'lb', 'lt', 'lv', 'ml', 'ml_IN', 'mn_MN', 'nb_NO', 'nl', 'pl', 'pt_BR', 'pt_PT', 'ro', 'ru', 'si_LK', 'sk', 'sl_SI', 'sr', 'sv_SE', 'ta', 'ta_IN', 'tg', 'th_TH', 'tr_TR', 'tt', 'ug', 'uk', 'uk_UA', 'vi', 'vi_VN', 'zh_CN', 'zh_TW'],
        plugins = ['autolink', 'oximage', 'link', 'paste', 'textcolor', 'emoji'],

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

    grunt.config.merge({
        curl: {
            tinymceLanguagePack: {
                src: {
                    url: 'http://www.tinymce.com/i18n/download.php',
                    method: 'POST',
                    form: {
                        'download': languages
                    }
                },
                dest: 'tmp/tinymce_language_pack.zip'
            }
        }
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

    grunt.registerTask('tinymce_update', ['curl:tinymceLanguagePack', 'unzip:tinymceLanguagePack', 'copy:build_tinymce']);

    grunt.loadNpmTasks('grunt-curl');
    grunt.loadNpmTasks('grunt-zip');
};
