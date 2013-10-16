/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/mediasupport', function () {

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
            // Early exit if mediatype is not supported
            if (!Modernizr[mediatype]) return false;
            return true;
        },
        supportedExtensionsArray: function (mediatype) {
            if (!mediatype) return false;
            var str = this.supportedExtensions(mediatype);
            if (!str) return false;
            if (str.indexOf('|') >= 0) {
                return str.split('|');
            } else if (str) {
                return [str];
            }
        },
        supportedExtensions: function (mediatype) {

            if (!this.hasSupport(mediatype)) return false;

            var support;
            _.each(_.browser, function (v, b) {
                if (v && media[mediatype][b]) {
                    support = media[mediatype][b];
                }
            });
            return support;
        },
        checkFile: function (mediatype, filename) {
            if (!this.hasSupport(mediatype)) return false;
            var pattern = '\\.(' + this.supportedExtensions(mediatype) + ')';
            return (new RegExp(pattern, 'i')).test(filename);
        }
    };

    return browserSupportsMedia;
});
