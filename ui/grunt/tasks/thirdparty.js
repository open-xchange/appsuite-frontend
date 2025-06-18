/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
                            'font-awesome/{less,fonts}/*',
                            'open-sans-fontface/fonts/Light/*',
                            '!**/*.otf'
                        ],
                        cwd: 'node_modules/',
                        dest: 'build/apps/3rd.party/',
                        filter: 'isFile'
                    },
                    {
                        flatten: true,
                        expand: true,
                        src: ['*.ttf'],
                        dest: 'build/apps/3rd.party/fonts/',
                        cwd: 'apps/io.ox/core/about/'
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
                            'bootstrap-datepicker/less/datepicker3.less',
                            'tinymce/{langs,plugins,skins,themes}/**/*',
                            '{hopscotch,emoji}/*.{js,css,png}'
                        ],
                        cwd: 'node_modules/@open-xchange/',
                        dest: 'build/apps/3rd.party/'
                    },
                    {
                        // static lib
                        expand: true,
                        src: [
                            // file is unused in core
                            'jquery-ui.min.js',
                            'jquery-ui-scrollparent.js'
                        ],
                        cwd: 'lib/',
                        dest: 'build/static/3rd.party/'
                    },
                    {
                        flatten: true,
                        expand: true,
                        src: [
                            '@open-xchange/bootstrap-datepicker/js/bootstrap-datepicker.js',
                            '@open-xchange/bootstrap-tokenfield/js/bootstrap-tokenfield.js',
                            'socket.io-client/dist/socket.io.slim.js',
                            'bigscreen/bigscreen.min.js',
                            'chart.js/dist/chart.min.js',
                            'clipboard/dist/clipboard.min.js',
                            'croppie/croppie.min.js',
                            'resize-polyfill/lib/polyfill-resize.js',
                            'swiper/swiper-bundle.min.js',
                            'typeahead.js/dist/typeahead.jquery.js',
                            'dompurify/dist/purify.min.js',
                            'jwt-decode/build/jwt-decode.js',
                            'mark.js/dist/jquery.mark.min.js'
                        ],
                        cwd: 'node_modules',
                        dest: 'build/static/3rd.party/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            'moment/moment.js',
                            'moment-timezone/builds/moment-timezone-with-data.js'
                        ],
                        cwd: 'node_modules',
                        dest: 'build/static/3rd.party/moment'
                    },
                    {
                        expand: true,
                        src: ['swiper-bundle.css'],
                        cwd: 'node_modules/swiper/',
                        dest: 'build/apps/3rd.party/swiper'
                    },
                    {
                        expand: true,
                        src: ['croppie.css'],
                        cwd: 'node_modules/croppie',
                        dest: 'build/apps/3rd.party/croppie'
                    },
                    {
                        // as long as we support older browsers, we need the legacy version (ES5 support dropped with 2.7)
                        expand: true,
                        src: [
                            'build/pdf.min.mjs',
                            'build/pdf.worker.min.mjs'
                        ],
                        cwd: 'node_modules/pdfjs-dist/legacy',
                        dest: 'build/apps/pdfjs-dist/',
                        rename: function (dest, src) {
                            return dest + src.replace(/\.min.mjs$/, '.mjs');
                        }
                    },
                    {
                        // as long as we support older browsers, we need the legacy version (ES5 support dropped with 2.7)
                        // but take the cmaps and the icons from the common version
                        expand: true,
                        src: [
                            'web/images/*',
                            'cmaps/*'
                        ],
                        cwd: 'node_modules/pdfjs-dist',
                        dest: 'build/apps/pdfjs-dist/'
                    },
                    {
                        // as long as we support older browsers, we need the legacy version (ES5 support dropped with 2.7)
                        expand: true,
                        src: [
                            'web/pdf_viewer.mjs'
                        ],
                        cwd: 'node_modules/pdfjs-dist/legacy',
                        dest: 'build/apps/pdfjs-dist/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['requirejs/require.js'],
                        cwd: 'node_modules/',
                        dest: 'build/static/3rd.party/requirejs'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['crypto-js/crypto-js.js'],
                        cwd: 'node_modules/',
                        dest: 'build/static/3rd.party/crypto-js'
                    },
                    {
                        expand: true,
                        src: ['unorm.js'],
                        cwd: 'node_modules/unorm/lib/',
                        dest: 'build/static/3rd.party/unorm'
                    },
                    {
                        expand: true,
                        src: [
                            // see io.ox/core/locale/meta for the list of locales
                            '{bg,ca,cs,da,de,de-AT,de-CH,el,en,en-GB,en-AU,en-CA,en-DE,en-IE,en-NZ,en-SG,en-ZA,' +
                            'es,es-MX,es-AR,es-BO,es-CL,es-CO,es-CR,es-DO,es-EC,es-SV,es-GT,es-HN,es-NI,es-PA,es-PY,es-PE,es-PR,es-US,' +
                            'et,fi,fr,fr-CA,fr-CH,fr-BE,hu,it,it-CH,lv,nl,nl-BE,nb,pl,pt,ru,ro,sk,sv,tr,ja,zh}/ca-gregorian.json'
                        ],
                        cwd: 'node_modules/cldr-dates-modern/main/',
                        dest: 'build/apps/3rd.party/cldr-dates'
                    },
                    {
                        expand: true,
                        src: ['qrcode.js'],
                        cwd: 'node_modules/qrcode/build',
                        dest: 'build/static/3rd.party/qrcode'
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
                    cwd: 'node_modules/@open-xchange/bootstrap-tokenfield/less/',
                    src: ['*.less'],
                    dest: 'build/apps/3rd.party/bootstrap-tokenfield/css/'
                }]
            }
        }
    });
};
