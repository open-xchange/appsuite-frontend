/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/core/desktop', [
    'io.ox/core/event',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/cache',
    'io.ox/core/notifications',
    'io.ox/core/upsell',
    'io.ox/core/adaptiveLoader',
    'io.ox/core/folder/api',
    'io.ox/find/main',
    'settings!io.ox/core',
    'gettext!io.ox/core',
    'io.ox/core/sessionrestore' //just load the class, no direct use
], function (Events, ext, links, cache, notifications, upsell, adaptiveLoader, api, findFactory, coreConfig, gt) {

    'use strict';

    /**
     * Core UI
     */

    // current window
    var currentWindow = null;

    // top bar
    var appGuid = 0,
        appCache = new cache.SimpleCache('app-cache', true);

    // Apps collection
    ox.ui.apps = new Backbone.Collection();

    var AbstractApp = Backbone.Model.extend({

        defaults: {
            title: ''
        },

        initialize: function (options) {
            var self = this;
            this.guid = appGuid++;
            this.id = this.id || 'app-' + appGuid;
            this.options = options || {};
            this.getInstance = function () {
                return self;
            };
        },

        setCounter: function (text, options) {
            if (!this.get('topbarNode')) {
                return;
            }
            if (!this.badge && this.get('topbarNode')) {
                this.badge = this.get('topbarNode').find('.topbar-launcherbadge');
                if (this.badge.length === 0) {
                    this.badge = $('<span class="badge topbar-launcherbadge">');
                }
                this.get('topbarNode').find('a.apptitle').append(this.badge);
            }
            var oldText = this.badge.text();

            this.badge.text(text);
            if (options.arialabel) {
                this.badge.attr('aria-label', options.arialabel);
            }
            if (oldText !== text) {
                ox.trigger('recalculate-topbarsize');
            }
            if (!text) {
                this.badge.hide();
            } else {
                this.badge.show();
            }
        },

        getName: function () {
            return this.get('name');
        },

        setTitle: function (title) {
            this.set('title', title);
            return this;
        },

        getTitle: function () {
            return this.get('title');
        },

        saveRestorePoint: $.noop,

        call: $.noop
    });

    ox.ui.AppPlaceholder = AbstractApp.extend({

        initialize: function () {
            // call super constructor
            AbstractApp.prototype.initialize.apply(this, arguments);
        },

        launch: function () {
            var self = this, id = (this.get('name') || this.id) + '/main', requires = this.get('requires');
            if (upsell.has(requires)) {
                //resolve/reject clears busy animation
                var def = $.Deferred();
                return ox.launch(id, { launched: def.promise() })
                         .then(function () { self.quit(); })
                         .always(def.resolve);
            } else {
                upsell.trigger({ type: 'app', id: id, missing: upsell.missing(requires) });
                return $.when();
            }
        },

        quit: function () {
            // mark as not running
            this.set('state', 'stopped');
            // remove from list
            ox.ui.apps.remove(this);
        }
    });

    var apputil = {
        LIMIT: 60000,
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
                //notify user
                if (!('exceeded' in data)) {
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

                that = {

                    initialized: initialized.promise(),

                    unset: function () {
                        // unset
                        folder = null;
                        // update window title?
                        if (win) {
                            win.setTitle(_.noI18n(''));
                        }
                        // update grid?
                        if (grid) {
                            grid.clear();
                        }
                    },

                    set: (function () {

                        function change(id, data, app, def) {
                            //app has changed while folder was requested
                            var appchange = _.url.hash('app') !== app;
                            // remember
                            folder = String(id);
                            //only change if the app did not change
                            if (!appchange) {
                                // update window title & toolbar?
                                if (win) {
                                    win.setTitle(_.noI18n(data.title || ''));
                                    win.updateToolbar();
                                }
                                // update grid?
                                if (grid && grid.prop('folder') !== folder) {
                                    grid.busy().prop('folder', folder);
                                    grid.refresh();
                                    // load fresh folder & trigger update event
                                    api.reload(id);
                                }
                                // update hash
                                _.url.hash('folder', folder);
                                self.trigger('folder:change', folder, data);
                            }
                            def.resolve(data, appchange);

                            if (initialized.state() !== 'resolved') {
                                initialized.resolve(folder, data);
                            }
                        }

                        return function (id) {
                            var def = $.Deferred();
                            if (id !== undefined && id !== null && String(id) !== folder) {

                                var app = _.url.hash('app');
                                var model = api.pool.getModel(id), data = model.toJSON();

                                if (model.has('title')) {
                                    change(id, data, app, def);
                                } else {
                                    api.get(id).then(
                                        function success(data) {
                                            change(id, data, app, def);
                                        },
                                        function fail() {
                                            console.warn('Failed to change folder', id);
                                            def.reject();
                                        }
                                    );
                                }
                            } else if (String(id) === folder) {
                                // see Bug 34927 - [L3] unexpected application error when clicking on "show all messages in inbox" in notification area
                                var model = api.pool.getModel(id), data = model.toJSON();
                                def.resolve(data, false);
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
                        var def = new $.Deferred();
                        require(['settings!io.ox/mail'], function (mailConfig) {
                            var defaultFolder = type === 'mail' ? mailConfig.get('folder/inbox') : coreConfig.get('folder/' + type);
                            if (defaultFolder) {
                                that.set(defaultFolder)
                                    .done(def.resolve)
                                    .fail(def.reject);
                            } else {
                                def.reject({ error: gt('Could not get a default folder for this application.') });
                            }
                        });
                        return def;
                    },

                    get: function () {
                        return folder;
                    },

                    getData: function () {

                        if (folder === null) return $.Deferred().resolve({});

                        var model = api.pool.getModel(folder);
                        return $.Deferred().resolve(model.toJSON());
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
                    }
                };

                return that;
            }());
        },

        setLauncher: function (fn) {
            this.set('launch', fn);
            return this;
        },

        setQuit: function (fn) {
            this.set('quit', fn);
            return this;
        },

        setWindow: function (win) {
            this.set('window', win);
            win.app = this;
            // add app name
            if (this.has('name')) {
                win.nodes.outer.attr('data-app-name', this.get('name'));
            }
            return this;
        },

        getWindow: function () {
            return this.get('window');
        },

        searchable: function () {
            if (this.get('find')) return;

            var find = findFactory.getApp({ parent: this });
            //TODO: bottleneck
            find.prepare();
            this.set('find', find);
            return this;
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
         * window, the document, or the <body> element) that listens to the
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
         *  The event handler function bound to the specified events. Will be
         *  triggered once automatically when the application window becomes
         *  visible.
         *
         * @returns {ox.io.App}
         *  A reference to this application instance.
         */
        registerGlobalEventHandler: function (target, eventType, eventHandler) {
            var handlers = {
                show: function () {
                    $(target).on(eventType, eventHandler);
                    eventHandler();
                },
                hide: function () {
                    $(target).off(eventType, eventHandler);
                }
            };
            if (this.getWindow().on(handlers).state.visible) handlers.show();
            return this;
        },

        /**
         * Registers an event handler at the browser window that listens to
         * 'resize' events. The event handler will only be active while the
         * application window is visible, and will be inactive while the
         * application window is hidden.
         *
         * @param {Function} resizeHandler
         *  The resize handler function bound to 'resize' events of the browser
         *  window. Will be triggered once automatically when the application
         *  window becomes visible.
         *
         * @returns {ox.io.App}
         *  A reference to this application instance.
         */
        registerWindowResizeHandler: function (resizeHandler) {
            return this.registerGlobalEventHandler(window, 'resize', resizeHandler);
        },

        setState: function (obj) {
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
                name = this.getName(),
                isDisabled = ox.manifests.isDisabled(name + '/main');

            // update hash
            if (name !== _.url.hash('app')) {
                _.url.hash({ folder: null, perspective: null, id: null });
            }
            if (name) {
                _.url.hash('app', name);
            }

            if (this.get('state') === 'ready') {
                this.set('state', 'initializing');
                ox.trigger('app:init', this);
                if (isDisabled) {
                    deferred = $.Deferred().reject();
                } else {
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
                }
                deferred.then(
                    function success() {
                        ox.ui.apps.add(self);
                        self.set('state', 'running');
                        self.trigger('launch', self);
                        ox.trigger('app:start', self);
                    },
                    function fail() {
                        var autoStart = require('settings!io.ox/core').get('autoStart');
                        if (autoStart !== 'none') ox.launch(autoStart);
                    }
                );
            } else if (this.has('window')) {
                // toggle app window
                this.get('window').show();
                this.trigger('resume', this);
                ox.trigger('app:resume', this);
            }

            return deferred.pipe(function () {
                return $.Deferred().resolveWith(self, arguments);
            });
        },

        quit: function (force) {
            // call quit function
            var def = force ? $.when() : (this.get('quit').call(this) || $.when()), win, self = this;
            return def.done(function () {
                // not destroyed?
                if (force && self.destroy) {
                    self.destroy();
                }
                // update hash but don't delete information of other apps that might already be open at this point (async close when sending a mail for exsample);
                if ((self.getWindow() && self.getWindow().state.visible) && (!_.url.hash('app') || self.getName() === _.url.hash('app').split(':', 1)[0])) {
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
                // remove from list
                ox.ui.apps.remove(self);
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
                return ox.ui.App.getSavePoints().then(function (list) {
                    // might be null, so:
                    list = list || [];
                    var data, ids, pos;
                    try {
                        data = self.failSave();
                        ids = _(list).pluck('id');
                        pos = _(ids).indexOf(uniqueID);
                        if (data) {
                            data.id = uniqueID;
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
                    } else {
                        return $.when();
                    }
                });
            } else {
                return $.when();
            }
        },

        removeRestorePoint: function () {
            var uniqueID = this.get('uniqueID');
            ox.ui.App.removeRestorePoint(uniqueID);
        }
    });

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
                return list && list.length;
            });
        },

        getSavePoints: function () {
            return appCache.get('savepoints').then(function (list) {
                if (!list || _.isEmpty(list)) {
                    list = coreConfig.get('savepoints', []);
                }
                return _(list || []).filter(function (obj) {
                    var hasPoint = 'point' in obj,
                        sameUA = obj.ua === navigator.userAgent;
                    return (hasPoint && sameUA);
                });
            });
        },

        setSavePoints: function (list) {
            list = list || [];
            coreConfig.set('savepoints', list).save();
            return appCache.add('savepoints', list);
        },

        removeAllRestorePoints: function () {
            return this.setSavePoints([]);
        },

        removeRestorePoint: function (id) {
            var self =  this;
            return this.getSavePoints().then(function (list) {
                list = list || [];
                var ids = _(list).pluck('id'),
                    pos = _(ids).indexOf(id);
                list = list.slice();
                if (pos > -1) {
                    list.splice(pos, 1);
                }
                return self.setSavePoints(list).then(function () {
                    return list;
                });
            });
        },

        restore: function () {
            var self = this;
            return this.getSavePoints().then(function (data) {
                return $.when.apply($,
                    _(data).map(function (obj) {
                        adaptiveLoader.stop();
                        var requirements = adaptiveLoader.startAndEnhance(obj.module, [obj.module + '/main']);
                        return ox.load(requirements).pipe(function (m) {
                            return m.getApp().launch().then(function () {
                                // update unique id
                                obj.id = this.get('uniqueID');
                                if (this.failRestore) {
                                    // restore
                                    return this.failRestore(obj.point);
                                }
                            });
                        });
                    })
                )
                .done(function () {
                    // we don't remove that savepoint now because the app might crash during restore!
                    // in this case, data would be lost
                    self.setSavePoints(data);
                });
            });
        },

        get: function (name) {
            return ox.ui.apps.filter(function (app) {
                return app.getName() === name;
            });
        },

        getByCid: function (cid) {
            return ox.ui.apps.chain().filter(function (app) {
                return app.cid === cid;
            }).first().value();
        },

        reuse: function (cid) {
            var app = ox.ui.apps.find(function (m) { return m.cid === cid; });
            if (app) {
                app.launch();
                return true;
            }
            return false;
        },

        getCurrentApp: function () {
            return currentWindow !== null ? currentWindow.app : null;
        },

        getCurrentWindow: function () {
            return currentWindow;
        }
    });

    // show
    $('#io-ox-core').show();

    // check if any open application has unsaved changes
    window.onbeforeunload = function () {

        // find all applications with unsaved changes
        var dirtyApps = ox.ui.apps.filter(function (app) {
                return _.isFunction(app.hasUnsavedChanges) && app.hasUnsavedChanges();
            });

        // browser will show a confirmation dialog, if onbeforeunload returns a string
        if (dirtyApps.length > 0) {
            return gt('There are unsaved changes.');
        }
    };

    /**
     * Create app
     */
    ox.ui.createApp = function (options) {
        return new ox.ui.App(options);
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
                        if (screenId !== id) {
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
            // show window managher
            this.show();
            // move/add window to top of stack
            windows = _(windows).without(win);
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
                    if (w !== win && w.state.open) {
                        w.show();
                        break;
                    }
                }
                //remove the window from cache if it's there
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

            pane = $('#io-ox-windowmanager-pane'),

            // window class
            Window = function (options) {

                this.options = options || {};
                this.id = options.id;
                this.name = options.name || 'generic';
                this.nodes = { title: $(), toolbar: $(), controls: $(), closeButton: $() };
                this.state = { visible: false, running: false, open: false };
                this.app = null;
                this.detachable = false;
                this.simple = false;
                this.page = options.page;

                if (this.page) pane = this.page;

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

                ext.point(name + '/window-toolbar').extend({
                    id: 'default',
                    draw: function () {
                        return $('<nav class="window-toolbar">')
                            .addClass('f6-target')
                            .attr({
                                'role': 'toolbar',
                                'aria-label': gt('Application Toolbar')
                            });
                    }
                });

                ext.point(name + '/window-head').extend({
                    id: 'default',
                    draw: function () {
                        return this.head.append(
                            this.toolbar = ext.point(name + '/window-toolbar')
                                .invoke('draw', this).first().value() || $()
                        );
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

                this.setHeader = function (node) {
                    this.nodes.header.append(node.addClass('container'));
                    this.nodes.outer.addClass('header-top');
                    considerScrollbarWidth(this.nodes.header);
                    return this.nodes.header;
                };

                this.show = function (cont) {
                    var appchange = false;
                    //use the url app string before the first ':' to exclude parameter additions (see how mail write adds the current mode here)
                    if (currentWindow && _.url.hash('app') && self.name !== _.url.hash('app').split(':', 1)[0]) {
                        appchange = true;
                    }
                    // get node and its parent node
                    var node = this.nodes.outer, parent = node.parent();
                    // if not current window or if detached (via funny race conditions)
                    if (!appchange && self && (currentWindow !== this || parent.length === 0)) {
                        // show
                        if (node.parent().length === 0) {
                            if (this.simple) {
                                node.insertAfter('#io-ox-topbar');
                                $('body').css('overflowY', 'auto');
                            } else {
                                node.appendTo(pane);
                            }
                        }
                        ox.ui.windowManager.trigger('window.beforeshow', self);
                        this.trigger('beforeshow');
                        this.updateToolbar();
                        //set current appname in url, was lost on returning from edit app
                        if (!_.url.hash('app') || self.app.getName() !== _.url.hash('app').split(':', 1)[0]) {
                            //just get everything before the first ':' to exclude parameter additions
                            _.url.hash('app', self.app.getName());
                        }
                        node.show();

                        if (self === null) return;
                        if (currentWindow && currentWindow !== self && !this.page) {
                            currentWindow.hide();
                        }
                        currentWindow = self;
                        _.call(cont);
                        self.state.visible = true;
                        self.state.open = true;
                        self.trigger('show');
                        if (_.device('!smartphone')) {
                            document.title = document.customTitle = gt.format(
                                //#. Title of the browser window
                                //#. %1$s is the name of the page, e.g. OX App Suite
                                //#. %2$s is the title of the active app, e.g. Calendar
                                gt.pgettext('window title', '%1$s %2$s'),
                                _.noI18n(ox.serverConfig.pageTitle),
                                _.noI18n(self.getTitle())
                            );
                        } else {
                            document.title = document.customTitle = _.noI18n(ox.serverConfig.pageTitle);
                        }

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
                        ox.ui.apps.trigger('resume', self.app);

                    } else {
                        _.call(cont);
                    }
                    return this;
                };

                this.hide = function () {
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
                        document.title = document.customTitle = _.noI18n(ox.serverConfig.pageTitle);
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
                    this.trigger('pre-quit');
                    ox.ui.windowManager.trigger('window.pre-quit', this);
                    return this;
                };

                this.close = function () {

                    // local self
                    var self = this;

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

                var BUSY_SELECTOR = 'input:not([type="file"], [type="hidden"]), select, textarea, button',
                    TOGGLE_CLASS = 'toggle-disabled';

                this.busy = function (pct, sub, callback) {
                    // use self instead of this to make busy/idle robust for callback use
                    var blocker;
                    if (self) {
                        blocker = self.nodes.blocker;
                        // steal focus
                        $('body').focus();
                        self.nodes.main.find(BUSY_SELECTOR)
                            .not(':disabled').prop('disabled', true).addClass(TOGGLE_CLASS);
                        if (_.isNumber(pct)) {
                            pct = Math.max(0, Math.min(pct, 1));
                            blocker.idle().find('.progress-bar').eq(0).css('width', (pct * 100) + '%').parent().show();
                            if (_.isNumber(sub)) {
                                blocker.find('.progress-bar').eq(1).css('width', (sub * 100) + '%').parent().show();
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
                        self.nodes.main.find(BUSY_SELECTOR).filter('.' + TOGGLE_CLASS)
                            .prop('disabled', false).removeClass(TOGGLE_CLASS);
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
                    if (_.isString(str)) {
                        title = str;
                        self.nodes.title.find('span').first().text(title);
                        if (this === currentWindow) {
                            if (_.device('!smartphone')) {
                                document.title = document.customTitle = gt.format(
                                    //#. Title of the browser window
                                    //#. %1$s is the name of the page, e.g. OX App Suite
                                    //#. %2$s is the title of the active app, e.g. Calendar
                                    gt.pgettext('window title', '%1$s %2$s'),
                                    _.noI18n(ox.serverConfig.pageTitle),
                                    _.noI18n(title)
                                );
                            } else {
                                document.title = document.customTitle = _.noI18n(ox.serverConfig.pageTitle);
                            }
                        }
                        this.trigger('change:title');
                    } else {
                        console.error('window.setTitle(str) expects string!', str);
                    }
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
                        this.nodes.head.hide();
                        this.nodes.body.css('left', '0px');
                    } else {
                        this.nodes.outer.removeClass('chromeless-window');
                        this.nodes.head.show();
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
                width: 0
            }, options);

            // get width
            var meta = (String(opt.width).match(/^(\d+)(px|%)$/) || ['', '100', '%']).splice(1),
                width = meta[0],
                unit = meta[1],
                // create new window instance
                win = new Window(opt);

            // window container
            win.nodes.outer = $('<div class="window-container">')
                .attr({ id: opt.id, 'data-window-nr': guid });

            // create very simple window?
            if (opt.simple) {
                win.simple = true;
                win.nodes.outer.addClass('simple-window').append(
                    win.nodes.main = $('<div class="window-content" tabindex="-1">')
                );
                win.nodes.blocker = $();
                win.nodes.sidepanel = $();
                win.nodes.head = $();
                win.nodes.body = $();

            } else {

                win.nodes.outer.append(
                    $('<div class="window-container-center">')
                    .data({ width: width + unit })
                    .css({ width: width + unit })
                    .append(
                        // blocker
                        win.nodes.blocker = $('<div class="abs window-blocker">').hide().append(
                            $('<div class="abs header">'),
                            $('<div class="progress progress-striped active first"><div class="progress-bar" style="width: 0%;"></div></div>').hide(),
                            $('<div class="progress progress-striped progress-warning active second"><div class="progress-bar" style="width: 0%;"></div></div>').hide(),
                            $('<div class="abs footer">')
                        ),
                        // window HEAD
                        // @deprecated
                        win.nodes.head = $('<div class="window-head">'),
                        // window HEADER
                        win.nodes.header = $('<div class="window-header">'),
                        // window SIDEPANEL
                        win.nodes.sidepanel = $('<div class="window-sidepanel collapsed">'),
                        // window BODY
                        win.nodes.body = $('<div class="window-body" role="main">').attr('aria-label', gt('Main window'))
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
                    win.nodes.outer.addClass(opt.name.replace(/[.\/]/g, '-') + '-window');
                }

                // draw window head
                ext.point(opt.name + '/window-head').invoke('draw', win.nodes);
                ext.point(opt.name + '/window-body').invoke('draw', win.nodes);
            }

            // add event hub
            Events.extend(win);

            if (opt.search)
                console.warn('search is deprecated with 7.6.0. Please use io.ox/find instead');

            if (opt.facetedsearch) {
                console.warn('io.ox/search is deprecated with 7.8.0. Please use io.ox/find instead');
            }

            if (opt.find) {

                ext.point('io.ox/find/view').extend({
                    id: 'view',
                    index: 100,
                    draw: function (baton) {
                        baton.$.viewnode = $('<div class="generic-toolbar top io-ox-find">');

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
                            id:  win.name + '-search-field',
                            guid:  _.uniqueId('form-control-description-')
                        });
                        // search box form
                        baton.$.group = $('<div class="form-group has-feedback">')
                            .append(
                                $('<input type="text">')
                                .attr({
                                    class: 'form-control has-feedback search-field tokenfield-placeholder f6-target',
                                    tabindex: 1,
                                    role: 'search',
                                    id: baton.data.id,
                                    placeholder: baton.data.label + '...',
                                    'aria-describedby': baton.data.guid
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
                            $('<i>')
                                .attr({
                                    'tabindex': '-1',
                                    'class': 'fa fa-search form-control-feedback action action-show',
                                    'data-toggle': 'tooltip',
                                    'data-placement': 'bottom',
                                    'data-animation': 'false',
                                    'data-container': 'body',
                                    'data-original-title': gt('Start search'),
                                    'aria-label': gt('Start search')
                                })
                                .tooltip(),
                            // cancel/reset
                            $('<i>')
                                .attr({
                                    'tabindex': '-1',
                                    'class': 'fa fa-times-circle form-control-feedback action action-cancel',
                                    'data-toggle': 'tooltip',
                                    'data-placement': 'bottom',
                                    'data-animation': 'false',
                                    'data-container': 'body',
                                    'data-original-title': gt('Cancel search'),
                                    'aria-label': gt('Cancel search')
                                })
                                .tooltip()
                        );
                    }
                });

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

                // draw searchfield and attach lazy load listener
                ext.point('io.ox/find/view').invoke('draw', win, ext.Baton.ensure({}));
            }

            // fix height/position/appearance
            if (opt.chromeless) {

                win.setChromeless(true);

            } else if (opt.name) {

                // toolbar
                ext.point(opt.name + '/toolbar').extend(new links.ToolbarLinks({
                    id: 'links',
                    ref: opt.name + '/links/toolbar'
                }));

                // add fullscreen handler
                if (opt.fullscreen === true) {

                    new links.Action(opt.name + '/actions/fullscreen', {
                        action:  function (baton) {
                            if (BigScreen.enabled) {
                                BigScreen.toggle(baton.$.outer.get(0));
                            }
                        }
                    });

                    new links.ActionLink(opt.name + '/links/toolbar/fullscreen', {
                        ref: opt.name + '/actions/fullscreen'
                    });

                    new links.ActionGroup(opt.name + '/links/toolbar', {
                        id: 'fullscreen',
                        index: 1000,
                        icon: function () {
                            return $('<i class="fa fa-expand">');
                        }
                    });
                }
            }
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

    ox.busy = function (block) {
        // init screen blocker
        $('#background-loader')[block ? 'busy' : 'idle']()
            .show()
            .addClass('secure' + (block ? ' block' : ''));
    };

    ox.idle = function () {
        $('#background-loader')
            .removeClass('secure block')
            .hide()
            .idle()
            .empty();
    };
    // only disable, don't show night-rider
    ox.disable = function () {
        $('#background-loader')
            .addClass('busy block secure')
            .on('touchmove', function (e) {
                e.preventDefault();
                return false;
            })
            .show();
    };

    // simple launch
    ox.launch = function (id, data) {
        var def = $.Deferred();
        if (_.isString(id)) {
            adaptiveLoader.stop();
            var requirements = adaptiveLoader.startAndEnhance(id.replace(/\/main$/, ''), [id]);
            ox.load(requirements, data).then(
                function (m) {
                    m.getApp(data).launch(data).done(function () {
                        def.resolveWith(this, arguments);
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

    ox.ui.apps.on('resume', function (app) {
        adaptiveLoader.stop();
        adaptiveLoader.listen(app.get('name'));
    });

    return {};
});
