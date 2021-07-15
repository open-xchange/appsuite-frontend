/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

module.exports = function (grunt) {
    var conf = {
        key: grunt.config('local.appserver.key') || 'ssl/host.key',
        cert: grunt.config('local.appserver.cert') || 'ssl/host.crt',
        ca: grunt.config('local.appserver.ca') || 'ssl/rootCA.crt'
    };

    (Object.keys(conf)).forEach(function (key) {
        var value = conf[key];
        // contains certificate content already
        if (value.indexOf('-----') === 0) return;
        // read file content
        if (!grunt.file.exists(value)) return grunt.log.warn('Missing certificate file: "' + value + '"');
        conf[key] = grunt.file.read(value);
    });

    grunt.config.set('connect.server.options.key', conf.key);
    grunt.config.set('connect.server.options.cert', conf.cert);
    grunt.config.set('connect.server.options.ca', conf.ca);

    // prefer environment variables over local conf
    grunt.config.set('local.appserver.server', process.env.SERVER || grunt.config.get('local.appserver.server'));
};
