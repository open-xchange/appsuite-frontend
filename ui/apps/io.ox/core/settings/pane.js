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
         'io.ox/core/date',
         'io.ox/core/api/apps',
         'settings!io.ox/core',
         'gettext!io.ox/core'],
         function (ext, BasicModel, views, forms, http, date, appAPI, settings, gt) {

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
            this.addClass('settings-container').append(
                $('<h1>').text(gt("Basic settings"))
            );
            new SettingView({model: model}).render().$el.appendTo(this);
        }
    });

    point.extend(new forms.SelectControlGroup({
        id: 'language',
        index: 100,
        attribute: 'language',
        label: gt("Language"),
        selectOptions: ox.serverConfig.languages || {},
        updateModel: function () {
            var value = this.nodes.element.val();
            this.model.set(this.attribute, value);
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

    var ErrorLogView = Backbone.View.extend({

        tagName: 'ul',
        className: 'error-log',

        initialize: function () {
            this.collection = http.log();
            this.collection.on('add', this.renderError, this);
        },

        render: function () {
            // clear
            this.$el.empty();
            // empty?
            if (this.collection.isEmpty()) {
                this.$el.append(
                    $('<li class="empty">').text(gt('No errors to report'))
                );
            } else {
                this.collection.each(this.renderError, this);
            }
            return this;
        },

        getSummary: function () {
            return [
                gt('Date') + ': ' + (new date.Local()).format(date.DATE_TIME),
                gt('Host') + ': ' + location.href,
                gt('UI version') + ': ' + ox.serverConfig.version,
                gt('Server version') + ': ' + ox.serverConfig.serverVersion,
                gt('Browser') + ': ' + navigator.userAgent
            ].join(', ');
        },

        renderSummary: function () {
            this.$el.append(
                $('<li class="summary">').append(
                    $('<div>').text(this.getSummary())
                )
            );
        },

        getMessage: function (model) {
            return model.get('error');
        },

        getID: function (model) {
            var id = model.get('error_id'), code = model.get('code');
            return !id ? '' : '(ID: ' + id + (code ? ' / ' + code : '') + ')';
        },

        getStrackTrace: function (model) {
            var stack = model.get('error_stack');
            return _.isArray(stack) ? stack[0] + ' ...' : '';
        },

        renderError: function (model) {
            var length = this.collection.length;
            if (length === 1) {
                this.$el.find('.empty').remove();
                this.renderSummary();
            }
            this.$el.append(
                $('<li class="error">').append(
                    $('<div class="message">').append(
                        $('<b>').text(this.getMessage(model)), $.txt(' '),
                        $('<span class="error-id">').text(this.getID(model))
                    ),
                    $('<div class="url">').text(model.get('url')),
                    $('<div class="stack-trace">').text(this.getStrackTrace(model))
                )
            );
        }
    });

    var log = new ErrorLogView();

    ext.point('io.ox/core/settings/detail').extend({
        index: 'last',
        id: 'log',
        draw: function () {
            this.append(
                $('<h1>').text(gt('Error log')),
                log.render().$el
            );
        }
    });

});
