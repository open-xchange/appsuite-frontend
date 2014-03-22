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

define('io.ox/mail/threadview',
    ['io.ox/mail/common-extensions',
     'io.ox/core/extensions',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/core/api/backbone',
     'io.ox/mail/detail/view',
     'io.ox/core/tk/list-dnd',
     'io.ox/core/http',
     'gettext!io.ox/mail',
     'io.ox/mail/listview'], function (extensions, ext, api, util, backbone, detail, dnd, http, gt) {

    'use strict';

    ext.point('io.ox/mail/thread-view').extend({
        id: 'navigation',
        index: 100,
        draw: function () {
            this.$el.append(
                $('<nav class="back-navigation">').append(
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
                )
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
                    this.$ul = $('<ul class="thread-view list-view f6-target" role="listbox">')
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
                $('<a href="#" class="toggle-all" tabindex="1">')
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
            var subject = util.getSubject(baton.view.collection.at(0).toJSON());
            this.append(
                $('<div class="subject">').text(subject)
            );
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
            this.$ul.empty();
            this.$el.scrollTop(0);
            this.$el.find('.thread-view-list').hide();
            this.model = null;
        },

        updateHeader: _.debounce(function () {

            var baton = new ext.Baton({ view: this }),
                node = this.$el.find('.thread-view-list > h1').empty();
            ext.point('io.ox/mail/thread-view/header').invoke('draw', node, baton);


            if (this.collection.length > 1)
                this.$el.find('.thread-view').addClass('multiple-messages');
            else
                this.$el.find('.thread-view').removeClass('multiple-messages');

        }, 10),

        updatePosition: function (position) {
            this.$el.find('.position').text(position);
        },

        togglePrevious: function (state) {
            this.$el.find('.previous-mail').toggleClass('disabled', !state);
        },

        toggleNext: function (state) {
            this.$el.find('.next-mail').toggleClass('disabled', !state);
        },

        toggleNavigation: function (state) {
            this.$el.toggleClass('back-navigation-visible', state);
        },

        onToggle: _.debounce(function () {
            var items = this.getItems(),
                open = items.filter('.expanded'),
                state = items.length > open.length,
                icon = state ? 'fa-angle-double-down' : 'fa-angle-double-up';
            this.$el.find('.toggle-all i').attr('class', 'fa ' + icon);
        }, 10),

        onToggleAll: function (e) {
            e.preventDefault();
            var items = this.getItems(),
                open = items.filter('.expanded'),
                state = items.length > open.length;
            // pause http layer to combine GET requests
            http.pause();
            this.collection.each(function (model) {
                this.toggleMail(model.cid, state);
            }, this);
            http.resume();
        },

        toggleMail: function (cid, state) {
            var $li = this.$ul.children('[data-cid="' + cid + '"]'),
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

        show: function (cid) {
            // strip 'thread.' prefix
            cid = String(cid).replace(/^thread\.(.+)$/, '$1');
            // no change?
            if (this.model && this.model.cid === cid) return;
            // stop listening
            if (this.model) this.stopListening(this.model);
            // get model
            this.model = api.pool.get('detail').get(cid);
            if (!this.model) return;
            // listen for changes
            this.listenTo(this.model, 'change:thread', this.onChange);
            // reset collection
            this.collection.reset([], { silent: true });
            this.reset();
        },

        reset: function () {
            // has model?
            if (!this.model) return;
            // get thread items
            var thread = api.threads.get(this.model.cid);
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
                this.$ul.empty();
                this.$el.scrollTop(0);
            }

            this.updateHeader();

            this.$el.find('.thread-view-list').show();

            // draw thread list
            this.$ul.append(
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
            if (index < children.length) children.eq(index).before(li); else this.$ul.append(li);

            if (li.position().top <= 0) {
                this.$ul.scrollTop(this.$el.scrollTop() + li.outerHeight(true));
            }

            this.zIndex();
            this.updateHeader();
        },

        onRemove: function (model) {

            var li = this.$ul.find('li[data-cid="' + model.cid + '"]'),
                top = this.$ul.scrollTop();

            if (li.length === 0) return;

            if (li.position().top < top) {
                this.$ul.scrollTop(top - li.outerHeight(true));
            }

            li.remove();
            this.updateHeader();
        },

        onChange: function () {
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
            if (!e.shiftKey) return;
            switch (e.which) {
            case 38: // cursor up
                this.onNext(e);
                break;
            case 40: // cursor down
                this.onPrevious(e);
                break;
            }
        },

        initialize: function () {

            this.model = null;
            this.collection = new backbone.Collection();

            this.listenTo(this.collection, {
                add: this.onAdd,
                change: this.onChange,
                remove: this.onRemove,
                reset: this.onReset
            });

            this.$ul = $();

            this.$el.on('toggle', '.list-item', this.onToggle.bind(this));

            // enable drag & drop support
            dnd.enable({
                container: this.$el,
                draggable: true,
                selectable: '.detail-view-header',
                simple: true
            });
        },

        // return alls items of this list
        getItems: function () {
            return this.$ul.children('.list-item');
        },

        // render scaffold
        render: function () {
            ext.point('io.ox/mail/thread-view').invoke('draw', this);
            return this;
        },

        // render an email
        renderListItem: function (model) {
            var view = new detail.View({ tagName: 'li', data: model.toJSON(), disable: { 'io.ox/mail/detail': 'subject' } });
            return view.render().$el.attr({ role: 'listitem', tabindex: '1' });
        },

        // update zIndex for all list-items (descending)
        zIndex: function () {
            var items = this.getItems(), length = items.length;
            items.each(function (index) {
                $(this).css('zIndex', length - index);
            });
        }
    });

    return ThreadView;

});
