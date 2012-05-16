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
      ['io.ox/calendar/edit/deps/Backbone',
       'io.ox/calendar/edit/view-common',
       'io.ox/calendar/edit/view-addparticipants',
       'io.ox/calendar/edit/view-participants',
       'io.ox/calendar/edit/collection-participants',
       'gettext!io.ox/calendar/edit/main',
       'less!io.ox/calendar/edit/style.css'], function (Backbone, CommonView, AddParticipantView, ParticipantsView, ParticipantsCollection, gt) {

    'use strict';

    var GRID_WIDTH = 330;
    var AppView = Backbone.View.extend({
        _modelBinder: undefined,
        className: 'io-ox-calendar-edit',
        el: ox.ui.createWindow({
            name: 'io.ox/calendar/edit',
            title: gt('Edit Appointment'),
            toolbar: true,
            search: false,
            close: true
        }),
        initialize: function () {
            this._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {
            var self = this;

            var container = self.el.nodes.main;

            self.view = new CommonView({model: self.model});

            container.empty().append(self.view.render().el);

            return self;
        },

        // just another awkful but needed hack at the moment
        aftershow: function () {
            var self = this;
            var bindings = {
                title: '.window-title'
            };
            self._modelBinder.bind(self.model, $('.window-title').parent().get(), bindings);
        }
    });

    return AppView;

});
