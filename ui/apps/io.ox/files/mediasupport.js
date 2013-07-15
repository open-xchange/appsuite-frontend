/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/mediasupport',
    [], function () {

    'use strict';

    var media = {
        audio: {
            Chrome:  'mp3|wav|m4a|m4b|ogg',
            Safari:  'mp3|wav|m4a|m4b|aac',
            IE:      'mp3|wav|m4a|m4b',
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
            if (!Modernizr[mediatype] || _.device('android')) return false;
            return true;
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