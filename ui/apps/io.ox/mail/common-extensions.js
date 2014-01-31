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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/common-extensions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/mail/util',
     'io.ox/mail/api',
     'io.ox/core/api/account',
     'io.ox/core/date',
     'io.ox/contacts/api',
     'gettext!io.ox/mail'
    ], function (ext, links, util, api, account, date, contactsAPI, gt) {

    'use strict';

    var extensions = {

        picture: function (baton) {
            var from = baton.data.from;
            this.append(
                contactsAPI.pictureHalo(
                    $('<div class="contact-picture">'),
                    { email: from && from[0] && from[0][1], width: 32, height: 32, scaleType: 'cover' }
                )
            );
        },

        date: function (baton) {
            var data = baton.data, t = data.received_date, d;
            if (!_.isNumber(t)) return;
            d = new date.Local(t);
            this.append(
                $('<time class="date">')
                .attr('datetime', d.format('yyyy-MM-dd hh:mm'))
                .text(_.noI18n(util.getTime(t)))
            );
        },

        from: function (baton) {
            var data = baton.data,
                field = data.threadSize === 1 && account.is('sent|drafts', data.folder_id) ? 'to' : 'from';
            this.append(
                $('<div class="from">').append(
                    util.getFrom(data, field)
                )
            );
        },

        unreadClass: function (baton) {
            var data = baton.data,
                unread = util.isUnseen(data) || (('threadSize' in data) && api.tracker.isPartiallyUnseen(data));
            this.closest('.list-item').toggleClass('unread', unread);
        },

        deleted: function (baton) {
            this.parent().toggleClass('deleted', util.isDeleted(baton.data));
        },

        flag: function (baton) {

            var color = baton.data.color_label || 0;
            if (color === 0) return;

            this.append(
                $('<i class="flag flag_' + color + ' icon-bookmark" aria-hidden="true">')
            );
        },

        threadSize: function (baton) {

            var data = baton.data;
            if (data.threadSize <= 1) return;

            this.append(
                $('<div class="thread-size" aria-hidden="true" data-open="false">').append(
                    $('<span class="number">').text(_.noI18n(data.threadSize))
                    // $.txt(' '),
                    // $('<i class="icon-caret-right">')
                )
            );
        },

        paperClip: function (baton) {
            if (!baton.data.attachment) return;
            this.append(
                $('<i class="icon-paper-clip" aria-hidden="true">')
            );
        },

        priority: function (baton) {
            this.append(
                $('<span class="priority" aria-hidden="true">').append(
                    util.getPriority(baton.data)
                )
            );
        },

        unread: function (baton) {
            var data = baton.data,
                isUnread = util.isUnseen(data) || (('threadSize' in data) && api.tracker.isPartiallyUnseen(data));
            if (isUnread) this.append('<i class="icon-unread icon-circle" aria-hidden="true">');
        },

        answered: function (baton) {
            var data = baton.data,
                thread = api.tracker.getThread(data) || data,
                isAnswered = util.isAnswered(thread, data);
            if (isAnswered) this.append('<i class="icon-answered icon-reply" aria-hidden="true">');
        },

        forwarded: function (baton) {
            var data = baton.data,
                thread = api.tracker.getThread(data) || data,
                isForwarded = util.isForwarded(thread, data);
            if (isForwarded) this.append('<i class="icon-forwarded icon-mail-forward" aria-hidden="true">');
        },

        subject: function (baton) {

            var data = baton.data,
                subject = $.trim(data.subject || '') || gt('No subject');

            if (data.threadSize > 1) subject = subject.replace(/^((re|fwd|aw|wg):\s?)+/i, '');

            this.append(
                $('<div class="subject">').append(
                    $('<span class="flags">'),
                    $('<span class="drag-title">').text(subject)
                )
            );
        },

        recipients: (function () {

            var drawAllDropDown = function (node, label, data) {
                // use extension pattern
                new links.DropdownLinks({
                    label: label,
                    classes: 'all-link',
                    ref: 'io.ox/mail/all/actions'
                }).draw.call(node, data);
            };

            var showAllRecipients = function (e) {
                e.preventDefault();
                $(this).find('.show-all-recipients').remove();
                $(this).children().show();
            };

            return function (baton) {

                var data = baton.data;

                // figure out if 'to' just contains myself - might be a mailing list, for example
                var showCC = data.cc && data.cc.length > 0,
                    showTO = data.to && data.to.length > 0,
                    showBCC = data.bcc && data.bcc.length > 0,
                    show = showTO || showCC || showBCC,
                    container = $('<div class="recipients">');

                if (!show) return;

                if (showTO) {
                    container.append(
                        // TO
                        $('<span class="io-ox-label">').append(
                            $.txt(gt('To')),
                            $.txt(_.noI18n('\u00A0\u00A0'))
                        ),
                        util.serializeList(data, 'to'),
                        $.txt(_.noI18n(' \u00A0 '))
                    );
                }
                if (showCC) {
                    container.append(
                        // CC
                        $('<span class="io-ox-label">').append(
                            $.txt(gt.pgettext('CC', 'Copy')),
                            _.noI18n('\u00A0\u00A0')
                        ),
                        util.serializeList(data, 'cc'),
                        $.txt(_.noI18n(' \u00A0 '))
                    );
                }
                if (showBCC) {
                    container.append(
                        // BCC
                        $('<span class="io-ox-label">').append(
                            $.txt(gt('Bcc')),
                            _.noI18n('\u00A0\u00A0')
                        ),
                        util.serializeList(data, 'bcc'),
                        $.txt(_.noI18n(' \u00A0 '))
                    );
                }

                this.append(container);

                if (_.device('!smartphone')) {
                    if (!(!showCC && showTO && data.to[0][1] === 'undisclosed-recipients:;')) {
                        var dd = $('<div class="recipient-actions">');
                        drawAllDropDown(dd, $('<i class="icon-group">'), data);
                        dd.appendTo(container);
                    }
                }

                var items = container.find('.person-link');
                if (items.length > 3) {
                    container.children().slice(4).hide();
                    container.append(
                        $('<a href="#" class="show-all-recipients">').text(gt('and %1$d others', items.length - 2))
                    );
                    container.on('click', showAllRecipients);
                }
            };
        }())
    };

    return extensions;
});
