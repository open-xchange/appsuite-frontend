/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/common-extensions', [
    'io.ox/mail/util',
    'io.ox/files/legacy_api',
    'io.ox/core/strings'
], function (util, api, strings) {

    'use strict';

    var extensions = {

        date: function (baton, options) {
            var data = baton.data, t = data.last_modified;
            if (!_.isNumber(t)) return;
            this.append(
                $('<time class="date">')
                .attr('datetime', moment(t).toISOString())
                .text(_.noI18n(util.getDateTime(t, options)))
            );
        },

        smartdate: function (baton) {
            extensions.date.call(this, baton, { fulldate: false, smart: true });
        },

        fulldate: function (baton) {
            extensions.date.call(this, baton, { fulldate: true, smart: false });
        },

        compactdate: function (baton) {
            extensions.date.call(this, baton, { fulldate: false, smart: false });
        },

        filename: function (baton) {
            this.append(
                $('<div class="filename">').text(baton.data.filename || baton.data.title)
            );
        },

        size: function (baton) {
            var size = baton.data.file_size;
            if (!_.isNumber(size)) return;
            this.append(
                $('<span class="size">').text(!!size ? strings.fileSize(size, 1) : strings.fileSize(size, 1))
            );
        },

        locked: function (baton) {
            var node = api.tracker.isLocked(baton.data) ? $('<i class="fa fa-lock">') : '';
            this.append(
                $('<span class="locked">').append(node)
            );
        },

        icon: (function () {

            function getExtension(filename) {
                var parts = String(filename || '').split('.');
                return parts.length === 1 ? '' : parts.pop().toLowerCase();
            }

            function getDecoration(extension) {
                for (var type in drawIndicator.types) {
                    if (drawIndicator.types[type].test(extension)) return type;
                }
            }

            function drawIndicator(baton) {
                var extension = getExtension(baton.data.filename),
                    decoration = getDecoration(extension);
                this.append(
                    $('<i class="fa file-type-indicator">').addClass(decoration)
                );
            }

            // accessible & extensible
            drawIndicator.types = {
                image: /^(gif|bmp|tiff|jpe?g|gmp|png)$/,
                audio: /^(mp3|ogg|m4a|m4b|aac|wav)$/,
                video: /^(avi|m4v|mp4|ogv|ogm|webm|mov|mpeg)$/,
                docx: /^do[ct]x?$/,
                xlsx: /^xlsx?$/,
                pptx: /^p[po]tx?$/,
                pdf: /^pdf$/,
                zip: /^(zip|gz|gzip|tgz)$/,
                text: /^(txt|md)$/
            };

            return drawIndicator;

        }())
    };

    return extensions;
});
