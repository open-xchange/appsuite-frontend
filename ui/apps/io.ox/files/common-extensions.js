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
    'io.ox/core/strings',
    'gettext!io.ox/files'
], function (util, api, strings, gt) {

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
            var name = baton.data.filename || baton.data.title;
            if (baton.model.isLocked()) name += ' (' + gt('Locked') + ')';
            this.append(
                $('<div class="filename">').text(name)
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
            this.toggleClass('locked', baton.model.isLocked());
        },

        fileTypeIcon: function () {
            this.append('<i class="fa file-type-icon">');
        },

        fileTypeClass: function (baton) {
            var type = baton.model.getFileType();
            if (type) this.closest('.list-item').addClass('file-type-' + type);
        },

        //
        // Thumbnail including the concept of retries
        //

        thumbnail: (function () {

            function load() {
                // 1x1 dummy or final image?
                if (this.width === 1 && this.height === 1) reload.call(this); else finalize.call(this);
            }

            function finalize() {
                var img = $(this), url = img.attr('src');
                // set as background image
                img.parent().css('background-image', 'url(' + url + ')');
                // remove dummay image
                img.remove();
            }

            function reload() {
                var img = $(this),
                    retry = img.data('retry') + 1,
                    url = String(img.attr('src') || '').replace(/&retry=\d+/, '') + '&retry=' + retry,
                    // 3 6 12 seconds
                    wait = Math.pow(2, retry - 1) * 3000;
                // stop trying after three retries
                if (retry > 3) return;
                setTimeout(function () {
                    img.off('load error').on({ load: load, error: error }).attr('src', url).data('retry', retry);
                    img = null;
                }, wait);
            }

            function error() {
                $(this).remove();
            }

            return function (baton) {

                //
                // Folder
                //
                if (baton.model.isFolder()) {
                    return this.append(
                        $('<div class="icon-thumbnail default-icon">').append(
                            $('<span class="folder-name">').text(baton.model.getDisplayName()),
                            $('<span class="folder-icon"><i class="fa file-type-icon"></i></span>')
                        )
                    );
                }

                //
                // File with preview
                //
                var preview = baton.model.supportsPreview();
                if (preview) {

                    // no clue if we should use double size for retina; impacts network traffic
                    // var retina = _.device('retina'),
                    var retina = false,
                        width = retina ? 400 : 200,
                        height = retina ? 300 : 150,
                        url = baton.model.getUrl(preview, { width: width, height: height, scaletype: 'cover' }),
                        img = $('<img class="dummy-image invisible">').attr('data-original', url);

                    // use defer to ensure the node has already been added to the DOM
                    _.defer(function () {
                        img.lazyload({
                            container: img.closest('.list-view'),
                            error: error,
                            event: 'scrollstop',
                            load: load
                        });
                        img = null;
                    });

                    return this.append(
                        $('<div class="icon-thumbnail">').append(img)
                    );
                }

                //
                // Fallback
                //
                this.append(
                    $('<div class="icon-thumbnail default-icon">').append(
                        $('<span class="file-icon"><i class="fa file-type-icon"></i></span>')
                    )
                );
            };
        }())
    };

    return extensions;
});
