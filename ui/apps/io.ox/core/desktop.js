/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

/* global assert: true */

define('io.ox/core/desktop', [
    'io.ox/core/event',
    'io.ox/backbone/views/window',
    'io.ox/core/extensions',
    'io.ox/core/cache',
    'io.ox/core/notifications',
    'io.ox/core/upsell',
    'io.ox/core/adaptiveLoader',
    'io.ox/core/folder/api',
    'io.ox/core/api/apps',
    'io.ox/find/main',
    'io.ox/core/main/icons',
    'settings!io.ox/core',
    'gettext!io.ox/core',
    'io.ox/core/capabilities'
], function (Events, FloatingWindow, ext, cache, notifications, upsell, adaptiveLoader, folderAPI, apps, findFactory, icons, coreSettings, gt, capabilities) {

    'use strict';

    /**
     * Core UI
     */

    // current window
    var currentWindow = null,
        appGuid = 0,
        appCache = new cache.SimpleCache('app-cache', true);

    function supportsFind(name) {
        // enabled apps
        var list = coreSettings.get('search/modules') || [];
        //var searchable = apps.get(name) && apps.get(name).get('searchable');

        name = name.replace(/^io\.ox\//, '')
            .replace(/files/, 'drive'); // drive alias
        //return list.indexOf(name) > -1 && searchable;
        return list.indexOf(name) > -1;
    }

    var AbstractApp = Backbone.Model.extend({

        defaults: {
            title: ''
        },

        initialize: function (options) {
            var self = this;
            this.options = options || {};
            this.guid = this.options.guid || appGuid++;
            this.id = this.id || (this.options.refreshable ? this.options.name : '') || 'app-' + this.guid;
            this.set('path', this.options.path ? this.options.path : this.getName() + '/main');
            this.set('id', this.id);
            this.set('openInTab', this.options.openInTab);
            this.set('tabUrl', this.options.tabUrl);
            this.getInstance = function () {
                return self;
            };
        },

        getName: function () {
            return this.get('name');
        },

        setTitle: function (title) {
            this.set('title', title);
            if (this.options.floating) {
                if (this.getWindow().floating) {
                    this.getWindow().floating.setTitle(title);
                }
                return;
            }
            return this;
        },

        getTitle: function () {
            return this.get('title');
        },

        getWindow: $.noop,

        saveRestorePoint: $.noop,

        call: $.noop
    });

    ox.ui.AppPlaceholder = AbstractApp;

    var apputil = {
        LIMIT: 265000,
        length: function (obj) {
            return JSON.stringify(obj).length;
        },
        //crop save point
        crop: function (list, data, pos) {
            var length = apputil.length,
                latest = list[pos],
                exceeds =  apputil.LIMIT < length(list) - length(latest || '') + length(data);

            if (exceeds) {
                if (latest) {
                    //use latest sucessfully saved state
                    data = latest;
                } else {
                    //remove data property
                    data.point.data = {};
                }
                //notify user if not mail compose. Mail compose is more likely to be hit,
                //but are Save as draft and autosave to prevent data loss
                if (!('exceeded' in data) && data.module !== 'io.ox/mail/compose') {
                    notifications.yell('warning', gt('Failed to automatically save current stage of work. Please save your work to avoid data loss in case the browser closes unexpectedly.'));
                    //flag to yell only once
                    data.exceeded = true;
                }
            } else {
                delete data.exceeded;
            }
            return data;
        }
    };

    ox.ui.App = AbstractApp.extend({

        defaults: {
            window: null,
            state: 'ready',
            saveRestorePointTimer: null,
            launch: function () { return $.when(); },
            resume: function () { return $.when(); },
            quit: function () { return $.when(); }
        },

        initialize: function () {
            var self = this;
            // call super constructor
            AbstractApp.prototype.initialize.apply(this, arguments);

            this.set('uniqueID', _.now() + '.' + String(Math.random()).substr(3, 4));

            var save = $.proxy(this.saveRestorePoint, this);
            $(window).on('unload', save);
            // 10 secs
            if (!this.disableRestorePointTimer) this.set('saveRestorePointTimer', setInterval(save, 10 * 1000));

            // add folder management
            this.folder = (function () {

                var folder = null, that, win = null, grid = null, type, initialized = $.Deferred();

                folderAPI.on('after:rename', function (id, data) {
                    if (win) win.setTitle(data.title || '');
                });

                that = {

                    initialized: initialized.promise(),

                    unset: function () {
                        // unset
                        folder = null;
                        _.url.hash('folder', null);
                        // update window title?
                        if (win) {
                            win.setTitle('');
                        }
                        // update grid?
                        if (grid) {
                            grid.clear();
                        }
                    },

                    set: (function () {

                        function change(id, data, app, def, favorite) {
                            //app has changed while folder was requested
                            var appchange = _.url.hash('app') !== app;
                            // remember
                            folder = String(id);
                            //only change if the app did not change
                            if (!appchange) {
                                // update window title & toolbar?
                                if (win) {
                                    win.setTitle(data.display_title || data.title || '');
                                    win.updateToolbar();
                                }
                                // update grid?
                                if (grid && grid.prop('folder') !== folder) {
                                    grid.busy().prop('folder', folder);
                                    grid.refresh();
                                    // load fresh folder & trigger update event
                                    folderAPI.reload(id);
                                }
                                // update hash
                                _.url.hash('folder', folder);
                                self.trigger('folder:change', folder, data, favorite);
                            }
                            def.resolve(data, appchange);

                            if (initialized.state() !== 'resolved') {
                                initialized.resolve(folder, data);
                            }
                        }

                        return function (id, favorite) {
                            var def = $.Deferred();
                            if (id !== undefined && id !== null && String(id) !== folder) {

                                var app = _.url.hash('app'),
                                    model = folderAPI.pool.getModel(id),
                                    data = model.toJSON();

                                if (model.has('title')) {
                                    change(id, data, app, def, favorite);
                                } else {
                                    folderAPI.get(id).then(
                                        function success(data) {
                                            change(id, data, app, def, favorite);
                                        },
                                        function fail() {
                                            console.warn('Failed to change folder', id);
                                            def.reject();
                                        }
                                    );
                                }
                            } else if (String(id) === folder) {
                                // see Bug 34927 - [L3] unexpected application error when clicking on "show all messages in inbox" in notification area
                                def.resolve(folderAPI.pool.getModel(id).toJSON(), false);
                            } else {
                                def.reject();
                            }
                            return def;
                        };
                    }()),

                    setType: function (t) {
                        type = t;
                        return this;
                    },

                    setDefault: function () {
                        return $.when().then(function () {
                            var defaultFolder = folderAPI.getDefaultFolder(type);
                            if (defaultFolder) {
                                return that.set(defaultFolder);
                            }
                            return folderAPI.getExistingFolder(type).then(
                                function (id) {
                                    return that.set(id);
                                },
                                function () {
                                    return $.Deferred().reject({ error: gt('Could not get a default folder for this application.') });
                                }
                            );
                        });
                    },

                    isDefault: function () {
                        return $.when().then(function () {
                            var defaultFolder = folderAPI.getDefaultFolder(type);
                            return String(folder) === String(defaultFolder);
                        });
                    },

                    get: function () {
                        return folder;
                    },

                    getData: function () {
                        if (folder === null) return $.Deferred().resolve({});
                        var model = folderAPI.pool.getModel(folder);
                        return $.Deferred().resolve(model.toJSON());
                    },

                    // getData() became internally sync over time, but it kept its async return value
                    // getModel() is sync; return undefined if model doesn't exist (yet)
                    getModel: function () {
                        return folderAPI.pool.getModel(folder);
                    },

                    can: function (action) {

                        if (folder === null) return $.when(false);

                        return require(['io.ox/core/folder/api']).then(function (api) {
                            return api.get(folder).then(function (data) {
                                return api.can(action, data);
                            });
                        });
                    },

                    updateTitle: function (w) {
                        win = w;
                        return this;
                    },

                    updateGrid: function (g) {
                        grid = g;
                        return this;
                    },

                    destroy: function () {
                        that = win = grid = null;
                    },

                    handleErrors: (function () {

                        var process = _.debounce(function (error) {
                            // refresh parent folder or if flat all
                            var model = folderAPI.pool.getModel(self.folder.get());
                            if (model) folderAPI.list(model.get('folder_id'), { cache: false });
                            self.folder.setDefault();
                            notifications.yell(error);
                        }, 1000, true);

                        var regexStr = '(' +
                                // permission denied (calendar)
                                'APP-0013|' +
                                // permission denied (contacts)
                                'CON-0104|' +
                                // permission denied
                                'FLD-0003|' +
                                // not found
                                'FLD-0008|' +
                                // folder storage service no longer available
                                'FLD-1004|' +
                                // The supplied folder is not supported. Please select a valid folder and try again.
                                'CAL-4060|' +
                                // mail folder "..." could not be found on mail server
                                'IMAP-1002|' +
                                // imap no read permission
                                'IMAP-2041|' +
                                // infostore no read permission
                                'IFO-0400|' +
                                // The provided "..." (e.g. dropbox) resource does not exist
                                'FILE_STORAGE-0005|' +
                                'FILE_STORAGE-0055|' +
                                // permission denied (tasks)
                                'TSK-0023' +
                            ')',
                            regex = new RegExp(regexStr);

                        return function () {
                            self.listenTo(ox, 'http:error', function (error, request) {
                                var folder = request.params.folder || request.data.folder || error.folder || request.params.id;
                                if (folder !== self.folder.get()) return;
                                // don't show expected errors see Bug 56276
                                if ((error.code === 'IMAP-1002' || error.code === 'FLD-0008') && folderAPI.isBeingDeleted(folder)) return;
                                if (!regex.test(error.code)) return;
                                // special handling for no permission. if api.get fails, 'http-error' is triggered again
                                if (/(IMAP-2041|IFO-0400|APP-0013|CON-0104|TSK-0023)/.test(error.code)) return folderAPI.get(self.folder.get(), { cache: false });
                                process(error);
                            });
                        };
                    }())

                };

                return that;
            }());
        },

        setLauncher: function (fn) {
            this.set('launch', fn);
            return this;
        },

        setResume: function (fn) {
            this.set('resume', fn);
            return this;
        },

        setQuit: function (fn) {
            this.set('quit', fn);
            return this;
        },

        setWindow: function (win) {
            this.set('window', win);
            win.app = this;
            if (this.options.floating) {
                var model = this.options.floatingWindowModel || new FloatingWindow.Model(
                    _.extend(_(this.options).pick('closable', 'displayStyle', 'size', 'taskbarIcon', 'title', 'name'), { win: win })
                );
                win.floating = new FloatingWindow.View({ el: win.nodes.outer, model: model }).render();

                win.floating.listenTo(model, 'quit', function () {
                    win.app.quit().done(function () {
                        model.trigger('close');
                    });
                });

                // handle dropzone
                win.floating.listenTo(model, 'change:active change:minimized', function (model) {
                    if (!win.app.dropZone) return;
                    var active = model.get('active') && !model.get('minimized');
                    if (!active && win.app.dropZone.remove) return win.app.dropZone.remove();
                    if (win.app.dropZone.include) win.app.dropZone.include();
                });

                win.app.once('quit', function () { model.trigger('close'); });
            }
            // add app name
            if (this.has('name')) {
                win.nodes.outer.attr('data-app-name', this.get('name'));
            }
            return this;
        },

        getWindow: function () {
            return this.get('window');
        },

        isFindSupported: function () {
            return supportsFind(this.getName());
        },

        initFind: function () {
            if (this.get('find')) return true;

            var find = findFactory.getApp({ parent: this });
            //TODO: bottleneck
            find.prepare();
            this.set('find', find);
            return find;
        },

        getWindowNode: function () {
            return this.has('window') ? this.get('window').nodes.main : $();
        },

        getWindowTitle: function () {
            return this.has('window') ? this.get('window').getTitle() : '';
        },

        /**
         * Add mediator extensions
         * ext.point('<app-name>/mediator'').extend({ ... });
         */
        mediator: function (obj) {
            ox.ui.App.mediator(this.getName(), obj);
        },

        /*
         * setup all mediator extensions
         */
        mediate: function () {
            var self = this;
            return ext.point(this.getName() + '/mediator').each(function (extension) {
                try {
                    if (extension.setup) extension.setup(self);
                } catch (e) {
                    console.error('mediate', extension.id, e.message, e);
                }
            });
        },

        /**
         * Registers an event handler at a global browser object (e.g. the
         * window, the document, or the `<body>` element) that listens to the
         * specified event or events. The event handler will only be active
         * while the application window is visible, and will be inactive while
         * the application window is hidden.
         *
         * @param {Object|String} target
         *  The target object that will trigger the specified events. Can be
         *  any object or value that can be passed to the jQuery constructor.
         *
         * @param {String} eventType
         *  The event name(s) the handler function will be registered for.
         *
         * @param {Function} eventHandler
         *  The event handler function bound to the specified events.
         */
        registerGlobalEventHandler: function (target, eventType, eventHandler) {
            var $target = $(target), win = this.getWindow();
            function startListening() { $target.on(eventType, eventHandler); }
            function stopListening() { $target.off(eventType, eventHandler); }
            win.on({ show: startListening, hide: stopListening, quit: stopListening });
            if (win.state.visible) { startListening(); }
        },

        /**
         * Registers an event handler at the browser window that listens to
         * `resize` events. The event handler will only be active while the
         * application window is visible, and will be inactive while the
         * application window is hidden.
         *
         * @param {Function} resizeHandler
         *  The resize handler function bound to `resize` events of the browser
         *  window. Will be called when:
         *  - the application is visible, and the browser window triggers a
         *    `resize` event,
         *  - the application window becomes visible,
         *  - immediately on registration if the application window is visible.
         */
        registerWindowResizeHandler: function (resizeHandler) {
            var win = this.getWindow();
            this.registerGlobalEventHandler(window, 'resize', resizeHandler);
            win.on('show', resizeHandler);
            if (win.state.visible) { resizeHandler(); }
        },

        setState: function (obj) {
            if (this.options.floating || this.options.plugged) return;
            for (var id in obj) {
                _.url.hash(id, ((obj[id] !== null) ? String(obj[id]) : null));
            }
        },

        getState: function () {
            return _.url.hash();
        },

        launch: function (options) {
            var deferred = $.when(),
                self = this,
                name = this.getName();

            // update hash (not for floating apps, e.g. mail editor; or plugged apps, e.g. spreadsheet viewer)
            if (!this.options.floating && !this.options.plugged) {
                if (name !== _.url.hash('app')) {
                    _.url.hash({ folder: null, perspective: null, id: null });
                }
                if (name) {
                    _.url.hash('app', name);
                }
            }

            if (this.get('state') === 'ready') {
                this.set('state', 'initializing');
                ox.trigger('app:init', this);
                _.extend(this.options, options);
                if (name) {
                    ext.point(name + '/main').invoke('launch', this, this.options);
                }
                try {
                    var fn = this.get('launch');
                    deferred = fn.call(this, this.options) || $.when();
                } catch (e) {
                    console.error('Error while launching application:', e.message, e, this);
                }
                deferred.then(
                    function success() {
                        apps.add(self);
                        self.set('state', 'running');
                        self.trigger('launch', self);
                        ox.trigger('app:start', self);
                        // add cloasable apps that don't use floating windows to the taskbar
                        if (self.get('closable') && !self.get('floating') && !_.device('smartphone')) FloatingWindow.addNonFloatingApp(self, options);
                    },
                    function fail() {
                        var autoStart = require('settings!io.ox/core').get('autoStart');
                        // don't autostart mail for guests just because any other app failed. Usually doesn't work and doesn't have permission for it.
                        if (autoStart !== 'none' && !capabilities.has('guest')) ox.launch(autoStart);
                        throw arguments;
                    }
                );
                // don't resume apps that are currently initializing
            } else if (this.get('state') !== 'initializing' && this.has('window')) {
                // show or toggle app window
                if (!this.options.toggle) this.get('window').show();
                this.trigger('resume', this);
                ox.trigger('app:resume', this);

                if (name) {
                    ext.point(name + '/main').invoke('resume', this, options);
                }
                try {
                    var fnResume = this.get('resume');
                    deferred = fnResume.call(this, options) || $.when();
                } catch (e) {
                    console.error('Error while resuming application:', e.message, e, this);
                }
                // if image previews were already displayed in the files app, it might happen that another app (e.g. latest files widget) did some changes to the pool
                // and the previews were redrawn but not displayed since the 'appear' event has not been triggered
                $(window).trigger('resize.lazyload');
            }

            return deferred.then(function () {
                return $.Deferred().resolveWith(self, arguments);
            });
        },

        quit: function (force, options) {
            // call quit function
            var def = force ? $.when() : (this.get('quit').call(this, options) || $.when()), win, self = this;
            return def.done(function () {
                // not destroyed?
                if (force && self.destroy) {
                    self.destroy();
                }
                // update hash but don't delete information of other apps that might already be open at this point (async close when sending a mail for exsample);
                if (!self.floating && (self.getWindow() && self.getWindow().state.visible) && (!_.url.hash('app') || self.getName() === _.url.hash('app').split(':', 1)[0])) {
                    //we are still in the app to close so we can clear the URL
                    _.url.hash({ app: null, folder: null, perspective: null, id: null });
                }
                // don't save
                clearInterval(self.get('saveRestorePointTimer'));
                self.removeRestorePoint();
                $(window).off('unload', $.proxy(self.saveRestorePoint, self));
                // destroy stuff
                self.folder.destroy();
                if (self.has('window')) {
                    win = self.get('window');
                    win.trigger('quit');
                    ox.ui.windowManager.trigger('window.quit', win);
                    win.destroy();
                }
                if (self.dropZone && self.dropZone.remove) self.dropZone.remove();
                // remove from list
                apps.remove(self);
                // mark as not running
                self.trigger('quit');
                ox.trigger('app:stop', self);
                self.set('state', 'stopped');
                // remove app's properties
                for (var id in self) {
                    delete self[id];
                }
                // don't leak
                self = win = null;
            });
        },

        saveRestorePoint: function () {
            var self = this, uniqueID = self.get('uniqueID');
            if (this.failSave) {
                // mail compose has a separate setting
                if (this.get('name') === 'io.ox/mail/compose' && !coreSettings.get('features/storeMailSavePoints', true)) return $.when();

                return ox.ui.App.getSavePoints().then(function (list) {
                    // might be null, so:
                    list = list || [];
                    var data, ids, pos;
                    try {
                        data = self.failSave();
                        ids = _(list).pluck('id');
                        pos = _(ids).indexOf(uniqueID);
                        if (data) {
                            data.floating = self.get('floating');
                            data.id = uniqueID;
                            data.cid = self.cid;
                            data.timestamp = _.now();
                            data.version = ox.version;
                            data.ua = navigator.userAgent;
                            //consider db limit for jslob
                            data = apputil.crop(list, data, pos);
                            if (pos > -1) {
                                // replace
                                list.splice(pos, 1, data);
                            } else {
                                // add
                                list.push(data);
                            }
                        }
                    } catch (e) {
                        // looks broken, so remove from list
                        if (pos > -1) { list.splice(pos, 1); delete self.failSave; }
                    }
                    if (list.length > 0) {
                        return ox.ui.App.setSavePoints(list);
                    }
                    return $.when();
                });
            }
            return $.when();
        },

        removeRestorePoint: function () {
            var uniqueID = this.get('uniqueID');
            return ox.ui.App.removeRestorePoint(uniqueID);
        }

    });

    function saveRestoreEnabled() {
        //no smartphones and feature toggle which is overridable by url parameter
        var urlForceOff = typeof _.url.hash('restore') !== 'undefined' && /^(0|false)$/i.test(_.url.hash('restore')),
            urlForceOn = typeof _.url.hash('restore') !== 'undefined' && /^(1|true)$/i.test(_.url.hash('restore'));

        return urlForceOn ||
            !urlForceOff &&
            coreSettings.get('features/storeSavePoints', true);
    }
    // static methods
    _.extend(ox.ui.App, {

        /**
         * Add mediator extensions
         * ext.point('<app-name>/mediator'').extend({ ... });
         */
        mediator: function (name, obj) {
            // get extension point
            var point = ext.point(name + '/mediator'), index = 0;
            // loop over key/value object
            _(obj).each(function (fn, id) {
                point.extend({ id: id, index: (index += 100), setup: fn });
            });
        },

        canRestore: function () {
            // use get instead of contains since it might exist as empty list
            return this.getSavePoints().then(function (list) {
                return list && list.length > 0;
            });
        },

        // utility function to clean savepoints of unsupported versions in jslob (not localstorage)
        cleanupSavepoints: function () {
            if (coreSettings.get('savepointCleanup', false)) return;
            coreSettings.set('savepoints', []).save().then(function () {
                coreSettings.set('savepointCleanup', ox.version).save();
            });
        },

        getSavePoints: function () {
            if (!saveRestoreEnabled()) return $.when([]);

            return appCache.get('savepoints').then(function (list) {
                list = list || [];
                // get restorepoints by Id too (those are saved in jslob so they survive logouts), don't return standard savepoints from jslob (those are artefacts from old versions, they are removed on the next save)
                var savepointsById = coreSettings.get('savepoints', []).filter(function (savepoint) { return savepoint.restoreById; });
                list = [].concat(list, savepointsById);

                return _(list || []).filter(function (obj) {
                    var hasPoint = 'point' in obj,
                        sameUA = obj.ua === navigator.userAgent;
                    return (hasPoint && (sameUA || obj.restoreById));
                });
            });
        },

        // deprecated
        storeSavePoints: _.noop,

        setSavePoints: function (list) {
            if (!saveRestoreEnabled()) {
                return $.Deferred().resolve([]);
            }
            list = list || [];
            var pointsById = _(list).filter(function (point) {
                return point.restoreById;
            });
            list = _(list).filter(function (point) {
                return !point.restoreById;
            });
            // set both types of savepoints
            coreSettings.set('savepoints', pointsById);
            return appCache.add('savepoints', list);
        },

        removeAllRestorePoints: function () {
            return this.setSavePoints([]);
        },

        removeRestorePoint: (function () {
            var hash = {};
            // Issue caused by multiple almost simultaneous removeRestorePoint calls.
            // All callbacks work on same state of that list as getSavePoints (t3, t4...)
            // resolves before setSavePoints of previous calls (t1, t2...). Minimal
            // solution/workaround as backport (reduce potential impacts) by maintaining
            // a list of deleted ids
            function getPoint(list, id) {
                var ids = _(list).pluck('id'),
                    pos = _(ids).indexOf(id);
                return list[pos];
            }

            function cleanupHash(list) {
                _(hash).each(function (value, id) {
                    if (getPoint(list, id)) return;
                    // point finally removed
                    delete hash[id];
                });
            }

            return function (id) {
                var self = this;
                hash[id] = true;
                return this.getSavePoints().then(function (list) {
                    list = (list || []).slice();
                    // remove already removed ones from 'removeHash'
                    cleanupHash(list);

                    var ids = _(list).pluck('id');
                    // loop all 'to be removed' ones
                    _(hash).each(function (value, id) {
                        var pos = _(ids).indexOf(id),
                            point = list[pos];
                        if (pos > -1) {
                            list.splice(pos, 1);
                        }
                        // if this is a point that's restored by id we need to remove it in the settings
                        if (point && point.restoreById) {
                            var pointsById = coreSettings.get('savepoints', []);
                            ids = _(pointsById).pluck('id');
                            pos = _(ids).indexOf(id);
                            if (pos > -1) {
                                pointsById.splice(pos, 1);
                                coreSettings.set('savepoints', pointsById).save();
                            }
                        }

                    });
                    return self.setSavePoints(list).then(function () {
                        return list;
                    });
                });
            };
        })(),

        restore: function () {
            this.cleanupSavepoints();
            return $.when(this.getSavePoints(), ox.rampup.compositionSpaces).then(function (list, spaces) {
                return this.restoreLoad({ list: list, spaces: spaces });
            }.bind(this));
        },

        restoreLoad: function (options) {
            var self = this,
                list = options.list || [],
                spaces = options.spaces || [];
            return $.when.apply($,
                _([].concat(list, spaces)).map(function (obj) {
                    adaptiveLoader.stop();
                    var requirements = adaptiveLoader.startAndEnhance(obj.module, [obj.module + '/main']);
                    return ox.load(requirements).then(function (m) {
                        var app = m.getApp(obj.passPointOnGetApp ? obj.point : undefined);
                        if (obj.cid) app.cid = obj.cid;
                        // floating windows are restored as dummies. On click the dummy starts the complete app. This speeds up the restore process.
                        if (_.device('!smartphone') && (app.options.floating || app.options.closable)) {
                            var model, win;
                            if (app.options.floating) {
                                // note: cid is stored as model property here
                                model = new FloatingWindow.Model({ cid: obj.cid, minimized: true, id: obj.id, title: obj.description, closable: true, lazy: true, taskbarIcon: app.options.taskbarIcon, name: app.options.name });
                                win = new FloatingWindow.TaskbarElement({ model: model }).render();
                                FloatingWindow.collection.add(model);
                            } else {
                                win = FloatingWindow.addNonFloatingApp(app, { lazyload: true });
                                model = win.model;
                            }
                            win.listenToOnce(model, 'lazyload', function () {
                                var oldId = obj.id;
                                obj = _.clone(obj);
                                if (app.options.floating) {
                                    // copy app options over to window model
                                    model.set(_(app.options).pick('closable', 'displayStyle', 'size', 'taskbarIcon', 'title'));
                                    app.launch({ floatingWindowModel: model }).then(function () {
                                        // update unique id
                                        obj.id = this.get('uniqueID');
                                        if (this.failRestore) return this.failRestore(obj.point);
                                        return $.when();
                                    }).done(function () {
                                        // replace restore point with old id with restore point with new id (prevents duplicates)
                                        self.removeRestorePoint(oldId).then(self.getSavePoints).then(function (sp) {
                                            sp.push(obj);
                                            if (obj.keepOnRestore !== false) self.setSavePoints(sp);
                                            if (model.get('quitAfterLaunch')) model.trigger('quit');
                                        });
                                    }).fail(function (e) {
                                        if (!e || e.code !== 'MSG-0032') return;
                                        // restoreById-savepoint after draft/composition space got deleted
                                        _.delay(function () {
                                            ox.ui.App.removeRestorePoint(oldId);
                                            model.trigger('close');
                                        });
                                    });
                                    return;
                                }
                                app.launch().then(function () {
                                    // update unique id
                                    obj.id = this.get('uniqueID');
                                    if (this.failRestore) {
                                        // restore
                                        return this.failRestore(obj.point);
                                    }
                                    return $.when();
                                }).done(function () {
                                    // replace restore point with old id with restore point with new id (prevents duplicates)
                                    self.removeRestorePoint(oldId).then(self.getSavePoints).then(function (sp) {
                                        sp.push(obj);
                                        self.setSavePoints(sp);
                                    });
                                });
                            });
                            return $.when();
                        }
                        var oldId = obj.id;
                        return app.launch().then(function () {
                            // update unique id
                            obj.id = this.get('uniqueID');
                            if (this.failRestore) {
                                // restore
                                return this.failRestore(obj.point).then(function () {
                                    app.set('restored', true);
                                });
                            }
                        }).fail(function (e) {
                            if (!e || e.code !== 'MSG-0032') return;
                            // restoreById-savepoint after draft got deleted
                            _.delay(function () {
                                ox.ui.App.removeRestorePoint(oldId);
                            });
                        });
                    });
                })
            )
            .done(function () {
                // we don't remove that savepoint now because the app might crash during restore!
                // in this case, data would be lost
                self.setSavePoints(list);
            });
        },

        get: function (name) {
            return apps.where({ name: name });
        },

        getByCid: function (cid) {
            return apps.get(cid);
        },

        reuse: function (cid) {
            var app = ox.ui.apps.find(function (m) { return m.cid === cid; });
            if (app) {
                // Special case: There exists a unrestored restore point for the same app.
                // Then, there must exist a corresponding model which will react on the lazyload event
                if (app.get('state') === 'ready') {
                    var model = FloatingWindow.collection.findWhere({ cid: cid });
                    if (model) {
                        model.trigger('lazyload');
                        return true;
                    }
                }
                app.launch();
                return true;
            }
            return false;
        },

        isCurrent: function (app) {
            var current = ox.ui.App.getCurrentApp();
            return !!(current && current.get('name') === (_.isString(app) ? app : app.model.get('name')));
        },

        getCurrentApp: function () {
            return currentWindow !== null ? currentWindow.app : null;
        },

        getCurrentFloatingApp: function () {
            return _.chain(ox.ui.apps.pluck('window')).compact()
                .map(function (win) {
                    if (win.app.get('name') === 'io.ox/help') return undefined;
                    return win.floating && win.floating.model && win.floating.model.get('active') ? win.app : undefined;
                }).compact().first().value();
        },

        getCurrentWindow: function () {
            return currentWindow;
        }
    });

    // show
    $('#io-ox-core').show();

    // check if any open application has unsaved changes
    window.onbeforeunload = function () {

        // find an applications with unsaved changes
        var unsavedChanges = apps.some(function (app) {
            return _.isFunction(app.hasUnsavedChanges) && app.hasUnsavedChanges();
        });

        // browser will show a confirmation dialog, if onbeforeunload returns a string
        ox.trigger('beforeunload', unsavedChanges);
        if (unsavedChanges) {
            return gt('There are unsaved changes.');
        }
    };

    /**
     * Create app
     */
    ox.ui.createApp = function (options) {
        if (upsell.visible(options.requires) && _.device(options.device)) {
            return apps.add(new ox.ui.App(options));
        }
    };

    ox.ui.screens = (function () {

        var current = null,

            that = {

                add: function (id) {
                    return $('<div>', { id: 'io-ox-' + id }).addClass('abs').hide()
                        .appendTo('#io-ox-screens');
                },

                get: function (id) {
                    return $('#io-ox-screens').find('#io-ox-' + id);
                },

                current: function () {
                    return current;
                },

                hide: function (id) {
                    this.get(id).hide();
                    this.trigger('hide-' + id);
                },

                show: function (id) {
                    $('#io-ox-screens').children().each(function () {
                        var attr = $(this).attr('id'),
                            screenId = String(attr || '').substr(6);
                        if (screenId !== id && screenId !== 'ad-skyscraper') {
                            that.hide(screenId);
                        }
                    });
                    this.get(id).show();
                    current = id;
                    this.trigger('show-' + id);
                }
            };

        Events.extend(that);

        return that;

    }());

    ox.ui.Perspective = (function () {

        var Perspective = function (name) {
            // init
            this.main = $();
            this.name = name;
            this.rendered = false;
            this.render = $.noop;
            this.save = $.noop;
            this.restore = $.noop;
            this.afterShow = $.noop;
            this.afterHide = $.noop;

            this.show = function (app, opt) {
                var win = app.getWindow(),
                    pcOpt = opt.animation ? { animation: opt.animation } : {},
                    self = this,
                    newPerspective = opt.perspective.split(':')[0];

                if (opt.disableAnimations) {
                    pcOpt.disableAnimations = true;
                }

                if (opt.perspective === win.currentPerspective) return;

                this.main = app.pages.getPage(newPerspective);

                if (!app.pages.getPageObject(newPerspective).perspective) {
                    app.pages.getPageObject(newPerspective).perspective = this;
                }

                // add to stack
                win.addPerspective(this);

                // trigger change event
                if (win.currentPerspective !== 'main') {
                    win.trigger('change:perspective', name, opt.perspective);
                } else {
                    win.trigger('change:initialPerspective', name);
                }

                _.url.hash('perspective', opt.perspective);

                // render?
                if (!this.rendered) {
                    this.render(app, opt);
                    this.rendered = true;
                }

                app.pages.getPage(newPerspective).one('pageshow', function () {
                    // wait for page to show
                    self.afterShow(app, opt);
                    win.currentPerspective = opt.perspective;
                    win.updateToolbar();
                });

                if (app.pages.getCurrentPage().name === newPerspective) {
                    // trigger also here, not every perspective change is also an page change
                    this.afterShow(app, opt);
                    win.currentPerspective = opt.perspective;
                    win.updateToolbar();
                }

                app.pages.changePage(newPerspective, pcOpt);
            };

            this.hide = function () {
                this.afterHide();
            };
        };

        function handlePerspectiveChange(app, p, newPers, opt) {
            var oldPers = app.getWindow().getPerspective();

            if (oldPers && _.isFunction(oldPers.save)) {
                oldPers.save();
            }

            if (newPers) {
                newPers.show(app, _.extend({ perspective: p }, opt));
                if (_.isFunction(newPers.restore)) {
                    newPers.restore();
                }
            }
        }

        Perspective.show = function (app, p, opt) {
            return require([app.get('name') + '/' + p.split(':')[0] + '/perspective'], function (newPers) {
                handlePerspectiveChange(app, p, newPers, opt);
            });
        };

        return Perspective;

    }());

    ox.ui.windowManager = (function () {

        var that = Events.extend({}),
            // list of windows
            windows = [],
            // get number of open windows
            numOpen = function () {
                return _(windows).inject(function (count, obj) {
                    return count + (obj.state.open ? 1 : 0);
                }, 0);
            };

        that.getWindows = function () {
            return windows.slice();
        };

        ox.ui.screens.on('hide-windowmanager', function () {
            if (currentWindow) {
                currentWindow.hide();
            }
        });

        that.hide = function () {
            ox.ui.screens.hide('windowmanager');
        };

        that.show = function () {
            ox.ui.screens.show('windowmanager');
        };

        that.on('window.open window.show', function (e, win) {
            // show window manager
            this.show();
            // move/add window to top of stack
            windows = _(windows).without(win);
            if (!win.options.floating) {
                _(windows).each(function (w) { w.nodes.body.removeAttr('role'); });
                if (win.options.name !== 'io.ox/settings') win.nodes.body.attr('role', 'main');
            } else {
                win.nodes.body.attr('role', 'region');
            }
            windows.unshift(win);
            // add current windows to cache
            if (windows.length > 1) {
                var winCache = _(windows).map(function (w) {
                    return w.name;
                });
                appCache.add('windows', winCache || []);
            }
        });

        that.on('window.beforeshow', function () {
            that.trigger('empty', false);
        });

        that.on('window.close window.quit window.pre-quit', function (e, win, type) {
            // fallback for different trigger functions
            if (!type) {
                type = e.type + '.' + e.namespace;
            }
            var pos = _(windows).indexOf(win), i, $i, w;
            if (pos !== -1) {
                // quit?
                if (type === 'window.quit') {
                    // remove item at pos
                    windows.splice(pos, 1);
                } else if (type === 'window.close' || type === 'window.pre-quit') {
                    // close?
                    // add/move window to end of stack
                    windows = _(windows).without(win);
                    windows.push(win);
                }
                // find first open window
                for (i = 0, $i = windows.length; i < $i; i++) {
                    w = windows[i];
                    // don't restore a floating window on close (only fullscreen apps)
                    if (w !== win && w.state.open && !w.floating) {
                        w.resume();
                        break;
                    }
                }
                // remove the window from cache if it's there
                appCache.get('windows').done(function (winCache) {
                    var index = _.indexOf(winCache, win.name);
                    if (index > -1) {
                        winCache.splice(index, 1);
                        appCache.add('windows', winCache || []);
                    }
                });
            }

            var isEmpty = numOpen() === 0;
            if (isEmpty) {
                appCache.get('windows').done(function (winCache) {
                    that.trigger('empty', true, winCache ? winCache[1] || null : null);
                });
            } else {
                that.trigger('empty', false);
            }
        });

        return that;

    }());

    /**
     * Create window
     */
    ox.ui.createWindow = (function () {

        // window guid
        var guid = 0,

            defaultPane = $('#io-ox-windowmanager-pane'),

            // window class
            Window = function (options) {

                this.options = options || {};
                this.id = options.id;
                this.name = options.name || 'generic';
                this.nodes = { title: $(), toolbar: $(), controls: $(), closeButton: $(), disabled: $() };
                this.state = { visible: false, running: false, open: false };
                this.app = null;
                this.detachable = false;
                this.simple = false;
                this.page = options.page;

                var pane = this.page ? this.page : defaultPane;

                var quitOnClose = false,
                    perspectives = {},
                    self = this,
                    firstShow = true,
                    shown = $.Deferred(),
                    name = this.name;

                this.updateToolbar = function () {
                    var folder = this.app && this.app.folder ? this.app.folder.get() : null,
                        baton = ext.Baton({ window: this, $: this.nodes, app: this.app, folder: folder });
                    ext.point(name + '/toolbar').invoke('draw', this.nodes.toolbar.empty(), baton);
                };

                ext.point(name + '/window-title').extend({
                    id: 'default',
                    draw: function () {
                        return $('<h1 class="window-title">').append(
                            ext.point(name + '/window-title-label')
                                .invoke('draw', this).first().value() || $()
                        );
                    }
                });

                ext.point(name + '/window-title-label').extend({
                    id: 'default',
                    draw: function () {
                        return $('<span class="window-title-label">');
                    }
                });

                ext.point(name + '/window-body').extend({
                    id: 'default',
                    draw: function () {
                        return this.body.append(
                            // default perspective
                            this.main = $('<div class="abs window-content">')
                        );
                    }
                });

                this.shown = shown.promise();

                function considerScrollbarWidth(element) {
                    // get scrollbar width and fix header
                    var test = $('<div style="width: 100px; visibility: hidden; overflow-y: scroll;">').appendTo('body'),
                        width = 100 - test[0].clientWidth;
                    test.remove();
                    // apply padding
                    element.css('padding-right', width);
                }

                this.setHeader = function (node, position) {
                    position = position || (_.device('!desktop') ? 'top' : coreSettings.get('features/windowHeaderPosition', 'bottom'));
                    if (position === 'top') {
                        this.nodes.header.append(node.addClass('container'));
                        this.nodes.outer.addClass('header-top');
                    } else {
                        this.nodes.footer.append(node.addClass('container'));
                        this.nodes.outer.addClass('header-bottom');
                    }
                    considerScrollbarWidth(this.nodes.header);
                    return this.nodes.header;
                };

                this.resume = function () {
                    this.show(_.noop, true);
                };

                this.show = function (cont, resume) {
                    // this is for apps that have a lot of rampup to do
                    // once they are ready trigger revealApp and it shows up
                    if (this.app && this.app.get('startHidden')) {
                        this.app.once('revealApp', function () {
                            self.app.set('startHidden', false);

                            if (self.app.get('prefetchDom')) {
                                self.nodes.outer
                                    .removeAttr('aria-hidden')
                                    .css('visibility', '');
                            }

                            // setting resume true, forces the app to become the current window.
                            self.show(cont, true);
                        });

                        // for apps that need DOM access while loading  e.g. to calculate width
                        if (this.app.get('prefetchDom')) {
                            // for a11y to hide app and prevent focus loss, but enable css calculations
                            this.nodes.outer
                                .attr('aria-hidden', true)
                                .css('visibility', 'hidden');

                            this.nodes.outer.prependTo(pane);
                        }

                        return this;
                    }

                    var appchange = false;
                    // the viewer can be a plugged application that must have a different handling that the root application
                    var appPlugged = this.app && this.app.options.plugged;
                    //todo URL changes on app change? direct links?
                    //use the url app string before the first ':' to exclude parameter additions (see how mail write adds the current mode here)
                    if (!this.floating && !appPlugged && currentWindow && _.url.hash('app') && self.name !== _.url.hash('app').split(':', 1)[0]) {
                        appchange = true;
                    }
                    ox.trigger('change:document:title', this.app.get('title'));
                    // get node and its parent node
                    var node = this.nodes.outer, parent = node.parent();
                    // if not current window or if detached (via funny race conditions)
                    if ((!appchange || resume) && self && (currentWindow !== this || parent.length === 0)) {
                        // show
                        if (node.parent().length === 0) {
                            if (this.floating) {
                                this.floating.open(true);
                            } else if (this.simple) {
                                node.insertAfter('#io-ox-appcontrol');

                                // during the iframe resizing refactoring the body node got some !important styles.
                                // we don't want to create side effects here and break the resizing again (super fragile), so we just use more important styles to allow scrolling on mobile again
                                document.body.style.setProperty('overflow-y', 'auto', 'important');
                            } else {
                                node.appendTo(pane);
                            }
                        }
                        ox.ui.windowManager.trigger('window.beforeshow', self);
                        this.trigger('beforeshow');
                        this.updateToolbar();
                        //set current appname in url, was lost on returning from edit app
                        if (!this.floating && !appPlugged && (!_.url.hash('app') || self.app.getName() !== _.url.hash('app').split(':', 1)[0])) {
                            //just get everything before the first ':' to exclude parameter additions
                            _.url.hash('app', self.app.getName());
                        }
                        node.show();

                        if (self === null) return;
                        // don't hide window if this is a floating one
                        if (!this.floating && currentWindow && currentWindow !== self && !this.page) {
                            currentWindow.hide();
                        }
                        if (!this.floating && !appPlugged) {
                            currentWindow = self;
                        }
                        _.call(cont);
                        self.state.visible = true;
                        self.state.open = true;
                        self.trigger('show');

                        if (firstShow) {
                            shown.resolve();
                            // alias for open
                            self.trigger('show:initial');
                            self.trigger('open');
                            self.state.running = true;
                            ox.ui.windowManager.trigger('window.open', self);
                            ox.trigger('app:ready', self.app);
                            firstShow = false;
                        }
                        ox.ui.windowManager.trigger('window.show', self);
                        apps.trigger('resume', self.app);

                    } else {
                        _.call(cont);
                    }
                    return this;
                };

                this.hide = function () {
                    // floating windows have their own hiding mechanism
                    if (this.floating) return;

                    if (!this.trigger) { return this; } // might have been removed (56913)

                    // detach if there are no iframes
                    this.trigger('beforehide');
                    // TODO: decide on whether or not to detach nodes
                    if (this.simple || (this.detachable && this.nodes.outer.find('iframe').length === 0)) {
                        this.nodes.outer.detach();
                        $('body').css('overflowY', '');
                    } else {
                        this.nodes.outer.hide();
                    }
                    this.state.visible = false;
                    this.trigger('hide');
                    ox.ui.windowManager.trigger('window.hide', this);
                    if (currentWindow === this) {
                        currentWindow = null;
                        // document.title = document.customTitle = ox.serverConfig.pageTitle || '';
                    }
                    return this;
                };

                this.toggle = function () {
                    if (currentWindow === this) {
                        this.hide();
                    } else {
                        this.show();
                    }
                    return this;
                };

                this.preQuit = function () {
                    if (!window.cordova) this.hide();
                    this.state.open = false;
                    if (this.floating) this.floating.minimize();
                    ox.ui.windowManager.trigger('window.pre-quit', this);
                    return this;
                };

                this.close = function () {

                    // local self
                    var self = this;

                    if (!this.trigger) { return this; } // might have been removed (56913)

                    if (quitOnClose && this.app !== null) {
                        this.trigger('beforequit');
                        this.app.quit()
                            .done(function () {
                                self.state.open = false;
                                self.state.running = false;
                                self = null;
                            });
                    } else {
                        this.hide();
                        this.state.open = false;
                        this.trigger('close');
                        ox.ui.windowManager.trigger('window.close', this);
                    }
                    return this;
                };

                var BUSY_SELECTOR = 'input:not([type="file"], [type="hidden"]), select, textarea, button';

                this.busy = function (pct, sub, callback) {
                    // use self instead of this to make busy/idle robust for callback use
                    var blocker;
                    if (self) {
                        blocker = self.nodes.blocker;
                        // steal focus
                        $('body').focus();
                        self.nodes.disabled = self.nodes.disabled.add(self.nodes.main.find(BUSY_SELECTOR)
                            .not(':disabled').prop('disabled', true));
                        if (_.isNumber(pct)) {
                            pct = Math.max(0, Math.min(pct, 1));
                            blocker.idle().find('.progress-bar').eq(0).css('width', (pct * 100) + '%').parent().show();
                            if (_.isNumber(sub)) {
                                blocker.find('.progress-bar').eq(1).css('width', (sub * 100) + '%').parent().show();
                            } else if (_.isString(sub)) {
                                blocker.find('.footer').text(sub);
                            }
                            blocker.show();
                        } else {
                            blocker.find('.progress').hide();
                            blocker.busy().show();
                        }
                        if (_.isFunction(callback)) {
                            callback.call(blocker);
                        }
                        self.trigger('busy');
                    }
                    return this;
                };

                this.idle = function () {
                    // use self instead of this to make busy/idle robust for callback use
                    if (self) {
                        self.nodes.blocker.find('.progress').hide()
                            .end().idle().hide()
                            .find('.header, .footer').empty();
                        self.nodes.disabled.prop('disabled', false);
                        self.nodes.disabled = $();
                        self.trigger('idle');
                    }
                    return this;
                };

                this.destroy = function () {
                    // hide window
                    this.hide();
                    // trigger event
                    this.trigger('destroy');
                    // disconnect from app
                    if (this.app !== null) {
                        this.app.win = null;
                        this.app = null;
                    }
                    // destroy everything
                    this.events.destroy();
                    this.show = this.busy = this.idle = $.noop;
                    this.nodes.outer.remove();
                    this.nodes = self = null;
                    return this;
                };

                this.setQuitOnClose = function (flag) {
                    quitOnClose = !!flag;
                    return this;
                };

                var title = '';

                this.getTitle = function () {
                    return title;
                };

                this.setTitle = function (str) {
                    ox.trigger('change:document:title', [str, this.app.get('title')]);
                    return this;
                };

                this.addClass = function () {
                    var o = this.nodes.outer;
                    return o.addClass.apply(o, arguments);
                };

                this.addButton = function (options) {

                    var o = $.extend({
                        label: 'Action',
                        action: $.noop
                    }, options || {});

                    return $('<div>')
                        .addClass('io-ox-toolbar-link')
                        .text(String(o.label))
                        .on('click', o.action)
                        .appendTo(this.nodes.toolbar);
                };

                this.addPerspective = function (p) {
                    if (!perspectives[p.name]) {
                        perspectives[p.name] = p;
                    }
                };

                this.getPerspective = function () {
                    var cur = this.currentPerspective.split(':')[0];
                    return perspectives[cur];
                };

                this.currentPerspective = 'main';

                this.setChromeless = function (mode) {
                    if (mode) {
                        this.nodes.outer.addClass('chromeless-window');
                        this.nodes.body.css('left', '0px');
                    } else {
                        this.nodes.outer.removeClass('chromeless-window');
                        this.nodes.body.css('left', '');
                    }
                };
            };

        // window factory
        return function (options) {

            var opt = $.extend({
                chromeless: false,
                classic: false,
                id: 'window-' + guid,
                name: '',
                title: '',
                toolbar: false,
                width: 0,
                floating: false
            }, options);

            // get width
            var meta = (String(opt.width).match(/^(\d+)(px|%)$/) || ['', '100', '%']).splice(1),
                width = meta[0],
                unit = meta[1],
                // create new window instance
                win = new Window(opt);

            // window container
            win.nodes.outer = $('<div class="window-container">').attr({ id: opt.id, 'data-window-nr': guid });

            // create very simple window?
            if (opt.simple) {
                win.simple = true;
                win.nodes.outer.addClass('simple-window').append(
                    win.nodes.main = $('<div class="window-content" tabindex="-1">')
                );
                //todo check blocker idle/busy
                win.nodes.blocker = $();
                //todo needed?
                //win.nodes.sidepanel = $();
                win.nodes.head = $();
                win.nodes.body = $();
                //todo footer?

            } else {
                win.nodes.outer.append(
                    $('<div class="window-container-center">')
                    .data({ width: width + unit })
                    .css({ width: width + unit })
                    .append(
                        // blocker
                        win.nodes.blocker = $('<div class="abs window-blocker">').hide().append(
                            $('<div class="abs header">'),
                            $('<div class="progress first"><div class="progress-bar" style="width:0"></div></div>').hide(),
                            $('<div class="progress second"><div class="progress-bar" style="width: 0"></div></div>').hide(),
                            $('<div class="abs footer">')
                        ),
                        // window HEADER
                        win.nodes.header = $('<div class="window-header">'),
                        // window SIDEPANEL
                        win.nodes.sidepanel = $('<div class="window-sidepanel collapsed">'),
                        // window BODY
                        win.nodes.body = $('<div class="window-body">'),

                        win.nodes.footer = $('<div class="window-footer">')
                    )
                    // capture controller events
                    .on('controller:quit', function () {
                        if (win.app) { win.app.quit(); }
                    })
                );

                // classic window header?
                if (opt.classic) win.nodes.outer.addClass('classic');

                // add default css class
                if (opt.name) {
                    win.nodes.outer.addClass(opt.name.replace(/[./]/g, '-') + '-window');
                }

                ext.point(opt.name + '/window-body').invoke('draw', win.nodes);
            }

            // add event hub
            Events.extend(win);

            if (opt.search) {
                console.warn('search is deprecated with 7.6.0. Please use io.ox/find instead');
            }

            if (opt.facetedsearch) {
                console.warn('io.ox/search is deprecated with 7.8.0. Please use io.ox/find instead');
            }

            if (opt.find && supportsFind(opt.name)) {

                ext.point('io.ox/find/view').extend({
                    id: 'view',
                    index: 100,
                    draw: function (baton) {
                        baton.$.viewnode = $('<div class="generic-toolbar top io-ox-find" role="search">');

                        // add nodes
                        this.nodes.sidepanel
                            .append(baton.$.viewnode)
                            .addClass('top-toolbar');
                    }
                });

                ext.point('io.ox/find/view').extend({
                    id: 'subviews',
                    index: 200,
                    draw: function (baton) {
                        baton.$.viewnode.append(
                            $('<div class="sr-only arialive" role="status" aria-live="polite">'),
                            baton.$.box = $('<form class="search-box">'),
                            baton.$.boxfilter = $('<div class="search-box-filter">')
                        );
                    }
                });

                ext.point('io.ox/find/view').extend({
                    id: 'form',
                    index: 300,
                    draw: function (baton) {
                        // share data
                        _.extend(baton.data, {
                            label: gt('Search'),
                            id: _.uniqueId('search')
                            // guid:  _.uniqueId('form-control-description-')
                        });
                        // search box form
                        baton.$.group = $('<div class="form-group has-feedback">').append(
                            $('<input type="text" class="form-control has-feedback search-field tokenfield-placeholder f6-target">').attr({
                                'aria-labelledby': baton.data.id,
                                placeholder: baton.data.label + '...'
                            })
                        );
                        // add to searchbox area
                        baton.$.box.append(
                            baton.$.group
                        );
                    }
                });

                ext.point('io.ox/find/view').extend({
                    id: 'buttons',
                    index: 400,
                    draw: function (baton) {
                        baton.$.group.append(
                            // search
                            $('<button type="button" class="btn btn-link form-control-feedback action action-show" data-toggle="tooltip" data-placement="bottom" data-animation="false" data-container="body">')
                                .attr({
                                    'data-original-title': gt('Start search'),
                                    'aria-label': gt('Start search'),
                                    'id': baton.data.id
                                }).append($('<i class="fa fa-search" aria-hidden="true">'))
                                .tooltip(),
                            // cancel/reset
                            $('<button type="button" class="btn btn-link form-control-feedback action action-cancel" data-toggle="tooltip" data-placement="bottom" data-animation="false" data-container="body">')
                                .attr({
                                    'data-original-title': gt('Cancel search'),
                                    'aria-label': gt('Cancel search')
                                }).append($('<i class="fa fa-times-circle" aria-hidden="true">'))
                                .tooltip()
                        );
                    }
                });

                /*

                A11y NOTE: This does not work like this. Instructions indicating a position on screen has no meaning to blind users.
                Also the label serves no purpose here, the best workaround in the moment is to attach a title to the input field.

                ext.point('io.ox/find/view').extend({
                    id: 'screenreader',
                    index: 500,
                    draw: function (baton) {
                        baton.$.group.append(
                            // sr label
                            $('<label class="sr-only">')
                                .attr('for', baton.data.id)
                                .text(baton.data.label),
                            // sr description
                            $('<p class="sr-only sr-description">').attr({ id: baton.data.guid })
                                .text(
                                    //#. search feature help text for screenreaders
                                    gt('Search results page lists all active facets to allow them to be easly adjustable/removable. Below theses common facets additonal advanced facets are listed. To narrow down search result please adjust active facets or add new ones')
                                )
                        );
                    }
                });
                */

                // draw searchfield and attach lazy load listener
                ext.point('io.ox/find/view').invoke('draw', win, ext.Baton.ensure({}));
            }

            // fix height/position/appearance
            if (opt.chromeless) win.setChromeless(true);

            // inc
            guid++;

            // return window object
            return win;
        };

    }());

    // wraps require function
    ox.load = (function () {

        var def,
            $blocker = $('#background-loader'),
            buttonTimer,
            launched;

        function startTimer() {
            var blockerTimer = setTimeout(function () {
                // visualize screen blocker
                ox.busy(true);
                buttonTimer = setTimeout(function () {
                    // add button to abort
                    if (!$blocker[0].firstChild) {
                        var button = $('<button type="button" class="btn btn-primary">').text(gt('Cancel')).fadeIn();
                        button.on('click', function () {
                            def.reject(true);
                            clear(blockerTimer);
                        });
                        $blocker
                            .append(button);
                        button.focus();
                    }
                }, 5000);
            }, 1000);
            return blockerTimer;
        }

        function clear(blockerTimer) {
            clearTimeout(blockerTimer);
            clearTimeout(buttonTimer);
            blockerTimer = null;
            buttonTimer = null;
            setTimeout(function () {
                if (blockerTimer === null) {
                    ox.idle();
                }
            }, 0);
        }

        function clearViaLauncher(blockerTimer) {
            // launched is a deferred used for a delayed clear
            launched.always(function () {
                clear(blockerTimer);
            });
        }

        return function (req, data) {
            assert(arguments.length <= 1 || arguments.length === 2 && !_.isFunction(data), 'ox.load does not support callback params.');

            def = $.Deferred();
            launched = data && data.launched ? data.launched : $.Deferred().resolve();

            // block UI
            if (!$blocker.hasClass('secure')) {
                ox.busy();
            }
            var blockertimer = startTimer();

            require(req).always(clearViaLauncher(blockertimer)).then(
                def.resolve,
                function fail(errcode) {
                    console.error(errcode);
                    def.reject(false);
                    if (_.isArray(req)) {
                        for (var i = 0; i < req.length; i++) {
                            requirejs.undef(req[i]);
                        }
                    }
                }
            );

            return def;
        };
    }());

    // simple launch
    ox.launch = function (id, data) {
        var def = $.Deferred(), loadStart = Date.now();
        if (_.isString(id)) {
            adaptiveLoader.stop();
            var requirements = adaptiveLoader.startAndEnhance(id.replace(/\/main$/, ''), [id]);
            ox.load(requirements, data).then(
                function (m) {
                    if (!m || !m.getApp) {
                        console.error('Couldn\'t launch app', id, m);
                        def.resolve({});
                        return;
                    }
                    m.getApp(data).launch(data).done(function () {
                        def.resolveWith(this, arguments);
                        ox.trigger('loadtime', { app: this, id: id, loadStart: loadStart, loadEnd: Date.now() });
                    });
                },
                function () {
                    notifications.yell('error', gt('Failed to start application. Maybe you have connection problems. Please try again.'));
                    requirejs.undef(id);
                }
            );
        } else {
            def.resolve({});
        }
        return def;
    };

    apps.on('resume', function (app) {
        adaptiveLoader.stop();
        adaptiveLoader.listen(app.get('name'));
    });

    return ox.ui;
});
