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

define('io.ox/mail/detail/view', [
    'io.ox/backbone/disposable',
    'io.ox/mail/common-extensions',
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/api/collection-pool',
    'io.ox/mail/detail/content',
    'io.ox/core/extPatterns/links',
    'io.ox/core/emoji/util',
    'gettext!io.ox/mail',
    'less!io.ox/mail/detail/shadow',
    'less!io.ox/mail/detail/style',
    'less!io.ox/mail/style',
    'io.ox/mail/actions'
], function (DisposableView, extensions, ext, api, util, Pool, content, links, emoji, gt, shadowStyle) {

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
            var header = $('<header class="detail-view-header" role="heading">');
            ext.point('io.ox/mail/detail/header').invoke('draw', header, baton);
            this.append(header);
        }
    });

    var INDEX_header = 0;

    ext.point('io.ox/mail/detail/header').extend({
        id: 'picture',
        index: INDEX_header += 100,
        draw: extensions.senderPicture
    });

    ext.point('io.ox/mail/detail/header').extend({
        id: 'drag-support',
        index: INDEX_header += 100,
        draw: function (baton) {
            this.find('.contact-picture').attr({
                'data-drag-data': _.cid(baton.data),
                'data-drag-message': util.getSubject(baton.data)
            });
        }
    });

    /* move the actions menu to the top in sidepanel on smartphones */
    var extPoint = _.device('smartphone') ? 'io.ox/mail/detail' : 'io.ox/mail/detail/header';

    ext.point(extPoint).extend(new links.Dropdown({
        id: 'actions',
        index: _.device('smartphone') ? 50 : INDEX_header += 100,
        classes: _.device('smartphone') ? '' : 'actions pull-right',
        label: gt('Actions'),
        ariaLabel: gt('Actions'),
        icon: _.device('smartphone') ? undefined : 'fa fa-bars',
        noCaret: true,
        ref: 'io.ox/mail/links/inline',
        smart: true
    }));

    ext.point('io.ox/mail/detail/header').extend({
        id: 'unread-toggle',
        index: INDEX_header += 100,
        draw: extensions.unreadToggle
    });

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
        draw: function (baton) {
            ext.point('io.ox/mail/detail/header/recipients').invoke('draw', this, baton);
        }
    });

    ext.point('io.ox/mail/detail/header/recipients').extend({
        id: 'default',
        index: 100,
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

    ext.point('io.ox/mail/detail').extend({
        id: 'body',
        index: INDEX += 100,
        draw: function () {
            var $body;
            this.append(
                $('<section class="attachments">'),
                $body = $('<section class="body user-select-text" tabindex="-1">')
            );
            // rendering mails in chrome is slow if we do not use a shadow dom
            if ($body[0].createShadowRoot && _.device('chrome') && !_.device('smartphone')) {
                $body[0].createShadowRoot();
                $body.addClass('shadow-root-container');
            }
            $body.on('dispose', function () {
                var $content = $(this.shadowRoot || this);
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
        draw: function (baton) {
            if (baton.attachments.length === 0) return;
            // reuse existing view, to not duplicate event listeners
            if (baton.view.attachmentView) {
                baton.view.attachmentView.$header.empty();
                this.append(baton.view.attachmentView.render());
                baton.view.attachmentView.renderInlineLinks();
            } else {
                baton.view.attachmentView = extensions.attachmentList.call(this, baton);
            }
        }
    });

    ext.point('io.ox/mail/detail/body').extend({
        id: 'content',
        index: 1000,
        draw: function (baton) {

            var data = content.get(baton.data),
                node = data.content;

            if (!data.isLarge && !data.processedEmoji && data.type === 'text/html') {
                emoji.processEmoji(node.innerHTML, function (html, lib) {
                    baton.processedEmoji = !lib.loaded;
                    if (baton.processedEmoji) return;
                    node.innerHTML = html;
                });
            }

            // restore height or set minimum height of 100px
            $(node).css('min-height', baton.model.get('visualHeight') || 100);
            // add to DOM
            this.idle().append(node);
            // ensure, that the scrollable is a lazyload scrollpane
            if (this[0].host) {
                // if it is a shadow dom, we must trigger add.lazyload to ensure, that lazyloading is updated at least once
                $(this[0].host).closest('.scrollable').lazyloadScrollpane().trigger('add.lazyload');
            } else {
                this.closest('.scrollable').lazyloadScrollpane();
            }
            // now remember height
            baton.model.set('visualHeight', $(node).height(), { silent: true });
        }
    });

    ext.point('io.ox/mail/detail/body').extend({
        id: 'max-size',
        after: 'content',
        draw: function (baton) {

            var isTruncated = _(baton.data.attachments).some(function (attachment) { return attachment.truncated; });
            if (!isTruncated) return;

            var url = 'api/mail?' + $.param({
                action: 'get',
                view: 'document',
                folder: baton.data.folder_id,
                id: baton.data.id,
                session: ox.session
            });

            this.append(
                $('<div class="max-size-warning">').append(
                    $.txt(gt('This message has been truncated due to size limitations.')), $.txt(' '),
                    $('<a role="button" target="_blank">').attr('href', url).text(gt('Show entire message'))
                )
            );
        }
    });

    var pool = Pool.create('mail');

    var View = DisposableView.extend({

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
            if (this.model.changed.attachments && _.isEqual(this.model.previous('attachments'), this.model.get('attachments'))) return;

            var data = this.model.toJSON(),
                baton = ext.Baton({
                    view: this,
                    model: this.model,
                    data: data,
                    attachments: util.getAttachments(data)
                }),
                node = this.$el.find('section.attachments').empty();
            ext.point('io.ox/mail/detail/attachments').invoke('draw', node, baton);
            // global event for tracking purposes
            ox.trigger('mail:detail:attachments:render', this);

            if (this.model.previous('attachments') &&
                this.model.get('attachments') &&
                this.model.previous('attachments')[0].content !== this.model.get('attachments')[0].content) this.onChangeContent();
        },

        onChangeContent: function () {
            var data = this.model.toJSON(),
                baton = ext.Baton({
                    view: this,
                    model: this.model,
                    data: data,
                    attachments: util.getAttachments(data)
                }),
                body = this.$el.find('section.body'),
                // get shadow DOM or body node
                shadowRoot = body.prop('shadowRoot'),
                node = $(shadowRoot || body),
                view = this;
            // set outer height & clear content
            body.css('min-height', this.model.get('visualHeight') || null);
            if (shadowRoot) shadowRoot.innerHTML = '<style>' + shadowStyle + '</style>'; else body.empty();
            // draw
            _.delay(function () {
                ext.point('io.ox/mail/detail/body').invoke('draw', node, baton);
                // global event for tracking purposes
                ox.trigger('mail:detail:body:render', view);
                body = shadowRoot = node = view = null;
            }, 20);
        },

        onChangeRecipients: _.debounce(function () {
            var data = this.model.toJSON(),
                baton = ext.Baton({ data: data, model: this.model, view: this }),
                node = this.$('.recipients').empty();
            ext.point('io.ox/mail/detail/header/recipients').invoke('draw', node, baton);
        }, 10),

        onToggle: function (e) {

            if (e.type === 'keydown' && e.which !== 13) return;

            // ignore click on/inside <a> tags
            if ($(e.target).closest('a').length) return;

            // ignore click on dropdowns
            if ($(e.target).hasClass('dropdown-menu')) return;

            // ignore clicks on overlays
            if ($(e.target).hasClass('overlay')) return;

            // don't toggle single messages unless it's collapsed
            if (this.$el.siblings().length === 0 && this.$el.hasClass('expanded')) return;

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
                api.trigger('update:set-seen', [{ id: this.model.get('id'), folder_id: this.model.get('folder_id') }]);
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
            this.listenTo(this.model, 'change:attachments', this.onChangeAttachments);
            this.listenTo(this.model, 'change:to change:cc change:bcc', this.onChangeRecipients);

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
                'data-cid': this.model.cid,
                'aria-expanded': 'false',
                'data-loaded': 'false'
            });

            this.$el.prepend(
                $('<h2 class="sr-only">').text(title)
            );

            this.$el.data({ view: this, model: this.model });

            ext.point('io.ox/mail/detail').invoke('draw', this.$el, baton);

            // global event for tracking purposes
            ox.trigger('mail:detail:render', this);

            return this;
        }
    });

    return {
        View: View
    };
});
