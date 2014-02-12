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
     'gettext!io.ox/mail',
     'io.ox/mail/listview'], function (extensions, ext, api, util, backbone, detail, gt) {

    'use strict';

    ext.point('io.ox/mail/thread-view').extend({
        id: 'navigation',
        index: 100,
        draw: function () {
            this.$el.append(
                $('<nav class="back-navigation">').append(
                    $('<div class="button">').append(
                        $('<a href="#" class="back" tabindex="1">').append(
                            $('<i class="icon-chevron-left">'), $.txt(' '), $.txt(gt('Back'))
                        )
                    ),
                    $('<div class="position">'),
                    $('<div class="prev-next">').append(
                        $('<a href="#" class="previous-mail" tabindex="1">').append('<i class="icon-chevron-up">'),
                        $('<a href="#" class="next-mail" tabindex="1">').append('<i class="icon-chevron-down">')
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
                $('<div class="thread-view-list abs">').hide().append(
                    $('<h1>'),
                    this.$ul = $('<ul class="thread-view list-view mail f6-target" role="listbox">')
                )
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
            'keydown': 'onKeydown'
        },

        empty: function () {
            this.$ul.empty();
            this.$el.scrollTop(0);
            this.$el.find('.thread-view-list').hide();
        },

        updateHeader: function () {
            var subject = util.getSubject(this.collection.at(0).toJSON());
            this.$el.find('.thread-view-list > h1').empty().append(
                // subject
                $('<div class="subject">').text(subject),
                // summary
                this.collection.length > 1 ?
                    $('<div class="summary">').text(gt('%1$d messages in this conversation', this.collection.length)) : []
            );
        },

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

        filter: function (data) {
            return !util.isDeleted(data);
        },

        reset: function (list) {
            // only filter conversations / single deleted messages are problematic otherwise
            var copy = list.length > 1 ? _(list).filter(this.filter) : list;
            // all filtered?
            if (copy.length === 0) copy = list;
            // get models
            copy = _(copy).map(function (obj) { return new backbone.Model(obj); });
            // prepare to compare current state with new collection
            var a = _(copy).pluck('cid').sort(),
                b = _(this.collection.models).pluck('cid').sort();
            // avoid unnecessary repaints
            if (_.isEqual(a, b)) return;
            // reset collection
            this.collection.reset(copy);
        },

        onReset: function () {

            this.empty();
            this.index = 0;

            if (this.collection.length === 0) return;

            this.updateHeader();

            this.$el.find('.thread-view-list').show();

            // draw thread list
            this.$ul.append(
                this.collection.chain().filter(this.filter).map(this.renderListItem, this).value()
            );

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
        },

        onRemove: function (model) {

            var li = this.$ul.find('li[data-cid="' + model.cid + '"]'),
                top = this.$ul.scrollTop();

            if (li.length === 0) return;

            if (li.position().top < top) {
                this.$ul.scrollTop(top - li.outerHeight(true));
            }

            li.remove();
        },

        // called whenever a model inside the collection changes
        onChange: function (/* model */) {
            // var li = this.$el.find('li[data-cid="' + model.cid + '"]'),
            //     data = model.toJSON();
            // // DRAW!
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

            this.collection = new backbone.Collection();

            this.listenTo(this.collection, {
                add: this.onAdd,
                change: this.onChange,
                remove: this.onRemove,
                reset: this.onReset
            });

            this.$ul = $();
        },

        // return alls items of this list
        getItems: function () {
            return this.$ul.children('.list-item');
        },

        render: function () {
            ext.point('io.ox/mail/thread-view').invoke('draw', this);
            return this;
        },

        renderListItem: function (model) {
            var view = new detail.View({ data: model.toJSON(), app: this.app });
            return view.render().$el;
        },
    });

    return ThreadView;

});
