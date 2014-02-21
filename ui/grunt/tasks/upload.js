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
    var rest = require('restler');

    function obsConfig(key) {
        if (grunt.option('obs-' + key)) {
            return grunt.option('obs-' + key);
        }
        var config = grunt.config().local.obs || {};

        return config[key];
    }

    grunt.config('obs_upload', {
        package: {
            options: {
                url: obsConfig('url'),
                project: obsConfig('project'),
                username: obsConfig('username'),
                password: obsConfig('password')
            },
            files: [{
                expand: true,
                src: [
                    '<%= pkg.name %>_<%= pkg.version %>.orig.tar.gz',
                    '<%= pkg.name %>_<%= pkg.version %>-*.debian.tar.gz',
                    '<%= pkg.name %>_<%= pkg.version %>-*.dsc'
                ],
                cwd: 'dist/'
            }]
        }
    });

    grunt.registerMultiTask('obs_upload', 'Upload files via HTTP(S) to OBS', function () {
        var config = this.options(),
            done = this.async(),
            lastIndex = this.files.length;

        this.files.forEach(function (file, index) {
            grunt.verbose.writeln('uploading to: ', config.url + '/source/' + config.project + '/' + grunt.config.get('pkg.name') + '/' + file.dest);
            rest.put(config.url + config.project + '/' + grunt.config.get('pkg.name') + '/' + file.dest, {
                username: config.username,
                password: config.password,
                data: grunt.file.read(file.src)
            })
            .on('error', function (err) {
                grunt.log.error(JSON.stringify(err));
                done(false);
            })
            .on('fail', function (err) {
                grunt.log.error(JSON.stringify(err));
                done(false);
            })
            .on('success', function () {
                grunt.log.ok('uploaded', file.dest);
                if (index === lastIndex) done(true);
            });
        });
    });
};
