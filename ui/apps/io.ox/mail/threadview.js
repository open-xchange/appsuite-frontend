/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/threadview', [
    'io.ox/mail/common-extensions',
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/api/backbone',
    'io.ox/mail/detail/view',
    'io.ox/mail/detail/mobileView',
    'io.ox/core/tk/list-dnd',
    'io.ox/core/http',
    'gettext!io.ox/mail',
    'less!io.ox/mail/style',
    'io.ox/mail/listview'
], function (extensions, ext, api, util, backbone, detail, detailViewMobile, dnd, http, gt) {

    'use strict';

    ext.point('io.ox/mail/thread-view').extend({
        id: 'navigation',
        index: 100,
        draw: function () {
            this.$el.append(
                $('<nav class="back-navigation generic-toolbar">').append(
                    $('<div class="button">').append(
                        $('<a href="#" role="button" class="back" draggable="false">')
                        .attr('aria-label', gt('Back to list'))
                        .append($('<i class="fa fa-chevron-left" aria-hidden="true">'), $.txt(' '), $.txt(gt('Back')))
                    ),
                    $('<div class="position">'),
                    $('<div class="prev-next">').append(
                        $('<a href="#" role="button" class="previous-mail">').attr('aria-label', gt('Previous message')).append(
                            $('<i class="fa fa-chevron-up" aria-hidden="true">')
                        ),
                        $('<a href="#" role="button" class="next-mail">').attr('aria-label', gt('Next message')).append(
                            $('<i class="fa fa-chevron-down" aria-hidden="true">')
                        )
                    )
                ).attr('role', 'navigation')
            );
        }
    });

    ext.point('io.ox/mail/thread-view').extend({
        id: 'thread-view-list',
        index: 200,
        draw: function () {
            this.$el.append(
                $('<div class="thread-view-list scrollable abs">').hide().append(
                    $('<div class="thread-view-header">').attr('aria-label', gt('Conversation')),
                    this.$messages = $('<div class="thread-view list-view" role="region">')
                ).on('scroll', this.onScrollEnd.bind(this))
            );
        }
    });

    ext.point('io.ox/mail/thread-view/header').extend({
        id: 'toggle-all',
        index: 100,
        draw: function (baton) {
            if (baton.view.collection.length <= 1) return;
            this.append(
                $('<a href="#" role="button" class="toggle-all">')
                .append('<i class="fa fa-angle-double-down" aria-hidden="true">')
                .attr('aria-label', gt('Open all messages'))
                .tooltip({
                    animation: false,
                    container: 'body',
                    placement: 'left',
                    title: gt('Open/close all messages')
                })
            );
        }
    });

    ext.point('io.ox/mail/thread-view/header').extend({
        id: 'subject',
        index: 200,
        draw: function (baton) {

            var keepPrefix = baton.view.collection.length === 1,
                data = baton.view.model.toJSON(),
                subject = baton.view.threaded ? api.threads.subject(data) || data.subject : data.subject;

            this.append(
                $('<h1 class="subject">').text(util.getSubject(subject, keepPrefix))
            );
        }
    });

    var ThreadView = Backbone.View.extend({

        tagName: 'div',
        className: 'thread-view-control abs',

        events: {
            'click .button a.back': 'onBack',
            'click .back-navigation .previous-mail': 'onPrevious',
            'click .back-navigation .next-mail': 'onNext',
            'click .toggle-all': 'onToggleAll',
            'keydown': 'onKeydown'
        },

        empty: function () {
            this.$messages.empty();
            this.$el.scrollTop(0);
            this.$el.find('.thread-view-list').scrollTop(0).hide();
            this.model = null;
        },

        updateHeader: function () {

            var baton = new ext.Baton({ view: this }),
                node = this.$el.find('.thread-view-list > .thread-view-header').empty(),
                keepPrefix = baton.view.collection.length === 1,
                subject = util.getSubject(baton.view.model.toJSON(), keepPrefix);

            if (this.collection.length > 0) {
                ext.point('io.ox/mail/thread-view/header').invoke('draw', node, baton);
            }

            this.$el.find('.thread-view')
                .toggleClass('multiple-messages', this.collection.length > 1)
                .attr('aria-label', subject);
        },

        updatePosition: function (position) {
            this.$el.find('.position').text(position);
            return this;
        },

        togglePrevious: function (state) {
            this.$el.find('.previous-mail').toggleClass('disabled', !state);
            return this;
        },

        toggleNext: function (state) {
            this.$el.find('.next-mail').toggleClass('disabled', !state);
            return this;
        },

        toggleNavigation: function (state) {
            this.$el.toggleClass('back-navigation-visible', state);
            return this;
        },

        onToggle: _.debounce(function (e) {
            var items = this.getItems(),
                open = items.filter('.expanded'),
                state = open.length === 0,
                icon = state ? 'fa-angle-double-down' : 'fa-angle-double-up',
                toggleButton = this.$el.find('.toggle-all');
            toggleButton.attr('aria-label', state ? gt('Open all messages') : gt('Close all messages'));
            toggleButton.find('i').attr('class', 'fa ' + icon);
            // only check if we need to replace placeholders when mail is collapsed
            if (!e || !$(e.target).hasClass('expanded')) this.onScrollEnd();
        }, 10),

        onToggleAll: function (e) {
            e.preventDefault();
            var items = this.getItems(),
                open = items.filter('.expanded'),
                // only open all if all are closed
                state = open.length === 0;
            // pause http layer to combine GET requests
            http.pause();
            this.collection.each(function (model) {
                this.toggleMail(model.cid, state);
            }, this);
            http.resume();
        },

        toggleMail: function (cid, state) {
            var $li = this.$messages.children('[data-cid="' + $.escape(cid) + '"]'),
                view = $li.data('view');
            if (view) view.toggle(state);
        },

        showMail: function (cid) {
            this.toggleMail(cid, true);
        },
        //idOnly returns the cid of the next mail to autoselect, without actually opening it
        autoSelectMail: function (idOnly) {
            // automatic selection of first seen mail on mailapp start
            if (this.autoSelect) {
                for (var a = 0, mail; mail = this.collection.at(a); a++) {
                    // last or first seen?
                    if (a === this.collection.length - 1 || !util.isUnseen(mail.toJSON())) {
                        if (idOnly) return mail.cid;
                        this.showMail(mail.cid);
                        break;
                    }
                }
                delete this.autoSelect;
                return;
            }

            for (var i = this.collection.length - 1, model; model = this.collection.at(i); i--) {
                // most recent or first unseen?
                if (i === 0 || util.isUnseen(model.toJSON())) {
                    if (idOnly) return model.cid;
                    this.showMail(model.cid);
                    break;
                }
            }
        },

        onScrollEnd: _.debounce(function () {
            var listNode = this.$el.find('.thread-view-list');
            this.getItems().each(function () {
                if (!$(this).hasClass('placeholder')) return;
                if ((this.offsetTop + $(this).height()) > listNode.scrollTop() && this.offsetTop < (listNode.scrollTop() + listNode.height())) {
                    var view = $(this).data('view');
                    // don't redraw views that are already loading. This removes the busy spinner
                    if (view && !view.$el.find('section.body').hasClass('loading')) {
                        view.placeholder = false;
                        view.render();
                    }
                }
            });
        }, 100),

        show: function (cid, threaded) {
            // strip 'thread.' prefix
            cid = String(cid).replace(/^thread\./, '');
            // no change?
            if (this.model && this.model.cid === cid) return;
            // get new model
            var pool = api.pool.get('detail'), model = pool.get(cid);
            if (!model) {
                this.empty();
                console.error('ThreadView.show(): Mail not found in pool', cid, pool);
                return;
            }
            // stop listening
            if (this.model) this.stopListening(this.model);
            // use new model
            this.model = model;
            this.threaded = !!threaded;
            if (!this.threaded) {
                // autoselect after mail app start
                delete this.autoSelect;
            }
            // listen for changes
            this.listenTo(this.model, 'change:thread', this.onChangeModel);
            // reset collection
            this.collection.reset([], { silent: true });
            this.reset();
        },

        reset: function () {
            // has model?
            if (!this.model) return;
            // get thread items
            var thread = this.threaded ? api.threads.get(this.model.cid) : [this.model.toJSON()];
            if (!thread.length) return;
            // reset collection
            var type = this.collection.length === 0 ? 'reset' : 'set';
            this.collection[type](thread);
        },

        onReset: function () {

            if (this.collection.length === 0) {
                this.empty();
                return;
            }
            this.$messages.empty();
            this.$el.scrollTop(0);

            // clear timeout of previous rendering to prevent race conditions
            clearTimeout(this.renderItemTimoutId);

            this.updateHeader();

            this.$el.find('.thread-view-list').scrollTop(0).show();

            this.nextAutoSelect = this.autoSelectMail(true);
            this.$messages.append(
                this.collection.chain().map(this.renderListItem, this).value()
            );

            this.zIndex();

        },

        onAdd: function (model) {

            var index = model.get('index'),
                children = this.getItems(),
                li = this.renderListItem(model),
                open = this.$el.data('open');

            // insert or append
            if (index < children.length) children.eq(index).before(li); else this.$messages.append(li);

            if (li.position().top <= 0) {
                this.$messages.scrollTop(this.$el.scrollTop() + li.outerHeight(true));
            }

            this.zIndex();
            this.updateHeader();

            if (open) {
                this.showMail(open);
                this.$el.data('open', null);
            }
        },

        onRemove: function (model) {
            var children = this.getItems(),
                li = children.filter(function () { return $(this).attr('data-cid') === model.cid; }),
                first = li.length ? li.attr('data-cid') && children.first().attr('data-cid') : false,
                top = this.$messages.scrollTop();

            if (li.length === 0) return;

            if (li.position().top < top) {
                this.$messages.scrollTop(top - li.outerHeight(true));
            }

            li.remove();

            // clear view if this was the last message
            if (children.length === 1) this.empty(); else this.updateHeader();

            // auto open next mail if this was the latest mail in the thread
            if (children.length > 1 && first) {
                this.autoSelectMail();
            }
        },

        onPoolRemove: function (model) {
            this.collection.remove(model);
        },

        onChangeModel: function () {
            this.reset();
        },

        onBack: function (e) {
            e.preventDefault();
            this.trigger('back');
        },

        onPrevious: function (e) {
            e.preventDefault();
            this.trigger('previous');
        },

        onNext: function (e) {
            e.preventDefault();
            this.trigger('next');
        },

        onClick: function (e) {
            var cid = $(e.currentTarget).attr('data-cid');
            this.showMail(cid);
        },

        onKeydown: function (e) {
            switch (e.which) {
                case 38:
                    // cursor up
                    if (e.shiftKey) this.onNext(e);
                    if (e.altKey) this.focusMessage(e, -1);
                    break;
                case 40:
                    // cursor down
                    if (e.shiftKey) this.onPrevious(e);
                    if (e.altKey) this.focusMessage(e, +1);
                    break;
                // no default
            }
        },

        focusMessage: function (e, shift) {
            var items = this.getItems(),
                current = $(document.activeElement).closest('.list-item'),
                index = items.index(current);
            // avoid scrolling
            e.preventDefault();
            // shift and check bounds
            index = index + shift;
            if (index < 0 || index >= items.length) return;
            // focus and open next message, close previous
            current.data('view').toggle(false);
            items.eq(index).focus().data('view').toggle(true);
            items.eq(index).get(0).scrollIntoView(true);
        },

        initialize: function (options) {

            this.model = null;
            this.threaded = true;
            this.collection = new backbone.Collection();
            options = options || {};
            this.standalone = options.standalone || false;

            this.app = options.app;

            this.listenTo(this.collection, {
                add: this.onAdd,
                remove: this.onRemove,
                reset: this.onReset
            });

            this.listenTo(api.pool.get('detail'), {
                remove: this.onPoolRemove
            });

            this.$messages = $();

            // make view accessible via DOM
            this.$el.data('view', this);

            this.$el.on('toggle', '.list-item', this.onToggle.bind(this));

            // we don't need drag support when it's open in a separate detailview (there is no foldertree to drag to)
            if (!options.disableDrag) {
                // enable drag & drop support
                dnd.enable({
                    container: this.$el,
                    draggable: true,
                    selectable: '.detail-view-header .contact-picture',
                    simple: true
                });
                // fix lost focus when just cliking .contact-picture
                this.$el.on('mouseup', '.detail-view-header .contact-picture', function (e) {
                    $(e.target).closest('article').focus();
                });
            }
            var resizeCallback = $.proxy(this.onScrollEnd, this);
            this.$el.one('remove', function () {
                $(window).off('resize', resizeCallback);
            });

            if (options.app) {
                this.listenTo(options.app.props, 'change:textPreview', function (model, value) {
                    this.$el.toggleClass('hide-text-preview', !value);
                    resizeCallback();
                });
            }

            $(window).on('resize', resizeCallback);
        },

        // return alls items of this list
        getItems: function () {
            return this.$messages.children('.list-item');
        },

        // render scaffold
        render: function () {
            this.$el.toggleClass('hide-text-preview', this.app ? !this.app.useTextPreview() : true);
            ext.point('io.ox/mail/thread-view').invoke('draw', this);
            return this;
        },

        // render an email
        renderListItem: function (model) {
            var self = this, view = new detail.View({ threadview: this, supportsTextPreview: this.app ? this.app.supportsTextPreviewConfiguration() : false, tagName: 'article', data: model.toJSON(), disable: { 'io.ox/mail/detail': 'subject' } });
            view.on('mail:detail:body:render', function (data) {
                self.trigger('mail:detail:body:render', data);
            });
            view.render();
            if (this.nextAutoSelect === model.cid) {
                delete this.nextAutoSelect;
                view.expand();
            }
            return view.$el.attr({ tabindex: -1 });
        },

        // update zIndex for all list-items (descending)
        zIndex: function () {
            var items = this.getItems(), length = items.length;
            items.each(function (index) {
                $(this).css('zIndex', length - index);
            });
            this.onScrollEnd();
        }
    });

    // Mobile
    ext.point('io.ox/mail/mobile/thread-view').extend({
        id: 'thread-view-list',
        index: 100,
        draw: function () {
            this.$el.append(
                $('<div class="thread-view-list scrollable abs">').hide().append(
                    $('<div class="thread-view-header">').attr('aria-label', gt('Conversation')),
                    this.$messages = $('<ul class="thread-view list-view">')
                ).on('scroll', this.onScrollEnd.bind(this))
            );
        }
    });

    // Mobile, remove halo links in thread-overview (placeholder handling in detail/view.js)
    ext.point('io.ox/mail/detail').extend({
        id: 'remove-halo-link',
        index: 'last',
        draw: function () {
            if (_.device('!smartphone')) return;
            this.find('.halo-link').removeClass('halo-link');
        }
    });

    var MobileThreadView = ThreadView.extend({

        initialize: function () {
            this.model = null;
            this.threaded = true;
            this.collection = new backbone.Collection();

            this.listenTo(this.collection, {
                add: this.onAdd,
                remove: this.onRemove,
                reset: this.onReset
            });

            this.listenTo(api.pool.get('detail'), {
                remove: this.onPoolRemove
            });

            this.$messages = $();
        },

        // render an email
        renderListItem: function (model) {
            // custom view
            var view = new detailViewMobile.HeaderView({
                tagName: 'li',
                data: model.toJSON(),
                disable: {
                    'io.ox/mail/detail': ['subject', 'actions'],
                    'io.ox/mail/detail/header': ['paper-clip'],
                    'io.ox/mail/detail/header/row1': ['color-picker', 'flag-toggle', 'security']
                }
            });

            view.render().$el.attr({ role: 'listitem', tabindex: '0' });

            return view.$el;
        },
        renderMail: function (cid) {
            // strip 'thread.' prefix
            cid = String(cid).replace(/^thread\.(.+)$/, '$1');

            var model = api.pool.get('detail').get(cid);

            if (!model) return;

            var view = new detailViewMobile.DetailView({
                tagName: 'li',
                data: model.toJSON()
            });
            this.mail = model.toJSON();
            return view.render().toggle().$el.attr({ role: 'listitem', tabindex: '0' });

        },
        // render scaffold
        render: function () {

            // disable some points
            ext.point('io.ox/mail/thread-view/header').disable('toggle-all');

            ext.point('io.ox/mail/thread-view').invoke('draw', this);
            return this;
        }
    });

    return {
        Desktop: ThreadView,
        Mobile: MobileThreadView
    };

});
