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
    'io.ox/files/api',
    'io.ox/files/legacy_api',
    'io.ox/core/strings'
], function (util, api, legacy_api, strings) {

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
            this.append(
                $('<span class="size">').text(
                    _.isNumber(size) ? strings.fileSize(size, 1) : '\u2014'
                )
            );
        },

        locked: function (baton) {
            var node = legacy_api.tracker.isLocked(baton.data) ? $('<i class="fa fa-lock">') : '';
            this.append(
                $('<span class="locked">').append(node)
            );
        },

        thumbnail: function (baton) {

            if (baton.model.isFolder()) {
                return this.append(
                    $('<div class="icon-thumbnail icon-folder">').append(
                        $('<span class="folder-name">').text(baton.model.getDisplayName()),
                        $('<span class="folder-icon"><i class="fa"></i></span>')
                    )
                );
            }

            var url = legacy_api.getUrl(baton.data, 'thumbnail', { thumbnailWidth: 200, thumbnailHeight: 150, scaletype: 'cover' }),
                node = $('<div class="icon-thumbnail">').attr('data-original', url);

            // use defer to ensure the node has already been added to the DOM
            _.defer(function () {
                node.lazyload({ container: node.closest('.list-view') });
                node = null;
            });

            this.append(node);
        },

        fileTypeIcon: function () {
            this.append('<i class="fa file-type-icon">');
        },

        fileTypeClass: function (baton) {
            var type = baton.model.getFileType();
            if (type) this.closest('.list-item').addClass('file-type-' + type);
        }
    };

    return extensions;
});
