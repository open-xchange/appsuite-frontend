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
     'io.ox/core/api/backbone',
     'gettext!io.ox/mail',
     'io.ox/mail/listview'], function (ext, api, util, detail, backbone, gt) {

    'use strict';

    var ThreadView = Backbone.View.extend({

        tagName: 'div',
        className: 'thread-view-control abs',
        scaffold: $('<li class="list-item">'),

        events: {
            'click .list-item': 'onClick',
            'click .overview a': 'onOverview',
            'click .previous-mail': 'onPrevious',
            'click .next-mail': 'onNext',
        },

        empty: function () {
            this.$ul.empty().scrollTop(0).show();
            this.$el.find('.detail-view-container').hide();
            this.$el.find('.detail-view').empty();
        },

        toggleDetailView: function (state) {
            this.$el.find('.detail-view-container').toggle(state);
            this.$ul.toggle(!state);
        },

        showOverview: function () {
            this.toggleDetailView(false);
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
            $detail.empty().busy();
            api.get(_.cid(cid)).done(function (data) {
                $detail.idle();
                $detail.append(detail.draw(data));
            });
        },

        onReset: function () {

            this.empty();
            this.index = 0;
            // draw detail view?
            if (this.collection.length === 1) this.showMail(this.collection.at(0).cid);
            // draw thread list
            this.$ul.append(
                this.collection.map(this.renderListItem, this)
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
            this.$el.append(
                 this.$ul = $('<ul class="thread-view list-view mail abs">'),
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
            return this;
        },

        renderListItem: function (model) {
            var li = this.scaffold.clone(),
                data = model.toJSON(),
                baton = new ext.Baton({ data: data });
            // add cid and full data
            li.attr('data-cid', _.cid(data));
            ext.point('io.ox/mail/listview/item').invoke('draw', li, baton);
            return li;
        },
    });

    return ThreadView;

});
