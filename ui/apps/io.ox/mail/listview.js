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

define('io.ox/mail/listview',
    ['io.ox/core/extensions',
     'io.ox/mail/util',
     'io.ox/mail/api',
     'io.ox/core/api/account',
     'io.ox/core/tk/list',
     'io.ox/core/date',
     'gettext!io.ox/core'
    ], function (ext, util, api, account, ListView, date) {

    'use strict';

    ext.point('io.ox/mail/listview/item').extend({
        id: 'row1',
        index: 100,
        draw: function (baton) {

            var data = baton.data,
                t = data.received_date,
                d = new date.Local(t);

            this.append(
                $('<div class="list-item-row">').append(
                    // date
                    $('<time class="date">')
                    .attr('datetime', d.format('yyyy-MM-dd hh:mm'))
                    .text(_.noI18n(util.getTime(t))),
                    // from
                    $('<div class="from">').append(
                        util.getFrom(data, (data.threadSize || 1) === 1 && account.is('sent|drafts', data.folder_id) ? 'to' : 'from')
                    )
                )
            );
        }
    });

    ext.point('io.ox/mail/listview/item').extend({
        id: 'unread',
        index: 110,
        draw: function (baton) {
            var data = baton.data;
            if (api.tracker.isUnseen(data) || (('threadSize' in data) && api.tracker.isPartiallyUnseen(data))) {
                this.addClass('unread');
            }
        }
    });

    ext.point('io.ox/mail/listview/item').extend({
        id: 'row2',
        index: 200,
        draw: function (baton) {
            var row = $('<div class="list-item-row">');
            ext.point('io.ox/mail/listview/item/row2').invoke('draw', row, baton);
            this.append(row);
        }
    });

    ext.point('io.ox/mail/listview/item/row2').extend({
        id: 'thread-size',
        index: 100,
        draw: function (baton) {

            var data = baton.data;
            if (!data.thread || data.thread.length <= 1) return;

            this.append(
                $('<div class="thread-size" aria-hidden="true">').append(
                    $('<span class="number">').text(_.noI18n(data.thread.length)),
                    $.txt(' '),
                    $('<i class="icon-caret-right">')
                )
            );
        }
    });

    ext.point('io.ox/mail/listview/item/row2').extend({
        id: 'flag',
        index: 200,
        draw: function (baton) {

            var color = api.tracker.getColorLabel(baton.data);
            if (color === 0) return;

            this.append(
                $('<i class="flag flag_' + color + ' icon-bookmark" aria-hidden="true">')
            );
        }
    });

    ext.point('io.ox/mail/listview/item/row2').extend({
        id: 'paper-clip',
        index: 300,
        draw: function (baton) {
            if (!baton.data.attachment) return;
            this.append(
                $('<i class="icon-paper-clip" aria-hidden="true">')
            );
        }
    });

    ext.point('io.ox/mail/listview/item/row2').extend({
        id: 'priority',
        index: 400,
        draw: function (baton) {
            this.append(
                $('<span class="priority" aria-hidden="true">').append(
                    util.getPriority(baton.data)
                )
            );
        }
    });

    ext.point('io.ox/mail/listview/item/row2').extend({
        id: 'subject',
        index: 1000,
        draw: function (baton) {

            var data = baton.data,
                thread = api.tracker.getThread(data) || data,
                isUnread = api.tracker.isUnseen(data) || (('threadSize' in data) && api.tracker.isPartiallyUnseen(data)),
                isAnswered = util.isAnswered(thread, data),
                isForwarded = util.isForwarded(thread, data);

            this.append(
                $('<div class="subject">').append(
                    isUnread ? $('<i class="icon-unread icon-circle" aria-hidden="true">') : [],
                    isAnswered ? $('<i class="icon-answered icon-reply" aria-hidden="true">') : [],
                    isForwarded ? $('<i class="icon-forwarded icon-mail-forward" aria-hidden="true">') : [],
                    $('<span class="drag-title">').text(data.subject)
                )
            );
        }
    });

    ext.point('io.ox/mail/listview/thread').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {

            var data = baton.data,
                t = data.received_date,
                d = new date.Local(t);

            this.append(
                // date
                $('<time class="date">')
                .attr('datetime', d.format('yyyy-MM-dd hh:mm'))
                .text(_.noI18n(util.getTime(t))),
                // from
                $('<div class="from">').append(
                    util.getFrom(data, (data.threadSize || 1) === 1 && account.is('sent|drafts', data.folder_id) ? 'to' : 'from')
                )
            );
        }
    });

    ext.point('io.ox/mail/listview/thread').extend({
        id: 'unread',
        index: 200,
        draw: function (baton) {
            var data = baton.data;
            if (api.tracker.isUnseen(data) || (('threadSize' in data) && api.tracker.isPartiallyUnseen(data))) {
                this.addClass('unread').prepend(
                    $('<i class="icon-unread icon-circle pull-left" aria-hidden="true">')
                );
            }
        }
    });

    var ANIMATION_DURATION = 200;

    var MailListView = ListView.extend({

        ref: 'io.ox/mail/listview',

        initialize: function (options) {
            ListView.prototype.initialize.call(this, options || {});
            this.$el.addClass('mail');
            this.on('cursor:right', this.openThread);
            this.on('cursor:left', this.closeThread);
        },

        filter: function (model) {
            var data = model.toJSON();
            return !util.isDeleted(data);
        },

        openThread: function () {

            var node, cid, model, thread, li;

            // get node and cid
            node = this.selection.getNode();
            cid = node.attr('data-cid');
            if (cid === undefined) return;

            // get model by cid
            model = this.collection.get(cid);
            if (model === undefined) return;

            // get thread
            thread = model.get('thread');
            if (thread.length <= 1) return;

            li = this.getThread(cid);
            if (li.length) return li.stop().slideDown(ANIMATION_DURATION); // avoid "remove" callback of running closeThread()

            this.renderThread(node, model);
        },

        getThread: function (cid) {
            return this.$el.find('li[data-thread="' + cid + '"]');
        },

        closeThread: function () {

            // get node and cid
            var node = this.selection.getNode(),
                cid = node.attr('data-cid');
            if (cid === undefined) return;

            this.getThread(cid).slideUp(ANIMATION_DURATION, function () {
                $(this).remove();
            });
        },

        renderThread: function (node, model) {
            $('<li>')
            .attr('data-thread', model.cid)
            .hide()
            .append(
                $('<ul>').append(
                    _(model.get('thread').slice(1)).map(this.renderThreadItem, this)
                )
            )
            .insertAfter(node)
            .slideDown(ANIMATION_DURATION);
        },

        renderThreadItem: function (data) {
            var li = this.scaffold.clone(),
                baton = ext.Baton({ data: data });
            li.addClass('thread-item');
            li.attr('data-cid', _.cid(data));
            ext.point(this.ref + '/thread').invoke('draw', li, baton);
            return li;
        }
    });

    return {
        getInstance: function () {
            return new MailListView();
        }
    };
});
