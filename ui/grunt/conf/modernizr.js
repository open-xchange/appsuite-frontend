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

module.exports = {
    // [REQUIRED] Path to the build you're using for development.
    devFile : 'node_modules/grunt-modernizr/lib/modernizr-dev.js',

    // [REQUIRED] Path to save out the built file.
    outputFile : 'lib/modernizr.js',

    // Based on default settings on http://modernizr.com/download/
    extra : {
        shiv : true,
        printshiv : false,
        load : true,
        mq : false,
        cssclasses : true
    },

    // Based on default settings on http://modernizr.com/download/
    extensibility : {
        addtest : false,
        prefixed : true,
        teststyles : false,
        testprops : false,
        testallprops : false,
        hasevents : false,
        prefixes : false,
        domprefixes : false
    },

    // By default, source is uglified before saving
    uglify : true,

    // Define any tests you want to implicitly include.
    tests : [],

    // By default, this task will crawl your project for references to Modernizr tests.
    // Set to false to disable.
    parseFiles : true,

    // When parseFiles = true, this task will crawl all *.js, *.css, *.scss files, except files that are in node_modules/.
    // You can override this by defining a files array below.
    files : ['apps/**/*.js', 'src/*.js', 'apps/**/*.less'],

    // When parseFiles = true, matchCommunityTests = true will attempt to
    // match user-contributed tests.
    matchCommunityTests : false,

    // Have custom Modernizr tests? Add paths to their location here.
    customTests : []
};
