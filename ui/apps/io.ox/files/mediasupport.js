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

define('io.ox/files/mediasupport', ['settings!io.ox/files'], function (settings) {

    'use strict';

    var media = {
        audio: {
            Chrome:  'mp3|wav|m4a|m4b|ogg',
            Safari:  'mp3|wav|m4a|m4b|aac',
            IE:      'mp3|m4a|m4b',
            Firefox: 'mp3|wav|ogg|opus'
        },
        video: {
            Chrome:  'm4v|ogv|webm',
            Safari:  'm4v',
            IE:      'm4v',
            Firefox: 'ogv|webm'
        }
    };

    var browserSupportsMedia = {
        hasSupport: function (mediatype) {
            if (mediatype === 'audio') {
                if (!settings.get('audioEnabled')) return false;
                // Early exit if mediatype is not supported
                // Disable Audio for Android, see Bug #29438
                if (_.device('android')) return false;
            }
            if (mediatype === 'video' && !settings.get('videoEnabled')) return false;
            if (!Modernizr[mediatype]) return false;
            return true;
        },
        supportedExtensionsArray: function (mediatype) {
            if (!mediatype) return [];
            var str = this.supportedExtensions(mediatype);
            if (!str || !str.length) return [];
            return str.split('|');
        },
        supportedExtensions: function (mediatype) {

            if (!this.hasSupport(mediatype)) return '';

            var support = '';
            _.each(_.browser, function (v, b) {
                if (v && media[mediatype][b]) {
                    support = media[mediatype][b];
                }
            });
            return support;
        },
        checkFile: function (mediatype, filename) {
            if (!this.hasSupport(mediatype)) return false;
            if (this.supportedExtensions(mediatype) === '') return false;
            var pattern = '\\.(' + this.supportedExtensions(mediatype) + ')';
            return (new RegExp(pattern, 'i')).test(filename);
        }
    };

    return browserSupportsMedia;
});
