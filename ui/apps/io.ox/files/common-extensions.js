/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/common-extensions', [
    'io.ox/mail/util',
    'io.ox/files/api',
    'io.ox/core/strings',
    'gettext!io.ox/files',
    'settings!io.ox/core'
], function (util, api, strings, gt, settings) {

    'use strict';

    var extensions = {

        ariaLabel: function (baton) {
            var parts = [];
            // filename, last modified, and size
            parts.push(baton.data.filename || baton.data.title);
            if (baton.model.isFolder()) parts.push(gt('Folder'));
            parts.push(gt('modified') + ' ' + moment(baton.data.last_modified).format('LLL'));
            parts.push(gt('size') + ' ' + strings.fileSize(baton.data.file_size || 0, 1));
            this.closest('li').attr('aria-label', parts.join(', ') + '.');
        },

        date: function (baton, options) {
            var data = baton.data, t = data.last_modified;
            if (!_.isNumber(t)) return;
            this.append(
                $('<time class="date">')
                .attr('datetime', moment(t).toISOString())
                .text(util.getDateTime(t, options))
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

        filename: function (baton, ellipsis) {
            var
                filename = baton.data['com.openexchange.file.sanitizedFilename'] || baton.data.filename || baton.data.title || '',
                isWrapFilename = false;

            // add suffix for locked files
            if (baton.model && _.isFunction(baton.model.isLocked) && baton.model.isLocked()) {

                filename += ' (' + gt('Locked') + ')';
            }

            // hostname suffix for federated share
            var parentFolder = baton.model.get('folder_id');
            if (
                (parentFolder === '10' || parentFolder === '15') &&  // is folder below My shares or Public files
                _.isFunction(baton.model.isFolder) && baton.model.isFolder() &&
                _.isFunction(baton.model.isSharedFederatedSync) && baton.model.isSharedFederatedSync()
            ) {
                var suffix = baton.model.getAccountDisplayNameSync();
                filename = suffix ? filename + ' (' + suffix + ')' : filename;
            }

            // fix long names
            if (ellipsis) {

                filename = _.ellipsis(filename, ellipsis);

                if (ellipsis.optimizeWordbreak !== true) {
                    isWrapFilename = true;
                }
            } else {
                isWrapFilename = true;
            }
            if (isWrapFilename) {

                // make underscore wrap as well
                filename = filename.replace(/_/g, '_\u200B');
            }
            this.append(
                $('<div class="filename">').text(filename)
            );
        },
        filenameTooltip: function (baton) {
            var filename = baton.data['com.openexchange.file.sanitizedFilename'] || baton.data.filename || baton.data.title || '';
            var parent = this.parent();
            var title = _.breakWord(filename);

            /*
             * The Tooltip object uses the value provided through the options or the data-original-title attribute value.
             * The only alternative is an explicit Tooltip object destruction before recreation (including cumbersome timeout because of async function).
             * The repeated initialization by invoking parent.tooltip() is necessary to not loose the tooltip feature when switching view layouts.
             * See bug 62650 and 64518 for further information.
             */
            parent.attr('data-original-title', title).tooltip('hide');
            parent.tooltip({ // http://getbootstrap.com/javascript/#tooltips // https://codepen.io/jasondavis/pen/mlnEe
                title: title,
                trigger: 'hover',                       // click | hover | focus | manual. You may pass multiple triggers; separate them with a space.
                //placement: 'right auto',                // top | bottom | left | right | auto.
                placement: 'bottom auto',               // top | bottom | left | right | auto.
                animation: true,                        // false
                //delay: { 'show': 400, 'hide': 50000 },
                delay: { 'show': 400 },
                container: parent,

                // Bug-55575: Dropdown indicator shown when hovering over folder symbol
                viewport: { selector: '.io-ox-files-main .list-view-control.toolbar-top-visible', padding: 16 } // viewport: '#viewport' or { "selector": "#viewport", "padding": 0 } // or callback function
            }).on('dispose', function () {
                $(this).parent().tooltip('destroy');
            });
        },

        mailSubject: function (baton, ellipsis) {
            if (!_.has(baton.data, 'com.openexchange.file.storage.mail.mailMetadata')) return;
            var data = baton.data['com.openexchange.file.storage.mail.mailMetadata'],
                subject = util.getSubject(data.subject || '');
            // fix long names
            if (ellipsis) subject = _.ellipsis(subject, ellipsis);
            // make underscore wrap as well
            subject = subject.replace(/_/g, '_\u200B');
            this.append(
                $('<div class="subject">').text(subject)
            );
        },

        mailFrom: function (baton, ellipsis) {
            if (!_.has(baton.data, 'com.openexchange.file.storage.mail.mailMetadata')) return;
            var data = baton.data['com.openexchange.file.storage.mail.mailMetadata'],
                attachmentView = settings.get('folder/mailattachments', {}),
                from = (baton.app.folder.get() === attachmentView.sent) ? data.to[0] : data.from[0];
            from = util.getDisplayName(from);
            // fix long names
            if (ellipsis) from = _.ellipsis(from, ellipsis);
            // make underscore wrap as well
            from = from.replace(/_/g, '_\u200B');
            this.append(
                $('<div class="from">').text(from)
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
            if (baton.model && baton.model.isLocked) {
                this.toggleClass('locked', baton.model.isLocked());
            }
        },

        fileTypeIcon: function () {
            this.append('<i class="fa file-type-icon" aria-hidden="true">');
        },

        fileTypeClass: function (baton) {
            var type = baton.model.getFileType();
            if (type) {
                var listItem = this.closest('.list-item');
                if (listItem[0]) {
                    listItem[0].className = listItem[0].className.replace(/file-type-\w*/gi, '');
                }
                listItem.addClass('file-type-' + type);
            }
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
                    img.off('load.lazyload error.lazyload').on({ 'load.lazyload': load, 'error.lazyload': error }).attr('src', url).data('retry', retry);
                    img = null;
                }, wait);
            }

            function error() {
                //fallback to default
                $(this).parent().addClass('default-icon').append(
                    $('<span class="file-icon"><i class="fa file-type-icon" aria-hidden="true"></i></span>')
                );
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
                            $('<span class="folder-icon"><i class="fa file-type-icon" aria-hidden="true"></i></span>')
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
                        url = baton.model.getUrl(preview, { width: width, height: height, scaleType: 'cover' }),
                        img = $('<img class="dummy-image invisible">').data('retry', 0);

                    // fix URL - would be cool if we had just one call for thumbnails ...
                    img.attr('data-original', url.replace(/format=preview_image/, 'format=thumbnail_image'));

                    // use lazyload
                    img.on({ 'load.lazyload': load, 'error.lazyload': error }).lazyload();

                    return this.append(
                        $('<div class="icon-thumbnail">').append(img)
                    );
                }

                //
                // Fallback
                //
                this.append(
                    $('<div class="icon-thumbnail default-icon">').append(
                        $('<span class="file-icon"><i class="fa file-type-icon" aria-hidden="true"></i></span>')
                    )
                );
            };
        }())
    };

    return extensions;
});
