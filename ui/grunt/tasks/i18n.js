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

    grunt.config('compile_po', {

        i18n: {
            options: {
                template: 'grunt/templates/i18n_module.js.tpl'
            },
            files: [{
                src: ['i18n/*.po'],
                dest: 'build/src/apps/i18n/'
            }]
        }

    });

    grunt.config('create_pot', {

        oxpot: {
            options: {
                headers: {
                    'Project-Id-Version': 'Open-Xchange 7',
                    'PO-Revision-Date': 'DATE',
                    'Last-Translator': 'NAME <EMAIL>',
                    'Language-Team': 'NAME <EMAIL>',
                    'MIME-Version': '1.0',
                    'Content-Type': 'text/plain; charset=UTF-8',
                    'Content-Transfer-Encoding': '8bit',
                    'Plural-Forms': 'nplurals=INTEGER; plural=EXPRESSION;'
                }
            },
            files: {
                'i18n/ox.pot': ['apps/**/*.js'],
            },
        }

    });

    grunt.registerMultiTask('migrate_po', 'Migrate the po files to new version', function () {
        var done = this.async();
        var PO = require('pofile');
        var files = this.files;
        var dest = this.files[0].dest;
        var last = files[0].src.length;

        PO.load('i18n/ox.pot', function (err, oxPot) {
            var modulesHash = oxPot.items.reduce(function (acc, item) {
                acc[item.msgid] = item.references.filter(function (ref) {
                    return ref.indexOf('module:') === 0;
                });
                return acc;
            }, {});
            files[0].src.forEach(function (srcFile, index) {
                PO.load(srcFile, function (err, po) {
                    po.items.forEach(function (item) {
                        (modulesHash[item.msgid] || []).forEach(function (module) {
                            item.references.push(module);
                        });
                    });

                    grunt.file.write(dest + srcFile, po.toString());

                    if (index === last) {
                        done(true);
                    }
                });
            });
        });
    });

    grunt.config('migrate_po', {
        i18n: {
            files: [{
                src: 'i18n/*.po',
                dest: 'tmp/migrate_po/'
            }]
        }
    });

    grunt.loadNpmTasks('grunt-require-gettext');
};
