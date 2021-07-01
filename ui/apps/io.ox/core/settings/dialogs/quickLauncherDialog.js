/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/settings/dialogs/quickLauncherDialog', [
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/core',
    'io.ox/backbone/views/modal',
    'io.ox/core/api/apps',
    'io.ox/core/upsell',
    'io.ox/backbone/mini-views/common',
    'settings!io.ox/core',
    'io.ox/core/main/appcontrol',
    'io.ox/core/extensions'
], function (DisposableView, gt, ModalDialog, apps, upsell, mini, settings, appcontrol, ext) {

    'use strict';

    var availableApps = apps.forLauncher().filter(function (model) {
        var requires = model.get('requires');
        return upsell.has(requires);
    }).map(function (o) {
        return {
            label: o.getTitle(),
            value: o.get('path')
        };
    }).concat(_(ext.point('io.ox/core/appcontrol/customQuickLaunchers').list()).map(function (customLauncher) {
        return {
            label: customLauncher.label,
            value: 'io.ox/core/appcontrol/customQuickLaunchers/' + customLauncher.id
        };
    }), [{ label: gt('None'), value: 'none' }]);

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
            initialize: function () {
                this.listenTo(this.model, 'change', function () {
                    settings.set('apps/quickLaunch', this.model.toString());
                });
            },
            render: function () {
                this.$el.append(
                    _.range(appcontrol.getQuickLauncherCount()).map(function (i) {
                        //#. %s is the number of the quicklauncher (1-3)
                        return this.getMultiSelect('apps/quickLaunch' + i, gt('Position %s', i + 1), { pos: i });
                    }, this)
                );
                return this;
            },
            getMultiSelect: function (name, label, options) {
                options = options || {};
                var id = 'settings-' + name,
                    view = new mini.SelectView({ id: id, name: name, model: this.model, list: availableApps, pos: options.pos });

                view.listenTo(this.model, 'change:' + name, function () {
                    var appName = this.model.get(name),
                        model = this.model;
                    // remove duplicates if appName is not 'none'
                    if (appName === 'none') return;
                    _(this.model.attributes).each(function (value, slotName) {
                        if (slotName !== name && value === appName) {
                            model.set(slotName, 'none');
                        }
                    });
                });

                return $('<div class="form-group row">').append(
                    $('<div class="col-md-12">').append(
                        $('<label>').attr('for', id).text(label),
                        view.render().$el
                    )
                );
            }
        }),

        openDialog = function () {
            var prevSettings = settings.get('apps/quickLaunch');
            new ModalDialog({
                title: gt('Change quick launch icons'),
                width: 360
            })
            .build(function () {
                this.$body.append(
                    new quickLauncherSettingsView({ model: new QuickLaunchModel() }).render().$el
                );
            })
            .addCancelButton()
            .addButton({ action: 'apply', label: gt('Save changes') })
            .on('cancel', function () {
                settings.set('apps/quickLaunch', prevSettings).save();
            })
            .on('apply', function () {
                settings.save();
            })
            .open();
        };

    return {
        openDialog: openDialog
    };

});
