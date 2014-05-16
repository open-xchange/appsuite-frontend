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
     'io.ox/core/strings',
     'io.ox/core/notifications',
     'io.ox/contacts/api',
     'io.ox/core/api/collection-pool',
     'io.ox/core/tk/flag-picker',
     'io.ox/core/capabilities',
     'settings!io.ox/mail',
     'gettext!io.ox/mail'
    ], function (ext, links, actions, util, api, account, date, strings, notifications, contactsAPI, Pool, flagPicker, capabilities, settings, gt) {

    'use strict';

    var extensions = {

        picture: function (baton) {
            var data = baton.data,
                from = data.from,
                size = _.device('retina') ? 80 : 40;
            this.append(
                contactsAPI.pictureHalo(
                    $('<div class="contact-picture" aria-hidden="true">'),
                    { email: from && from[0] && from[0][1], width: size, height: size, scaleType: 'cover' }
                )
            );
        },

        date: function (baton, options) {
            var data = baton.data, t = data.received_date, d;
            if (!_.isNumber(t)) return;
            d = new date.Local(t);
            this.append(
                $('<time class="date">')
                .attr('datetime', d.format('yyyy-MM-dd hh:mm'))
                .text(_.noI18n(util.getDateTime(t, options)))
            );
        },

        smartdate: function (baton) {
            extensions.date.call(this, baton, { fulldate: false, smart: true });
        },

        fulldate: function (baton) {
            extensions.date.call(this, baton, { fulldate: true, smart: false });
        },

        from: function (baton) {
            var data = baton.data,
                single = !data.threadSize || data.threadSize === 1,
                field = single && account.is('sent|drafts', data.folder_id) ? 'to' : 'from';
            this.append(
                $('<div class="from">').append(
                    util.getFrom(data, field)
                )
            );
        },

        size: function (baton) {
            var data = baton.data;
            if (!_.isNumber(data.size)) return;
            this.append(
                $('<span class="size">').text(strings.fileSize(data.size, 1))
            );
        },

        unreadClass: function (baton) {
            var isUnseen = util.isUnseen(baton.data);
            this.closest('.list-item').toggleClass('unread', isUnseen);
        },

        deleted: function (baton) {
            this.parent().toggleClass('deleted', util.isDeleted(baton.data));
        },

        flag: function (baton) {

            var color = baton.data.color_label;
            if (color <= 0) return; // 0 and a buggy -1

            this.append(
                $('<i class="flag flag_' + color + ' fa fa-bookmark" aria-hidden="true">')
            );
        },

        threadSize: function (baton) {

            var data = baton.data;
            if (!_.isNumber(data.threadSize)) return;
            if (data.threadSize <= 1) return;

            this.append(
                $('<div class="thread-size" aria-hidden="true">').append(
                    $('<span class="number">').text(_.noI18n(data.threadSize))
                )
            );
        },

        paperClip: function (baton) {
            if (!baton.data.attachment) return;
            this.append(
                $('<i class="fa fa-paperclip has-attachments" aria-hidden="true">')
            );
        },

        priority: function (baton) {
            var data = baton.data;
            this.append(
                $('<span class="priority" aria-hidden="true">').append(
                    util.getPriority(data)
                )
            );
        },

        unread: function (baton) {
            var isUnseen = util.isUnseen(baton.data);
            if (isUnseen) this.append('<i class="icon-unread fa fa-envelope" aria-hidden="true">');
        },

        answered: function (baton) {
            var data = baton.data,
                cid = _.cid(data),
                thread = api.threads.get(cid),
                isAnswered = util.isAnswered(thread, data);
            if (isAnswered) this.append('<i class="icon-answered fa fa-reply" aria-hidden="true">');
        },

        forwarded: function (baton) {
            var data = baton.data,
                cid = _.cid(data),
                thread = api.threads.get(cid),
                isForwarded = util.isForwarded(thread, data);
            if (isForwarded) this.append('<i class="icon-forwarded fa fa-mail-forward" aria-hidden="true">');
        },

        subject: function (baton) {

            var data = baton.data,
                keepFirstPrefix = baton.data.threadSize === 1,
                subject = util.getSubject(data, keepFirstPrefix);

            this.append(
                $('<div class="subject">').append(
                    $('<span class="flags">'),
                    $('<span class="drag-title">').text(subject)
                )
            );
        },

        // a11y: set title attribute on outer list item
        title: function (baton) {
            var subject = util.getSubject(baton.data);
            this.closest('.list-item').attr('title', subject);
        },

        recipients: (function () {

            // var drawAllDropDown = function (node, label, data) {
            //     // use extension pattern
            //     new links.Dropdown({
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

                var items = container.find('.person-link');
                if (items.length > 3) {
                    container.children().slice(4).hide();
                    container.append(
                        //#. %1$d - number of other recipients (names will be shown if string is clicked)
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
                var dd = new links.Dropdown({
                        label: label,
                        classes: 'attachment-link',
                        ref: 'io.ox/mail/attachment/links'
                    }).draw.call(node, ext.Baton({ data: data, $el: $('<span>') })),
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
                            $('<i class="fa fa-paperclip">'),
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
                            //#. %1$d - number of attachments not shown (will be shown when string is clicked)
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

            var regIsDocument = /\.(pdf|do[ct]x?|xlsx?|p[po]tx?)$/i,
                regIsImage = /\.(gif|bmp|tiff|jpe?g|gmp|png)$/i;

            return function (baton) {

                var attachments = baton.attachments,
                    supportsDocumentPreview = capabilities.has('document_preview'),
                    list = _(attachments).filter(function (attachment) {
                        if (attachment.disp !== 'attachment') return false;
                        if (regIsImage.test(attachment.filename)) return true;
                        if (supportsDocumentPreview && regIsDocument.test(attachment.filename)) return true;
                        return false;
                    }),
                    $ul;

                if (!list.length) return;

                this.append(
                    $ul = $('<ul class="attachment-preview" role="presentation" aria-hidden="true">').append(
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

                if (util.isEmbedded(baton.data)) return;

                this.append(
                    $('<a href="#" class="unread-toggle" tabindex="1"><i class="fa"/></a>')
                    .on('click', { view: baton.view }, toggle)
                );
            };
        }()),

        externalImages: (function () {

            function loadImages(e) {
                e.preventDefault();
                var view = e.data.view;
                view.trigger('load');
                view.$el.find('.external-images').remove();
                // get unmodified mail
                api.getUnmodified(_.cid(view.model.cid)).done(function (data) {
                    view.trigger('load:done');
                    view.model.set(data);
                });
            }

            function draw(model) {

                // nothing to do if message is unchanged
                // or if message is embedded (since we cannot reload it)
                if (model.get('modified') !== 1 || util.isEmbedded(model.toJSON())) {
                    this.find('.external-images').remove();
                    return;
                }

                this.append(
                    $('<div class="alert alert-info external-images">').append(
                        $('<a href="#" class="btn btn-primary btn-sm" tabindex="1">').text(gt('Show images')),
                        $('<div class="comment">').text(gt('External images have been blocked to protect you against potential spam!'))
                    )
                );
            }

            return function (baton) {
                draw.call(this, baton.model);
                this.on('click', '.external-images', { view: baton.view }, loadImages);
                baton.model.on('change:modified', draw.bind(this));
            };

        }()),

        phishing: (function () {

            var headers = _(settings.get('phishing/headers', ['phishing-test']));

            function draw(model) {

                // avoid duplicates
                if (this.find('.phishing').length) return;

                _(model.get('headers')).find(function (value, name) {
                    if (headers.contains(name)) {
                        this.append(
                            $('<div class="alert alert-error phishing">')
                            .text(gt('Warning: This message might be a phishing or scam mail'))
                        );
                        return true;
                    }
                }, this);
            }

            return function (baton) {
                draw.call(this, baton.model);
                baton.model.on('change:headers', draw.bind(this));
            };

        }()),

        dispositionNotification: (function () {

            var skip = {};

            function returnReceipt(e) {
                e.preventDefault();
                var view = e.data.view, obj = _.cid(view.model.cid);
                view.model.set('disp_notification_to', '');
                skip[view.model.cid] = true;
                api.ack({ folder: obj.folder_id, id: obj.id }).done(function () {
                    notifications.yell(
                        'success',
                        //#. delivery receipt; German "Lesebestätigung"
                        gt('A return receipt has been sent')
                    );
                });
            }

            function cancel(e) {
                e.preventDefault();
                // add to skip hash
                var view = e.data.view;
                skip[view.model.cid] = true;
            }

            function draw(model) {

                this.find('.disposition-notification').remove();

                // skip? (cancaled or already returned)
                if (skip[model.cid]) return;
                // has proper attribute? (only available if message was unseen on fetch)
                if (!model.get('disp_notification_to')) return;
                // user does not ignore this feature?
                if (!settings.get('sendDispositionNotification', false)) return;
                // is not in drafts folder?
                if (account.is('drafts', model.get('folder_id'))) return;

                this.append(
                    $('<div class="alert alert-info disposition-notification">').append(
                        $('<button type="button" class="close" data-dismiss="alert">&times;</button>'),
                        $('<a href="#" class="btn btn-primary btn-sm" tabindex="1">').text(
                            //#. Respond to delivery receipt; German "Lesebestätigung senden"
                            gt('Send a return receipt')
                        ),
                        $('<div class="comment">').text(
                            gt('The sender wants to get notified when you have read this email')
                        )
                    )
                );
            }

            return function (baton) {
                draw.call(this, baton.model);
                this.on('click', '.disposition-notification .btn', { view: baton.view }, returnReceipt);
                this.on('click', '.disposition-notification .close', { view: baton.view }, cancel);
                baton.model.on('change:disp_notification_to', draw.bind(this));
            };

        }()),
    };

    return extensions;
});
