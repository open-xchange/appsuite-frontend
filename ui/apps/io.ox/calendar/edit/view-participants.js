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
       'io.ox/core/tk/view',
       'io.ox/calendar/edit/view-participant'], function (ext, View, ParticipantView) {

    'use strict';
    var fnClickPerson = function (e) {
        ext.point('io.ox/core/person:action').each(function (ext) {
            _.call(ext.action, e.data, e);
        });
    };


    // just a collection of a participant view
    var ParticipantsView = View.extend({
        initialize: function () {
            var self = this;
            self.el = $('<div>').addClass('edit-appointment-participants');
            self.model.on('change', _.bind(self.render, self));
            self.model.on('add', _.bind(self.onAdd, self));
            self.model.on('remove', _.bind(self.onRemove, self));

            $(self.el).on('click', _.bind(self.click, self));
        },
        render: function () {
            var self = this;
            self.list = $('<ul>'); //.addClass('edit-appointment-participantslist');

            self.model.each(function (participant) {
                self.add(participant);
            });

            self.el.empty().append(self.list);

            return self;
        },
        add: function (participantModel) {
            var self = this;
            var myview = new ParticipantView({model: participantModel});
            participantModel.fetch(participantModel.get())
                .done(function () {
                    self.list.append(
                        myview.render().el
                    );
                });

        },
        onAdd: function (evt, model) {
            var self = this;
            self.add(model);
        },
        onRemove: function (evt, model, collection, options) {
            var self = this;
            $(self.el).find('[data-cid=' + model.cid + ']').remove();
        },
        click: function (evt) {
            var self = this,
                item = $(evt.target).parents('.edit-appointment-participant').get(0),
                itemid = $(item).attr('data-cid');

            if ($(evt.target).parent().hasClass('remove')) {
                console.log('click:' + itemid);
                console.log(item);
                self.model.remove(self.model.getByCid(itemid));
                console.log('click');
                console.log(arguments);
            }

            if ($(evt.target).hasClass('person-link')) {
                var obj = self.model.getByCid(itemid).get();
                console.log(obj);
                evt.data = {id: obj.id, email1: obj.email1};
                fnClickPerson(evt);

                console.log('hit halo now');
            }
        }
    });

    return ParticipantsView;
});
