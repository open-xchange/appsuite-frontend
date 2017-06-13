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

    grunt.config.merge({
        copy: {
            build_thirdparty: {
                files: [
                    {
                        expand: true,
                        src: [
                            'bootstrap/less/**/*.less',
                            'bootstrap-datepicker/less/datepicker3.less',
                            'font-awesome/{less,fonts}/*',
                            'open-sans-fontface/fonts/Light/*',
                            '!**/*.otf'
                        ],
                        cwd: 'node_modules/',
                        dest: 'build/apps/3rd.party/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        src: [
                            'tinymce/jquery.tinymce.js',
                            'tinymce/jquery.tinymce.min.js',
                            'tinymce/{plugins,skins,themes}/**/*',
                            'tinymce/tinymce.js'
                        ],
                        cwd: 'node_modules/',
                        dest: 'build/apps/3rd.party/'
                    },
                    {
                        expand: true,
                        src: [
                            'tinymce/{langs,plugins,skins,themes}/**/*',
                            '{hopscotch,emoji}/*.{js,css,png}'
                        ],
                        cwd: 'node_modules/@open-xchange/',
                        dest: 'build/apps/3rd.party/'
                    },
                    {
                        // static lib
                        expand: true,
                        src: ['jquery-ui.min.js', 'bootstrap-combobox.js'],
                        cwd: 'lib/',
                        dest: 'build/static/3rd.party/'
                    },
                    {
                        flatten: true,
                        expand: true,
                        src: [
                            'socket.io-client/dist/socket.io.slim.js',
                            'bigscreen/bigscreen.min.js',
                            'bootstrap-datepicker/js/bootstrap-datepicker.js',
                            'bootstrap-tokenfield/js/bootstrap-tokenfield.js',
                            'chart.js/dist/Chart.min.js',
                            'clipboard/dist/clipboard.min.js',
                            'marked/lib/marked.js',
                            'resize-polyfill/lib/polyfill-resize.js',
                            'swiper/dist/js/swiper.jquery.js',
                            'typeahead.js/dist/typeahead.jquery.js'
                        ],
                        cwd: 'node_modules',
                        dest: 'build/static/3rd.party/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            'moment/moment.js',
                            'moment-timezone/builds/moment-timezone-with-data.js',
                            '@open-xchange/moment-interval/moment-interval.js'
                        ],
                        cwd: 'node_modules',
                        dest: 'build/static/3rd.party/moment'
                    },
                    {
                        expand: true,
                        src: ['*.{png,svg,swf,gif,xap,css}', '!{jquery,*.min}.js'],
                        cwd: 'node_modules/mediaelement/build/',
                        dest: 'build/apps/3rd.party/mediaelement/',
                        filter: 'isFile'
                    },
                    {
                        // js file of mediaelement goes to static path for caching
                        expand: true,
                        src: ['*.js', '!{jquery,*.min}.js'],
                        cwd: 'node_modules/mediaelement/build/',
                        dest: 'build/static/3rd.party/mediaelement/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        src: ['*.css'],
                        cwd: 'node_modules/swiper/dist/css/',
                        dest: 'build/apps/3rd.party/swiper'
                    },
                    {
                        expand: true,
                        src: [
                            'build/pdf.combined.js',
                            'web/images/*'
                        ],
                        cwd: 'node_modules/pdfjs-dist',
                        dest: 'build/apps/pdfjs-dist/'
                        // pdfjs now has it's own define: define('pdfjs-dist/build/pdf.combined', ...)
                    },
                    {
                        expand: true,
                        src: ['unorm.js'],
                        cwd: 'node_modules/unorm/lib/',
                        dest: 'build/static/3rd.party/unorm'
                    }
                ]
            }
        }
    });

    // replace the anonymous defines in the moment.js locales to prevent require.js errors
    grunt.config.merge({
        copy: {
            build_moment_locales: {
                options: {
                    process: function (content, srcPath) {
                        var defineName = (srcPath.split('.').shift()).replace('node_modules/', '');
                        return content.replace(/define\(\['\.\.\/moment'\]/, 'define(\'' + defineName + '\', [\'moment\']');
                    }
                },
                files: [{
                    expand: true,
                    src: ['moment/locale/*'],
                    cwd: 'node_modules',
                    dest: 'build/static/3rd.party/'
                }]
            }
        }
    });

    grunt.config.merge({
        less: {
            build_tokenfield: {
                options: {
                    lessrc: '.lessrc',
                    process: function (src) {
                        return src.replace(/@import "..\/node_modules\/(.*)";/g, '');
                    }
                },
                files: [{
                    expand: true,
                    ext: '.css',
                    cwd: 'node_modules/bootstrap-tokenfield/less/',
                    src: ['*.less'],
                    dest: 'build/apps/3rd.party/bootstrap-tokenfield/css/'
                }]
            }
        }
    });
};
