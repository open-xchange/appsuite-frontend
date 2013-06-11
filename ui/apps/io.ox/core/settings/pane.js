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
         'io.ox/core/capabilities',
         'plugins/portal/userSettings/register',
         'settings!io.ox/core',
         'gettext!io.ox/core'],
         function (ext, BasicModel, views, forms, http, appAPI, capabilities, userSettings, settings, gt) {

    'use strict';

    var point = views.point("io.ox/core/settings/entry"),
        SettingView = point.createView({ tagName: 'form', className: 'form-horizontal'}),
        reloadMe = ['language', 'timezone', 'theme', 'refreshInterval', 'autoOpenNotification'];

    ext.point("io.ox/core/settings/detail").extend({
        index: 50,
        id: 'extensions',
        draw: function () {
            var model = settings.createModel(BasicModel);
            model.on('change', function (model, e) {
                settings.save();
                var showNotice = _(reloadMe).any(function (attr) {
                    return model.changed[attr];
                });

                if (model.changed.autoOpenNotification) {//AutonOpenNotification updates directly
                    require("io.ox/core/notifications").yell("success", gt("The setting has been saved."));
                } else if (showNotice) {
                    require("io.ox/core/notifications").yell("success", gt("The setting has been saved and will become active when you enter the application the next time."));
                }
            });
            this.addClass('settings-container').append(
                $('<h1>').text(gt("Basic settings"))
            );
            new SettingView({model: model}).render().$el.appendTo(this);
        }
    });

    if (capabilities.has('edit_password')) {
        point.basicExtend({
            id: 'change-password',
            index: 'last',
            draw: function () {
                this.append(
                    $('<div class="control-group">').append(
                        $('<div class="controls">').append(
                            $('<a class="btn">').text(gt('Change password'))
                            .on('click', userSettings.changePassword)
                        )
                    )
                );
            }
        });
    }

    point.extend(new forms.SelectControlGroup({
        id: 'language',
        index: 100,
        attribute: 'language',
        label: gt("Language"),
        selectOptions: ox.serverConfig.languages || {},
        updateModel: function () {
            var value = this.nodes.element.val();
            this.model.set(this.attribute, value, {validate: true});
            _.setCookie('language', value);
        }
    }));

    http.GET({
        module: 'jslob',
        params: {
            action: 'get',
            id: 'io.ox/core/settingOptions'
        }
    }).done(function (settingOptions) {
        // Timezones
        var available = settingOptions.tree.availableTimeZones,
            technicalNames = _(available).keys(),
            userTZ = settings.get('timezone', 'UTC'),
            sorted = {};

        // Sort the technical names by the alphabetic position of their values
        technicalNames.sort(function (a, b) {
            var va = available[a],
                vb = available[b];
            return va === vb ? 0 : va < vb ? -1 : 1;
        });

        // filter double entries and sum up results in 'sorted' array
        for (var i = 0; i < technicalNames.length; i++) {
            var key = technicalNames[i],
                key2 = technicalNames[i + 1];
            if (key2 && available[key] === available[key2]) {
                if (key2 === userTZ) {
                    sorted[key2] = available[key2];
                } else {
                    sorted[key] = available[key];
                }
                i++;
            } else {
                sorted[key] = available[key];
            }
        }

        point.extend(new forms.SelectControlGroup({
            id: 'timezones',
            index: 200,
            attribute: 'timezone',
            label: gt("Timezone"),
            selectOptions: sorted
        }));

        // Themes
        var availableThemes = settingOptions.tree.themes;

        //  until we get translated themes from backend
        if (settingOptions.tree.themes['default']) {
            settingOptions.tree.themes['default'] = gt('Default Theme');
        }


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
        var options = {};

        options.never = gt("Never");
        options.noEmail = gt("On new notifications except mails");
        options.always = gt("On every new notification");

        if (settings.isConfigurable('autoOpenNotificationarea')) {
            point.extend(new forms.SelectControlGroup({
                id: 'autoOpenNotfication',
                index: 700,
                attribute: 'autoOpenNotification',
                label: gt("Automatic opening of notification area"),
                selectOptions: options
            }));
        }
    }());

    // Auto Logout

    (function () {
        var MINUTES = 60000,
            options = {};

        options[0] = gt("Off");
        options[5 * MINUTES] = gt("5 minutes");
        options[10 * MINUTES] = gt("10 minutes");
        options[15 * MINUTES] = gt("15 minutes");
        options[30 * MINUTES] = gt("30 minutes");

        point.extend(new forms.SelectControlGroup({
            id: 'autoLogout',
            index: 600,
            attribute: 'autoLogout',
            label: gt("Auto Logout"),
            selectOptions: options,
            updateModel: function () {
                this.setValueInModel(this.nodes.element.val());
                ox.autoLogoutRestart();
            }
        }));


    }());

    // point.basicExtend({
    //     id: 'clearCache',
    //     index: 200000,
    //     draw: function () {
    //         this.append(
    //             $('<button class="btn">').text(gt("Clear cache")).on("click", function (e) {
    //                 e.preventDefault();
    //                 require(["io.ox/core/cache"], function () {
    //                     ox.cache.clear();
    //                 });
    //             })
    //         );
    //     }
    // });
});
