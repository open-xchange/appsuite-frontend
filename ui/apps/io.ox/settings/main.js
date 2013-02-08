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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/settings/main',
     ['io.ox/core/tk/vgrid',
      'io.ox/core/api/apps',
      'io.ox/core/extensions',
      'io.ox/core/tk/forms',
      'io.ox/core/tk/view',
      'io.ox/core/commons',
      'gettext!io.ox/core',
      'less!io.ox/settings/style.css'], function (VGrid, appsApi, ext, forms, View, commons, gt) {

    'use strict';

    var tmpl = {
        main: {
            build: function () {
                var title;
                this.addClass('application')
                    .append(
                        title = $('<div>').addClass('title')
                    );
                return { title: title };
            },
            set: function (data, fields, index) {
                fields.title.text(gt(data.title));
            }
        },
        label: {
            build: function () {
                this.addClass("settings-label");
            },
            set: function (data, fields, index) {
                this.text(data.group || '');
            }
        },
        requiresLabel: function (i, data, current) {
            if (!data) { return false; }
            return data.group !== current ? data.group : false;
        }
    };

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/settings' }),
        // app window
        win,
        // grid
        grid,
        // nodes
        left,
        right,
        expertmode = true, // for testing - better: false,
        currentSelection = null;

    function updateExpertMode() {
        var nodes = $('.expertmode');
        if (expertmode) {
            nodes.show();
        } else {
            nodes.hide();
        }
    }

    app.setLauncher(function () {

        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/settings',
            title: gt('Settings'),
            chromeless: true
        }));

        var saveSettings = function () {
            if (currentSelection !== null) {
                var settingsID = currentSelection.id + '/settings';
                ext.point(settingsID + '/detail').invoke('save');
            }
        };

        win.nodes.controls.append(
            forms.createCheckbox({
                dataid: 'settings-expertcb',
                initialValue: expertmode,
                label: gt('Expert mode')
            })
            .on('update.model', function (e, options) {
                expertmode = options.value;
                updateExpertMode();
            })
        );

        win.addClass('io-ox-settings-main');

        left = $('<div>')
            .addClass('leftside border-right')
            .appendTo(win.nodes.main);

        right = $('<div>')
            .addClass('rightside default-content-padding settings-detail-pane')
            .appendTo(win.nodes.main);

        grid = new VGrid(left);

        // disable the Deserializer
        grid.setDeserialize(function (cid) {
            return cid;
        });

        grid.addTemplate(tmpl.main);
        grid.addLabelTemplate(tmpl.label);

        grid.requiresLabel = tmpl.requiresLabel;

        grid.setAllRequest(function () {
            var def = $.Deferred();
            appsApi.getInstalled().done(function (installed) {
                var apps = _.filter(installed, function (item) {
                    return item.settings;
                });

                apps.unshift({
                    category: 'Basic',
                    company: 'Open-Xchange',
                    description: 'Basic Settings',
                    icon: '',
                    id: 'io.ox/core',
                    settings: true,
                    title: gt('Basic settings')
                });

                // TODO: Move this to a plugin
                apps.push({
                    category: 'Basic',
                    company: 'Open-Xchange',
                    description: 'Manage Accounts',
                    icon: '',
                    id: 'io.ox/settings/accounts',
                    settings: true,
                    title: gt('Mail and Social Accounts')
                });

                // Extend the above list by custom plugins
                ext.point("io.ox/settings/pane").each(function (ext) {
                    apps.push({
                        description: ext.title,
                        id: ext.ref,
                        settings: true,
                        title: ext.title,
                        loadSettingPane: ext.loadSettingPane
                    });
                });

                def.resolve(apps);
            });


            return def;
        });

        grid.setMultiple(false);

        var showSettings = function (obj) {
            var settingsPath = obj.id + '/settings/pane',
                extPointPart = obj.id + '/settings';
            right.empty().busy();
            if (obj.loadSettingPane || _.isUndefined(obj.loadSettingPane)) {
                require([settingsPath], function (m) {
                    right.empty().idle(); // again, since require makes this async
                    ext.point(extPointPart + '/detail').invoke('draw', right, obj);
                    updateExpertMode();
                });
            } else {
                right.empty().idle(); // again, since require makes this async
                ext.point(extPointPart + '/detail').invoke('draw', right, obj);
                updateExpertMode();
            }
        };

        // trigger auto save
        grid.selection.on('change', function (e, selection) {
            if (selection.length === 1) {
                currentSelection = selection[0];
            }
        });

        // trigger auto save on any change
        win.nodes.main.on('change', saveSettings);

        commons.wireGridAndSelectionChange(grid, 'io.ox/settings', showSettings, right);
        commons.wireGridAndWindow(grid, win);

        // go!
        win.show(function () {
            grid.paint();
        });
    });

    return {
        getApp: app.getInstance
    };
});
