/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/detail/mobileView', [
    'io.ox/mail/detail/view',
    'io.ox/mail/common-extensions',
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/mail/detail/content',
    'gettext!io.ox/mail',
    'less!io.ox/mail/style'
], function (DetailView, extensions, ext, api, util, content, gt) {

    'use strict';

    var INDEX = 0;

    ext.point('io.ox/mail/mobile/detail').extend({
        id: 'unread-class',
        index: INDEX += 100,
        draw: extensions.unreadClass
    });

    ext.point('io.ox/mail/mobile/detail').extend({
        id: 'flagged-class',
        index: INDEX += 100,
        draw: extensions.flaggedClass
    });

    ext.point('io.ox/mail/mobile/detail').extend({
        id: 'header',
        index: INDEX += 100,
        draw: function (baton) {
            var header = $('<header class="mobile-detail-view-mail detail-view-header">');
            ext.point('io.ox/mail/mobile/detail/header').invoke('draw', header, baton);
            this.append(header);

        }
    });

    var INDEX_header = 0;

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'drag-support',
        index: INDEX_header += 100,
        draw: function (baton) {
            this.attr({
                'data-drag-data': _.cid(baton.data),
                'data-drag-message': util.getSubject(baton.data)
            });
        }
    });

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'actions',
        index: INDEX_header += 100,
        draw: extensions.actions
    });

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'from',
        index: INDEX_header += 100,
        draw: extensions.fromDetail
    });

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'priority',
        index: INDEX_header += 100,
        draw: extensions.priority
    });

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'paper-clip',
        index: INDEX_header += 100,
        draw: extensions.paperClip
    });

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'recipients',
        index: INDEX_header += 100,
        draw: extensions.recipients
    });

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'unread-indicator',
        index: INDEX_header += 100,
        draw: extensions.unreadIndicator
    });

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'subject',
        index: INDEX_header += 100,
        draw: function (baton) {
            var subject = util.getSubject(baton.data, true);
            this.append(
                $('<h1 class="subject">').text(subject)
            );
        }
    });

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'date',
        index: INDEX_header += 100,
        draw: extensions.fulldate
    });

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'flags',
        index: INDEX_header += 100,
        draw: function (baton) {
            var node = $('<span class="flags">').appendTo(this);
            ext.point('io.ox/mail/mobile/detail/header/flags').invoke('draw', node, baton);
        }
    });

    ext.point('io.ox/mail/mobile/detail/header/flags').extend({
        id: 'security',
        index: INDEX_header += 100,
        draw: extensions.security
    });

    ext.point('io.ox/mail/mobile/detail/header/flags').extend({
        id: 'flag-toggle',
        index: INDEX_header += 100,
        draw: extensions.flagToggle
    });

    ext.point('io.ox/mail/mobile/detail/header/flags').extend({
        id: 'color-picker',
        index: INDEX_header += 100,
        draw: function (baton) {
            //if (_.device('smartphone')) return;
            extensions.flagPicker.call(this, baton);
        }
    });


    ext.point('io.ox/mail/mobile/detail').extend({
        id: 'notifications',
        index: INDEX += 100,
        draw: function (baton) {
            var section = $('<section class="notifications">');
            ext.point('io.ox/mail/detail/notifications').invoke('draw', section, baton);
            this.append(section);
        }
    });

    ext.point('io.ox/mail/mobile/detail').extend({
        id: 'body',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<section class="attachments">'),
                $('<section class="body user-select-text">')
            );
        }
    });

    ext.point('io.ox/mail/mobile/detail/attachments').extend({
        id: 'attachment-list',
        index: 100,
        draw: function (baton) {
            if (baton.attachments.length === 0) return;
            extensions.attachmentList.call(this, baton);
        }
    });

    ext.point('io.ox/mail/mobile/detail/attachments').extend({
        id: 'attachment-preview',
        index: 200,
        draw: extensions.attachmentPreview
    });

    ext.point('io.ox/mail/mobile/detail/body').extend({
        id: 'iframe+content',
        index: 100,
        draw: function (baton) {
            var self = this;
            ext.point('io.ox/mail/detail/body').get('iframe', function (extension) {
                extension.invoke('draw', self, baton);
            });
            ext.point('io.ox/mail/detail/body').get('content', function (extension) {
                extension.invoke('draw', self, baton);
            });
        }
    });


    ext.point('io.ox/mail/mobile/detail/body').extend({
        id: 'max-size',
        after: 'content',
        draw: function (baton) {

            var isTruncated = _(baton.data.attachments).some(function (attachment) { return attachment.truncated; });
            if (!isTruncated) return;

            var url = 'api/mail?' + $.param({
                action: 'get',
                view: 'document',
                folder: baton.data.folder_id,
                id: baton.data.id,
                session: ox.session
            });

            this.append(
                $('<div class="max-size-warning">').append(
                    $.txt(gt('This message has been truncated due to size limitations.')), $.txt(' '),
                    $('<a role="button" target="_blank">').attr('href', url).text(gt('Show entire message'))
                )
            );
        }
    });

    /*
     * Used for header information in threads on mobile (threadView page)
     * Uses all extension points from desktop view
     */
    var MobileHeaderView = DetailView.View.extend({
        events: {
            'click .detail-view-header': 'onClick'
        },
        onClick: function (e) {
            // trigger bubbling event
            if ($(e.target).hasClass('show-all-recipients')) return;
            this.$el.trigger('showmail');
        },
        toggle: function () {
            // overwrite default toggle of superview
            return this;
        }

    });

    /*
     * DetailView for mobile use
     * uses extionsion point defined in this file
     */
    var MobileDetailView = DetailView.View.extend({

        onChangeAttachments: function () {

            var data = this.model.toJSON(),
                baton = ext.Baton({ data: data, attachments: util.getAttachments(data), view: this }),
                node = this.$el.find('section.attachments').empty();

            ext.point('io.ox/mail/mobile/detail/attachments').invoke('draw', node, baton);

            if (this.model.previous('attachments') &&
                this.model.get('attachments') &&
                this.model.previous('attachments')[0].content !== this.model.get('attachments')[0].content) this.onChangeContent();
        },

        onChangeContent: function () {
            var data = this.model.toJSON(),
                baton = ext.Baton({
                    view: this,
                    model: this.model,
                    data: data,
                    attachments: util.getAttachments(data)
                }),
                node = this.getEmptyBodyNode();
            baton.disable(this.options.disable);
            // draw mail body
            ext.point('io.ox/mail/mobile/detail/body').invoke('draw', node, baton);
        },

        render: function () {
            var data = this.model.toJSON(),
                baton = ext.Baton({ data: data, model: this.model, view: this }),
                subject = util.getSubject(data),
                title = util.hasFrom(data) ?
                    //#. %1$s: Mail sender
                    //#. %2$s: Mail subject
                    gt('Email from %1$s: %2$s', util.getDisplayName(data.from[0]), subject) : subject;

            // disable extensions?
            _(this.options.disable).each(function (extension, point) {
                if (_.isArray(extension)) {
                    _(extension).each(function (ext) {
                        baton.disable(point, ext);
                    });
                } else {
                    baton.disable(point, extension);
                }
            });

            this.$el.attr({
                'aria-label': title,
                'data-cid': this.cid,
                'data-loaded': 'false'
            });
            this.$el.data({ view: this, model: this.model });
            this.baton = baton;
            ext.point('io.ox/mail/mobile/detail').invoke('draw', this.$el, baton);

            $('[data-page-id="io.ox/mail/detailView"]').trigger('header_ready');
            return this;
        }
    });

    return {
        HeaderView: MobileHeaderView,
        DetailView: MobileDetailView
    };
});
