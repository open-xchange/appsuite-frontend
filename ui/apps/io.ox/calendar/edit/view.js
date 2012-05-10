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

define('io.ox/calendar/edit/view',
      ['io.ox/core/tk/view',
       'gettext!io.ox/calendar/edit/main'], function (View, gt) {
    'use strict';

    var app;


    var EditCommonView = View.extend({
        render: function (app) {

        }
    });

    var EditParticipantsViewItem = View.extend({
        render: function () {

        }
    });

    var EditParticipants = View.extend({
        render: function () {

        }
    });

    var EditView = View.extend({
        GRID_WIDTH: 330,
        render: function (app) {
            var self = this;
            app = app;

            console.log('THIS GRID_WIDTH:' + self.GRID_WIDTH);

            self.el = $('<div>');

            self.main = $('<div>').addClass('rightside').css({left: self.GRID_WIDTH + 'px'});

            window.mymodel = this.model;


            self.main.append(
                self.createLabel({id: 'edit_title', text: gt('Title')}),
                self.createTextField({id: 'edit_title', property: 'title', classes: 'input-large'}),

                self.createLabel({id: 'edit_location', text: gt('Location')}),
                self.createTextField({id: 'edit_location', property: 'location', classes: 'input-large'}),

                self.createLabel({id: 'edit_startdate', text: gt('Start at')}),
                self.createDateField({id: 'edit_startdate', property: 'start_date', classes: 'input-large'}),

                self.createLabel({id: 'edit_enddate', text: gt('Ends at')}),
                self.createDateField({id: 'edit_enddate', property: 'end_date', classes: 'input-large'}),

                self.createLabel({id: 'edit_note', text: gt('Note')}),
                self.createTextArea({id: 'edit_note', property: 'note'})
            );

            self.scrollpane = $('<div>').css({ width: (self.GRID_WIDTH - 26) + 'px'}).addClass('leftside io-ox-calendar-edit-sidepanel');
            self.sidepanel = self.scrollpane.scrollable();

            self.sidepanel.append(
                self.createParticipantList()
            );

            self.growl = $('<div>', {id: 'myGrowl'})
                .addClass('jGrowl').css({position: 'absolute', right: '-275px', top: '-10px'});

            self.el.append(self.main, self.scrollpane, self.growl);
            return self;
        },

        createParticipantList: function () {
            var self = this,
                participants = self.model.get('participants'),
                el = $('<div>').addClass('edit-appointment-participantlist');

            _.each(participants, function (participant) {
            });
            console.log(participants);
            return el;
        },
        drawContact: function (id, node, data) {

        },
        drawAutoCompleteItem: function (node, data, query) {

        },
        addParticipant: function (participant) {

        }
    });

    return EditView;
});
