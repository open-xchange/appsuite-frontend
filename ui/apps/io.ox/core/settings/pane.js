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
         'io.ox/core/http',
         'io.ox/core/api/apps',
         'settings!io.ox/core',
         'gettext!io.ox/core'],
         function (ext, BasicModel, views, forms, http, appAPI, settings, gt) {

    'use strict';

    var point = views.point("io.ox/core/settings/entry"),
        SettingView = point.createView({ tagName: 'form', className: 'form-horizontal'}),
        reloadMe = ['language', 'timezone', 'theme', 'refreshInterval', 'autoOpenNotification'];



    ext.point("io.ox/core/settings/detail").extend({
        index: 100,
        id: 'extensions',
        draw: function () {
            var model = settings.createModel(BasicModel);
            model.on('change', function (model, e) {
                settings.save();
                var showNotice = _(reloadMe).any(function (attr) {
                    return e.changes[attr];
                });

                if (e.changes.autoOpenNotification) {//AutonOpenNotification updates directly
                    require("io.ox/core/notifications").yell("success", gt("The setting has been saved."));
                } else if (showNotice) {
                    require("io.ox/core/notifications").yell("success", gt("The setting has been saved and will become active when you enter the application the next time."));
                }
            });
            this.append(
                $('<div class="clear-title">').text(gt("Basic settings")),
                $('<div class="settings sectiondelimiter">')
            );
            new SettingView({model: model}).render().$el.appendTo(this);
        }
    });

    point.extend(new forms.SelectControlGroup({
        id: 'language',
        index: 100,
        attribute: 'language',
        label: gt("Language"),
        selectOptions: ox.serverConfig.languages || {}
    }));

    http.GET({
        module: 'jslob',
        params: {
            action: 'get',
            id: 'io.ox/core/settingOptions'
        }
    }).done(function (settingOptions) {
        // Timezones
        var available = settingOptions.tree.availableTimeZones;

        // Sort the technical names by the alphabetic position of their
        // values

        var technicalNames = _(available).keys();
        technicalNames.sort(function (a, b) {
            var va = available[a];
            var vb = available[b];
            return va === vb ? 0 : va < vb ? -1 : 1;
        });

        var sorted = {};
        _(technicalNames).each(function (key) {
            sorted[key] = available[key];
        });


        point.extend(new forms.SelectControlGroup({
            id: 'timezones',
            index: 200,
            attribute: 'timezone',
            label: gt("Timezone"),
            selectOptions: sorted
        }));

        // Themes
        var availableThemes = settingOptions.tree.themes;

        if (!_(availableThemes).isEmpty() && settings.isConfigurable('theme')) {
            point.extend(new forms.SelectControlGroup({
                id: 'theme',
                index: 400,
                attribute: 'theme',
                label: gt("Theme"),
                selectOptions: availableThemes
            }));
        }

    });

    (function () {
        if (settings.isConfigurable('refreshInterval')) {
            var MINUTES = 60000;
            var options = {};

            options[5 * MINUTES] = gt("5 minutes");
            options[10 * MINUTES] = gt("10 minutes");
            options[15 * MINUTES] = gt("15 minutes");
            options[30 * MINUTES] = gt("30 minutes");


            point.extend(new forms.SelectControlGroup({
                id: 'refreshInterval',
                index: 300,
                attribute: 'refreshInterval',
                label: gt("Refresh interval"),
                selectOptions: options
            }));
        }
    }());

    // Auto Start App

    (function () {
        if (settings.isConfigurable('autoStart')) {
            var options = {};
            _(appAPI.getFavorites()).each(function (app) {
                options[app.path] = gt(app.title);
            });

            options.none = gt('None');
            point.extend(new forms.SelectControlGroup({
                id: 'autoStart',
                index: 500,
                attribute: 'autoStart',
                label: gt("Default App after login?"),
                selectOptions: options
            }));
        }
    }());

    // Auto open notification area
    (function () {
        if (settings.isConfigurable('autoOpenNotificationarea')) {
            point.extend(new forms.ControlGroup({
                id: 'autoOpenNotfication',
                index: 600,
                attribute: 'autoOpenNotification',
                label: gt("Automatic opening of notification area on new notifications."),
                control: $('<input type="checkbox">'),
                updateElement: function () {
                    var value = this.model.get(this.attribute);
                    if (value) {
                        value = 'checked';
                    } else {
                        value = undefined;
                    }
                    this.nodes.element.attr('checked', value);
                },
                updateModel: function () {
                    var value = this.nodes.element.attr('checked');
                    if (value) {
                        value = true;
                    } else {
                        value = false;
                    }
                    this.model.set(this.attribute, value);
                }
            }));
        }
    }());

});
