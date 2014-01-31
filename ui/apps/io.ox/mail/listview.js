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
    ['io.ox/mail/common-extensions',
     'io.ox/core/extensions',
     'io.ox/mail/util',
     'io.ox/mail/api',
     'io.ox/core/api/account',
     'io.ox/core/tk/list',
     'io.ox/core/date'
    ], function (extensions, ext, util, api, account, ListView, date) {

    'use strict';

    ext.point('io.ox/mail/listview/item').extend({
        id: 'default',
        draw: function (baton) {

            var data = baton.data;

            // ignore deleted mails
            data.threadSize = _(data.thread).reduce(function (sum, data) {
                return sum + (util.isDeleted(data) ? 0 : 1);
            }, 0);

            var preview = baton.app.props.get('preview'),
                isSmall = preview === 'bottom' || preview === 'none';

            this.closest('.list-item').toggleClass('small', isSmall);
            ext.point('io.ox/mail/listview/item/' + (isSmall ? 'small' : 'default')).invoke('draw', this, baton);
        }
    });

    /* small */

    ext.point('io.ox/mail/listview/item/small').extend({
        id: 'unread',
        index: 110,
        draw: extensions.unreadClass
    });

    ext.point('io.ox/mail/listview/item/small').extend({
        id: 'col1',
        index: 100,
        draw: function (baton) {
            var column = $('<div class="list-item-column column-1">');
            extensions.answered.call(column, baton);
            this.append(column);
        }
    });

    ext.point('io.ox/mail/listview/item/small').extend({
        id: 'col2',
        index: 200,
        draw: function (baton) {
            var column = $('<div class="list-item-column column-2">');
            extensions.priority.call(column, baton);
            this.append(column);
        }
    });

    ext.point('io.ox/mail/listview/item/small').extend({
        id: 'col3',
        index: 300,
        draw: function (baton) {
            var column = $('<div class="list-item-column column-3">');
            ext.point('io.ox/mail/listview/item/small/col3').invoke('draw', column, baton);
            this.append(column);
        }
    });

    ext.point('io.ox/mail/listview/item/small/col3').extend({
        id: 'from',
        index: 100,
        draw: extensions.from
    });

    ext.point('io.ox/mail/listview/item/small').extend({
        id: 'col4',
        index: 400,
        draw: function (baton) {
            var column = $('<div class="list-item-column column-4">');
            ext.point('io.ox/mail/listview/item/small/col4').invoke('draw', column, baton);
            this.append(column);
        }
    });

    ext.point('io.ox/mail/listview/item/small/col4').extend({
        id: 'flag',
        index: 100,
        draw: extensions.flag
    });

    ext.point('io.ox/mail/listview/item/small/col4').extend({
        id: 'thread-size',
        index: 200,
        draw: extensions.threadSize
    });

    ext.point('io.ox/mail/listview/item/small/col4').extend({
        id: 'paper-clip',
        index: 300,
        draw: extensions.paperClip
    });

    ext.point('io.ox/mail/listview/item/small/col4').extend({
        id: 'subject',
        index: 1000,
        draw: extensions.subject
    });

    ext.point('io.ox/mail/listview/item/small').extend({
        id: 'col5',
        index: 500,
        draw: function (baton) {
            var column = $('<div class="list-item-column column-5">');
            ext.point('io.ox/mail/listview/item/small/col5').invoke('draw', column, baton);
            this.append(column);
        }
    });

    ext.point('io.ox/mail/listview/item/small/col5').extend({
        id: 'date',
        index: 100,
        draw: extensions.date
    });

    /* default */

    ext.point('io.ox/mail/listview/item/default').extend({
        id: 'picture',
        before: 'row1',
        draw: extensions.picture
    });

    ext.point('io.ox/mail/listview/item/default').extend({
        id: 'row1',
        index: 100,
        draw: function (baton) {
            var row = $('<div class="list-item-row">');
            ext.point('io.ox/mail/listview/item/default/row1').invoke('draw', row, baton);
            this.append(row);
        }
    });

    ext.point('io.ox/mail/listview/item/default/row1').extend({
        id: 'date',
        index: 100,
        draw: extensions.date
    });

    ext.point('io.ox/mail/listview/item/default/row1').extend({
        id: 'from',
        index: 200,
        draw: extensions.from
    });

    ext.point('io.ox/mail/listview/item/default').extend({
        id: 'unread',
        index: 110,
        draw: extensions.unreadClass
    });

    ext.point('io.ox/mail/listview/item/default').extend({
        id: 'deleted',
        index: 120,
        draw: extensions.deleted
    });

    ext.point('io.ox/mail/listview/item/default').extend({
        id: 'row2',
        index: 200,
        draw: function (baton) {
            var row = $('<div class="list-item-row">');
            ext.point('io.ox/mail/listview/item/default/row2').invoke('draw', row, baton);
            this.append(row);
        }
    });

    ext.point('io.ox/mail/listview/item/default/row2').extend({
        id: 'flag',
        index: 100,
        draw: extensions.flag
    });

    ext.point('io.ox/mail/listview/item/default/row2').extend({
        id: 'thread-size',
        index: 200,
        draw: extensions.threadSize
    });

    ext.point('io.ox/mail/listview/item/default/row2').extend({
        id: 'paper-clip',
        index: 300,
        draw: extensions.paperClip
    });

    ext.point('io.ox/mail/listview/item/default/row2').extend({
        id: 'priority',
        index: 400,
        draw: extensions.priority
    });

    ext.point('io.ox/mail/listview/item/default/row2').extend({
        id: 'subject',
        index: 1000,
        draw: function (baton) {
            extensions.subject.call(this, baton);
            var node = this.find('.flags');
            extensions.unread.call(node, baton);
            extensions.answered.call(node, baton);
            extensions.forwarded.call(node, baton);
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
                    util.getFrom(data, 'from')
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

    // var ANIMATION_DURATION = 200;

    var MailListView = ListView.extend({

        ref: 'io.ox/mail/listview',

        initialize: function (options) {
            ListView.prototype.initialize.call(this, options || {});
            this.$el.addClass('mail');
            // this.on('cursor:right', this.openThread);
            // this.on('cursor:left', this.closeThread);
            // this.$el.on('click', '.thread-size', $.proxy(this.toggleThread, this));
        },

        filter: function (model) {
            var data = model.toJSON();
            return !util.isDeleted(data);
        }

        // onRemove: function (model) {
        //     ListView.prototype.onRemove.call(this, model);
        //     this.$el.find('li[data-thread="' + model.cid + '"]').remove();
        // },

        // onChange: function (model) {
        //     ListView.prototype.onChange.call(this, model);
        //     this.updateThread(model);
        // },

        // getThread: function (cid) {
        //     return this.$el.find('li[data-thread="' + cid + '"]');
        // },

        // toggleThread: function (e) {
        //     var open = $(e.currentTarget).attr('data-open') === 'true';
        //     if (open) this.closeThread(); else this.openThread();
        // },

        // openThread: function () {

        //     var node, cid, model, thread, li;

        //     node = this.selection.getCurrentNode();
        //     if (!node || node.find('.thread-size').attr('data-open') === 'true') return;

        //     cid = node.attr('data-cid').replace(/^thread\./, '');
        //     if (cid === undefined) return;

        //     // get model by cid
        //     model = this.collection.get(cid);
        //     if (model === undefined) return;

        //     // get thread
        //     thread = model.get('thread');
        //     if (thread.length <= 1) return;

        //     node.find('.thread-size')
        //         .attr('data-open', 'true')
        //         .find('i').attr('class', 'icon-caret-down');

        //     li = this.getThread(cid);
        //     if (li.length) return li.stop().slideDown(ANIMATION_DURATION); // avoid "remove" callback of running closeThread()

        //     this.renderThread(node, model);
        // },

        // closeThread: function () {

        //     var node, cid;

        //     node = this.selection.getCurrentNode();
        //     if (!node || node.find('.thread-size').attr('data-open') === 'false') return;

        //     cid = node.attr('data-cid').replace(/^thread\./, '');
        //     if (cid === undefined) return;

        //     node.find('.thread-size')
        //         .attr('data-open', 'false')
        //         .find('i').attr('class', 'icon-caret-right');

        //     this.getThread(cid).slideUp(ANIMATION_DURATION, function () {
        //         $(this).remove();
        //     });
        // },

        // updateThread: function (model) {
        //     var li = this.getThread(model.cid);
        //     if (li.length === 0) return;
        //     this.renderThreadList(li.children('ul').empty(), model);
        // },

        // renderThread: function (node, model) {
        //     $('<li>')
        //     .attr('data-thread', model.cid)
        //     .hide()
        //     .append(
        //         this.renderThreadList($('<ul>'), model)
        //     )
        //     .insertAfter(node)
        //     .slideDown(ANIMATION_DURATION);
        // },

        // renderThreadList: function (ul, model) {
        //     return ul.append(
        //         _(model.get('thread'))
        //         .chain()
        //         .filter(function (data) {
        //             return !util.isDeleted(data);
        //         })
        //         .map(this.renderThreadItem, this)
        //         .value()
        //     );
        // },

        // renderThreadItem: function (data) {
        //     var li = this.scaffold.clone(),
        //         baton = ext.Baton({ data: data });
        //     li.addClass('thread-item');
        //     li.attr('data-cid', _.cid(data));
        //     ext.point(this.ref + '/thread').invoke('draw', li, baton);
        //     return li;
        // }
    });

    return MailListView;
});
