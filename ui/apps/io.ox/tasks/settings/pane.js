/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/tasks/settings/pane',
       ['settings!io.ox/tasks', 'io.ox/tasks/settings/model',
        'dot!io.ox/tasks/settings/form.html', 'io.ox/core/extensions',
        'gettext!io.ox/tasks/tasks'], function (settings, tasksSettingsModel, tmpl, ext, gt) {

    'use strict';




    var tasksSettings =  settings.createModel(tasksSettingsModel),
        staticStrings =  {},
        tasksViewSettings;

    var TasksSettingsView = Backbone.View.extend({
        tagName: "div",
        _modelBinder: undefined,
        initialize: function (options) {
            // create template
            this._modelBinder = new Backbone.ModelBinder();

        },
        render: function () {
            var self = this;
            self.$el.empty().append(tmpl.render('io.ox/tasks/settings', {
                strings: staticStrings
            }));

            var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
            self._modelBinder.bind(self.model, self.el, defaultBindings);

            return self;

        }
    });

    ext.point('io.ox/tasks/settings/detail').extend({
        index: 200,
        id: 'taskssettings',
        draw: function (data) {

            tasksViewSettings = new TasksSettingsView({model: tasksSettings});
            var holder = $('<div>').css('max-width', '800px');
            this.append(holder.append(
                    tasksViewSettings.render().el)
            );
        },

        save: function () {
//            console.log(calendarViewSettings.model);
            tasksViewSettings.model.save();
        }
    });

});
