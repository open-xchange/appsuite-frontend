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

define('io.ox/calendar/edit/view-app',
      ['io.ox/calendar/edit/view-main',
       'gettext!io.ox/calendar/edit/main',
       'less!io.ox/calendar/edit/style.less'], function (MainView, gt) {

    'use strict';

    var AppView = Backbone.View.extend({
        _modelBinder: undefined,
        subviews: {},
        initialize: function () {
            this._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {
            var self = this;
            self.appwindow = ox.ui.createWindow({
                name: 'io.ox/calendar/edit',
                title: gt('Edit Appointment'),
                toolbar: true,
                search: false,
                close: true
            });

            self.el = self.appwindow.nodes.main[0];

            self.subviews.common = new MainView({model: self.model});
            self.subviews.common.on('save', function () {
                self.trigger('save'); //just bubble manually
            });
            $(self.el).empty().append(self.subviews.common.render().el);


            return self;
        },

        // just another awkful but needed hack at the moment
        aftershow: function () {
            var self = this;
            var bindings = {
                title: '.window-title'
            };
            // updates the title on change
            self._modelBinder.bind(self.model, $('.window-title').parent().get(), bindings);
            // now focus on title
            $('#' + self.subviews.common.guid + '_title').get(0).focus();
        }
    });
    return AppView;
});
