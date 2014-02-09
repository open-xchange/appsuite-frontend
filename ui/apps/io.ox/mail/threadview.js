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
        id: 'thread-view-list',
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
                        $('<a href="#" class="next-mail" tabindex="1">').append('<i class="icon-chevron-up">'),
                        $('<a href="#" class="previous-mail" tabindex="1">').append('<i class="icon-chevron-down">')
                    )
                ),
                $('<div class="thread-view-list abs">').hide().append(
                    $('<h1>'),
                    this.$ul = $('<ul class="thread-view list-view mail f6-target" role="listbox">')
                )
            );
        }
    });

    ext.point('io.ox/mail/thread-view').extend({
        id: 'detail-view',
        index: 200,
        draw: function () {
            this.$el.append(
                $('<div class="detail-view-container abs">').hide().append(
                    $('<nav class="thread-view-navigation">').append(
                        $('<div class="button">').append(
                            $('<a href="#" class="show-overview" tabindex="1">').append(
                                $('<i class="icon-chevron-left">'), $.txt(' '), $.txt(gt('Overview'))
                            )
                        ),
                        $('<div class="position">'),
                        $('<div class="prev-next">').append(
                            $('<a href="#" class="next-mail" tabindex="1">').append('<i class="icon-chevron-up">'),
                            $('<a href="#" class="previous-mail" tabindex="1">').append('<i class="icon-chevron-down">')
                        )
                    ),
                    $('<div class="detail-view abs" tabindex="1">')
                )
            );
        }
    });

    var ThreadView = Backbone.View.extend({

        tagName: 'div',
        className: 'thread-view-control abs',

        events: {
            'click .button a.back': 'onBack',
            'click .button a.show-overview': 'onOverview',
            'click .thread-view-navigation .previous-mail': 'onPrevious',
            'click .thread-view-navigation .next-mail': 'onNext',
            'keydown': 'onKeydown'
        },

        empty: function () {
            this.$ul.empty().scrollTop(0);
            this.$el.find('.thread-view-list').hide();
            this.$el.find('.detail-view-container').hide();
            this.$el.find('.detail-view').empty();
        },

        toggleDetailView: function (state) {
            this.$el.find('.detail-view-container').toggle(state);
            this.$el.find('.thread-view-list').toggle(!state);
            this.updateNavigation();
        },

        showOverview: function () {
            this.toggleDetailView(false);
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

        updatePosition: function (cid) {
            var model = this.collection.get(cid),
                length = this.collection.length;
            this.index = this.collection.indexOf(model);
            // update text
            this.$el.find('.position').text(
                gt('%1$d of %2$d', length - this.index, length)
            );
            // update controls
            this.$el.find('.previous-mail').toggleClass('disabled', this.index + 1 === length);
            this.$el.find('.next-mail').toggleClass('disabled', this.index === 0);
        },

        updateNavigation: function () {

            var multiple = this.collection.length > 1,
                inDetailView = this.$el.find('.detail-view-container:visible').length,
                inListMode = this.app.props.get('preview') === 'none',
                $el = this.$el;

            function update(back, thread) {
                $el.toggleClass('back-navigation-visible', back);
                $el.toggleClass('thread-view-navigation-visible', thread);
            }

            // show thread navigation?
            if (multiple && inDetailView) update(false, true);
                else if (inListMode) update(true, false);
                else update(false, false);
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
            if (list.length > 1) list = _(list).filter(this.filter);
            // get models
            list = _(list).map(function (obj) { return new backbone.Model(obj); });
            // prepare to compare current state with new collection
            var a = _(list).pluck('cid').sort(),
                b = _(this.collection.models).pluck('cid').sort();
            // need to check navigation even if nothing changed
            this.updateNavigation();
            // avoid unnecessary repaints
            if (_.isEqual(a, b)) return;
            // reset collection
            this.collection.reset(list);
        },

        onReset: function () {

            this.empty();
            this.index = 0;

            if (this.collection.length === 0) return;

            this.updateHeader();

            if (this.collection.length > 0) this.$el.find('.thread-view-list').show();

            this.updateNavigation();

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
            this.$el.closest('.preview-visible').removeClass('preview-visible');
        },

        onPrevious: function (e) {
            e.preventDefault();
            var model = this.collection.at(this.index + 1);
            if (model) this.showMail(model.cid);
        },

        onNext: function (e) {
            e.preventDefault();
            var model = this.collection.at(this.index - 1);
            if (model) this.showMail(model.cid);
        },

        onOverview: function (e) {
            e.preventDefault();
            this.showOverview();
        },

        onClick: function (e) {
            var cid = $(e.currentTarget).attr('data-cid');
            this.showMail(cid);
        },

        onKeydown: function (e) {
            if (!e.shiftKey) return;
            switch (e.which) {
            case 37: // cursor left
                this.showOverview(e);
                break;
            case 38: // cursor up
                this.onNext(e);
                break;
            case 40: // cursor down
                this.onPrevious(e);
                break;
            }
        },

        initialize: function (options) {

            this.collection = new backbone.Collection();
            this.app = options.app;

            this.listenTo(this.collection, {
                add: this.onAdd,
                change: this.onChange,
                remove: this.onRemove,
                reset: this.onReset
            });

            this.listenTo(this.app.props, 'change:preview', this.updateNavigation);

            this.$ul = $();
            this.$detail = $();
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
