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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/detail/view',
    ['io.ox/mail/common-extensions',
     'io.ox/core/extensions',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/core/api/collection-pool',
     'io.ox/mail/detail/content',
     'gettext!io.ox/mail'
    ], function (extensions, ext, api, util, Pool, content, gt) {

    'use strict';

    ext.point('io.ox/mail/detail-view').extend({
        id: 'focus-indicator',
        index: 100,
        draw: function () {
            this.append('<div class="focus-indicator">');
        }
    });

    ext.point('io.ox/mail/detail-view').extend({
        id: 'unread-class',
        index: 200,
        draw: extensions.unreadClass
    });

    ext.point('io.ox/mail/detail-view').extend({
        id: 'header',
        index: 300,
        draw: function (baton) {
            var header = $('<header class="detail-view-header">');
            ext.point('io.ox/mail/detail-view/header').invoke('draw', header, baton);
            this.append(header);
        }
    });

    var INDEX_header = 0;

    ext.point('io.ox/mail/detail-view/header').extend({
        id: 'picture',
        index: INDEX_header += 100,
        draw: extensions.picture
    });

    ext.point('io.ox/mail/detail-view/header').extend({
        id: 'unread-toggle',
        index: INDEX_header += 100,
        draw: extensions.unreadToggle
    });

    ext.point('io.ox/mail/detail-view/header').extend({
        id: 'date',
        index: INDEX_header += 100,
        draw: extensions.date
    });

    ext.point('io.ox/mail/detail-view/header').extend({
        id: 'from',
        index: INDEX_header += 100,
        draw: extensions.from
    });

    ext.point('io.ox/mail/detail-view/header').extend({
        id: 'flag-picker',
        index: INDEX_header += 100,
        draw: extensions.flagPicker
    });

    ext.point('io.ox/mail/detail-view/header').extend({
        id: 'paper-clip',
        index: INDEX_header += 100,
        draw: extensions.paperClip
    });

    ext.point('io.ox/mail/detail-view/header').extend({
        id: 'recipients',
        index: INDEX_header += 100,
        draw: extensions.recipients
    });

    ext.point('io.ox/mail/detail-view').extend({
        id: 'notifications',
        index: 300,
        draw: function (baton) {
            var section = $('<section class="notifications">');
            ext.point('io.ox/mail/detail-view/notifications').invoke('draw', section, baton);
            this.append(section);
        }
    });

    var INDEX_notifications = 0;

    ext.point('io.ox/mail/detail-view/notifications').extend({
        id: 'phishing',
        index: INDEX_notifications += 100,
        draw: extensions.phishing
    });

    ext.point('io.ox/mail/detail-view/notifications').extend({
        id: 'disposition-notification',
        index: INDEX_notifications += 100,
        draw: extensions.dispositionNotification
    });

    ext.point('io.ox/mail/detail-view/notifications').extend({
        id: 'external-images',
        index: INDEX_notifications += 100,
        draw: extensions.externalImages
    });

    ext.point('io.ox/mail/detail-view').extend({
        id: 'body',
        index: 400,
        draw: function () {
            this.append(
                $('<section class="attachments">'),
                $('<section class="body user-select-text">')
            );
        }
    });

    ext.point('io.ox/mail/detail-view/attachments').extend({
        id: 'attachment-list',
        index: 100,
        draw: extensions.attachmentList
    });

    ext.point('io.ox/mail/detail-view/attachments').extend({
        id: 'attachment-preview',
        index: 200,
        draw: extensions.attachmentPreview
    });

    ext.point('io.ox/mail/detail-view/body').extend({
        id: 'content',
        index: 1000,
        draw: function (baton) {
            var data = content.get(baton.data);
            this.idle().append(data.content);
        }
    });

    var pool = new Pool('mail');

    var View = Backbone.View.extend({

        tagName: 'li',
        className: 'list-item mail-detail',

        events: {
            'keydown': 'onToggle',
            'click .detail-view-header': 'onToggle'
        },

        onChangeFlags: function () {
            // update unread state
            this.$el.toggleClass('unread', util.isUnseen(this.model.get('flags')));
        },

        onChangeContent: function () {
            var data = this.model.toJSON(),
                baton = ext.Baton({ data: data, attachments: util.getAttachments(data) }),
                body = this.$el.find('section.body').empty();
            ext.point('io.ox/mail/detail-view/body').invoke('draw', body, baton);
        },

        onToggle: function (e) {

            if (e.type === 'keydown' && e.which !== 13) return;

            // ignore click on/inside <a> tags
            if ($(e.target).closest('a').length) return;

            // fix collapsed blockquotes
            this.$el.find('.collapsed-blockquote').hide();
            this.$el.find('.blockquote-toggle').show();

            var cid = $(e.currentTarget).closest('li').data('cid');
            this.toggle(cid);
        },

        onUnseen: function () {
            api.markRead(this.model.toJSON());
        },

        onLoad: function (data) {

            // since this function is a callback we have to check this.model
            // as an indicator whether this view has been destroyed meanwhile
            if (this.model === null) return;

            var attachments = this.$el.find('section.attachments'),
                unseen = util.isUnseen(this.model.get('flags'));

            // done
            this.trigger('load:done');

            // draw attachments
            var baton = ext.Baton({ data: data, attachments: util.getAttachments(data) });
            ext.point('io.ox/mail/detail-view/attachments').invoke('draw', attachments, baton);

            // draw body
            this.onChangeContent();

            // merge data
            this.model.set(data);

            // process unseen flag
            if (unseen) this.onUnseen();
        },

        onLoadFail: function () {
            this.trigger('load:done');
            this.$el.attr('data-loaded', false).removeClass('expanded');
        },

        toggle: function (state) {

            var $li = this.$el;

            if (state === undefined) $li.toggleClass('expanded'); else $li.toggleClass('expanded', state);

            if ($li.attr('data-loaded') === 'false' && $li.hasClass('expanded')) {
                $li.attr('data-loaded', true);
                this.trigger('load');
                // load detailed email data
                api.get(_.cid(this.cid)).then(this.onLoad.bind(this), this.onLoadFail.bind(this));
            }
        },

        show: function () {
            this.toggle(true);
        },

        initialize: function (options) {

            this.model = pool.getDetailModel(options.data);
            this.cid = this.model.cid;
            this.listenTo(this.model, 'change:flags', this.onChangeFlags);
            this.listenTo(this.model, 'change:attachments', this.onChangeContent);
            this.$el.on('dispose', this.dispose.bind(this));

            this.on({
                'load': function () {
                    this.$el.find('section.body').empty().busy();
                },
                'load:done': function () {
                    this.$el.find('section.body').idle();
                }
            });
        },

        render: function () {

            var data = this.model.toJSON(),
                baton = ext.Baton({ data: data, model: this.model, view: this }),
                subject = util.getSubject(data),
                title = util.hasFrom(data) ?
                    //#. %1$s: Mail sender
                    //#. %2$s: Mail subject
                    gt('Email from %1$s: %2$s', util.getDisplayName(data.from[0]), subject) : subject;

            this.$el.attr({
                'aria-label': title,
                'data-cid': this.cid,
                'data-loaded': 'false',
                'role': 'listitem',
                'tabindex': '1'
            });

            this.$el.data({ view: this, model: this.model });

            ext.point('io.ox/mail/detail-view').invoke('draw', this.$el, baton);

            return this;
        },

        dispose: function () {
            this.stopListening();
            this.model = null;
        }
    });

    return { View: View };
});
