/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/mail/detail/mobileView', [
    'io.ox/mail/detail/view',
    'io.ox/mail/common-extensions',
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/mail/detail/content',
    'io.ox/core/extPatterns/links',
    'gettext!io.ox/mail',
    'less!io.ox/mail/style'
], function (DetailView, extensions, ext, api, util, content, links, gt) {

    'use strict';

    var INDEX = 0;

    ext.point('io.ox/mail/mobile/detail').extend({
        id: 'unread-class',
        index: INDEX += 100,
        draw: extensions.unreadClass
    });

    ext.point('io.ox/mail/mobile/detail').extend({
        id: 'header',
        index: INDEX += 100,
        draw: function (baton) {
            var header = $('<header class="mobile-detail-view-mail detail-view-header" role="heading">');
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
        draw: function (baton) {
            this.append(
                $('<div class="from">').append(
                    util.serializeList(baton.data, 'from')
                )
            );
        }
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
        id: 'unread-toggle',
        index: INDEX_header += 100,
        draw: extensions.unreadToggle
    });

    ext.point('io.ox/mail/mobile/detail/header').extend({
        id: 'subject',
        index: INDEX_header += 100,
        draw: function (baton) {
            var subject = util.getSubject(baton.data);
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
        id: 'flag-picker',
        index: INDEX_header += 100,
        draw: extensions.flagPicker
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
        draw: extensions.attachmentList
    });

    ext.point('io.ox/mail/mobile/detail/attachments').extend({
        id: 'attachment-preview',
        index: 200,
        draw: extensions.attachmentPreview
    });

    ext.point('io.ox/mail/mobile/detail/body').extend({
        id: 'content',
        index: 1000,
        draw: function (baton) {
            var data = content.get(baton.data);
            this.idle().append(data.content);
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
        onClick: function () {
            // trigger bubbling event
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
        showMail: function () {
            var $li = this.$el;
            if ($li.attr('data-loaded') === 'false') {
                $li.attr('data-loaded', true);
                $li.find('section.body').addClass('loading');
                this.trigger('load');
                // load detailed email data
                api.get(_.cid(this.cid)).then(this.onLoad.bind(this), this.onLoadFail.bind(this));
            }
            return this;
        },
        onChangeAttachments: function () {
            var data = this.model.toJSON(),
                baton = ext.Baton({ data: data, attachments: util.getAttachments(data) }),
                node = this.$el.find('section.attachments').empty();
            ext.point('io.ox/mail/mobile/detail/attachments').invoke('draw', node, baton);
        },

        onChangeContent: function () {
            var data = this.model.toJSON(),
                baton = ext.Baton({ data: data, attachments: util.getAttachments(data) }),
                node = this.$el.find('section.body').empty();
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

            return this;
        }
    });

    return {
        HeaderView: MobileHeaderView,
        DetailView: MobileDetailView
    };
});
