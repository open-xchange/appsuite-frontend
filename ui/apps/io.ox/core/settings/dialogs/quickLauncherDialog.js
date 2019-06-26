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

define('io.ox/core/settings/dialogs/quickLauncherDialog', [
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/core',
    'io.ox/backbone/views/modal',
    'io.ox/core/api/apps',
    'io.ox/core/upsell',
    'io.ox/backbone/mini-views/common',
    'settings!io.ox/core',
    'io.ox/core/main/appcontrol'
], function (DisposableView, gt, ModalDialog, apps, upsell, mini, settings, appcontrol) {

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
            initialize: function () {
                this.listenTo(this.model, 'change', function () {
                    settings.set('apps/quickLaunch', this.model.toString());
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
                title: gt('Configure quick launchers'),
                width: 360
            })
            .build(function () {
                this.$body.append(
                    new quickLauncherSettingsView({ model: new QuickLaunchModel() }).render().$el
                );
            })
            .addCancelButton({ left: true })
            .addButton({ action: 'apply', label: gt('Apply') })
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
