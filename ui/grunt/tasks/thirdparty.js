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

    grunt.config.merge({
        copy: {
            build_thirdparty: {
                files: [
                    {
                        expand: true,
                        src: [
                            'bootstrap/less/*.less',
                            'bootstrap-datepicker/less/datepicker3.less',
                            'font-awesome/{less,fonts}/*',
                            'open-sans-fontface/fonts/Light/*',
                            '!**/*.otf'
                        ],
                        cwd: 'bower_components/',
                        dest: 'build/apps/3rd.party/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        src: ['view-qrcode.js', 'hopscotch/*', 'mobiscroll/css/*'],
                        cwd: 'lib/',
                        dest: 'build/apps/3rd.party/'
                    },
                    {
                        // static lib
                        expand: true,
                        src: ['jquery-ui.min.js'],
                        cwd: 'lib/',
                        dest: 'build/static/3rd.party/'
                    },
                    {
                        // static lib
                        expand: true,
                        src: [
                            'jquery-imageloader/jquery.imageloader.js',
                            'Chart.js/Chart.js',
                            'bootstrap-tokenfield/js/bootstrap-tokenfield.js',
                            'typeahead.js/dist/typeahead.jquery.js',
                            'marked/lib/marked.js'
                        ],
                        cwd: 'bower_components',
                        dest: 'build/static/3rd.party/'
                    },
                    {
                        expand: true,
                        src: ['*.{png,svg,swf,gif,xap,css}', '!{jquery,*.min}.js'],
                        cwd: 'bower_components/mediaelement/build/',
                        dest: 'build/apps/3rd.party/mediaelement/',
                        filter: 'isFile'
                    },
                    {
                        // js file of mediaelement goes to static path for caching
                        expand: true,
                        src: ['*.js', '!{jquery,*.min}.js'],
                        cwd: 'bower_components/mediaelement/build/',
                        dest: 'build/static/3rd.party/mediaelement/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        src: ['*.{js,css,png}'],
                        cwd: 'lib/node_modules/emoji/lib',
                        dest: 'build/apps/3rd.party/emoji'
                    }
                ]
            }
        }
    });

    grunt.config.merge({
        less: {
            build_tokenfield: {
                options: {
                    lessrc: '.lessrc',
                    process: function (src) {
                        return src.replace(/@import "..\/bower_components\/(.*)";/g, '');
                    }
                },
                files: [{
                    expand: true,
                    ext: '.css',
                    cwd: 'bower_components/bootstrap-tokenfield/less/',
                    src: ['*.less'],
                    dest: 'build/apps/3rd.party/bootstrap-tokenfield/css/'
                }]
            }
        }
    });
};
