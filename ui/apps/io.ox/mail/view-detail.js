/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com
 */

define('io.ox/mail/view-detail',
    ['io.ox/mail/detail/content',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/mail/util',
     'io.ox/mail/api',
     'io.ox/core/http',
     'io.ox/core/util',
     'io.ox/core/api/account',
     'settings!io.ox/mail',
     'gettext!io.ox/mail',
     'io.ox/core/api/folder',
     'io.ox/core/emoji/util',
     'io.ox/mail/actions',
     'less!io.ox/mail/style'
    ], function (content, ext, links, util, api, http, coreUtil, account, settings, gt, folder, emoji) {

    'use strict';

    var regImage = /^image\/(jpe?g|png|gif|bmp)$/i;

    var copyThreadData = function (a, b) {
        a.threadKey = b.threadKey;
        a.threadPosition = b.threadPosition;
        a.threadSize = b.threadSize;
    };

    var that = {

        getContent: function (data, options) {
            return content.get(data, options);
        },

        drawScaffold: function (baton, resolver) {

            var node = $('<section class="mail-detail">')
                .busy()
                .one('resolve', { baton: baton }, resolver);

            if (baton.options.tabindex) {
                node.attr('tabindex', baton.options.tabindex);
            }

            return node;
        },

        draw: function (baton) {

            if (!baton) return $('<div>');

            // ensure baton
            baton = ext.Baton.ensure(baton);

            var data = baton.data,
                copy = _.extend({}, data),
                node = $('<section class="mail-detail">'),
                container = $.createViewContainer(data, api)
                    .addClass('mail-detail-decorator')
                    .on('redraw', function (e, fresh) {
                        // mails can only change color_label and flags
                        var current = {
                            color_label: parseInt(container.find('.flag-dropdown-icon').attr('data-color'), 10) || 0,
                            unseen: node.hasClass('unread')
                        };
                        // flags changed?
                        if (current.unseen !== util.isUnseen(fresh)) {
                            // update class
                            node.toggleClass('unread', util.isUnseen(fresh));
                            // udpate inline links
                            ext.point('io.ox/mail/detail').get('inline-links', function (extension) {
                                var div = $('<div>'), baton = ext.Baton({ data: _.extend(copy, fresh) });
                                extension.draw.call(div, baton);
                                node.find('ul.io-ox-inline-links:first').replaceWith(div.children());
                            });
                        }
                        if (current.color_label !== fresh.color_label) {
                            setLabel(node, fresh.color_label);
                        }
                        // update copy
                        _.extend(copy, fresh);
                    });

            if (baton.options.tabindex) {
                // we add f6-target just here; first mail in thread
                node.addClass('f6-target').attr({
                    tabindex: baton.options.tabindex,
                    role: 'document',
                    'aria-label': baton.data.subject
                });
            }

            try {

                // fix z-index in threads?
                if (data.threadSize > 1) {
                    container.css('zIndex', data.threadSize - data.threadPosition);
                }

                // threaded & send by myself (and not in sent folder)?
                if (data.threadSize > 1 && util.byMyself(data) && !account.is('sent', data.folder_id)) {
                    node.addClass('by-myself');
                }

                // make sure this mail is seen
                if (api.tracker.isUnseen(baton.data) && !util.isAttachment(baton.data)) {
                    api.markRead(baton.data).done(function () {
                        //update detailview because if update was faster than cache the inline links have wrong data
                        api.trigger('update:' + _.ecid(baton.data), baton.data);
                    });
                }

                ext.point('io.ox/mail/detail').invoke('draw', node, baton);

            } catch (e) {
                console.error('mail.draw', e.message, e, baton);
            }

            container.append(node);

            return container;
        },

        autoResolveThreads: (function () {

            function resolve(node, baton) {
                api.get(api.reduce(baton.data)).then(
                    function (data) {
                        // replace placeholder with mail content
                        copyThreadData(data, baton.data);
                        node.replaceWith(that.draw(ext.Baton({ data: data, app: baton.app, options: baton.options })));
                        baton = null;
                    },
                    function () {
                        node.idle().empty().append(
                            $.fail(baton.options.failMessage, function () {
                                resolve(node, baton);
                                baton = null;
                            })
                        );
                    }
                );
            }

            return function (e) {
                resolve($(this), e.data.baton);
            };

        }()),

        drawThread: (function () {

            function autoResolve(e) {
                // check for data (due to debounce)
                if (e.data) {
                    // determine visible nodes
                    var pane = $(this), node = e.data.node,
                        top = pane.scrollTop(), bottom = top + node.parent().height();
                    e.data.nodes.each(function () {
                        var self = $(this), pos = self.position();
                        if ((pos.top + 100) > top && pos.top < bottom) { // +100 due to min-height
                            self.trigger('resolve');
                        }
                    });
                }
            }

            function fail(node, baton) {
                node.idle().empty().append($.fail(baton.options.failMessage, function () {
                    baton.options.retry(baton);
                }));
            }

            function drawThread(node, baton, options, mails) {

                var i, obj, frag = document.createDocumentFragment(),
                    scrollpane = node.closest('.scrollable').off('scroll'),
                    nodes, inline, mail,
                    list = baton.data;

                try {

                    // draw inline links for whole thread
                    if (list.length > 1) {
                        //
                        inline = $('<div class="thread-inline-actions">');

                        inline.on('redraw', function () {
                            inline.empty();
                            ext.point('io.ox/mail/thread').invoke('draw', inline, baton);
                            inline.find('.dropdown > a').addClass('btn');
                        });

                        // add special marker
                        baton.isThread = true;
                        ext.point('io.ox/mail/thread').invoke('draw', inline, baton);
                        inline.find('.dropdown > a').addClass('btn btn-default'); // was: btn-primary
                        if (_.device('!smartphone')) {
                            frag.appendChild(inline.get(0));
                        } else {
                            node.parent().parent().find('.rightside-inline-actions').empty().append(inline);
                            node.parent().attr('aria-label', gt('Mail Thread Details'));
                        }
                    }

                    // loop over thread - use fragment to be fast for tons of mails
                    for (i = 0; (obj = list[i]); i++) {
                        obj.threadPosition = i;
                        obj.threadSize = list.length;
                        if (i >= options.top && i <= options.bottom) {
                            mail = mails.shift();
                            copyThreadData(mail, obj);
                            // draw mail
                            frag.appendChild(that.draw(
                                ext.Baton({ data: mail, app: baton.app, options: baton.options })
                            ).get(0));
                        } else {
                            frag.appendChild(that.drawScaffold(
                                ext.Baton({ data: obj, app: baton.app, options: baton.options }),
                                that.autoResolveThreads).get(0)
                            );
                        }
                    }
                    options.children = null;
                    node.empty().get(0).appendChild(frag);
                    // get nodes
                    nodes = node.find('.mail-detail');
                    // set initial scroll position (37px not to see thread's inline links)
                    if (_.device('!smartphone')) {
                        options.top = nodes.eq(options.pos).parent().position().top;
                    }
                    scrollpane.scrollTop(list.length === 1 ? 0 : options.top);
                    scrollpane.on('scroll', { nodes: nodes, node: node }, _.debounce(autoResolve, 100));
                    scrollpane.one('scroll.now', { nodes: nodes, node: node }, autoResolve);
                    scrollpane.trigger('scroll.now'); // to be sure
                    nodes = frag = node = scrollpane = list = mail = mails = null;
                } catch (e) {
                    console.error('mail.drawThread', e.message, e);
                    fail(node.empty(), baton);
                }
            }

            return function (baton) {

                // define next step now
                var list = baton.data,
                    next = _.lfo(drawThread),
                    node = this,
                    options = {
                        pos: 0,
                        top: 0,
                        bottom: 0
                    };

                // get list data, esp. to know unseen flag - we need this list for inline link checks anyway
                api.getList(list).then(
                    function sucess(list) {

                        var i, $i, pos, numVisible, top, bottom, defs = [];

                        try {
                            // getList might be incomplete
                            list = _(list).compact();

                            // which mail to focus?
                            for (i = pos = $i = list.length - 1; i >= 0; i--) {
                                pos = i;
                                if (util.isUnseen(list[i])) { break; }
                            }
                            // how many visible?
                            if (pos === 0) {
                                numVisible = 1;
                                top = bottom = 0;
                            } else {
                                numVisible = Math.ceil(node.parent().height() / 300);
                                bottom = Math.min(pos + numVisible, $i);
                                top = Math.max(0, pos - (pos + numVisible - bottom));
                            }
                            // fetch mails we will display
                            for (i = top; i <= bottom; i++) {
                                defs.push(api.get(api.reduce(list[i])));
                            }
                            $.when.apply($, defs).then(
                                function () {
                                    options.pos = pos;
                                    options.top = top;
                                    options.bottom = bottom;
                                    baton = ext.Baton({ data: list, app: baton.app, options: baton.options });
                                    next(node, baton, options, $.makeArray(arguments));
                                },
                                function () {
                                    fail(node.empty(), baton);
                                }
                            );
                        } catch (e) {
                            console.error('mail.drawThread', e.message, e);
                            fail(node.empty(), baton);
                        }
                    },
                    function fail() {
                        fail(node.empty(), baton);
                    }
                );
            };
        }()),

        // redraw with new threadData without loosing scrollposition
        updateThread: (function () {

            function autoResolve(e) {
                // check for data (due to debounce)
                if (e.data) {
                    // determine visible nodes
                    var pane = $(this), node = e.data.node,
                        top = pane.scrollTop(), bottom = top + node.parent().height();
                    e.data.nodes.each(function () {
                        var self = $(this), pos = self.position();
                        if ((pos.top + 100) > top && pos.top < bottom) { // +100 due to min-height
                            self.trigger('resolve');
                        }
                    });
                }
            }

            return function (baton) {

                var nodeTable  = {},
                    node = this,
                    data = baton.data,
                    scrollpane = $(node).parent(),
                    top = scrollpane.scrollTop(),
                    currentMail,
                    currentMailOffset,
                    nodes = node.find('.mail-detail');
                //fill nodeTable
                for (var i = 0; i < nodes.length; i++) {//bring nodes and mails together;
                    if ($(nodes[i]).parent().hasClass('mail-detail-decorator')) {
                        nodes[i] = $(nodes[i]).parent().get(0);
                    }
                    nodeTable[_.ecid($(nodes[i]).attr('data-cid'))] = nodes[i];
                }
                //remember current scrollposition
                currentMail = $(nodes[0]);//select first
                for (var i = 1; i < nodes.length && $(nodes[i]).position().top <= top; i++) {
                    currentMail = $(nodes[i]);
                }
                currentMailOffset = top - (currentMail.position() ? currentMail.position().top : 0);
                node.find('.mail-detail.io-ox-busy,.mail-detail-decorator').detach();
                for (var i = 0; i < data.length; i++) {//draw new thread
                    if (nodeTable[_.ecid(data[i])]) {
                        node.append(nodeTable[_.ecid(data[i])]);
                    } else {
                        node.append(that.drawScaffold(
                            ext.Baton({ data: data[i], app: baton.app, options: baton.options }),
                            that.autoResolveThreads).addClass('io-ox-busy').get(0)//no 200ms wait for busy animation because this changes our scroll position
                        );
                    }
                }
                nodes = node.find('.mail-detail');
                scrollpane.off('scroll').on('scroll', { nodes: nodes, node: node }, _.debounce(autoResolve, 100));//update event parameters
                //scroll to old position
                scrollpane.scrollTop((currentMail.position() ? currentMail.position().top : 0) + currentMailOffset);
            };
        }())
    };

    // extensions

    // inline links for each mail
    ext.point('io.ox/mail/detail').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links',
        ref: 'io.ox/mail/links/inline'
    }));

    ext.point('io.ox/mail/detail').extend({
        index: 200,
        id: 'header',
        draw: function (baton) {
            var header = $('<header>');
            function setHeaderWidth() {
                var wW = $(window).width();
                return wW - 25;
            }
            if (_.device('smartphone')) {
                $(window)
                    .off('orientationchange.mailheader')
                    .on('orientationchange.mailheader', function () {
                    header.css('max-width', setHeaderWidth());
                });
                header.addClass('details-collapsed');
                header.css('max-width', setHeaderWidth());

            }
            ext.point('io.ox/mail/detail/header').invoke('draw', header, baton);
            this.append(header);
        }
    });

    ext.point('io.ox/mail/detail/header').extend({
        index: 100,
        id: 'contact-picture',
        draw: function (baton) {
            this.append(function () {
                var picture = $('<div class="contact-picture">');
                require(['io.ox/contacts/api'], function (api) {
                    api.pictureHalo(picture, { email: util.hasFrom(baton.data) && baton.data.from[0][1], width: 64, height: 64, scaleType: 'cover' });
                    picture = null;
                });
                return picture;
            });
        }
    });

    ext.point('io.ox/mail/detail/header').extend({
        index: 110,
        id: 'receiveddate',
        draw: function (baton) {
            // some mails just have a sent_date, e.g. nested EMLs
            var data = baton.data;
            var date = util.getDateTime(data.received_date || data.sent_date || 0, { filtertoday: true });
            this.append(
                $('<div>').addClass('date list').text(_.noI18n(date))
            );
        }
    });

    function searchSender(e) {
        var app = ox.ui.App.get('io.ox/mail')[0],
            win = app.getWindow(),
            query = e.data.display_name || e.data.email1;
        // trigger search
        win.search.start(query);
    }

    ext.point('io.ox/mail/detail/header').extend({
        index: 120,
        id: 'fromlist',
        draw: function (baton) {

            var data = baton.data, list, node;

            if (!util.hasFrom(data)) {
                return this.append(
                    $('<div class="from list">').text(gt('No sender'))
                );
            }

            this.append(
                $('<div class="from list">').append(
                    list = util.serializeList(data, 'from').removeAttr('style')
                )
            );

            if (ox.ui.App.get('io.ox/mail').length) {
                node = list.last();
                node.after(
                    $('<i class="fa fa-search">').on('click', node.data('person'), searchSender)
                        .css({ marginLeft: '0.5em', opacity: 0.3, cursor: 'pointer' })
                );
            }
            list = node = null;
        }
    });

    var colorNames = {
        NONE:       gt('None'),
        RED:        gt('Red'),
        BLUE:       gt('Blue'),
        GREEN:      gt('Green'),
        GRAY:       gt('Gray'),
        PURPLE:     gt('Purple'),
        LIGHTGREEN: gt('Light green'),
        ORANGE:     gt('Orange'),
        PINK:       gt('Pink'),
        LIGHTBLUE:  gt('Light blue'),
        YELLOW:     gt('Yellow')
    };

    var colorLabelIconEmpty = 'fa fa-bookmark-o',
        colorLabelIcon = 'fa fa-bookmark';

    function setLabel(node, color) {
        // set proper icon class
        color = color || 0;
        var className = 'flag-dropdown-icon ';
        className += color === 0 ? colorLabelIconEmpty : colorLabelIcon;
        className += ' flag_' + color;
        node.find('.flag-dropdown-icon').attr({ 'class': className, 'data-color': color });
    }

    function changeLabel(e) {

        e.preventDefault();

        var data = e.data.data,
            color = e.data.color,
            node = $(this).closest('.flag-dropdown');

        setLabel(node, color);
        node.find('.dropdown-toggle').focus();

        return api.changeColor(data, color);
    }

    // show within multi-selection
    ext.point('io.ox/links/multi-selection').extend({
        id: 'color-labels',
        index: 300,
        draw: function (baton) {

            if (baton.id !== 'io.ox/mail') return;

            this.append(
                $('<div class="multi-selection-flag">').append(
                    _(api.COLORS).map(function (index, color) {
                        return $('<a href="#" tabindex="1">').append(
                            $('<i>')
                            .addClass('flag_' + index)
                            .addClass(index > 0 ? colorLabelIcon : colorLabelIconEmpty)
                            .attr('title', colorNames[color])
                        )
                        .on('click', { data: baton.selection, color: index }, changeLabel);
                    })
                )
            );
        }
    });

    ext.point('io.ox/mail/detail/header').extend({
        index: 130,
        id: 'flag',
        draw: function (baton) {

            var data = baton.data, color = api.tracker.getColorLabel(data);

            this.append(
                $('<div class="dropdown flag-dropdown clear-title flag">').append(
                    // box
                    $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" tabindex="1">').append(
                        $('<i class="flag-dropdown-icon">')
                            .attr('data-color', color)
                            .addClass(color === 0 ? colorLabelIconEmpty : colorLabelIcon)
                            .addClass('flag_' + color)
                    ),
                    // drop down
                    $('<ul class="dropdown-menu" role="menu">')
                    .append(
                        _(api.COLORS).reduce(function (memo, index, color) {
                            return memo.add($('<li>').append(
                                $('<a href="#" tabindex="1" role="menuitem">').append(
                                    index > 0 ? $('<span class="flag-example">').addClass('flag_bg_' + index) : $(),
                                    $.txt(colorNames[color])
                                )
                                .on('click', { data: data, color: index }, changeLabel)
                                .addClass(color === index ? 'active-label' : undefined)
                            ));
                        }, $())
                    )
                )
            );
        }
    });

    ext.point('io.ox/mail/detail/header').extend({
        index: 140,
        id: 'subject',
        draw: function (baton) {

            // soft-break long words (like long URLs)
            var subject = $.trim(baton.data.subject),
                self = this,
                html = emoji.processEmoji(coreUtil.breakableHTML(subject), function (text, lib) {
                    if (!lib.loaded) return;

                    self.find('.subject > span.subject-data').html(text);
                });

            // process emoji
            subject = subject ? $('<span class="subject-data">').html(html) : '';

            this.append(
                $('<div class="mail-detail-clear-left">'),
                $('<div>')
                .addClass('subject' + (_.device('!smartphone') ? ' clear-title' : '') + (subject === '' ? ' empty' : ''))
                .append(
                    // unread
                    $('<i class="fa icon-unread fa-circle">'),
                    // inject some zero width spaces for better word-break
                    subject || $.txt(gt('No subject')),
                    // priority
                    $('<span class="priority">').append(util.getPriority(baton.data))
                )
            );
        }
    });

    var drawAllDropDown = function (node, label, data) {
        // use extension pattern
        new links.DropdownLinks({
            label: label,
            classes: 'all-link',
            ref: 'io.ox/mail/all/actions'
        }).draw.call(node, data);
    };

    ext.point('io.ox/mail/detail/header').extend({
        index: 150,
        id: 'tocopy',
        draw: function (baton) {

            var data = baton.data;

            // figure out if 'to' just contains myself - might be a mailing list, for example
            var showCC = data.cc && data.cc.length > 0,
                showTO = data.to && data.to.length > 0,
                showBCC = data.bcc && data.bcc.length > 0,
                show = showTO || showCC || showBCC,
                container = $('<div>').addClass('to-cc list');

            if (showTO) {
                container.append(
                    // TO
                    $('<span>').addClass('io-ox-label').append(
                        $.txt(gt('To')),
                        $.txt(_.noI18n('\u00A0\u00A0'))
                    ),
                    util.serializeList(data, 'to'),
                    $.txt(_.noI18n(' \u00A0 '))
                );
            }
            if (showCC) {
                container.append(
                    //#. CC list - use npgettext cause pgettext is broken
                    $('<span>').addClass('io-ox-label').append(
                        $.txt(gt.npgettext('CC', 'Copy', 'Copy', 1)),
                        _.noI18n('\u00A0\u00A0')
                    ),
                    util.serializeList(data, 'cc'),
                    $.txt(_.noI18n(' \u00A0 '))
                );
            }
            if (showBCC) {
                container.append(
                    // BCC
                    $('<span>').addClass('io-ox-label').append(
                        $.txt(gt('Bcc')),
                        _.noI18n('\u00A0\u00A0')
                    ),
                    util.serializeList(data, 'bcc'),
                    $.txt(_.noI18n(' \u00A0 '))
                );
            }
            if (show) {
                if (_.device('smartphone')) {
                    container.find('.io-ox-label').prepend(
                        $('<div>').addClass('mail-detail-clear-left')
                    );
                }
                this.append(
                    $('<div>').addClass('mail-detail-clear-left'),
                    container
                );
                if (_.device('!smartphone')) {
                    if (!(!showCC && showTO && data.to[0][1] === 'undisclosed-recipients:;')) {
                        var dd = $('<div class="recipient-actions">');
                        drawAllDropDown(dd, $('<i class="fa fa-group">'), data);
                        dd.find('.dropdown').addClass('pull-right');
                        dd.appendTo(container);
                    }
                }

            }
        }
    });

    ext.point('io.ox/mail/detail/header').extend({
        id: 'account',
        index: 152,
        draw: function (baton) {

            if (!folder.is('unifiedfolder', baton.data.folder_id)) return;

            this.find('.to-cc').prepend(
                $('<span class="io-ox-label">').append(
                    $.txt(gt('Account')),
                    $.txt(_.noI18n('\u00A0\u00A0'))
                ),
                $('<span class="account-name">').text(
                    _.noI18n(util.getAccountName(baton.data))
                ),
                $.txt(_.noI18n(' \u00A0 '))
            );
        }
    });

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
        // add instant preview
        if (regImage.test(contentType) && data.size > 0) {
            dd.find('a').on('click', data, function (e) {
                var node = $(this), data = e.data, p = node.parent(), url, src, used;
                if (p.hasClass('open') && p.find('.instant-preview').length === 0) {
                    url = api.getUrl(data, 'view');
                    src = url + '&scaleType=contain&width=190&height=190'; // 190 + 2 * 15 pad = 220 max-width
                    //default vs. phone custom-dropdown
                    used = $.extend({menu: p.find('ul')}, p.data() || { addlink: true });
                    //append instant-preview if not done yet
                    if (used.menu.find('.instant-preview').length !== 1) {
                        var $li =  $('<li>').busy().append(
                                (used.addlink ? $('<a>', { href: url, target: '_blank' }) : $('<span>'))
                                .append(
                                    $('<img>', { src: src, alt: '' }).addClass('instant-preview').load(function () {
                                        $li.idle();
                                    })
                                )
                            );
                        used.menu.append($li);
                    }
                }
            });
        }
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

    function showAllAttachments() {
        $(this).closest('.attachment-list').children().css('display', 'inline-block');
        $(this).remove();
    }

    ext.point('io.ox/mail/detail/header').extend({
        index: 160,
        id: 'attachments',
        draw: function (baton) {

            var data = baton.data,
                attachments = util.getAttachments(data), length = attachments.length,
                aLabel;

            if (length > 0) {
                var outer = $('<div>').addClass('list attachment-list'),
                    aLabel;
                if (_.device('!smartphone')) {
                    aLabel = $('<span>').addClass('io-ox-label').append(
                        $.txt(gt.npgettext('plural', 'Attachment', 'Attachments', length)),
                        $.txt('\u00A0\u00A0')
                    );
                } else {
                    aLabel = $('<a>', { href: '#'})
                        .text(gt.npgettext('plural', 'Show attachment', 'Show attachments', length))
                        .on('click', function (e) {
                        e.preventDefault();
                        outer.toggleClass('attachments-collapsed');
                        if (outer.hasClass('attachments-collapsed')) {
                            outer.find('.dropdown').hide();
                            $(this).text(gt.npgettext('plural', 'Show attachment', 'Show attachments', length));
                        } else {
                            outer.find('.dropdown').css('display', 'block');
                            $(this).text(gt.npgettext('plural', 'Hide attachment', 'Hide attachments', length));
                        }
                    });
                }
                outer.append(aLabel);
                _(attachments).each(function (a, i) {
                    try {
                        var label = (a.filename || ('Attachment #' + i))
                            // lower case file extensions for better readability
                            .replace(/\.(\w+)$/, function (match) {
                                return match.toLowerCase();
                            });
                        // draw
                        var dd = drawAttachmentDropDown(outer, _.noI18n(label), a);
                        if (_.device('smartphone')) {
                            dd.hide();
                        } else {
                            dd.find('a>b.caret').before(
                                $('<i class="fa fa-paperclip">'),
                                $.txt('\u00A0')
                            );
                        }
                        // cut off long lists?
                        if (i > 3 && length > 5) {
                            dd.hide();
                        }
                    } catch (e) {
                        console.error('mail.drawAttachment', e.message);
                    }
                });
                // add "[n] more ..."
                if (_.device('!smartphone') && length > 5) {
                    outer.append(
                        //#. 'more' like in 'x more attachments' / 'weitere' in German
                        $('<a href="#" class="n-more">').text((length - 4) + ' ' + gt('more') + ' ...').click(showAllAttachments)
                    );
                }
                // how 'all' drop down?
                if (length > 1) {
                    attachments.subject = data.subject;
                    drawAttachmentDropDown(outer, gt('All attachments'), attachments).find('a').removeClass('attachment-link');
                }
                if (_.device('smartphone')) {
                    outer.addClass('attachments-collapsed').find('.dropdown').hide();
                }
                this.append(outer);
            }
        }
    });

    /**
     * @description actions for publication invitation mails
     */
    ext.point('io.ox/mail/detail/header').extend({
        index: 199,
        id: 'subscribe',
        draw: function (baton) {
            var data = baton.data,
                label = '',
                pub = {},
                pubtype = '';

            //exists publication header
            pub.url  = data.headers['X-OX-PubURL'] || '';
            if (pub.url === '')
                return false;
            else {
                //qualify data
                pubtype = /^(\w+),(.*)$/.exec(data.headers['X-OX-PubType']) || ['', '', ''];
                pub.module  = pubtype[1];
                pub.type  = pubtype[2];
                pub.name = _.first(_.last(pub.url.split('/')).split('?'));
                pub.parent = require('settings!io.ox/core').get('folder/' + pub.module);
                pub.folder = '';
                label = pub.module === 'infostore' ? gt('files') : gt(pub.module);

                // published folder have much more data, single file just has a name and a URL.
                var isSingleFilePublication = !pub.type;

                if (isSingleFilePublication) {
                    this.append(
                        $('<div class="well">').append(
                            $('<div class="invitation">').text(gt('Someone shared a file with you')),
                            $('<div class="subscription-actions">').append(
                                $('<button type="button" class="btn btn-default" data-action="show">').text(gt('Show file'))
                            )
                        )
                    );
                } else {
                    this.append(
                        $('<div class="well">').append(
                            $('<div class="invitation">').text(gt('Someone shared a folder with you. Would you like to subscribe those %1$s?', label)),
                            $('<div class="subscription-actions">').append(
                                $('<button type="button" class="btn btn-default" data-action="show">').text(gt('Show original publication')),
                                '&nbsp;',
                                $('<button type="button" class="btn btn-primary" data-action="subscribe">').text(gt('Subscribe'))
                            )
                        )
                    );
                }

                //actions
                this.on('click', '.subscription-actions .btn', function (e) {
                    var button = $(e.target),
                        notifications = require('io.ox/core/notifications');
                    //disble button
                    if (button.data('action') === 'show') {
                        window.open(pub.url, '_blank');
                    } else {
                        $(e.target).prop('disabled', true);
                        notifications.yell('info', gt('Adding subscription. This may take some seconds...'));
                        var opt = opt || {};
                        //create folder; create and refresh subscription
                        require(['io.ox/core/pubsub/util']).done(function (pubsubUtil) {
                            pubsubUtil.autoSubscribe(pub.module, pub.name, pub.url).then(
                                function success() {
                                    notifications.yell('success', gt('Created private folder \'%1$s\' in %2$s and subscribed successfully to shared folder', pub.name, pub.module));
                                    //refresh folder views
                                    folder.trigger('update');
                                },
                                function fail(data) {
                                    notifications.yell('error', data.error || gt('An unknown error occurred'));
                                }
                            );
                        });
                    }
                });
            }
        }
    });

    // inline links for entire thread
    ext.point('io.ox/mail/thread').extend(new links.DropdownLinks({
        label: gt('Entire thread'),
        zIndex: 12001,
        ref: 'io.ox/mail/links/inline'
    }));

    ext.point('io.ox/mail/detail/header').extend({
        index: 90,
        id: 'phishing-warning',
        draw: function (baton) {
            var data = baton.data;
            if ('headers' in data) {
                // TODO: get proper settings here
                var headers = settings.get('phishing/headers', []), key;
                for (key in headers) {
                    if (headers[key] in data.headers) {
                        // show phishing warning
                        this.append(
                            $('<div class="mail-warning progress progress-warning progress-striped">')
                            .append(
                                 $('<div class="bar">')
                                 .text(gt('Warning: This message might be a phishing or scam mail'))
                             )
                        );
                        break;
                    }
                }
            }
        }
    });

    function replaceWithUnmodified(e) {
        e.preventDefault();
        // be busy
        var section = e.data.node.parent();
        section.find('article').busy().empty();
        // get unmodified mail
        api.getUnmodified(e.data.data).done(function (unmodifiedData) {
            // keep outer node due to custom CSS classes (e.g. page)
            var content = that.draw(unmodifiedData);
            section.parent().empty().append(content.children());
            section = content = null;
        });
    }

    // TODO: remove click handler out of inner closure
    ext.point('io.ox/mail/detail/header').extend({
        index: 195,
        id: 'externalresources-warning',
        draw: function (baton) {
            var data = baton.data;
            if (data.modified === 1) {
                this.append(
                    $('<div class="alert alert-info cursor-pointer">')
                    .append(
                         $('<a>').text(gt('Show images')),
                         $('<i>').append(
                             $.txt(_.noI18n(' \u2013 ')),
                             $.txt(gt('External images have been blocked to protect you against potential spam!'))
                         )
                     )
                    .on('click', { node: this, data: api.reduce(data) }, replaceWithUnmodified)
                );
            }
        }
    });

    function sendDeliveryReceipt(e) {
        e.preventDefault();
        api.ack({ folder: e.data.folder_id, id: e.data.id });
        $(this).attr('class', 'alert alert-success')
            .text(gt('A delivery receipt has been sent'))
            .delay(5000).fadeOut();
    }

    ext.point('io.ox/mail/detail/header').extend({
        index: 196,
        id: 'delivery-receipt',
        draw: function (baton) {

            // has proper attribute?
            if (!baton.data.disp_notification_to) return;
            // user does not ignore this feature?
            if (!settings.get('sendDispositionNotification', false)) return;
            // is not in drafts folder?
            if (account.is('drafts', baton.data.folder_id)) return;

            // update mail
            api.caches.get.merge(_.extend({ disp_notification_to: false, id: baton.data.id, folder_id: baton.data.folder_id }));

            this.append(
                $('<div class="alert alert-info cursor-pointer">')
                .append(
                     $('<a href="#">').text(gt('Send a delivery receipt')),
                     $('<i>').append(
                         $.txt(_.noI18n(' \u2013 ')), // long dash
                         $.txt(gt('The sender wants to get a notification when you have read this email'))
                     )
                 )
                .on('click', baton.data, sendDeliveryReceipt)
            );
        }
    });

    if (_.device('smartphone')) {
        ext.point('io.ox/mail/detail');
        ext.point('io.ox/mail/detail').disable('inline-links');
        ext.point('io.ox/mail/detail/header')
            .replace({
                id: 'fromlist',
                index: 120
            })
            .replace({
                id: 'tocopy',
                index: 130
            })
            .replace({
                id: 'account',
                index: 140
            })
            .replace({
                id: 'externalresources-warning',
                index: 160
            })
            .replace({
                id: 'subscribe',
                index: 170
            })
            .extend(new links.InlineLinks({
                id: 'inline-links',
                index: 175,
                ref: 'io.ox/mail/links/inline'
            }))
            .extend({
                id: 'recipient-actions',
                index: 176,
                draw: function (baton) {
                    var data = baton.data,
                        showCC = data.cc && data.cc.length > 0,
                        showTO = data.to && data.to.length > 0;

                    if (!(!showCC && showTO && data.to[0][1] === 'undisclosed-recipients:;')) {
                        var dd = $('<div class="recipient-actions">');
                        drawAllDropDown(dd, gt('All recipients'), data);
                        if ((data.to.length === 1 && data.cc.length < 1) ||
                            (data.cc.length === 1 && data.to.length < 1)) {
                            dd.show().find('a').show();
                        }
                        this.append(dd);
                    }
                }
            })
            .extend({
                id: 'details-toggle',
                index: 177,
                draw: function (baton) {
                    if ((baton.data.to.length === 1 && baton.data.cc.length < 1) ||
                        (baton.data.cc.length === 1 && baton.data.to.length < 1))
                         {
                        return;
                    }
                    var self = this;
                    this.append(
                        $('<a>', { href: '#'}).text(gt('Show details')).on('click', function (e) {
                            e.preventDefault();
                            self.toggleClass('details-collapsed');
                            if (self.hasClass('details-collapsed')) {
                                $(this).text(gt('Show details'));
                            } else {
                                $(this).text(gt('Hide details'));
                            }
                        })
                    );
                }
            })
            .replace({
                id: 'attachments',
                index: 178
            })
            .replace({
                id: 'subject',
                index: 180
            })
            .replace({
                id: 'flag',
                index: 190
            })
            .replace({
                id: 'receiveddate',
                index: 200
            });
    }

    function findFarthestElement(memo, node) {
        var pos;
        if (node.css('position') === 'absolute' && (pos = node.position())) {
            memo.x = Math.max(memo.x, pos.left + node.width());
            memo.y = Math.max(memo.y, pos.top + node.height());
            memo.found = true;
        }
        return memo;
    }

    ext.point('io.ox/mail/detail').extend({
        index: 300,
        id: 'content',
        draw: function (baton) {
            var article, data = baton.data, content = that.getContent(data, baton.options);

            if (content.processedEmoji === false) {
                content.content.addClass('unprocessedEmoji');
                emoji.processEmoji(content.content.html(), function (text) {
                    $(article || $()).find('.unprocessedEmoji').removeClass('unprocessedEmoji').html(text);
                });
            }
            this.append(
                article = $('<article>').attr({
                    'data-cid': data.folder_id + '.' + data.id,
                    'data-content-type': content.type
                })
                .addClass(
                    // html or text mail
                    content.type === 'text/html' ? 'text-html' : 'text-plain'
                )
                .addClass(
                    // assuming touch-pad/magic mouse for macos
                    // chrome & safari do a good job; firefox is not smooth
                    // ios means touch devices; that's fine
                    // biggeleben: DISABLED for 7.2.1 due to too many potential bugs
                    false && _.device('(macos && (chrome|| safari)) || ios') ? 'horizontal-scrolling' : ''
                )
                .append(
                    content.content,
                    $('<div class="mail-detail-clear-both">')
                )
            );

            // show toggle info box instead of original mail
            if (baton.hideOriginalMail) {
                article.hide();
                this.append(
                    $('<div>').addClass('alert alert-info cursor-pointer').append(
                        $('<a href="#" role="button">').text(gt('Show original message'))
                    ).on('click', function () {
                        article.show();
                        $(this).remove();
                    })
                );
            }

            var content = this.find('.content');

            setTimeout(function () {
                var farthest = { x: content.get(0).scrollWidth, y: content.get(0).scrollHeight, found: false },
                    width = content.width(), height = content.height();
                if (!content.isLarge && (farthest.x >= width || farthest.y >= height)) { // Bug 22756: FF18 is behaving oddly correct, but impractical
                    farthest = _.chain($(content).find('*')).map($).reduce(findFarthestElement, farthest).value();
                }
                // only do this for absolute elements
                if (farthest.found) {
                    if (farthest.x > width) content.css('width', Math.round(farthest.x) + 'px');
                    if (farthest.y > height) content.css('height', Math.round(farthest.y) + 'px');
                }
                content = null;
            }, 0);
        }
    });

    function quickReply(e) {
        // collapse selection created by double click
        if (document.getSelection) document.getSelection().collapse(this, 0);
        // load ...
        require(['io.ox/mail/write/inplace/inplace']).done(function (inplace) {
            var options = { mail: e.data.baton.data };
            if (e.data.baton.app) options.container = e.data.baton.app.getWindow().nodes.outer;
            inplace.reply(options);
        });
    }

    ext.point('io.ox/mail/detail').extend({
        id: 'quick-reply',
        index: 'last',
        draw: function (baton) {
            if (_.device('small')) return;
            this.on('dblclick', '.subject', { baton: baton }, quickReply);
        }
    });

    return that;
});
