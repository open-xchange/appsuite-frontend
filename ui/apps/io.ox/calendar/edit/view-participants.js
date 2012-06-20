/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/edit/view-participants',
      ['io.ox/core/extensions',
       'io.ox/calendar/edit/view-participant'], function (ext, ParticipantView) {

    'use strict';

    // just a collection of a participant view
    var ParticipantsView = Backbone.View.extend({
        tagName: 'div',
        className: 'edit-appointment-participants',
        _collectionBinder: undefined,
        events: {
            'click .person-link': 'onClickPersonLink',
            'click .remove': 'onClickRemove',
            'mouseover .remove': 'onMouseOverRemove',
            'mouseout .remove': 'onMouseOutRemove'
        },
        initialize: function (options) {
            window.parts = this.collection;
            console.log('init:', options);
            var viewCreator = function (model) {
                return new ParticipantView({model: model});
            };
            var elManagerFactory = new Backbone.CollectionBinder.ViewManagerFactory(viewCreator);
            this._collectionBinder = new Backbone.CollectionBinder(elManagerFactory);

            this._collectionBinder.on('elCreated', _.bind(this.updateCSS, this));
            this._collectionBinder.on('elRemoved', _.bind(this.updateCSS, this));
        },
        render: function () {
            this.$el.empty();
            this._collectionBinder.bind(this.collection, this.$el);
            return this;
        },
        updateCSS: function () {
            console.log('update css');
            this.$el.find(':nth-child(even)').removeClass('odd').addClass('even');
            this.$el.find(':nth-child(odd)').removeClass('even').addClass('odd');
        },
        onAdd: function (model) {
            this.collection.add(model);
        },

        onClickRemove: function (evt) {
            var self = this,
                item = $(evt.target).parents('.edit-appointment-participant').get(0),
                itemid = $(item).attr('data-cid');

            self.collection.remove(self.collection.getByCid(itemid));
        },
        onMouseOverRemove: function (e) {
            $(e.target).find('i').addClass('icon-white');
        },
        onMouseOutRemove: function (e) {
            $(e.target).find('i').removeClass('icon-white');
        },

        onClickPersonLink: function (evt) {
            var self = this,
                item = $(evt.target).parents('.edit-appointment-participant').get(0),
                itemid = $(item).attr('data-cid');

            var obj = self.collection.getByCid(itemid);

            if (obj.get('type') !== 5) { // no external
                evt.data = {id: obj.get('id'), email1: obj.get('email1')};
            } else {
                evt.data = {email1: obj.get('email1'), display_name: obj.get('display_name')};
            }
            ext.point('io.ox/core/person:action').each(function (ext) {
                _.call(ext.action, evt.data, evt);
            });
        }
    });

    return ParticipantsView;
});
