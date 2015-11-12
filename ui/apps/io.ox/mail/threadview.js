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

define('io.ox/mail/threadview', [
    'io.ox/mail/common-extensions',
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/api/backbone',
    'io.ox/mail/detail/view',
    'io.ox/mail/detail/mobileView',
    'io.ox/core/tk/list-dnd',
    'io.ox/core/emoji/util',
    'io.ox/core/http',
    'gettext!io.ox/mail',
    'less!io.ox/mail/style',
    'io.ox/mail/listview'
], function (extensions, ext, api, util, backbone, detail, detailViewMobile, dnd, emoji, http, gt) {

    'use strict';

    ext.point('io.ox/mail/thread-view').extend({
        id: 'navigation',
        index: 100,
        draw: function () {
            this.$el.append(
                $('<nav class="back-navigation generic-toolbar">').append(
                    $('<div class="button">').append(
                        $('<a href="#" class="back" tabindex="1">').append(
                            $('<i class="fa fa-chevron-left">'), $.txt(' '), $.txt(gt('Back'))
                        )
                    ),
                    $('<div class="position">'),
                    $('<div class="prev-next">').append(
                        $('<a href="#" class="previous-mail" tabindex="1">').append('<i class="fa fa-chevron-up">'),
                        $('<a href="#" class="next-mail" tabindex="1">').append('<i class="fa fa-chevron-down">')
                    )
                ).attr('role', 'toolbar')
            );
        }
    });

    ext.point('io.ox/mail/thread-view').extend({
        id: 'thread-view-list',
        index: 200,
        draw: function () {
            this.$el.append(
                $('<div class="thread-view-list scrollable abs">').hide().append(
                    $('<h1>'),
                    this.$messages = $('<div class="thread-view list-view">')
                )
            );
        }
    });

    ext.point('io.ox/mail/thread-view/header').extend({
        id: 'toggle-all',
        index: 100,
        draw: function (baton) {
            if (baton.view.collection.length <= 1) return;
            this.append(
                $('<a href="#" role="button" class="toggle-all" tabindex="1">')
                .append('<i class="fa fa-angle-double-down">')
                .attr({
                    'data-toggle': 'tooltip',
                    'data-placement': 'left',
                    'data-animation': 'false',
                    'data-container': 'body',
                    'title': gt('Open/close all messages')
                })
                .tooltip()
            );
        }
    });

    ext.point('io.ox/mail/thread-view/header').extend({
        id: 'subject',
        index: 200,
        draw: function (baton) {
            var keepFirstPrefix = baton.view.collection.length === 1,
                subject = util.getSubject(baton.view.model.toJSON(), keepFirstPrefix),
                node = $('<div class="subject">').text(subject);

            this.append(node);
            emoji.processEmoji(node.html(), function (text) {
                node.html(text);
            });
        }
    });

    ext.point('io.ox/mail/thread-view/header').extend({
        id: 'summary',
        index: 300,
        draw: function (baton) {
            var length = baton.view.collection.length;
            if (length <= 1) return;
            this.append(
                $('<div class="summary">').text(gt('%1$d messages in this conversation', length))
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
            this.$el.find('.thread-view-list').hide();
            this.model = null;
        },

        updateHeader: _.debounce(function () {

            var baton = new ext.Baton({ view: this }),
                node = this.$el.find('.thread-view-list > h1').empty();

            if (this.collection.length > 0) {
                ext.point('io.ox/mail/thread-view/header').invoke('draw', node, baton);
            }

            this.$el.find('.thread-view').toggleClass('multiple-messages', this.collection.length > 1);

        }, 10),

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

        onToggle: _.debounce(function () {
            var items = this.getItems(),
                open = items.filter('.expanded'),
                state = open.length === 0,
                icon = state ? 'fa-angle-double-down' : 'fa-angle-double-up';
            this.$el.find('.toggle-all i').attr('class', 'fa ' + icon);
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

        autoSelectMail: function () {
            for (var i = this.collection.length - 1, model; model = this.collection.at(i); i--) {
                // most recent or first unseen?
                if (i === 0 || util.isUnseen(model.toJSON())) {
                    this.showMail(model.cid);
                    break;
                }
            }
        },

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
            this.collection[type || 'reset'](thread);
        },

        onReset: function () {

            if (this.collection.length === 0) {
                this.empty();
                return;
            } else {
                this.$messages.empty();
                this.$el.scrollTop(0);
            }

            this.updateHeader();

            this.$el.find('.thread-view-list').show();

            // draw thread list
            this.$messages.append(
                this.collection.chain().map(this.renderListItem, this).value()
            );

            this.zIndex();
            this.autoSelectMail();
        },

        onAdd: function (model) {

            var index = model.get('index'),
                children = this.getItems(),
                li = this.renderListItem(model);

            // insert or append
            if (index < children.length) children.eq(index).before(li); else this.$messages.append(li);

            if (li.position().top <= 0) {
                this.$messages.scrollTop(this.$el.scrollTop() + li.outerHeight(true));
            }

            this.zIndex();
            this.updateHeader();
        },

        onRemove: function (model) {
            var children = this.getItems(),
                li = children.filter('[data-cid="' + model.cid + '"]'),
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

            this.listenTo(this.collection, {
                add: this.onAdd,
                remove: this.onRemove,
                reset: this.onReset
            });

            this.listenTo(api.pool.get('detail'), {
                remove: this.onPoolRemove
            });

            this.$messages = $();

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
            }
        },

        // return alls items of this list
        getItems: function () {
            return this.$messages.children('.list-item');
        },

        // render scaffold
        render: function () {
            ext.point('io.ox/mail/thread-view').invoke('draw', this);
            return this;
        },

        // render an email
        renderListItem: function (model) {
            var view = new detail.View({ tagName: 'article', data: model.toJSON(), disable: { 'io.ox/mail/detail': 'subject' } });
            return view.render().$el.attr({ tabindex: '1' });
        },

        // update zIndex for all list-items (descending)
        zIndex: function () {
            var items = this.getItems(), length = items.length;
            items.each(function (index) {
                $(this).css('zIndex', length - index);
            });
        }
    });

    // Mobile
    ext.point('io.ox/mail/mobile/thread-view').extend({
        id: 'thread-view-list',
        index: 100,
        draw: function () {
            this.$el.append(
                $('<div class="thread-view-list scrollable abs">').hide().append(
                    $('<h1>'),
                    this.$messages = $('<ul class="thread-view list-view">')
                )
            );
        }
    });

    // Mobile
    ext.point('io.ox/mail/mobile').extend({
        id: 'remove-halo-link',
        index: 100,
        customize: function () {
            var elem = this.$el.find('.person-link');
            _(elem).each(function (el) {
                var span = $('<span>').text($(el).text());
                span.addClass(elem.attr('class'));
                span.addClass('sp').removeClass('halo-link');
                $(el).after(span);
            });
            elem.remove();
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
                    'io.ox/mail/detail/header': ['flag-picker', 'unread-toggle']
                }
            });

            view.render().$el.attr({ role: 'listitem', tabindex: '1' });

            ext.point('io.ox/mail/mobile').invoke('customize', view);

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
            return view.render().toggle().$el.attr({ role: 'listitem', tabindex: '1' });

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
