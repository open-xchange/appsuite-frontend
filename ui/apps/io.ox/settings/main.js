    /**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/settings/main', [
    'io.ox/core/tk/vgrid',
    'io.ox/core/api/apps',
    'io.ox/core/extensions',
    'io.ox/core/commons',
    'gettext!io.ox/core',
    'settings!io.ox/settings/configjump',
    'settings!io.ox/core',
    'io.ox/core/capabilities',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/node',
    'io.ox/core/folder/api',
    'io.ox/core/api/mailfilter',
    'io.ox/core/notifications',
    'io.ox/core/settings/errorlog/settings/pane',
    'io.ox/core/settings/downloads/pane',
    'less!io.ox/settings/style'
], function (VGrid, appsAPI, ext, commons, gt, configJumpSettings, coreSettings, capabilities, TreeView, TreeNodeView, api, mailfilterAPI, notifications) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/settings' }),
        // app window
        win,
        // nodes
        left,
        right,
        // always true
        // TODO: clean up code if we stick to the decision to remove this
        expertmode = true,
        currentSelection = null,
        previousSelection = null,
        pool = api.pool;

    // function updateExpertMode() {
    //     var nodes = $('.expertmode');
    //     if (expertmode) {
    //         nodes.show();
    //     } else {
    //         nodes.hide();
    //     }
    // }

    app.setLauncher(function (options) {

        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/settings',
            title: 'Settings',
            chromeless: true
        }));

        var changeStatus = false,
            ignoreChangeEvent,

            saveSettings = function (triggeredBy) {

                switch (triggeredBy) {
                    case 'changeMain':
                        if (currentSelection !== null && currentSelection.lazySaveSettings !== true) {
                            var settingsID = currentSelection.id + '/settings';
                            ext.point(settingsID + '/detail').invoke('save');
                        } else if (currentSelection !== null && currentSelection.lazySaveSettings === true) {
                            changeStatus = true;
                        }
                        break;
                    case 'changeGrid':
                        if (previousSelection !== null && previousSelection.lazySaveSettings === true && changeStatus === true) {
                            var settingsID = previousSelection.id + '/settings';
                            ext.point(settingsID + '/detail').invoke('save');
                            changeStatus = false;
                        }
                        break;
                    case 'changeGridMobile':
                        if (currentSelection.lazySaveSettings === true && changeStatus === true) {
                            var settingsID = currentSelection.id + '/settings';
                            ext.point(settingsID + '/detail').invoke('save');
                            changeStatus = false;
                        }
                        break;
                    case 'hide':
                    case 'logout':
                        if (currentSelection !== null && currentSelection.lazySaveSettings === true && changeStatus === true) {
                            var settingsID = currentSelection.id + '/settings',
                                defs = ext.point(settingsID + '/detail').invoke('save').compact().value();
                            changeStatus = false;
                            return $.when.apply($, defs);
                        }
                        break;
                    default:
                        var settingsID = currentSelection.id + '/settings';
                        ext.point(settingsID + '/detail').invoke('save');
                }

                return $.when();
            };

        win.addClass('io-ox-settings-main');

        var vsplit = commons.vsplit(win.nodes.main, app);
        left = vsplit.left.addClass('leftside border-right');

        left.attr({
            'role': 'navigation',
            'aria-label': gt('Settings')
        });

        right = vsplit.right.addClass('default-content-padding settings-detail-pane f6-target').attr({
            'tabindex': 1,
            //needed or mac voice over reads the whole settings pane when an input element is focused
            'role': 'main'
        }).scrollable();

        var appsInitialized = appsAPI.getInstalled().done(function (installed) {

            var apps = _.filter(installed, function (item) {
                if (!item.settings) return false;
                if (item.device) return _.device(item.device);
                // special code for tasks because here settings depend on a capability
                // could have been done in manifest, but I did not want to change the general structure
                // because of one special case, that might even disappear in the future
                if (item.id === 'io.ox/tasks') return capabilities.has('delegate_tasks');
                return true;
            });

            var index = 200;

            _(apps).each(function (app) {
                ext.point('io.ox/settings/pane').extend(_.extend({}, {
                    title: app.description,
                    ref: app.id,
                    index: index
                }, app));
                index += 100;
            });
        });

        var getAllSettingsPanes = function () {
            var def = $.Deferred(),
                disabledSettingsPanes = coreSettings.get('disabledSettingsPanes') ? coreSettings.get('disabledSettingsPanes').split(',') : [],
                actionPoints = {
                    'redirect': 'io.ox/autoforward',
                    'vacation': 'io.ox/vacation'
                };

            function filterAvailableSettings(point) {
                var shown = _.indexOf(disabledSettingsPanes, point.id) === -1 ? true : false;
                if (expertmode && shown) {
                    return true;
                } else if (!point.advancedMode && shown) {
                    return true;
                }
            }

            if (capabilities.has('mailfilter')) {
                mailfilterAPI.getConfig().done(function (config) {
                    _.each(actionPoints, function (val, key) {
                        if (_.indexOf(config.actioncommands, key) === -1) disabledSettingsPanes.push(val);
                    });
                    appsInitialized.done(function () {
                        def.resolve(_.filter(ext.point('io.ox/settings/pane').list(), filterAvailableSettings));
                    });

                    appsInitialized.fail(def.reject);
                }).fail(function (response) {
                    notifications.yell('error', response.error_desc);
                }).always(function () {
                    appsInitialized.done(function () {
                        def.resolve(_.filter(ext.point('io.ox/settings/pane').list(), filterAvailableSettings));
                    });

                    appsInitialized.fail(def.reject);
                });
            } else {
                appsInitialized.done(function () {
                    def.resolve(_.filter(ext.point('io.ox/settings/pane').list(), filterAvailableSettings));
                });

                appsInitialized.fail(def.reject);
            }

            return def;
        };

        var defaultExtension = {
            id: 'standard-folders',
            index: 100,
            draw: function (tree) {
                var defaults = { headless: true, count: 0, empty: false, indent: false, open: true, tree: tree, parent: tree, folder: 'virtual/settings' };

                this.append(

                    new TreeNodeView(_.extend({}, defaults, {
                        model_id: 'virtual/settings/general'
                    }))
                    .render().$el.addClass('standard-folders'),
                    new TreeNodeView(_.extend({}, defaults, {
                        model_id: 'virtual/settings/main'
                    }))
                    .render().$el.addClass('standard-folders'),
                    new TreeNodeView(_.extend({}, defaults, {
                        model_id: 'virtual/settings/tools'
                    }))
                    .render().$el.addClass('standard-folders'),
                    new TreeNodeView(_.extend({}, defaults, {
                        model_id: 'virtual/settings/external'
                    }))
                    .render().$el.addClass('standard-folders')

                );
            }
        };

        ext.point('io.ox/core/foldertree/settings/app').extend(_.extend({}, defaultExtension));

        var listOfVirtualFolders = ['settings/general', 'settings/main', 'settings/external', 'settings/tools'];

        var getter = function () {
            var def = $.Deferred();
            def.resolve(pool.getCollection(this.id).models);
            return def;
        };

        //create virtual folders
        _.each(listOfVirtualFolders, function (val) {
            api.virtual.add('virtual/' + val, getter);
        });

        // tree view
        var tree = new TreeView({
            root: '1',
            all: false,
            app: app,
            contextmenu: false,
            flat: false,
            indent: true,
            module: 'settings'
        });

        tree.on('virtual', function (id, item, baton) {
            var focus = true;

            tree.selection.resetSelected(tree.selection.getItems());
            tree.selection.preselect(id);
            previousSelection = currentSelection;
            currentSelection = pool.getModel(id).get('meta');
            if (!baton) {
                baton = pool.getModel(id).get('meta');
                focus = false;
            }

            if (previousSelection === null || previousSelection.id !== currentSelection.id) {
                showSettings(baton, focus);
            }

            left.trigger('select');
            if (!ignoreChangeEvent) {
                saveSettings('changeGrid');
            }
            ignoreChangeEvent = false;

        });

        if (_.device('smartphone')) {
            tree.$container.on('click', '.folder.selectable.selected .folder-label', function () {
                left.trigger('select');
            });

            tree.$container.on('changeMobile', function () {
                saveSettings('changeGridMobile');
            });
        }

        function paintTree() {
            var dfd = $.Deferred();
            getAllSettingsPanes().done(function (data) {
                addModelsToPool(data);
                if (vsplit.left.find('.folder-tree').length === 0) {
                    vsplit.left.append(tree.render().$el);
                }

                ignoreChangeEvent = true;
                dfd.resolve();
            });
            return dfd;
        }

        function addModelsToPool(allApps) {
            var collectedModels = {
                general: [],
                main: [],
                tools: [],
                external: [],
                submenu: []
            };
            _.each(allApps, function (val) {
                var menuStrucktur = [],
                    defaultModel = {
                        id: 'virtual/' + val.id,
                        module: 'settings',
                        own_rights: 134225984,
                        title: /*#, dynamic*/gt.pgettext('app', val.title),
                        subfolders: false,
                        meta: val
                    };

                if (val.settingsgroup) {
                    menuStrucktur = val.settingsgroup.split('/');
                }

                pool.addModel(_.extend(defaultModel, { menuStrucktur: menuStrucktur }));

                if (menuStrucktur.length === 1) {
                    collectedModels[val.settingsgroup].push(pool.getModel('virtual/' + val.id).toJSON());

                } else if (menuStrucktur.length === 0) {
                    collectedModels.external.push(pool.getModel('virtual/' + val.id).toJSON());
                } else if (menuStrucktur.length >= 1) {
                    collectedModels.submenu.push(pool.getModel('virtual/' + val.id).toJSON());
                }
            });

            _.each(collectedModels, function (val, key) {
                if (key === 'submenu') {
                    var sort = {};
                    _.each(val, function (val) {
                        if (!sort[val.menuStrucktur[1]]) {
                            sort[val.menuStrucktur[1]] = [];
                        }
                        sort[val.menuStrucktur[1]].push(val);

                    });
                    _.each(sort, function (val, key) {
                        //create virtual folders
                        api.virtual.add('virtual/io.ox/' + key, getter);

                        pool.addCollection('virtual/io.ox/' + key, val, { reset: true });
                    });

                } else {
                    pool.addCollection('virtual/settings/' + key, val, { reset: true });
                }
            });
        }

        // Create extensions for the config jump pages
        _(configJumpSettings.get()).chain().keys().each(function (id) {
            var declaration = configJumpSettings.get(id);
            if (declaration.requires) {
                if (!capabilities.has(declaration.requires)) {
                    return;
                }
            }

            // try to get a translated title
            var title = declaration['title_' + ox.language] || /*#, dynamic*/gt(declaration.title) || '';

            ext.point('io.ox/settings/pane').extend(_.extend({
                id: id,
                ref: 'io.ox/configjump/' + id,
                loadSettingPane: false
            }, declaration, { title: title }));

            ext.point('io.ox/configjump/' + id + '/settings/detail').extend({
                id: 'iframe',
                index: 100,
                draw: function () {
                    var $node = this;
                    $node.css({ height: '100%' });
                    var fillUpURL = $.Deferred();

                    if (declaration.url.indexOf('[token]') > 0) {
                        // Grab token
                        $node.busy();
                        require(['io.ox/core/http'], function (http) {
                            http.GET({
                                module: 'token',
                                params: {
                                    action: 'acquireToken'
                                }
                            }).done(function (resp) {
                                fillUpURL.resolve(declaration.url.replace('[token]', resp.token));
                            }).fail(require('io.ox/core/notifications').yell);
                        });
                    } else {
                        fillUpURL.resolve(declaration.url);
                    }

                    fillUpURL.done(function (url) {
                        $node.idle();
                        $node.append($('<iframe>', { src: url, frameborder: 0 }).css({
                            width: '100%',
                            minHeight: '90%'
                        }));
                    });
                }
            });
        });

        ext.point('io.ox/settings/pane').extend({
            title: gt('Basic settings'),
            index: 50,
            id: 'io.ox/core',
            settingsgroup: 'general'
        });

        ext.point('io.ox/settings/pane').extend({
            title: gt('Mail and Social Accounts'),
            index: 600,
            id: 'io.ox/settings/accounts',
            settingsgroup: 'general'
        });

        var showSettings = function (baton, focus) {
            baton = ext.Baton.ensure(baton);
            baton.tree = tree;
            app.get('window').setTitle(gt('%1$s %2$s', gt('Settings'), /*#, dynamic*/gt.pgettext('app', baton.data.title)));

            var data = baton.data,
                settingsPath = data.pane || ((data.ref || data.id) + '/settings/pane'),
                extPointPart = data.pane || ((data.ref || data.id) + '/settings/detail');

            right.empty().busy();

            if (data.loadSettingPane || _.isUndefined(data.loadSettingPane)) {
                return require([settingsPath], function () {
                    // again, since require makes this async
                    right.empty().idle();
                    vsplit.right.attr('aria-label', /*#, dynamic*/gt.pgettext('app', baton.data.title));
                    ext.point(extPointPart).invoke('draw', right, baton);
                    // updateExpertMode();
                    if (focus) vsplit.right.focus();
                });
            } else {
                return require(['io.ox/contacts/settings/pane', 'io.ox/mail/vacationnotice/settings/filter', 'io.ox/mail/autoforward/settings/filter'], function () {
                    // again, since require makes this async
                    right.empty().idle();
                    vsplit.right.attr('aria-label', /*#, dynamic*/gt.pgettext('app', baton.data.title));
                    ext.point(extPointPart).invoke('draw', right, baton);
                    // updateExpertMode();
                    if (focus) vsplit.right.focus();
                });
            }
        };

        // trigger auto save on any change

        win.nodes.main.on('change', function () {
            saveSettings('changeMain');
        });
        win.on('hide', function () {
            saveSettings('hide');
        });

        // listen for logout event
        ext.point('io.ox/core/logout').extend({
            id: 'saveSettings',
            logout: function () {
                return saveSettings('logout');
            }
        });

        app.setSettingsPane = function (options) {
            if (options && options.id) {
                return paintTree().done(function () {
                    var baton = new ext.Baton({ data: pool.getModel('virtual/' + options.id).get('meta'), options: options || {} });
                    tree.trigger('virtual', 'virtual/' + options.id, {}, baton);
                });
            } else {
                if (!_.device('smartphone')) {
                    tree.selection.resetSelected(tree.selection.getItems());
                    tree.selection.pick(0);
                }
                return $.when();
            }
        };

        // go!
        win.show(function () {
            paintTree().done(function () {
                app.setSettingsPane(options);
            });
        });
    });

    return {
        getApp: app.getInstance
    };
});
