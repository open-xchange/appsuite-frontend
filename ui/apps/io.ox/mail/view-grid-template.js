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
     'io.ox/core/emoji/util',
     'gettext!io.ox/core/mail',
     'less!io.ox/mail/style.less'
    ], function (util, api, VGrid, account, emoji, gt) {

    'use strict';

    var colorLabelIconEmpty = 'icon-bookmark-empty',
        colorLabelIcon = 'icon-bookmark';

    var that = {

        // main grid template
        main: {

            // will be replaced with proper object from mail/main.js
            openThreads: {},

            unified: false,

            build: function () {
                var from, date, priority, subject, attachment, threadSize, threadSizeCount, threadSizeIcon,
                    flag, answered, forwarded, unread, account = null, touchHelper = $();
                if (_.device('smartphone')) {
                    touchHelper = $('<div class="touch-helper ignoreheight">');
                }
                this.addClass('mail').append(
                    $('<div>').append(
                        date = $('<span class="date">'),
                        from = $('<div class="from">')
                    ),
                    $('<div>').append(
                        touchHelper,
                        threadSize = $('<div class="thread-size">').append(
                            threadSizeCount = $('<span class="number">'),
                            $.txt(' '),
                            threadSizeIcon = $('<i class="icon-caret-right">')
                        ),
                        flag = $('<i class="flag ' + colorLabelIconEmpty + '">'),
                        attachment = $('<i class="icon-paper-clip">'),
                        priority = $('<span class="priority">'),
                        $('<div class="subject">').append(
                            unread = $('<i class="icon-unread icon-circle">'),
                            answered = $('<i class="icon-answered icon-reply">'),
                            forwarded = $('<i class="icon-forwarded icon-mail-forward">'),
                            subject = $('<span class="drag-title">')
                        )
                    )
                );
                if (that.unified) {
                    this.append(account = $('<div class="account-name">'));
                }
                return {
                    from: from,
                    date: date,
                    priority: priority,
                    unread: unread,
                    subject: subject,
                    attachment: attachment,
                    threadSize: threadSize,
                    threadSizeCount: threadSizeCount,
                    threadSizeIcon: threadSizeIcon,
                    touchHelper: touchHelper,
                    flag: flag,
                    answered: answered,
                    forwarded: forwarded,
                    account: account
                };
            },
            set: function (data, fields, index) {
                fields.priority.empty().append(util.getPriority(data));
                var subject = _.escape($.trim(data.subject)),
                    fromlist = data.from || [['', '']],
                    a11yLabel = util.getDisplayName(fromlist[0]);
                a11yLabel += ', ' + util.getTime(data.received_date);
                if (subject !== '') {
                    a11yLabel += ', ' + subject;
                    fields.subject.removeClass('empty').empty().html(
                        emoji.processEmoji(subject)
                    );
                } else {
                    fields.subject.addClass('empty').text(gt('No subject'));
                }
                if (!data.threadSize || data.threadSize <= 1) {
                    if (_.device('smartphone')) fields.touchHelper.hide();
                    fields.threadSize.css('display', 'none');
                    fields.threadSizeCount.text(_.noI18n(''));
                } else {
                    fields.threadSize.css('display', '');
                    fields.threadSizeCount.text(_.noI18n(data.threadSize));
                    fields.threadSizeIcon.attr('class', (index + 1) in that.openThreads ? 'icon-caret-down' : 'icon-caret-right');
                }
                fields.from.empty().append(
                    util.getFrom(data, (data.threadSize || 1) === 1 && account.is('sent|drafts', data.folder_id) ? 'to' : 'from')
                );
                fields.date.text(_.noI18n(util.getTime(data.received_date)));
                fields.attachment.css('display', data.attachment ? '' : 'none');
                var color = api.tracker.getColorLabel(data);
                //var color = 'threadSize' in data ? api.tracker.getThreadColorLabel(data) : api.tracker.getColorLabel(data);
                fields.flag.get(0).className = that.getLabelClass(color);
                if (fields.account) {
                    fields.account.text(util.getAccountName(data));
                }
                if (api.tracker.isUnseen(data) || (('threadSize' in data) && api.tracker.isPartiallyUnseen(data))) {
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
                this.attr({
                    'data-index': index,
                    'aria-label': a11yLabel
                });
            }
        },

        // use label concept to visualize thread overview
        thread: {
            build: function () {
            },
            set: function (data, fields, index, prev, grid) {
                var self = this.removeClass('vgrid-label').addClass('thread-summary').empty(),
                    thread = api.getThread(prev);
                return api.getList(thread).done(function (list) {
                    var length = list.length, subset = list.slice(1);
                    // update selection
                    if (!grid.selection.contains(subset)) {
                        // get current index
                        index = grid.selection.getIndex(prev) + 1;
                        grid.selection.insertAt(subset, index);
                    }
                    // draw labels
                    _(subset).each(function (data, index) {
                        self.append(
                            $('<div class="thread-summary-item selectable">')
                            .addClass(util.isUnseen(data) ? 'unread' : undefined)
                            .attr('data-obj-id', _.cid(data))
                            .append(
                                $('<div class="thread-summary-right">').append(
                                    //$('<i class="' + that.getLabelClass(color) + '">'),
                                    $('<span class="date">').text(_.noI18n(util.getTime(data.received_date)))
                                ),
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

        getLabelClass: function (color) {
            color = color || 0;
            return 'flag flag_' + color + ' ' + (color === 0 ? colorLabelIconEmpty : colorLabelIcon);
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
