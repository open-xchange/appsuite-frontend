'use strict';

module.exports = function (grunt) {

    grunt.config('compile_po', {

        i18n: {
            options: {
                template: 'grunt/templates/i18n_module.js.tpl'
            },
            files: [{
                src: ['i18n/*.po'],
                dest: 'build/src/apps/'
            }]
        }

    });

    grunt.config('create_pot', {

        oxpot: {
            options: {
                headers: {
                    'Project-Id-Version': '<%= moduleName %>',
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
