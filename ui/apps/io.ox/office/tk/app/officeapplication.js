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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/tk/app/officeapplication',
    ['io.ox/files/api',
     'io.ox/office/tk/utils',
     'io.ox/office/tk/io',
     'gettext!io.ox/office/main'
    ], function (FilesAPI, Utils, IO, gt) {

    'use strict';

    // class OfficeApplication ================================================

    /**
     * A mix-in class that defines common public methods for an application
     * that is based on a document file.
     *
     * Triggers the events supported by the base class ox.ui.App, and the
     * following additional events:
     * - 'docs:init': Once during launch, after this application instance has
     *      been constructed completely, before the registered launch handlers
     *      will be called. Note that the calling order of the event listeners
     *      is not defined. See method OfficeApplication.registerInitHandler()
     *      for an alternative.
     * - 'docs:init:after': Once during launch, after the registered launch
     *      handlers have been called.
     * - 'docs:init:success': Directly after the event 'docs:init:after', if
     *      all initialization handlers returned successfully.
     * - 'docs:init:error': Directly after the event 'docs:init:after', if any
     *      initialization handler failed.
     * - 'docs:import:before': Once during launch before the document described
     *      in the file descriptor will be imported.
     * - 'docs:import:after': Once during launch, after the document described
     *      in the file descriptor has been imported (successfully or not).
     * - 'docs:import:success': Directly after the event 'docs:import:after',
     *      if the document described in the file descriptor has been imported
     *      successfully.
     * - 'docs:import:error': Directly after the event 'docs:import:after',
     *      if an error occurred while importing the document described in the
     *      file descriptor.
     * - 'docs:quit': Before the application will be really closed, after all
     *      registered before-quit handlers have been called, and none has
     *      rejected quitting, and before the application will be destroyed.
     * - 'docs:resume': After all registered before-quit handlers have been
     *      called, and at least one has rejected quitting. The application
     *      continues to run normally.
     *
     * @constructor
     *
     * @extends ox.ui.App
     *
     * @param {Function} ModelClass
     *  The constructor function of the document model class. MUST derive from
     *  the class Model. Receives a reference to this application instance.
     *  MUST NOT use the methods OfficeApplication.getModel(),
     *  OfficeApplication.getView(), or OfficeApplication.getController()
     *  during construction. For further initialization depending on valid
     *  model/view/controller instances, the constructor can register an event
     *  handler for the 'docs:init' event of this application, or register an
     *  initialization handler with the OfficeApplication.registerInitHandler()
     *  method.
     *
     * @param {Function} ViewClass
     *  The constructor function of the view class. MUST derive from the class
     *  View. Receives a reference to this application instance. MUST NOT use
     *  the methods OfficeApplication.getModel(), OfficeApplication.getView(),
     *  or OfficeApplication.getController() during construction. For further
     *  initialization depending on valid model/view/controller instances, the
     *  constructor can register an event handler for the 'docs:init' event of
     *  this application, or register an initialization handler with the
     *  OfficeApplication.registerInitHandler() method.
     *
     * @param {Function} ControllerClass
     *  The constructor function of the controller class. MUST derive from the
     *  class Controller. Receives a reference to this application instance.
     *  MUST NOT use the methods OfficeApplication.getModel(),
     *  OfficeApplication.getView(), or OfficeApplication.getController()
     *  during construction. For further initialization depending on valid
     *  model/view/controller instances, the constructor can register an event
     *  handler for the 'docs:init' event of this application, or register an
     *  initialization handler with the OfficeApplication.registerInitHandler()
     *  method.
     *
     * @param {Function} importHandler
     *  A function that will be called to import the document described in the
     *  file descriptor of this application. Will be called once after
     *  launching the application regularly, or after restoring the application
     *  from a save point after the browser has been opened or the web page has
     *  been reloaded. Will be called in the context of this application. If
     *  called from fail-restore, receives the save point as first parameter.
     *  Must return a Deferred object that will be resolved or rejected after
     *  the document has been loaded.
     *
     * @param {Object} launchOptions
     *  A map of options containing initialization data for the new application
     *  object. The following options are supported directly:
     *  @param {Boolean} [launchOptions.search=false]
     *      If set to true, the application will show and use the global search
     *      tool bar.
     *  @param {Boolean} [launchOptions.detachable=true]
     *      If set to false, the application window will not be detached from
     *      the DOM while it is hidden.
     */
    function OfficeApplication(ModelClass, ViewClass, ControllerClass, importHandler, launchOptions) {

        var // self reference
            self = this,

            // file descriptor of the document edited by this application
            file = Utils.getObjectOption(launchOptions, 'file', null),

            // all registered initialization handlers
            initHandlers = [],

            // all registered before-quit handlers
            beforeQuitHandlers = [],

            // all registered fail-save handlers
            failSaveHandlers = [],

            // the document model instance
            model = null,

            // application view: contains panes, tool bars, etc.
            view = null,

            // the controller instance as single connection point between model and view
            controller = null,

            // browser timeouts for delayed callbacks, mapped by initial setTimeout() call
            delayTimeouts = {},

            // browser timeouts for debounced methods, mapped by their indexes
            debounceTimeouts = {},

            // counter for unique indexes of all debounced methods
            debounceCount = 0;

        // private methods ----------------------------------------------------

        /**
         * Imports the document described by the current file descriptor, by
         * calling the import handler passed to the constructor. Does nothing
         * (but return a resolved Deferred object), if no file descriptor
         * exists.
         *
         * @param {Object} [point]
         *  The save point if called from fail-restore.
         *
         * @returns {jQuery.Promise}
         *  The result of the import handler passed to the constructor of this
         *  application.
         */
        function importDocument(point) {

            var // the application window
                win = self.getWindow();

            // do nothing if file descriptor is missing (e.g. while restoring after browser refresh)
            if (!file) { return $.when(); }

            // set window to busy state while the import handler is running
            win.busy();

            // notify listeners
            self.trigger('docs:import:before');

            // call the import handler
            return importHandler.call(self, point)
                .always(function () {
                    self.trigger('docs:import:after');
                })
                .done(function () {
                    self.trigger('docs:import:success');
                })
                .fail(function () {
                    Utils.warn('OfficeApplication.launch(): importing document ' + file.filename + ' failed.');
                    view.showError(gt('Load Error'), gt('An error occurred while loading the document.'));
                    self.trigger('docs:import:error');
                })
                .always(function () {
                    win.idle();
                });
        }

        /**
         * Calls all handler functions contained in the passed array, and
         * returns a Deferred object that accumulates the result of all
         * handlers.
         */
        function callHandlers(handlers) {

            var // execute all handlers and store their results in an array
                results = _(handlers).map(function (handler) { return handler.call(self); });

            // accumulate all results into a single Deferred object
            return $.when.apply($, results);
        }

        // public methods -----------------------------------------------------

        /**
         * Returns the document model instance of this application.
         *
         * @returns {DocumentModel}
         *  The document model instance of this application.
         */
        this.getModel = function () {
            return model;
        };

        /**
         * Returns the view instance of this application.
         *
         * @returns {View}
         *  The view instance of this application.
         */
        this.getView = function () {
            return view;
        };

        /**
         * Returns the controller instance of this application.
         *
         * @returns {Controller}
         *  The controller instance of this application.
         */
        this.getController = function () {
            return controller;
        };

        // file descriptor ----------------------------------------------------

        /**
         * Returns whether this application contains a valid file descriptor.
         */
        this.hasFileDescriptor = function () {
            return _.isObject(file);
        };

        /**
         * Returns the file descriptor of the document edited by this
         * application.
         */
        this.getFileDescriptor = function () {
            return file;
        };

        /**
         * Sets the file descriptor of the document edited by this application.
         * Must not be called if the application already contains a valid file
         * descriptor.
         *
         * @returns {OfficeApplication}
         *  A reference to this application instance.
         */
        this.setFileDescriptor = function (newFile) {
            // only set new file descriptor, do not change it
            if (_.isNull(file) && _.isObject(newFile)) {
                file = newFile;
            }
            this.updateTitle();
            return this;
        };

        /**
         * Returns an object with attributes describing the file currently
         * opened by this application.
         *
         * @returns {Object|Null}
         *  An object with file attributes, if existing; otherwise null.
         */
        this.getFileParameters = function () {
            return file ? {
                id: file.id,
                folder_id: file.folder_id,
                filename: file.filename,
                version: file.version
            } : null;
        };

        /**
         * Returns the full file name of the current file (with file
         * extension).
         *
         * @returns {String|Null}
         *  The file name of the current file descriptor; or null, if no file
         *  descriptor exists.
         */
        this.getFullFileName = function () {
            return (file && _.isString(file.filename)) ? file.filename : null;
        };

        /**
         * Returns the short file name of the current file (without file
         * extension).
         *
         * @returns {String|Null}
         *  The short file name of the current file descriptor; or null, if no
         *  file descriptor exists.
         */
        this.getShortFileName = function () {

            var // the current full file name
                fileName = this.getFullFileName(),
                // start position of the extension
                extensionPos = _.isString(fileName) ? fileName.lastIndexOf('.') : -1;

            return (extensionPos > 0) ? fileName.substring(0, extensionPos) : fileName;
        };

        /**
         * Returns the file extension of the current file (without leading
         * period).
         *
         * @returns {String|Null}
         *  The file extension of the current file descriptor; or null, if no
         *  file descriptor exists.
         */
        this.getFileExtension = function () {

            var // the current full file name
                fileName = this.getFullFileName(),
                // start position of the extension
                extensionPos = _.isString(fileName) ? fileName.lastIndexOf('.') : -1;

            return (extensionPos >= 0) ? fileName.substring(extensionPos + 1) : null;
        };

        /**
         * Updates the application title according to the current file name. If
         * the application does not contain a file descriptor, shows the
         * localized word 'Unnamed' as title.
         *
         * @returns {OfficeApplication}
         *  A reference to this application instance.
         */
        this.updateTitle = function () {
            this.setTitle(this.getShortFileName() || gt('Unnamed'));
            return this;
        };

        // server requests ----------------------------------------------------

        /**
         * Sends a request to the server and returns the promise of a Deferred
         * object waiting for the response. The unique identifier of this
         * application will be added to the request parameters automatically.
         * See method IO.sendRequest() for further details.
         *
         * @param {Object} options
         *  Additional options. See method IO.sendRequest() for details.
         *
         * @returns
         *  The promise of the request.
         */
        this.sendRequest = function (options) {

            // build a default map with the application UID, and add the passed options
            options = Utils.extendOptions({
                params: {
                    uid: this.get('uniqueID')
                }
            }, options);

            // send the request
            return IO.sendRequest(options);
        };

        /**
         * Sends a request to the document filter module on the server and
         * returns the promise of a Deferred object waiting for the response.
         * The module name, the unique identifier of this application, and the
         * parameters of the file currently opened by the application will be
         * added to the request parameters automatically. See method
         * IO.sendRequest() for further details.
         *
         * @param {Object} options
         *  Additional options. See method IO.sendRequest() for details.
         *
         * @returns
         *  The promise of the request. Will be rejected immediately, if this
         *  application is not connected to a document file.
         */
        this.sendFilterRequest = function (options) {

            // reject immediately if no file is present
            if (!this.hasFileDescriptor()) {
                return $.Deferred().reject();
            }

            // build default options, and add the passed options
            options = Utils.extendOptions({
                module: OfficeApplication.FILTER_MODULE_NAME,
                params: this.getFileParameters()
            }, options);

            // send the request
            return this.sendRequest(options);
        };

        /**
         * Sends a request to the document converter module on the server and
         * returns the promise of a Deferred object waiting for the response.
         * The module name, the unique identifier of this application, and the
         * parameters of the file currently opened by the application will be
         * added to the request parameters automatically. See method
         * IO.sendRequest() for further details.
         *
         * @param {Object} options
         *  Additional options. See method IO.sendRequest() for details.
         *
         * @returns
         *  The promise of the request. Will be rejected immediately, if this
         *  application is not connected to a document file.
         */
        this.sendDocumentConverterRequest = function (options) {

            // reject immediately if no file is present
            if (!this.hasFileDescriptor()) {
                return $.Deferred().reject();
            }

            // build default options, and add the passed options
            options = Utils.extendOptions({
                module: OfficeApplication.DOCUMENTCONVERTER_MODULE_NAME,
                params: this.getFileParameters()
            }, options);

            // send the request
            return this.sendRequest(options);
        };

        /**
         * Creates and returns the URL of server requests used to convert a
         * document file with the document filter module.
         *
         * @param {Object} [params]
         *  Additional parameters inserted into the URL.
         *
         * @returns {String|Undefined}
         *  The final URL of the request to the document filter module; or
         *  undefined, if the application is not connected to a document file,
         *  or the current session is invalid.
         */
        this.getFilterModuleUrl = function (options) {

            // return nothing if no file is present
            if (!ox.session || !this.hasFileDescriptor()) {
                return;
            }

            // build a default options map, and add the passed options
            options = Utils.extendOptions({ session: ox.session, uid: this.get('uniqueID') }, options);
            options = Utils.extendOptions(this.getFileParameters(), options);

            // build and return the resulting URL
            return ox.apiRoot + '/' + OfficeApplication.FILTER_MODULE_NAME + '?' + _(options).map(function (value, name) { return name + '=' + value; }).join('&');
        };

        // application setup --------------------------------------------------

        /**
         * Registers an initialization handler function that will be executed
         * when the application has been be constructed (especially the model,
         * view, and controller instances). All registered initialization
         * handlers will be called in order of their insertion. If the
         * initialization handlers return a Deferred object, launching the
         * application will be deferred until all Deferred objects have been
         * resolved or rejected. If any of the handlers rejects its Deferred
         * object, the application cannot be launched at all.
         *
         * @param {Function} initHandler
         *  A function that will be called when the application has been
         *  constructed. Will be called in the context of this application
         *  instance. May return a Deferred object, which must be resolved or
         *  rejected by the initialization handler function.
         *
         * @returns {OfficeApplication}
         *  A reference to this application instance.
         */
        this.registerInitHandler = function (initHandler) {
            initHandlers.push(initHandler);
            return this;
        };

        /**
         * Registers a quit handler function that will be executed before the
         * application will be closed.
         *
         * @param {Function} beforeQuitHandler
         *  A function that will be called before the application will be
         *  closed. Will be called in the context of this application instance.
         *  May return a Deferred object, which must be resolved or rejected by
         *  the quit handler function. If the Deferred object will be rejected,
         *  the application remains alive.
         *
         * @returns {OfficeApplication}
         *  A reference to this application instance.
         */
        this.registerBeforeQuitHandler = function (beforeQuitHandler) {
            beforeQuitHandlers.push(beforeQuitHandler);
            return this;
        };

        /**
         * Registers a handler function that will be executed when the
         * application creates a new restore point.
         *
         * @param {Function} failSaveHandler
         *  A function that will be called when the application creates a new
         *  restore point. Will be called in the context of this application
         *  instance. Must return an object the new restore point will be
         *  extended with.
         *
         * @returns {OfficeApplication}
         *  A reference to this application instance.
         */
        this.registerFailSaveHandler = function (failSaveHandler) {
            failSaveHandlers.push(failSaveHandler);
            return this;
        };

        /**
         * Registers an event handler for specific events at the passed target
         * object. The event handler will be unregistered automatically when
         * the application has been closed.
         *
         * @param {HTMLElement|Window|jQuery} target
         *  The target object the event handler will be bound to. Can be a DOM
         *  node, the browser window, or a jQuery object containing DOM nodes
         *  and/or the browser window.
         *
         * @param {String} events
         *  The names of the events, as space-separated string.
         *
         * @param {Function} handler
         *  The event handler function that will be bound to the specified
         *  events.
         *
         * @returns {OfficeApplication}
         *  A reference to this application instance.
         */
        this.registerEventHandler = function (target, events, handler) {

            // bind event handler to events
            $(target).on(events, handler);

            // unbind handler when application is closed
            this.on('docs:quit', function () {
                $(target).off(events, handler);
            });

            return this;
        };

        /**
         * Registers a handler at the browser window that listens to resize
         * events. The event handler will be activated when the application
         * window is visible; and deactivated, when the application window is
         * hidden.
         *
         * @param {Function} resizeHandler
         *  The resize handler function bound to 'resize' events of the browser
         *  window. Will be triggered once when the application window becomes
         *  visible.
         *
         * @returns {OfficeApplication}
         *  A reference to this application instance.
         */
        this.registerWindowResizeHandler = function (resizeHandler) {
            this.getWindow()
                .on('show', function () {
                    $(window).on('resize', resizeHandler);
                    resizeHandler();
                })
                .on('hide', function () {
                    $(window).off('resize', resizeHandler);
                });
        };

        /**
         * Creates a debounced method that can be called multiple times during
         * the current script execution. Execution is separated into a part
         * that runs directly every time the method is called (the 'direct
         * callback'), and a part that runs once after the current script
         * execution ends (the 'deferred callback').
         *
         * @param {Function} directCallback
         *  A function that will be called every time the debounced method
         *  has been called. Receives all parameters that have been passed to
         *  the debounced method.
         *
         * @param {Function} deferredCallback
         *  A function that will be called once after calling the debounced
         *  method at least once during the execution of the current script.
         *  Does not receive any parameters. As long as this function returns
         *  true, it will be called again after the passed repeatition delay
         *  time.
         *
         * @param {Number} [initialDelay=0]
         *  The time (in milliseconds) the first execution of the deferred
         *  callback function will be delayed.
         *
         * @param {Number} [repeatedDelay=initialDelay]
         *  The time (in milliseconds) after the execution of the deferred
         *  callback function will be repeated. If omitted, the passed initial
         *  delay time will be used.
         *
         * @returns {Function}
         *  The debounced method that can be called multiple times, and that
         *  executes the deferred callback once after execution of the current
         *  script ends. Passes all arguments to the direct callback, and
         *  returns the result of the direct callback function.
         */
        this.createDebouncedMethod = function (directCallback, deferredCallback, initialDelay, repeatedDelay) {

            var // unique index of this deferred method
                index = debounceCount++;

            // creates a timeout calling the deferred callback, if not already done
            function createTimeout(delay) {

                // do not create multiple timeouts
                if (index in debounceTimeouts) { return; }

                // create a new timeout that calls the deferred callback
                debounceTimeouts[index] = window.setTimeout(function () {
                    // first delete the timeout from the map
                    // (allow to call ourselves from deferred callback)
                    delete debounceTimeouts[index];
                    // call deferred callback, recall it if it returns true
                    if (deferredCallback.call(self) === true) {
                        createTimeout(repeatedDelay);
                    }
                }, delay);
            }

            initialDelay = _.isNumber(initialDelay) ? initialDelay : 0;
            repeatedDelay = _.isNumber(repeatedDelay) ? repeatedDelay : initialDelay;

            // create and return the deferred method
            return function () {
                // create a timeout calling the deferred callback
                createTimeout(initialDelay);
                // call the direct callback with the passed arguments
                return directCallback.apply(self, _.toArray(arguments));
            };
        };

        // application runtime ------------------------------------------------

        /**
         * Executes the passed callback function once or repeatedly in a
         * browser timeout. If the application will be closed before the
         * callback function has been started, or while the callback function
         * will be repeated, it will not be executed anymore.
         *
         * @param {Function} callback
         *  The callback function that will be executed in a browser timeout
         *  after the specified initial delay time. As long as this function
         *  returns true, it will be called again after the specified
         *  repetition delay time.
         *
         * @param {Number} [initialDelay=0]
         *  The time (in milliseconds) the first execution of the passed
         *  callback function will be delayed.
         *
         * @param {Number} [repeatedDelay=initialDelay]
         *  The time (in milliseconds) after the execution of the passed
         *  callback function will be repeated. If omitted, the passed initial
         *  delay time will be used.
         *
         * @returns {Number}
         *  A unique identifier that can be used to identify the pending
         *  callback function.
         */
        this.executeDelayed = function (callback, initialDelay, repeatedDelay) {

            var // the unique timeout identifier (initial browser timeout handle)
                id = null,
                // the delay time for the next execution of the callback
                delay = _.isNumber(initialDelay) ? initialDelay : 0;

            // executes the callback, repeats execution if required
            function executeCallback() {
                delete delayTimeouts[id];
                // call deferred callback, recall it if it returns true
                if (callback() === true) {
                    delayTimeouts[id] = window.setTimeout(executeCallback, delay);
                }
            }

            // create initial timeout
            id = window.setTimeout(executeCallback, delay);
            delayTimeouts[id] = id;

            // switch to repetition delay time
            if (_.isNumber(repeatedDelay)) {
                delay = repeatedDelay;
            }

            return id;
        };

        /**
         * Cancels the execution of the specified deferred method. If the
         * deferred callback function has been executed already and is not
         * executed repeatedly, this method has no effect.
         *
         * @param {Number} id
         *  The unique identifier of the deferred callback, as returned from
         *  the method OfficeApplication.executeDelayed().
         *
         * @returns {Boolean}
         *  Whether the specified callback was still waiting for its execution
         *  and has been cancelled.
         */
        this.cancelDelayed = function (id) {

            var // whether the timeout is still waiting for execution
                pending = id in delayTimeouts;

            if (pending) {
                window.clearTimeout(delayTimeouts[id]);
                delete delayTimeouts[id];
            }
            return pending;
        };

        /**
         * Renames the current file and updates the GUI accordingly.
         *
         * @param {String} shortName
         *  The new short file name (without extension).
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved when the
         *  file has been renamed successfully; or that will be rejected, if
         *  renaming the file has failed.
         */
        this.rename = function (shortName) {

            var // the result Deferred object
                def = null;

            if (shortName === this.getShortFileName()) {
                // name does not change
                def = $.when();
            } else {
                def = this.sendFilterRequest({
                    params: {
                        action: 'renamedocument',
                        filename: shortName + '.' + this.getFileExtension()
                    },
                    resultFilter: function (data) {
                        // returning undefined (also for empty file name) rejects the entire request
                        return Utils.getStringOption(data, 'filename', undefined, true);
                    }
                })
                .then(function (fileName) {
                    file.filename = fileName;
                    // TODO: what if filter request succeeds, but Files API fails?
                    return FilesAPI.propagate('change', file);
                });
            }

            // update application title
            return def.always(function () { self.updateTitle(); }).promise();
        };

        /**
         * Will be called automatically from the OX core framework to create
         * and return a restore point containing the current state of the
         * application.
         *
         * @returns {Object}
         *  The restore point containing the application state.
         */
        this.failSave = function () {

            var // create the new restore point with basic information
                restorePoint = {
                    module: this.getName(),
                    point: { file: file }
                };

            // call all fail-save handlers and add their data to the restore point
            _(failSaveHandlers).each(function (failSaveHandler) {
                _(restorePoint.point).extend(failSaveHandler.call(this));
            }, this);

            return restorePoint;
        };

        /**
         * Will be called automatically from the OX core framework to restore
         * the state of the application after a browser refresh.
         *
         * @param {Object} point
         *  The save point containing the application state, as returned by the
         *  last call of the OfficeApplication.failSave() method.
         *
         * @returns {jQuery.Promise}
         *  The promise of a Deferred object that will be resolved when the
         *  import handler has loaded the document.
         */
        this.failRestore = function (point) {

            var // the result Deferred object
                def = $.Deferred();

                // set file descriptor and import the document
            this.setFileDescriptor(Utils.getObjectOption(point, 'file'));
            // always resolve the deferred (expected by the core launcher)
            importDocument(point).always(function () { def.resolve(); });

            return def.promise();
        };

        // initialization -----------------------------------------------------

        // call all registered launch handlers
        this.setLauncher(function () {

            var // the result Deferred object
                def = $.Deferred(),
                // the Deferred object waiting for the initialization handlers
                initDef = $.Deferred(),
                // create the application window
                win = ox.ui.createWindow({
                    name: self.getName(),
                    search: Utils.getBooleanOption(launchOptions, 'search', false)
                });

            // do not detach window if specified
            win.detachable = Utils.getBooleanOption(launchOptions, 'detachable', true);

            // set the window at the application instance
            self.setWindow(win);

            // create the MVC instances
            model = new ModelClass(self);
            view = new ViewClass(self);
            controller = new ControllerClass(self);

            // disable FF spell checking
            win.on({
                show: function () { $('body').attr('spellcheck', false); },
                hide: function () { $('body').removeAttr('spellcheck'); }
            });

            // in order to get the 'open' event of the window at all, it must be shown (also without file)
            win.show(function () {
                win.busy();

                // wait for pending initialization, kill the application if no
                // file descriptor is present after fail-restore (using absence
                // of the launch option 'action' as indicator for fail-restore)
                if (!launchOptions || !('action' in launchOptions)) {

                    // the 'open' event of the window is triggered once after launch and fail-restore
                    win.on('open', function () {
                        initDef.always(function () {
                            if (!file) {
                                _.defer(function () { self.quit(); });
                            }
                        });
                    });
                }

                // call initialization listeners
                self.trigger('docs:init');

                // call initialization handlers, they may return Deferred objects
                callHandlers(initHandlers)
                .always(function () {
                    self.trigger('docs:init:after');
                    // this resumes pending window 'open' event handler
                    initDef.resolve();
                    win.idle();
                })
                .done(function () {
                    self.trigger('docs:init:success');
                    // import the document, always resolve the result Deferred object (expected by the core launcher)
                    importDocument().always(function () { def.resolve(); });
                })
                .fail(function () {
                    self.trigger('docs:init:error');
                    // failing initialization handler should have shown an error alert
                    Utils.warn('OfficeApplication.launch(): initialization failed.');
                    def.resolve();
                });

            });

            return def.promise();
        });

        // call all registered quit handlers
        this.setQuit(function () {

            return callHandlers(beforeQuitHandlers)
                .done(function () {

                    // cancel all running timeouts
                    _(delayTimeouts).each(function (timeout) {
                        window.clearTimeout(timeout);
                    });
                    _(debounceTimeouts).each(function (timeout) {
                        window.clearTimeout(timeout);
                    });

                    // base application does not trigger 'quit' events
                    self.trigger('docs:quit');

                    // destroy class members
                    controller.destroy();
                    view.destroy();
                    model.destroy();
                    model = view = controller = delayTimeouts = debounceTimeouts = null;
                })
                .fail(function () {
                    self.trigger('docs:resume');
                })
                .promise();
        });

        // prevent usage of these methods in derived classes
        delete this.setLauncher;
        delete this.setQuit;

        // set application title to current file name
        this.updateTitle();

    } // class OfficeApplication

    // constants --------------------------------------------------------------

    /**
     * The name of the document filter server module.
     */
    OfficeApplication.FILTER_MODULE_NAME = 'oxodocumentfilter';
    OfficeApplication.DOCUMENTCONVERTER_MODULE_NAME = 'oxodocumentconverter';


    // exports ================================================================

    return _.makeExtendable(OfficeApplication);

});
