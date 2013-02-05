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

define('io.ox/files/settings/pane',
       ['settings!io.ox/files', 'io.ox/files/settings/model',
        'dot!io.ox/files/settings/form.html', 'io.ox/core/extensions',
        'gettext!io.ox/files/files'], function (settings, filesSettingsModel, tmpl, ext, gt) {

    'use strict';

    var filesSettings =  settings.createModel(filesSettingsModel),
        staticStrings =  {
            TITLE_FILES: gt('Files'),
            DEFAULT_VIEW: gt('Default view'),
            TITLE_MEDIAPLAYER: gt('Mediaplayer'),
            AUDIO_ENABLED: gt('Audio enabled'),
            VIDEO_ENABLED: gt('Video enabled')
        },
        optionsView = [{label: gt('Icon view'), value: 'icons'},
                       {label: gt('List view'), value: 'list'}],
        filesViewSettings;

    var FilesSettingsView = Backbone.View.extend({
        tagName: 'div',
        _modelBinder: undefined,
        initialize: function (options) {
            // create template
            this._modelBinder = new Backbone.ModelBinder();

        },
        render: function () {
            var self = this;
            self.$el.empty().append(tmpl.render('io.ox/files/settings', {
                strings: staticStrings,
                optionsViewDefault: optionsView
            }));

            var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
            self._modelBinder.bind(self.model, self.el, defaultBindings);

            return self;
        }
    });

    ext.point('io.ox/files/settings/detail').extend({
        index: 200,
        id: 'filessettings',
        draw: function (data) {

            filesViewSettings = new FilesSettingsView({model: filesSettings});
            var holder = $('<div>').css('max-width', '800px');
            this.append(holder.append(
                filesViewSettings.render().el)
            );
        },

        save: function () {
            filesViewSettings.model.save();
        }
    });

});
