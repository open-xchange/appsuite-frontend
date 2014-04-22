/* This file has been generated by ox-ui-module generator.
 * Please only apply minor changes (better no changes at all) to this file
 * if you want to be able to run the generator again without much trouble.
 *
 * If you really have to change this file for whatever reason, try to contact
 * the core team and describe your use-case. May be, your changes can be
 * integrated into the templates to be of use for everybody.
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
                dest: 'build/apps/'
            }]
        }

    });

    grunt.config('create_pot', {

        oxpot: {
            options: {
                headers: {
                    'Project-Id-Version': 'open-xchange-guidedtours',
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

    grunt.loadNpmTasks('grunt-require-gettext');
};
