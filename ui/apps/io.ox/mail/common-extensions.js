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

define('io.ox/mail/common-extensions', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/emoji/util',
    'io.ox/mail/util',
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/core/strings',
    'io.ox/core/folder/api',
    'io.ox/core/folder/title',
    'io.ox/core/notifications',
    'io.ox/contacts/api',
    'io.ox/core/api/collection-pool',
    'io.ox/core/tk/flag-picker',
    'io.ox/core/capabilities',
    'settings!io.ox/mail',
    'io.ox/core/attachments/view',
    'gettext!io.ox/mail'
], function (ext, links, actions, emoji, util, api, account, strings, folderAPI, shortTitle, notifications, contactsAPI, Pool, flagPicker, capabilities, settings, attachment, gt) {

    'use strict';

    // little helper
    function isSearchActive(baton) {
        return !!baton.app && !!baton.app.get('find') && baton.app.get('find').isActive();
    }

    var extensions = {

        a11yLabel: function (baton) {

            var data = baton.data,
                size = api.threads.size(data),
                fromlist = data.from || [['', '']],
                parts = [],
                a11yLabel;

            if (util.isUnseen(data)) parts.push(gt('Unread'));
            parts.push(util.getDisplayName(fromlist[0]), data.subject, util.getTime(data.received_date));
            if (size > 1) parts.push(gt.format('Thread contains %1$d messages', size));
            if (data.attachment) parts.push(gt('has attachments'));

            a11yLabel = parts.join(', ') + '.';

            this.attr({
                'aria-hidden': true
            })
            .parent().attr({
                // escape that a bit; firefox has a severe XSS issue (see bug 31065)
                'aria-label': a11yLabel.replace(/["<]/g, function (match) {
                    if (match === '"') return '&quot';
                    if (match === '<') return '&lt;';
                    return match;
                })
            });
        },

        picture: function (baton) {
            // show picture of sender or first recipient
            // special cases:
            // - show picture of first recipient in "Sent items" and "Drafts"
            // - exception: always show sender in threaded messages
            var data = baton.data,
                size = api.threads.size(data),
                single = size <= 1,
                addresses = single && !isSearchActive(baton) && account.is('sent|drafts', data.folder_id) ? data.to : data.from;
            this.append(
                contactsAPI.pictureHalo(
                    $('<div class="contact-picture" aria-hidden="true">'),
                    { email: data.picture || (addresses && addresses[0] && addresses[0][1]) },
                    { width: 40, height: 40, effect: 'fadeIn' }
                )
            );
        },

        senderPicture: function (baton) {
            // shows picture of sender see Bug 41023
            var addresses = baton.data.from;
            this.append(
                contactsAPI.pictureHalo(
                    $('<div class="contact-picture" aria-hidden="true">'),
                    { email: addresses && addresses[0] && addresses[0][1] },
                    { width: 40, height: 40, effect: 'fadeIn' }
                )
            );
        },

        date: function (baton, options) {
            var data = baton.data, t = data.received_date;
            if (!_.isNumber(t)) return;
            this.append(
                $('<time class="date">')
                .attr('datetime', moment(t).toISOString())
                .text(_.noI18n(util.getDateTime(t, options)))
            );
        },

        dateOrSize: function (baton) {
            // show date or size depending on sort option
            var fn = 'size';
            if (baton.app && baton.app.props.get('sort') !== 608) {
                fn = baton.app.props.get('exactDates') ? 'fulldate' : 'smartdate';
            }
            extensions[fn].call(this, baton);
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
                field = single && !isSearchActive(baton) && account.is('sent|drafts', data.folder_id) ? 'to' : 'from',
                // get folder data to check capabilities:
                // if bit 4096 is set, the server sort by local part not display name
                capabilities = folderAPI.pool.getModel(data.folder_id).get('capabilities') || 0,
                useDisplayName = baton.options.sort !== 'from-to' || !(capabilities & 4096);

            this.append(
                $('<div class="from">').append(
                    util.getFrom(data, { field: field, reorderDisplayName: useDisplayName, showDisplayName: useDisplayName })
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
            // 0 and a buggy -1
            if (color <= 0) return;

            this.append(
                $('<i class="flag flag_' + color + ' fa fa-bookmark" aria-hidden="true">')
            );
        },

        threadSize: function (baton) {
            // only consider thread-size if app is in thread-mode
            var isThreaded = baton.app && baton.app.isThreaded();
            if (!isThreaded) return;
            if (baton.options.threaded !== true && (!baton.app || baton.app.props.get('thread') === false)) return;

            var size = api.threads.size(baton.data);
            if (size <= 1) return;

            this.append(
                $('<div class="thread-size" aria-hidden="true">').append(
                    $('<span class="number drag-count">').text(_.noI18n(size))
                )
            );
        },

        paperClip: function (baton) {
            if (!baton.data.attachment) return;
            this.append(
                $('<i class="fa fa-paperclip has-attachments" aria-hidden="true">')
            );
        },

        pgp: {
            encrypted: function (baton) {
                //simple check for encrypted mail
                if (!/^multipart\/encrypted/.test(baton.data.content_type)) return;

                this.append(
                    $('<i class="fa fa-lock encrypted" aria-hidden="true">')
                );
            },
            signed: function (baton) {
                //simple check for signed mail
                if (!/^multipart\/signed/.test(baton.data.content_type)) return;

                this.append(
                    $('<i class="fa fa-pencil-square-o signed" aria-hidden="true">')
                );
            }
        },

        priority: function (baton) {
            var data = baton.data;
            this.append(
                $('<span class="priority" aria-hidden="true">').append(
                    util.getPriority(data)
                )
            );
        },

        envelope: function () {
            this.append($('<i class="fa seen-unseen-indicator" aria-hidden="true">'));
        },

        unread: function (baton) {
            var isUnseen = util.isUnseen(baton.data);
            if (isUnseen) extensions.envelope.call(this);
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
                subject = util.getSubject(data, keepFirstPrefix),
                node;

            this.append(
                $('<div class="subject">').append(
                    $('<span class="flags">'),
                    node = $('<span class="drag-title">').text(subject)
                )
            );

            emoji.processEmoji(_.escape(subject), function (html) {
                node.html(html);
            });
        },

        // a11y: set title attribute on outer list item
        title: function (baton) {
            var subject = util.getSubject(baton.data);
            this.closest('.list-item').attr('title', subject);
        },

        // used in unified inbox
        account: function (baton) {
            if (!account.isUnifiedFolder(baton.data.folder_id)) return;
            this.append(
                $('<span class="account-name">').text(baton.data.account_name || '')
            );
        },

        // add orignal folder as label to search result items
        folder: function (baton) {
            // missing data or find currently inactive
            if (!baton.data.original_folder_id || !isSearchActive(baton)) return;
            // add container
            var node = $('<span class="original-folder">').appendTo(this);
            // add breadcrumb
            require(['io.ox/core/folder/breadcrumb'], function (BreadcrumbView) {
                var view = new BreadcrumbView({
                        folder: baton.data.original_folder_id,
                        app: baton.app,
                        exclude: ['default0']
                    }), renderPathOrig;
                // not need for this here
                view.computeWidth = $.noop;
                // show only folder paths tail
                renderPathOrig = view.renderPath;
                view.renderPath = function (path) {
                    return renderPathOrig.call(this, [].concat(_.last(path)));
                };
                // append to dom
                node.append(view.render().$el);
            });
        },

        folderName: function (baton) {
            if (!baton.app || !baton.app.folder || baton.app.folder.get() !== 'virtual/all-unseen') return;

            this.append($('<span class="original-folder">').append(folderAPI.getTextNode(baton.data.original_folder_id)));
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
                $(this).parent().children().show();
                $(this).hide();
            };

            return function (baton) {

                var data = baton.data;

                // figure out if 'to' just contains myself - might be a mailing list, for example
                var showCC = data.cc && data.cc.length > 0,
                    showTO = data.to && data.to.length > 0,
                    showBCC = data.bcc && data.bcc.length > 0,
                    show = showTO || showCC || showBCC,
                    container = $('<div class="recipients">');

                if (!show) {
                    // fix broken layout when mail has only 'to' and 'attachments'
                    this.append(container.append($.txt(_.noI18n('\u00A0'))));
                    return;
                }

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
                            $.txt(gt('Blind copy')),
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
                        .on('click', showAllRecipients)
                    );
                }
            };
        }()),

        attachmentList: (function attachmentList() {

            function drawInlineLinks(node, data) {
                var extension = new links.InlineLinks({
                    dropdown: false,
                    ref: 'io.ox/mail/attachment/links'
                });
                return extension.draw.call(node, ext.Baton({ data: data }));
            }

            var CustomAttachmentView,
                renderContent = function () {

                    var node = this.$('.file'),
                        data = this.model.toJSON(),
                        url, contentType;

                    new links.Dropdown({
                        label: this.model.getShortTitle(),
                        noCaret: true,
                        ref: 'io.ox/mail/attachment/links'
                    })
                    .draw.call(node, ext.Baton({ context: this.model.collection.toJSON(), data: data, $el: node }));

                    // support for fixed position
                    // TODO: introduce as general solution
                    node.on('show.bs.dropdown', function (e) {
                        var link = $(e.relatedTarget),
                            offset = link.offset(),
                            // need to use siblings() instead of next() due to funky backdrop injection on mobile devices (see bug 35863)
                            menu = link.siblings('.dropdown-menu'),
                            top, overlay;
                        top = offset.top + link.height();
                        menu.css({ top: offset.top + link.height(), bottom: 'auto', left: offset.left });
                        if ((top + menu.height()) > $(window).height()) menu.css({ top: 'auto', bottom: '20px' });
                        overlay = $('<div class="dropdown-overlay">').append(menu);
                        // catch click manually (same idea as boostrap's dropdown-backdrop)
                        if (_.device('touch')) {
                            overlay.on('click', { link: link }, function (e) {
                                e.data.link.dropdown('toggle');
                            });
                        }
                        link.data('overlay', overlay);
                        $('body').append(overlay);
                    });

                    node.on('hide.bs.dropdown', function (e) {
                        var link = $(e.relatedTarget), overlay = link.data('overlay');
                        link.parent().append(overlay.children());
                        overlay.remove();
                    });

                    url = api.getUrl(data, 'download');
                    contentType = (this.model.get('content_type') || 'unknown').split(/;/)[0];

                    this.$el.attr({
                        title: this.model.getTitle(),
                        draggable: true,
                        'data-downloadurl': contentType + ':' + this.model.getTitle().replace(/:/g, '') + ':' + ox.abs + url
                    })
                    .on('dragstart', function (e) {
                        $(this).css({ display: 'inline-block' });
                        e.originalEvent.dataTransfer.setData('DownloadURL', this.dataset.downloadurl);
                    });
                };

            return function (baton) {

                if (baton.attachments.length === 0) return $.when();

                var headers = baton.model.get('headers') || {};
                // hide attachments for our own share invitations
                if (headers['X-Open-Xchange-Share-Type']) this.hide();

                var $el = this;

                _.once(function () {
                    CustomAttachmentView = attachment.View.extend({
                        renderContent: renderContent
                    });
                })();

                var list = baton.attachments.map(function (m) {
                        m.group = 'mail';
                        return m;
                    }),
                    collection = new attachment.Collection(list),
                    view = new attachment.List({
                        AttachmentView: CustomAttachmentView,
                        collection: collection,
                        el: $el,
                        mode: settings.get('attachments/layout/detail/' + _.display(), 'list')
                    });

                $el.append(view.render().$el);

                view.renderInlineLinks = function () {
                    var models = this.getValidModels(), $links = this.$header.find('.links').empty();
                    if (models.length >= 1) drawInlineLinks($links, _(models).invoke('toJSON'));
                };

                view.listenTo(view.collection, 'add remove reset', view.renderInlineLinks);
                view.renderInlineLinks();

                view.$el.on('click', 'li.item', function (e) {

                    var node = $(e.currentTarget), id, data, baton;

                    // skip attachments without preview
                    if (!node.attr('data-original')) return;

                    id = node.attr('data-id');
                    data = collection.get(id).toJSON();
                    baton = ext.Baton({ startItem: data, data: list });

                    actions.invoke('io.ox/mail/actions/view-attachment', null, baton);
                });

                view.on('change:layout', function (mode) {
                    settings.set('attachments/layout/detail/' + _.display(), mode).save();
                });

                return view;
            };
        }()),

        flagPicker: function (baton) {
            flagPicker.draw(this, baton, true);
        },

        unreadToggle: (function () {

            function getAriaLabel(data) {
                return util.isUnseen(data) ?
                    gt('This message is unread, press this button to mark it as read.') :
                    gt('This message is read, press this button to mark it as unread.');

            }

            function toggle(e) {
                e.preventDefault();
                var data = e.data.model.toJSON();
                // toggle 'unseen' bit
                if (util.isUnseen(data)) api.markRead(data); else api.markUnread(data);
                $(this).attr('aria-label', getAriaLabel(data));
            }

            return function (baton) {

                if (util.isEmbedded(baton.data)) return;

                this.append(
                    $('<a href="#" role="button" class="unread-toggle" tabindex="1">')
                    .attr('aria-label', getAriaLabel(baton.data))
                    .append('<i class="fa" aria-hidden="true">')
                    .on('click', { model: baton.view.model }, toggle)
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
                    $('<div class="notification-item external-images">').append(
                        $('<button type="button" class="btn btn-default btn-sm" tabindex="1">').text(gt('Show images')),
                        $('<div class="comment">').text(gt('External images have been blocked to protect you against potential spam!'))
                    )
                );
            }

            return function (baton) {
                draw.call(this, baton.model);
                this.on('click', '.external-images', { view: baton.view }, loadImages);
                baton.view.listenTo(baton.model, 'change:modified', draw.bind(this));
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
                baton.view.listenTo(baton.model, 'change:headers', draw.bind(this));
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
                        //#. read receipt; German "Lesebestätigung"
                        gt('A read receipt has been sent')
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
                        $('<button type="button" class="btn btn-primary btn-sm" tabindex="1">').text(
                            //#. Respond to a read receipt request; German "Lesebestätigung senden"
                            gt('Send a read receipt')
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
                baton.view.listenTo(baton.model, 'change:disp_notification_to', draw.bind(this));
            };
        }())
    };

    return extensions;
});
