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

    var staticSrc = grunt.config('copy.local_install_static.files.0.src');
    staticSrc.push('appsuite/**/.htaccess');
    staticSrc.push('appsuite/static/**/*');
    staticSrc.push('sbin/touch-appsuite');
    grunt.config('copy.local_install_static.files.0.src', staticSrc);

    //exclude language properties files from main install target
    var dynamicSrc = grunt.config('copy.local_install_dynamic.files.0.src');
    dynamicSrc.push('!etc/languages/**/*');
    dynamicSrc.push('!appsuite/static/**/*');
    dynamicSrc.push('!sbin/touch-appsuite');
    grunt.config('copy.local_install_dynamic.files.0.src', dynamicSrc);

    // add language properties file to each language package, override the default "Lang" copy task
    var languages = grunt.file.expand('i18n/*.po').map(function (fileName) {
        return fileName.match(/([a-zA-Z]+_[a-zA-Z]+).po$/)[1];
    });
    languages.forEach(function (Lang) {
        var config = {},
            prefix = grunt.option('prefix') || 'no_prefix_set/',
            lang = Lang.toLowerCase().replace(/_/g, '-');

        config['local_install_' + Lang] = {
            files: [{
                src: ['etc/languages/appsuite/*-' + lang + '.properties'],
                expand: true,
                filter: 'isFile',
                cwd: 'dist/',
                dest: prefix
            }]
        };

        grunt.config.merge({
            copy: config
        });
    });

    grunt.registerTask('install:languages', languages.map(function (l) { return 'copy:local_install_' + l; }));

};
