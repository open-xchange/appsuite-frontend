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

    grunt.registerTask('serve', 'Use the appserver to serve your apps', function () {
        var config = grunt.config().local.appserver;
        if (config.server === '') {
            grunt.log.error('Server not specified in grunt/local.conf.json');
            grunt.log.writeln('Hint: If this is a new setup you may want to copy the file grunt/local.conf.defaults.json to grunt/local.conf.json and change its values according to your setup.');
        } else {
            this.async(); // run forever
            var server = require('../../lib/appserver/server.js');
            server.create(config);
        }
    });

};
