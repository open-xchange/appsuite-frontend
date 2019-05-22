/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/settings/quicklauncherDialog', [
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/core',
    'io.ox/backbone/views/modal',
    'io.ox/core/api/apps',
    'io.ox/core/upsell',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/main/appcontrol'
], function (DisposableView, gt, ModalDialog, apps, upsell, mini, appcontrol) {

    'use strict';

    var availableApps = apps.forLauncher().filter(function (model) {
        var requires = model.get('requires');
        return upsell.has(requires);
    }).map(function (o) {
        return {
            label: o.getTitle(),
            value: o.get('path')
        };
    }).concat([{ label: gt('None'), value: 'none' }]);

    // Check that the app exists in available applications
    function getAvailablePath(app) {
        return _(availableApps).findWhere({ 'value': app }) ? app : '';
    }

    var QuickLaunchModel = Backbone.Model.extend({
            initialize: function () {
                appcontrol.getQuickLauncherItems().forEach(function (item, i) {
                    this.set('apps/quickLaunch' + i, getAvailablePath(item));
                }.bind(this));
            },
            toString: function () {
                return _.range(appcontrol.getQuickLauncherCount()).map(function (i) {
                    return this.get('apps/quickLaunch' + i);
                }.bind(this)).join(',');
            }
        }),

        quickLauncherSettingsView = DisposableView.extend({
            initialize: function (options) {
                this.listenTo(this.model, 'change', function () {
                    options.settings.set('apps/quickLaunch', this.model.toString());
                });
            },
            render: function () {
                this.$el.append(
                    _.range(appcontrol.getQuickLauncherCount()).map(function (i) {
                        //#. %s is the number of the quicklauncher (1-3)
                        return this.getMultiSelect('apps/quickLaunch' + i, gt('Quick launch %s', i + 1), { pos: i });
                    }, this)
                );
                return this;
            },
            getMultiSelect: function (name, label, options) {
                options = options || {};
                var id = 'settings-' + name,
                    view = new mini.SelectView({ id: id, name: name, model: this.model, list: this.appsForPos(options.pos), pos: options.pos }),
                    appsForPos = this.appsForPos.bind(this);

                view.listenTo(this.model, 'change', function () {
                    this.options.list = appsForPos(this.options.pos);
                    this.$el.empty();
                    this.render();
                });

                return $('<div class="form-group row">').append(
                    $('<div class="col-md-6">').append(
                        $('<label>').attr('for', id).text(label),
                        view.render().$el
                    )
                );
            },
            appsForPos: function (pos) {
                // This function filters the select box, in order to prevent duplicate quicklaunchers
                return _.range(appcontrol.getQuickLauncherCount())
                    .filter(function (i) { return i !== pos; })
                    .map(function (i) { return this.model.get('apps/quickLaunch' + i); }, this)
                    .reduce(function (acc, app) {
                        return acc.filter(function (a) { return a.value !== app || app === 'none'; });
                    }, availableApps);
            }
        }),

        openDialog = function () {
            var model = new QuickLaunchModel();
            new ModalDialog({
                title: gt('Edit reminders'),
                width: 600
            })
            .build(function () {
                this.$body.append(
                    new quickLauncherSettingsView({ settings: this.model, model: new QuickLaunchModel() }).render().$el
                );
            })
            .addCancelButton({ left: true })
            .addButton({ action: 'apply', label: gt('Apply') })
            .on('apply', function () {
            })
            .open();
            console.log(model, availableApps);
        };

    return {
        openDialog: openDialog
    };

});
