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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/settings/pane',
        ['io.ox/core/extensions',
         'io.ox/backbone/basicModel',
         'io.ox/backbone/views',
         'io.ox/backbone/forms',
         'settings!io.ox/core',
         'gettext!io.ox/core/settings'],
         function (ext, BasicModel, views, forms, settings, gt) {
    
    'use strict';
    
    var point = views.point("io.ox/core/settings/entry"),
        SettingView = point.createView({ tagName: 'form', className: 'form-horizontal'}),
        reloadMe = ['language'];



    ext.point("io.ox/core/settings/detail").extend({
        index: 100,
        id: 'extensions',
        draw: function () {
            var model = settings.createModel(BasicModel);
            model.on('change', function (model, e) {
                settings.save().done(function () {
                    var showNotice = _(reloadMe).any(function (attr) {
                        return e.changes[attr];
                    });
                    if (showNotice) {
                        require("io.ox/core/notifications").yell("success", gt("The setting has been saved and will become active when you enter the application the next time."));
                    }
                }).fail(require("io.ox/core/notifications").yell);
            });
            new SettingView({model: model}).render().$el.appendTo(this);
        }
    });

    point.extend(new forms.SelectControlGroup({
        id: 'language',
        index: 100,
        attribute: 'language',
        label: gt("Language"),
        selectOptions: ox.serverConfig.languages
    }));




});