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
     'io.ox/mail/detail/content'
    ], function (extensions, ext, api, util, Pool, content) {

    'use strict';

    ext.point('io.ox/mail/detail-view').extend({
        id: 'header',
        index: 200,
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
        id: 'body',
        index: 300,
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

        onChangeFlags: function () {
            // update unread state
            this.$el.toggleClass('unread', util.isUnseen(this.model.get('flags')));
        },

        initialize: function (options) {
            this.model = pool.getDetailModel(options.data);
            this.cid = this.model.cid;
            this.listenTo(this.model, 'change:flags', this.onChangeFlags);
        },

        render: function () {
            this.$el.attr({ 'data-cid': this.cid, 'data-loaded': 'false' });
            this.$el.data({ view: this, model: this.model });
            ext.point('io.ox/mail/detail-view').invoke(
                'draw', this.$el, ext.Baton({ data: this.model.toJSON(), model: this.model, view: this })
            );
            return this;
        }
    });

    return { View: View };
});
