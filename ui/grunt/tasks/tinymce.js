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
            done = this.async(),
            dir = './tmp/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        var writeStream = fs.createWriteStream(dir + 'tinymce_language_pack.zip');
        request('https://tinymce-services.azurewebsites.net/1/i18n/download?langs=af_ZA,ar,hy,az,be,bg_BG,ca,zh_CN,zh_CN.GB2312,zh_TW,hr,cs,cs_CZ,da,dv,nl,en_CA,en_GB,eo,et,fo,fi,fr_FR,fr_CH,gd,ka_GE,de,de_AT,el,he_IL,hi_IN,hu_HU,is_IS,id,ga,it,ja,kab,kk,km_KH,ko_KR,lv,lt,mk_MK,nb_NO,oc,fa_IR,pl,pt_BR,pt_PT,ro,ru,sr,sk,sl_SI,es,es_MX,sv_SE,ta,ta_IN,th_TH,tr,tr_TR,ug,uk,uk_UA,vi_VN,cy', function cb(error) {
            if (error) grunt.fail.warn(error);
        }).pipe(writeStream);
        writeStream.on('close', done);
        writeStream.on('error', done);
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
