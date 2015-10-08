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
    try {
        require('q');
    } catch (e) {
        grunt.verbose.warn('Skipping upload optional tasks');
        return;
    }

    var url = require('url'),
        fs = require('fs'),
        Q = require('q');

    function obsConfig(key) {
        if (grunt.option('obs-' + key)) {
            return grunt.option('obs-' + key);
        }
        var config = grunt.config().local.obs || {};

        return config[key];
    }

    grunt.config.merge({
        obs_upload: {
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
        }
    });

    grunt.registerMultiTask('obs_upload', 'Upload files via HTTP(S) to OBS', function () {
        var config = this.options(),
            done = this.async(),
            requests = new Array(this.files.length),
            baseUrl = config.url + '/source/' + config.project + '/' + grunt.config.get('pkg.name'),
            proto = config.url.slice(0, 5) === 'https' ? require('https') : require('http');

        this.files.forEach(function (file, index) {
            var uri = baseUrl + '/' + file.dest,
                data = url.parse(uri + '?rev=upload'),
                readFile = Q.denodeify(fs.readFile),
                def = Q.defer();

            data.auth = [config.username, config.password].join(':');
            data.method = 'PUT';
            data.headers = {
                'Accept': '*/*'
            };
            requests[index] = def.promise;
            readFile(file.src[0]).then(function (buffer) {
                var def = Q.defer(),
                    req;

                grunt.verbose.writeln('Uploading', buffer.length, 'byte to', uri);
                req = proto.request(data, def.resolve)
                .on('error', def.reject);

                req.write(buffer);

                req.end();
                return def.promise;
            })
            .then(function (res) {
                var def = Q.defer();
                if (res.statusCode === 200) {
                    res.on('data', def.resolve);
                } else {
                    res.on('data', def.reject);
                }

                return def.promise;
            })
            .done(function (res) {
                grunt.log.ok('uploaded', file.dest);
                grunt.verbose.writeln('Response:\n', res.toString());
                def.resolve(res);
            },
            function (err) {
                grunt.log.error(err);
                def.reject(err);
                done(false);
            });
        });
        Q.all(requests).done(function () {
            var data = url.parse(baseUrl + '?cmd=commit'),
                req;

            data.method = 'POST';
            data.auth = [config.username, config.password].join(':');
            data.headers = {
                'Accept': '*/*'
            };

            grunt.verbose.writeln('Commiting files.');
            req = proto.request(data, function (res) {
                if (res.statusCode === 200) {
                    grunt.log.ok('All files uploaded.');
                    res.on('data', function (data) {
                        grunt.verbose.writeln('Response:\n', data.toString());
                        done(true);
                    });
                    return;
                }

                grunt.log.error('Commit request failed:', require('http').STATUS_CODES[res.statusCode]);
                res.on('data', grunt.log.error);
                done(false);
            })
            .on('error', function (res) {
                grunt.log.error(JSON.stringify(res));
                done(false);
            });

            req.end();
        });
    });
};
