/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

'use strict';

module.exports = function (grunt) {

    var staticSrc = grunt.config('copy.local_install_static.files.0.src');
    staticSrc.push('appsuite/**/.htaccess');
    grunt.config('copy.local_install_static.files.0.src', staticSrc);

    //exclude language properties files from main install target
    var dynamicSrc = grunt.config('copy.local_install_dynamic.files.0.src');
    dynamicSrc.push('!etc/languages/**/*');
    grunt.config('copy.local_install_dynamic.files.0.src', dynamicSrc);

    // add language properties file to each language package
    grunt.file.expand('i18n/*.po').map(function (fileName) {
        return fileName.match(/([a-zA-Z]+_[a-zA-Z]+).po$/)[1];
    }).forEach(function (Lang) {
        var lang = Lang.toLowerCase().replace(/_/g, '-');
        var langSrc = grunt.config('copy.local_install_' + Lang + '.files.0.src');
        langSrc.push('etc/languages/appsuite/*-' + lang + '.properties');
        grunt.config('copy.local_install_' + Lang + '.files.0.src', langSrc);
    });
};
