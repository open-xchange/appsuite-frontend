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
        events: {
            'click .person-link': 'onClickPersonLink',
            'click .remove': 'onClickRemove'
        },
        initialize: function (options) {
            var self = this;
            self._participantViews = [];

            self.collection.on('reset', _.bind(self.render, self));
            self.collection.on('add', _.bind(self.onAdd, self));
            self.collection.on('remove', _.bind(self.onRemove, self));

            self.collection.each(function (participant) {
                self._participantViews.push(new ParticipantView({model: participant}));
            });
        },
        render: function () {
            var self = this;
            self.list = $('<ul>'); //.addClass('edit-appointment-participantslist');
            self.$el.empty().append(self.list);
            _(self._participantViews).each(function (participantView) {
                self.list.append(participantView.render().el);
            });
            return self;
        },
        onAdd: function (model) {
            var self = this;
            var myview = new ParticipantView({model: model});
            self._participantViews.push(myview);
            self.list.append(myview.render().el);
        },
        onRemove: function (model, collection, options) {
            var self = this;
            // find view
            // tear down model of view
            // tear down view
            // remove artifacts
            self.$el.find('[data-cid=' + model.cid + ']').remove();
        },

        onClickRemove: function (evt) {
            var self = this,
                item = $(evt.target).parents('.edit-appointment-participant').get(0),
                itemid = $(item).attr('data-cid');

            self.collection.remove(self.collection.getByCid(itemid));
        },

        onClickPersonLink: function (evt) {
            var self = this,
                item = $(evt.target).parents('.edit-appointment-participant').get(0),
                itemid = $(item).attr('data-cid');

            var obj = self.collection.getByCid(itemid);

            evt.data = {id: obj.get('id'), email1: obj.get('email1')};
            ext.point('io.ox/core/person:action').each(function (ext) {
                _.call(ext.action, evt.data, evt);
            });
        }
    });

    return ParticipantsView;
});
