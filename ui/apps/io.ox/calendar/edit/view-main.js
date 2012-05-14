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

define('io.ox/calendar/edit/view-main',
      ['io.ox/core/tk/view',
       'io.ox/core/tk/model',
       'io.ox/calendar/edit/view-common',
       'io.ox/calendar/edit/view-addparticipants',
       'io.ox/calendar/edit/view-participants',
       'io.ox/calendar/edit/collection-participants',
       'gettext!io.ox/calendar/edit/main',
       'less!io.ox/calendar/edit/style.css'], function (View, Model, CommonView, AddParticipantView, ParticipantsView, ParticipantsCollection, gt) {

    'use strict';

    var GRID_WIDTH = 330;
    var AppView = View.extend({
        initialize: function () {
            var self = this;

            self.el = ox.ui.createWindow({
                name: 'io.ox/calendar/edit',
                title: gt('Edit Appointment'),
                toolbar: true,
                search: false,
                close: true
            });
            self.el.addClass('io-ox-calendar-edit');
        },
        render: function () {
            var self = this;

            var container = self.el.nodes.main;

            var commonsModel = self.model; //just for easyness in the moment
            var commonsView = new CommonView({model: commonsModel});

            // should go into common view
            self.main = commonsView.render().el;

            //FIXME: quick hack
            self.scrollpane = $('<div>').css({ width: (GRID_WIDTH - 26) + 'px'}).addClass('leftside io-ox-calendar-edit-sidepanel');
            self.sidepanel = self.scrollpane.scrollable();

            var participantsCollection = new ParticipantsCollection(self.model.get('participants'));

            window.coll = participantsCollection;

            var enterParticipantView = new AddParticipantView({model: new Model()});
            var participantsView = new ParticipantsView({model: participantsCollection });

            enterParticipantView.on('select', function (evt, data) {
                //just a test
                console.log('data');
                console.log(data);
                participantsCollection.add([{type: 1, id: data.id }]);
            });

            self.sidepanel.empty()
                .append(enterParticipantView.render().el)
                .append(participantsView.render().el);

            container.empty().append(self.scrollpane, self.main);
            return self;
        }
    });

    return AppView;

});
