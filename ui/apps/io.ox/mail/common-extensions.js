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
     'io.ox/core/extPatterns/actions',
     'io.ox/mail/util',
     'io.ox/mail/api',
     'io.ox/core/api/account',
     'io.ox/core/date',
     'io.ox/contacts/api',
     'io.ox/core/api/collection-pool',
     'io.ox/core/tk/flag-picker',
     'gettext!io.ox/mail',
     'apps/io.ox/core/tk/jquery.lazyload.js'
    ], function (ext, links, actions, util, api, account, date, contactsAPI, Pool, flagPicker, gt) {

    'use strict';

    var extensions = {

        picture: function (baton) {
            var from = baton.data.from,
                size = _.device('retina') ? 80 : 40;
            this.append(
                contactsAPI.pictureHalo(
                    $('<div class="contact-picture">'),
                    { email: from && from[0] && from[0][1], width: size, height: size, scaleType: 'cover' }
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
                unread = util.isUnseen(data);
            this.closest('.list-item').toggleClass('unread', unread);
        },

        unreadClassPartial: function (baton) {
            var data = baton.data,
                unread = api.threads.partiallyUnseen(data);
            this.closest('.list-item').toggleClass('unread', unread);
        },

        deleted: function (baton) {
            this.parent().toggleClass('deleted', util.isDeleted(baton.data));
        },

        flag: function (baton) {

            var color = parseInt(baton.data.color_label || 0, 10);
            if (color <= 0) return; // 0 and a buggy -1

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
                $('<i class="icon-paper-clip has-attachments" aria-hidden="true">')
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
            var isUnread = api.threads.partiallyUnseen(baton.data);
            if (isUnread) this.append('<i class="icon-unread icon-circle" aria-hidden="true">');
        },

        answered: function (baton) {
            var data = baton.data,
                thread = api.threads.get(data) || data,
                isAnswered = util.isAnswered(thread, data);
            if (isAnswered) this.append('<i class="icon-answered icon-reply" aria-hidden="true">');
        },

        forwarded: function (baton) {
            var data = baton.data,
                thread = api.threads.get(data) || data,
                isForwarded = util.isForwarded(thread, data);
            if (isForwarded) this.append('<i class="icon-forwarded icon-mail-forward" aria-hidden="true">');
        },

        subject: function (baton) {

            var keepFirstPrefix = baton.data.threadSize === 1,
                subject = util.getSubject(baton.data, keepFirstPrefix);

            this.append(
                $('<div class="subject">').append(
                    $('<span class="flags">'),
                    $('<span class="drag-title">').text(subject)
                )
            );
        },

        recipients: (function () {

            // var drawAllDropDown = function (node, label, data) {
            //     // use extension pattern
            //     new links.DropdownLinks({
            //         label: label,
            //         classes: 'all-link',
            //         ref: 'io.ox/mail/all/actions'
            //     }).draw.call(node, data);
            // };

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

                // if (_.device('!smartphone')) {
                //     if (!(!showCC && showTO && data.to[0][1] === 'undisclosed-recipients:;')) {
                //         var dd = $('<div class="recipient-actions">');
                //         drawAllDropDown(dd, $('<i class="icon-group">'), data);
                //         dd.appendTo(container);
                //     }
                // }

                var items = container.find('.person-link');
                if (items.length > 3) {
                    container.children().slice(4).hide();
                    container.append(
                        $('<a href="#" class="show-all-recipients">').text(gt('and %1$d others', items.length - 2))
                    );
                    container.on('click', showAllRecipients);
                }
            };
        }()),

        attachmentList: (function () {

            var getContentType = function (type) {
                // might be: image/jpeg; name=Foto.JPG", so ...
                var split = (type || 'unknown').split(/;/);
                return split[0];
            };

            var drawAttachmentDropDown = function (node, label, data) {
                // use extension pattern
                var dd = new links.DropdownLinks({
                        label: label,
                        classes: 'attachment-link',
                        ref: 'io.ox/mail/attachment/links'
                    }).draw.call(node, ext.Baton({ data: data })),
                    contentType = getContentType(data.content_type),
                    url,
                    filename;
                // make draggable (drag-out)
                if (_.isArray(data)) {
                    url = api.getUrl(data, 'zip');
                    filename = (data.subject || 'mail') + '.zip'; // yep, array prop
                } else {
                    url = api.getUrl(data, 'download');
                    filename = String(data.filename || '');
                }
                dd.find('a')
                    .attr({
                        title: data.title,
                        draggable: true,
                        'data-downloadurl': contentType + ':' + filename.replace(/:/g, '') + ':' + ox.abs + url
                    })
                    .on('dragstart', function (e) {
                        $(this).css({ display: 'inline-block' });
                        e.originalEvent.dataTransfer.setData('DownloadURL', this.dataset.downloadurl);
                    });
                return dd;
            };

            function drawInlineLinks(node, data) {
                var extension = new links.InlineLinks({
                    ref: 'io.ox/mail/attachment/links'
                });
                return extension.draw.call(node, ext.Baton({ data: data }));
            }

            function showAllAttachments() {
                $(this).closest('.attachment-list').children().css('display', 'inline-block');
                $(this).remove();
            }

            return function (baton) {

                var attachments = baton.attachments,
                    length = attachments.length,
                    list;

                if (!length) return;

                list = $('<div class="attachment-list">');

                _(attachments).each(function (a, i) {
                    try {
                        var label = (a.filename || ('Attachment #' + i))
                            // lower case file extensions for better readability
                            .replace(/\.(\w+)$/, function (match) {
                                return match.toLowerCase();
                            });
                        // draw
                        var dd = drawAttachmentDropDown(list, _.noI18n(label), a);
                        dd.find('a').first().addClass('attachment-link').prepend(
                            $('<i class="icon-paper-clip">'),
                            $.txt('\u00A0')
                        );
                        // cut off long lists?
                        if (i > 1 && length > 3) dd.hide();

                    } catch (e) {
                        console.error('mail.drawAttachment', e.message);
                    }
                });

                // add "[n] more ..."
                if (length > 3) {
                    list.append(
                        $('<a href="#" class="n-more">').text(
                            gt('and %1$d others ...', length - 2)
                        )
                        .click(showAllAttachments)
                    );
                }

                // show actions for 'all' attachments
                attachments.subject = baton.data.subject;
                list.append('<br>');
                drawInlineLinks(list, attachments);

                this.append(list);
            };
        }()),

        attachmentPreview: (function () {

            var regSupportsPreview = /\.(gif|bmp|tiff|jpe?g|gmp|png|pdf|docx?|xlsx?|pptx?)$/i,
                regIsImage = /\.(gif|bmp|tiff|jpe?g|gmp|png)$/i;

            return function (baton) {

                var attachments = baton.attachments,
                    list = _(attachments).filter(function (attachment) {
                        return attachment.disp === 'attachment' && regSupportsPreview.test(attachment.filename);
                    }),
                    $ul;

                if (!list.length) return;

                this.append(
                    $ul = $('<ul class="attachment-preview" role="presention" aria-hidden="true">').append(
                        _(list).map(function (attachment) {
                            // consider retina displays
                            var size = _.device('retina') ? 240 : 120,
                                // get URL of preview image
                                url = api.getUrl(attachment, 'view') + '&scaleType=cover&width=' + size + '&height=' + size;
                            // non-image files need special format parameter
                            if (!regIsImage.test(attachment.filename)) url += '&format=preview_image&session=' + ox.session;
                            // create list item
                            return $('<li class="lazy">').attr('data-original', url).data(attachment);
                        })
                    )
                );

                $ul.on('click', 'li', function () {
                    var baton = ext.Baton({ data: [$(this).data()] });
                    actions.invoke('io.ox/mail/actions/slideshow-attachment', null, baton);
                });

                _.defer(function () {
                    $ul.find('li.lazy').lazyload({
                        container: $ul,
                        effect : 'fadeIn'
                    });
                    $ul = null;
                });
            };
        }()),

        flagPicker: function (baton) {
            flagPicker.draw(this, baton);
        },

        unreadToggle: (function () {

            function toggle(e) {
                e.preventDefault();
                var view = e.data.view, data = view.model.toJSON();
                // toggle 'unseen' bit
                if (util.isUnseen(data)) api.markRead(data); else api.markUnread(data);
            }

            return function (baton) {
                this.append(
                    $('<a href="#" class="unread-toggle"><i class="icon-circle"/></a>')
                    .on('click', { view: baton.view }, toggle)
                );
            };
        }())
    };

    return extensions;
});
