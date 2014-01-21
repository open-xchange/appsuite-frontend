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
    ['io.ox/core/extensions',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/mail/view-detail',
     'io.ox/mail/inplace-reply',
     'io.ox/core/api/backbone',
     'gettext!io.ox/mail',
     'io.ox/mail/listview'], function (ext, api, util, detail, InplaceReply, backbone, gt) {

    'use strict';

    ext.point('io.ox/mail/thread-view').extend({
        id: 'thread-view-list',
        index: 100,
        draw: function () {
            this.$el.append(
                $('<div class="thread-view-list abs">').append(
                    $('<header>'),
                    this.$ul = $('<ul class="thread-view list-view mail">'),
                    $('<footer>').append(
                        $('<label class="checkbox">').append(
                            $('<input type="checkbox" name="auto-select">'),
                            $.txt('Automatically select oldest unread message or most recent message')
                        )
                    )
                )
            );
        }
    });

    ext.point('io.ox/mail/thread-view').extend({
        id: 'detail-view',
        index: 200,
        draw: function () {
            this.$el.append(
                $('<div class="detail-view-container abs">').append(
                    $('<nav class="thread-view-navigation">').append(
                        $('<div class="overview">').append(
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
        scaffold: $('<li class="list-item">'),

        events: {
            'click .list-item': 'onClick',
            'click .overview a': 'onOverview',
            'click .previous-mail': 'onPrevious',
            'click .next-mail': 'onNext',
            'keydown': 'onKeydown'
        },

        empty: function () {
            this.$ul.empty().scrollTop(0);
            this.$el.find('.thread-view-list').show();
            this.$el.find('.thread-view-list header').hide();
            this.$el.find('.thread-view-list footer').hide();
            this.$el.find('.detail-view-container').hide();
            this.$el.find('.detail-view').empty();
        },

        toggleDetailView: function (state) {
            this.$el.find('.detail-view-container').toggle(state);
            this.$el.find('.thread-view-list').toggle(!state);
        },

        showOverview: function () {
            this.toggleDetailView(false);
        },

        updateHeader: function () {
            this.$el.find('.thread-view-list header').empty().show().append(
                $('<div class="subject">').text(util.getSubject(this.collection.at(0).toJSON())),
                $('<div class="summary">').text(gt('%1$d messages in this conversation', this.collection.length))
            );
        },

        updateFooter: function () {
            this.$el.find('.thread-view-list footer').show();
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

        showMail: function (cid) {

            var $detail = this.$el.find('.detail-view');

            // show navigation?
            $detail.parent().toggleClass('navigation-visible', this.collection.length > 1);

            // update position
            this.updatePosition(cid);

            this.toggleDetailView(true);
            $detail.empty().scrollTop(0).busy();
            api.get(_.cid(cid)).done(function (data) {
                $detail.idle();
                var inplace = new InplaceReply({ cid: cid }).render().$el,
                    message = detail.draw(data);
                $detail.append(inplace, message);
                $detail.scrollTop(message.position().top);
            });
        },

        autoSelectMail: function () {
            for (var i = this.collection.length - 1, model; model = this.collection.at(i); i--) {
                // most recent or first unseen?
                if (i === 0 || util.isUnseen(model.toJSON())) { this.showMail(model.cid); break; }
            }
        },

        filter: function (data) {
            return !util.isDeleted(data);
        },

        reset: function (list) {
            var filtered = _(list)
                    .chain()
                    .filter(this.filter)
                    .map(function (obj) { return new backbone.Model(obj); })
                    .value(),
                a = _(filtered).pluck('cid').sort(),
                b = _(this.collection.models).pluck('cid').sort();
            // avoid unnecessary repaints
            if (_.isEqual(a, b)) return;
            // reset collection
            this.collection.reset(filtered);
        },

        onReset: function () {

            this.empty();
            this.index = 0;
            this.updateHeader();
            this.updateFooter();

            // draw detail view?
            if (this.collection.length === 1 || this.$el.find('[name="auto-select"]').prop('checked')) this.autoSelectMail();

            // draw thread list
            this.$ul.append(
                this.collection.chain().filter(this.filter).map(this.renderListItem, this).value()
            );
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
            var li = this.scaffold.clone(),
                baton = new ext.Baton({ data: model.toJSON(), app: this.app });
            // add cid and full data
            li.attr('data-cid', model.cid);
            ext.point('io.ox/mail/listview/item').invoke('draw', li, baton);
            return li;
        },
    });

    return ThreadView;

});
