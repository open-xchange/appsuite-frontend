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
     'io.ox/mail/detail/content',
     'io.ox/core/extPatterns/links',
     'io.ox/core/emoji/util',
     'gettext!io.ox/mail',
     'less!io.ox/mail/style',
     'io.ox/mail/actions'
    ], function (extensions, ext, api, util, Pool, content, links, emoji, gt) {

    'use strict';

    var INDEX = 0;

    ext.point('io.ox/mail/detail').extend({
        id: 'unread-class',
        index: INDEX += 100,
        draw: extensions.unreadClass
    });

    ext.point('io.ox/mail/detail').extend({
        id: 'subject',
        index: INDEX += 100,
        draw: function (baton) {

            var subject = util.getSubject(baton.data),
                node = $('<h1 class="subject">').text(subject);

            emoji.processEmoji(_.escape(subject), function (html) {
                node.html(html);
            });

            this.append(node);
        }
    });

    ext.point('io.ox/mail/detail').extend({
        id: 'header',
        index: INDEX += 100,
        draw: function (baton) {
            var header = $('<header class="detail-view-header">');
            ext.point('io.ox/mail/detail/header').invoke('draw', header, baton);
            this.append(header);
        }
    });

    var INDEX_header = 0;

    ext.point('io.ox/mail/detail/header').extend({
        id: 'picture',
        index: INDEX_header += 100,
        draw: extensions.picture
    });

    ext.point('io.ox/mail/detail/header').extend({
        id: 'drag-support',
        index: INDEX_header += 100,
        draw: function (baton) {
            this.attr({
                'data-drag-data': _.cid(baton.data),
                'data-drag-message': util.getSubject(baton.data)
            });
        }
    });

    ext.point('io.ox/mail/detail/header').extend({
        id: 'unread-toggle',
        index: INDEX_header += 100,
        draw: extensions.unreadToggle
    });

    /* move the actions menu to the top in sidepanel on smartphones */
    var extPoint = _.device('smartphone') ? 'io.ox/mail/detail' : 'io.ox/mail/detail/header';

    ext.point(extPoint).extend(new links.Dropdown({
        id: 'actions',
        index: _.device('smartphone') ? 50 : INDEX_header += 100,
        classes: _.device('smartphone') ? '': 'actions pull-right',
        label: gt('Actions'),
        ariaLabel: gt('Actions'),
        icon: _.device('smartphone') ? undefined : 'fa fa-bars',
        noCaret: true,
        ref: 'io.ox/mail/links/inline',
    }));

    ext.point('io.ox/mail/detail/header').extend({
        id: 'date',
        index: INDEX_header += 100,
        draw: extensions.fulldate
    });

    ext.point('io.ox/mail/detail/header').extend({
        id: 'from',
        index: INDEX_header += 100,
        draw: function (baton) {
            this.append(
                $('<div class="from">').append(
                    util.serializeList(baton.data, 'from')
                )
            );
        }
    });

    ext.point('io.ox/mail/detail/header').extend({
        id: 'flag-picker',
        index: INDEX_header += 100,
        draw: extensions.flagPicker
    });

    ext.point('io.ox/mail/detail/header').extend({
        id: 'priority',
        index: INDEX_header += 100,
        draw: extensions.priority
    });

    ext.point('io.ox/mail/detail/header').extend({
        id: 'paper-clip',
        index: INDEX_header += 100,
        draw: extensions.paperClip
    });

    ext.point('io.ox/mail/detail/header').extend({
        id: 'recipients',
        index: INDEX_header += 100,
        draw: extensions.recipients
    });

    ext.point('io.ox/mail/detail').extend({
        id: 'notifications',
        index: INDEX += 100,
        draw: function (baton) {
            var section = $('<section class="notifications">');
            ext.point('io.ox/mail/detail/notifications').invoke('draw', section, baton);
            this.append(section);
        }
    });

    var INDEX_notifications = 0;

    ext.point('io.ox/mail/detail/notifications').extend({
        id: 'phishing',
        index: INDEX_notifications += 100,
        draw: extensions.phishing
    });

    ext.point('io.ox/mail/detail/notifications').extend({
        id: 'disposition-notification',
        index: INDEX_notifications += 100,
        draw: extensions.dispositionNotification
    });

    ext.point('io.ox/mail/detail/notifications').extend({
        id: 'external-images',
        index: INDEX_notifications += 100,
        draw: extensions.externalImages
    });

    /**
     * @description actions for publication invitation mails
     */
    ext.point('io.ox/mail/detail/notifications').extend({
        index: INDEX_notifications += 100,
        id: 'subscribe',
        draw: function (baton) {
            var cont = function (baton) {
                var data = baton.data,
                    label = '',
                    pub = {},
                    pubtype = '';

                //exists publication header
                pub.url  = data.headers && data.headers['X-OX-PubURL'] || '';
                if (pub.url === '') {
                    return false;
                }
                //qualify data
                pubtype = /^(\w+),(.*)$/.exec(data.headers['X-OX-PubType']) || ['', '', ''];
                pub.module  = pubtype[1];
                pub.type  = pubtype[2];
                pub.name = decodeURIComponent(_.first(_.last(pub.url.split('/')).split('?')));
                pub.parent = require('settings!io.ox/core').get('folder/' + pub.module);
                pub.folder = '';
                label = pub.module === 'infostore' ?
                    /*#. folder publication of type 'files' (drive/infostore)
                     */
                    gt('files') :
                    /*#, dynamic*/
                    gt(pub.module);

                // published folder have much more data, single file just has a name and a URL.
                var isSingleFilePublication = !pub.type;

                this.append(
                    $('<div class="notification-item subscription">').append(
                        $('<div class="invitation">').text(
                            isSingleFilePublication ?
                                gt('Someone shared a file with you') :
                                /*#. %1$s is the (translated) type of the publication like "files", "contacts", …
                                */
                                gt('Someone shared a folder with you. Would you like to subscribe those %1$s?', label)
                        ),
                        $('<div class="actions">').append(
                            $('<button type="button" class="btn btn-default btn-sm" data-action="show">').text(
                                isSingleFilePublication ? gt('Show file') : gt('Show original publication')
                            ),
                            isSingleFilePublication ? '' :
                                $('<button type="button" class="btn btn-primary btn-sm" data-action="subscribe">').text(gt('Subscribe'))
                        )
                    )
                );

                //actions
                this.on('click', '.subscription .btn', function (e) {
                    var button = $(e.target),
                        notifications = require('io.ox/core/notifications');
                    //disble button
                    if (button.data('action') === 'show') {
                        window.open(pub.url, '_blank');
                    } else {
                        $(e.target).prop('disabled', true);
                        notifications.yell('info', gt('Adding subscription. This may take some seconds …'));
                        var opt = opt || {};
                        //create folder; create and refresh subscription
                        require(['io.ox/core/pubsub/util', 'io.ox/core/folder/api']).done(function (pubsubUtil, folder) {
                            pubsubUtil.autoSubscribe(pub.module, pub.name, pub.url).then(
                                function success() {
                                    /*#. %1$s is the publication name
                                     *#. %2$s is the (translated) type of the publication like "files", "contacts", …
                                     */
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
            }.bind(this);

            if (baton.model.has('headers')) {
                cont(baton);
            } else {
                baton.model.listenToOnce('changes:headers', cont, baton);
            }
        }
    });

    ext.point('io.ox/mail/detail').extend({
        id: 'body',
        index: INDEX += 100,
        draw: function () {
            var $body;
            this.append(
                $('<section class="attachments">'),
                $body = $('<section class="body user-select-text">')
            );
            $body.on('dispose', function () {
                var $content = $(this).find('.content');
                if ($content[0] && $content[0].children.length > 0) {
                    //cleanup content manually, since this subtree might get very large
                    //content only contains the mail and should not have any handlers assigned
                    //no need for jQuery.fn.empty to clean up, here (see Bug #33308)
                    $content[0].innerHTML = '';
                }
            });
        }
    });

    ext.point('io.ox/mail/detail/attachments').extend({
        id: 'attachment-list',
        index: 100,
        draw: extensions.attachmentList
    });

    ext.point('io.ox/mail/detail/body').extend({
        id: 'content',
        index: 1000,
        draw: function (baton) {
            var data = content.get(baton.data),
                node = data.content;
            if (!data.isLarge && !data.processedEmoji && data.type === 'text/html') {
                emoji.processEmoji(node.html(), function (text, lib) {
                    baton.processedEmoji = !lib.loaded;
                    if (baton.processedEmoji) return;
                    node.empty().append(text);
                });
            }
            this.idle().append(node);
        }
    });

    var pool = Pool.create('mail');

    var View = Backbone.View.extend({

        className: 'list-item mail-item mail-detail f6-target',

        events: {
            'keydown': 'onToggle',
            'click .detail-view-header': 'onToggle'
        },

        onChangeFlags: function () {
            // update unread state
            this.$el.toggleClass('unread', util.isUnseen(this.model.get('flags')));
        },

        onChangeAttachments: function () {
            var data = this.model.toJSON(),
                baton = ext.Baton({ data: data, attachments: util.getAttachments(data) }),
                node = this.$el.find('section.attachments').empty();
            ext.point('io.ox/mail/detail/attachments').invoke('draw', node, baton);
        },

        onChangeContent: function () {
            var data = this.model.toJSON(),
                baton = ext.Baton({ data: data, attachments: util.getAttachments(data) }),
                node = this.$el.find('section.body').empty();

            ext.point('io.ox/mail/detail/body').invoke('draw', node, baton);
        },

        onToggle: function (e) {

            if (e.type === 'keydown' && e.which !== 13) return;

            // ignore click on/inside <a> tags
            if ($(e.target).closest('a').length) return;

            // ignore click on dropdowns
            if ($(e.target).hasClass('dropdown-menu')) return;

            // don't toggle single messages
            if (this.$el.siblings().length === 0) return;

            // fix collapsed blockquotes
            this.$el.find('.collapsed-blockquote').hide();
            this.$el.find('.blockquote-toggle').show();

            var cid = $(e.currentTarget).closest('li').data('cid');
            this.toggle(cid);
        },

        onUnseen: function () {
            var data = this.model.toJSON();
            if (util.isToplevel(data)) api.markRead(data);
        },

        onLoad: function (data) {

            // since this function is a callback we have to check this.model
            // as an indicator whether this view has been destroyed meanwhile
            if (this.model === null) return;

            var unseen = this.model.get('unseen') || util.isUnseen(this.model.get('flags'));

            // done
            this.$el.find('section.body').removeClass('loading');
            this.trigger('load:done');

            // draw
            this.onChangeAttachments();
            this.onChangeContent();

            // merge data (probably unnecessary here since API updates the model)
            if (data) this.model.set(data);

            // process unseen flag
            if (unseen) {
                this.onUnseen();
            } else {
                //if this mail was read elsewhere notify other apps about it, for example the notification area (also manages new mail window title)
                api.trigger('update:set-seen', [{id: this.model.get('id'), folder_id: this.model.get('folder_id')}]);
            }
        },

        onLoadFail: function () {
            this.trigger('load:done');
            if (this.$el) this.$el.attr('data-loaded', false).removeClass('expanded');
        },

        toggle: function (state) {

            var $li = this.$el;

            if (state === undefined) {
                $li.toggleClass('expanded');
                $li.attr('aria-expanded', !$li.attr('aria-expanded'));
            } else {
                $li.toggleClass('expanded', state);
                $li.attr('aria-expanded', state);
            }

            // trigger DOM event that bubbles
            this.$el.trigger('toggle');

            if ($li.attr('data-loaded') === 'false' && $li.hasClass('expanded')) {
                $li.attr('data-loaded', true);
                $li.find('section.body').addClass('loading');
                this.trigger('load');
                // load detailed email data
                if (this.loaded) {
                    this.onLoad();
                } else {
                    api.get(_.cid(this.model.cid)).then(
                        this.onLoad.bind(this),
                        this.onLoadFail.bind(this)
                    );
                }
            }

            return this;
        },

        expand: function () {
            return this.toggle(true);
        },

        initialize: function (options) {

            this.options = options || {};
            this.model = pool.getDetailModel(options.data);
            this.loaded = options.loaded || false;
            this.listenTo(this.model, 'change:flags', this.onChangeFlags);
            this.listenTo(this.model, 'change:attachments', this.onChangeContent);
            this.$el.on('dispose', this.dispose.bind(this));

            this.on({
                'load': function () {
                    this.$el.find('section.body').empty().busy();
                },
                'load:done': function () {
                    this.$el.find('section.body').idle();
                }
            });
        },

        redraw: function () {
            this.$el.empty();
            this.render();
            if (this.$el.hasClass('expanded')) {
                this.onChangeAttachments();
                this.onChangeContent();
            }
        },

        render: function () {

            var data = this.model.toJSON(),
                baton = ext.Baton({ data: data, model: this.model, view: this }),
                subject = util.getSubject(data),
                title = util.hasFrom(data) ?
                    //#. %1$s: Mail sender
                    //#. %2$s: Mail subject
                    gt('Email from %1$s: %2$s', util.getDisplayName(data.from[0]), subject) : subject;

            // disable extensions?
            _(this.options.disable).each(function (extension, point) {
                if (_.isArray(extension)) {
                    _(extension).each(function (ext) {
                        baton.disable(point, ext);
                    });
                } else {
                    baton.disable(point, extension);
                }
            });

            this.$el.attr({
                'aria-label': title,
                'aria-expanded': 'false',
                'data-cid': this.model.cid,
                'data-loaded': 'false'
            });

            this.$el.data({ view: this, model: this.model });

            ext.point('io.ox/mail/detail').invoke('draw', this.$el, baton);

            return this;
        },

        dispose: function () {
            this.stopListening();
            this.off();
            this.model = this.options = this.$el = null;
        }
    });

    return {
        View: View
    };
});
