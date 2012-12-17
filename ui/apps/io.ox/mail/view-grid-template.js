/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/view-grid-template',
    ['io.ox/mail/util',
     'io.ox/mail/api',
     'io.ox/core/tk/vgrid',
     'io.ox/core/api/account',
     'less!io.ox/mail/style.css'], function (util, api, VGrid, account) {

    'use strict';

    var that = {

        // main grid template
        main: {
            build: function () {
                var from, date, priority, subject, attachment, threadSize, flag,
                    answered, forwarded, unread;
                this.addClass('mail').append(
                    $('<div>').append(
                        date = $('<span>').addClass('date'),
                        from = $('<div>').addClass('from')
                    ),
                    $('<div>').append(
                        threadSize = $('<div>').addClass('thread-size'),
                        flag = $('<div>').addClass('flag').text(_.noI18n('\u00A0')),
                        attachment = $('<i>').addClass('icon-paper-clip'),
                        priority = $('<span>').addClass('priority'),
                        $('<div>').addClass('subject').append(
                            answered = $('<i>').addClass('icon-circle-arrow-left'),
                            forwarded = $('<i>').addClass('icon-circle-arrow-right'),
                            unread = $('<i>').addClass('icon-bookmark'),
                            subject = $('<span>')
                        )
                    )
                );
                return { from: from, date: date, priority: priority, unread: unread, subject: subject, attachment: attachment, threadSize: threadSize, flag: flag, answered: answered, forwarded: forwarded };
            },
            set: function (data, fields, index) {
                fields.priority.empty().append(util.getPriority(data));
                fields.subject.text(_.noI18n($.trim(data.subject)));
                if (!data.threadSize || data.threadSize <= 1) {
                    fields.threadSize.text(_.noI18n('')).css('display', 'none');
                } else {
                    fields.threadSize.text(_.noI18n(data.threadSize)).css('display', '');
                }
                fields.from.empty().append(
                    util.getFrom(data, account.is('sent', data.folder_id) ? 'to' : 'from')
                );
                fields.date.text(_.noI18n(util.getTime(data.received_date)));
                fields.attachment.css('display', data.attachment ? '' : 'none');
                fields.flag.get(0).className = 'flag flag_' + (data.color_label || 0);
                if (api.tracker.isPartiallyUnseen(data)) {
                    this.addClass('unread');
                }
                if (util.byMyself(data)) {
                    this.addClass('me');
                }
                if (util.isDeleted(data)) {
                    this.addClass('deleted');
                }
                var thread = api.tracker.getThread(data) || data;
                if (util.isAnswered(thread, data)) {
                    this.addClass('answered');
                }
                if (util.isForwarded(thread, data)) {
                    this.addClass('forwarded');
                }
                this.attr('data-index', index);
            }
        },

        // use label concept to visualize thread overview
        thread: {
            build: function () {
            },
            set: function (data, fields, index, prev) {
                var self = this.removeClass('vgrid-label').addClass('thread-summary').empty(),
                    thread = api.getThread(prev);
                return api.getList(thread).done(function (list) {
                    var length = list.length;
                    _(list.slice(1)).each(function (data, index) {
                        self.append(
                            $('<div class="thread-summary-item selectable">')
                            .addClass(util.isUnseen(data) ? 'unread' : undefined)
                            .attr('data-obj-id', _.cid(data))
                            .append(
                                $('<div class="thread-summary-right">')
                                    .addClass('date').text(_.noI18n(util.getTime(data.received_date))),
                                $('<div class="thread-summary-left">').append(
                                    $('<span class="thread-summary-pos">').text(_.noI18n((length - index - 1))),
                                    $('<span class="thread-summary-from">').append(util.getFrom(data).removeClass('person'), $.txt(' ')),
                                    $('<span class="thread-summary-subject">').text(_.noI18n(data.subject))
                                )
                            )
                        );
                    });
                });
            }
        },

        // simple grid-based list for portal & halo
        drawSimpleGrid: function (list) {

            // use template
            var tmpl = new VGrid.Template(),
                $div = $('<div>');

            // add template
            tmpl.add(that.main);

            _(list).each(function (data, i) {
                var clone = tmpl.getClone();
                clone.update(data, i);
                clone.appendTo($div).node
                    .css('position', 'relative')
                    .data('object-data', data)
                    .addClass('hover');
            });

            return $div;
        }
    };

    return that;
});
