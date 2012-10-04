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
 * @author Malte Timmermann <malte.timmermann@open-xchange.com>
 * @author Ingo Schmidt-Rosbiegal <ingo.schmidt-rosbiegal@open-xchange.com>
 */

define('io.ox/office/editor/main',
    ['io.ox/files/api',
     'io.ox/office/tk/utils',
     'io.ox/office/tk/apphelper',
     'io.ox/office/tk/config',
     'io.ox/office/editor/editor',
     'io.ox/office/editor/view',
     'io.ox/office/editor/controller',
     'gettext!io.ox/office/main',
     'less!io.ox/office/editor/style.css'
    ], function (FilesAPI, Utils, AppHelper, Config, Editor, View, Controller, gt) {

    'use strict';

    var // application identifier
        MODULE_NAME = 'io.ox/office/editor';

    // static functions =======================================================

    /**
     * Extracts the operations list from the passed response object of an
     * AJAX import request.
     *
     * @param {Object} response
     *  The response object of the AJAX request.
     *
     * @return {Object[]|Undefined}
     *  The operations array, if existing, otherwise undefined.
     */
    function extractOperationsList(response) {

        var // the result data
            data = AppHelper.extractAjaxResultData(response);

        // check that the result data object contains an operations array
        if (!_.isObject(data) || !_.isArray(data.operations)) {
            return;
        }

        try {
            // check all operation objects in the array
            _(data.operations).each(function (operation) {
                if (!_.isObject(operation) || !_.isString(operation.name)) {
                    throw null; // exit the each() loop
                }
            });
        } catch (ex) {
            return;
        }

        // operations array is valid, return it
        return data.operations;
    }

    // class Application ======================================================

    function Application(options) {

        var // self reference
            self = this,

            // application window
            win = null,

            // the editor (model)
            editor = null,

            // editor view, contains panes, tool bars, etc.
            view = null,

            // controller as single connection point between editor and view elements
            controller = null,

            // deferred objects causing the quit handler to delay destruction of the application
            quitDelays = [],

            // buffer for user operations
            operationsBuffer = [],

            // browser timer for operations handling
            operationsTimer = null,

            // if true, debug mode is active (second editor and operations output console)
            debugMode = false,

            // if true, editor synchronizes operations with backend server
            syncMode = true;

        // private methods ----------------------------------------------------

        function initializeFromOptions(options) {
            self.setFileDescriptor(Utils.getObjectOption(options, 'file'));
            debugMode = Utils.getBooleanOption(options, 'debugMode', false);
            syncMode = Utils.getBooleanOption(options, 'syncMode', true);
        }

        /**
         * Creates a deferred object that will be stored internally and used by
         * the quit handler to delay closing the application. The creator of a
         * quit delay has to resolve or reject the deferred when the blocking
         * operation is finished.
         *
         * @returns {Object}
         *  A wrapper object that offers the methods resolve() and reject(). By
         *  calling resolve() the caller agrees to close the application, and
         *  by calling reject() the application will stay alive.
         */
        function createQuitDelay() {

            var // the underlying deferred
                deferred = $.Deferred();

            // push the deferred into the array of all quit delays
            quitDelays.push(deferred);

            // register a handler that removes the deferred from the array
            deferred.always(function () {
                quitDelays = _(quitDelays).without(deferred);
            });

            // Return a wrapper object that reconfigures the resolve() and
            // reject() calls to always resolve the deferred. With this 'trick'
            // $.when() will finish all delays even if one of them fails.
            return {
                resolve: function () { deferred.resolve(true); },
                reject: function () { deferred.resolve(false); }
            };
        }

        /**
         * Shows a closable error message above the editor.
         *
         * @param {String} message
         *  The message text.
         *
         * @param {String} [title='Error']
         *  The title of the error message. Defaults to 'Error'.
         */
        function showError(message, title) {

            var // the alert box (return focus to editor when clicked)
                alert = $.alert(title || gt('Error'), message).click(function () { controller.done(); });

            win.nodes.appPane
                .find('.alert').remove().end()
                .prepend(alert);
        }

        /**
         * Shows an error message extracted from the error object returned by
         * a jQuery AJAX call.
         *
         * @param {Object} response
         *  Response object returned by the failed AJAX call.
         */
        function showAjaxError(response) {
            showError(response.responseText, gt('AJAX Error'));
        }

        /**
         * Shows an error message for an unhandled exception.
         *
         * @param exception
         *  The exception to be reported.
         */
        function showExceptionError(exception) {
            showError('Exception caught: ' + exception, 'Internal Error');
        }

        /**
         * Sets application title (launcher) and window title according to the
         * current file name but without any extension.
         */
        function updateTitles() {
            var file = self.getFileDescriptor(),
                filename = (file && file.filename) ? file.filename : gt('Unnamed'),
                extensionPos = filename.lastIndexOf('.'),
                displayName = (extensionPos !== -1 && extensionPos > 0) ? filename.substring(0, extensionPos) : filename;

            self.setTitle(displayName);
            win.setTitle(displayName);
        }

        /**
         * Updates the view according to the current state of the debug mode.
         */
        function updateDebugMode() {
            var debugavailable = Config.isDebugAvailable();
            if (debugavailable) {
                editor.getNode().toggleClass('debug-highlight', debugMode);
                win.nodes.debugPane.toggle(debugMode);
                controller.update('debug/toggle');
                // resize editor pane
                windowResizeHandler();
            }
        }

        /**
         * Recalculates the size of the editor frame according to the current
         * view port size.
         */
        function windowResizeHandler() {
            var debugHeight = debugMode ? win.nodes.debugPane.outerHeight() : 0;
            win.nodes.appPane.height(window.innerHeight - win.nodes.appPane.offset().top - debugHeight);
        }

        /**
         * The handler function that will be called while launching the
         * application. Creates and initializes a new application window.
         */
        function launchHandler() {

            var // deferred used to initialize file descriptor
                initFileDef = null,
                // deferred returned to caller
                def = $.Deferred();

            // create the application window
            win = ox.ui.createWindow({
                name: MODULE_NAME,
                close: true,
                search: true,
                toolbar: true
            });
            self.setWindow(win);

            // do not detach when hiding for several reasons:
            // - keep editor selection alive
            // - prevent resize handles for tables and objects (re-enabled after detach/insert)
            win.detachable = false;

            // create controller
            controller = new Controller(self);

            // editor view
            view = new View(win, controller, editor);
            updateDebugMode();

            // register window event handlers
            Utils.registerWindowResizeHandler(win, windowResizeHandler);

            // disable Firefox spell checking. TODO: better solution...
            $('body').attr('spellcheck', false);

            // 'new document' action: create the new file in InfoStore
            if (Utils.getStringOption(options, 'file') === 'new') {
                initFileDef = $.ajax({
                    type: 'GET',
                    url: self.buildServiceUrl('oxodocumentfilter', { action: 'createdefaultdocument', folder_id: Utils.getOption(options, 'folder_id'), document_type: 'text' }),
                    dataType: 'json'
                }).pipe(function (response) {
                    // creation succeeded: receive file descriptor and set it
                    self.setFileDescriptor(response.data);
                });
            } else {
                initFileDef = $.when();
            }

            // load the file
            initFileDef.done(function () {
                loadAndShow().then(function () { def.resolve(); }, function () { def.reject(); });
            }).fail(function () {
                def.reject();
            });

            return def;
        }

        /**
         * The handler function that will be called when the application shuts
         * down. If the edited document has unsaved changes, a dialog will be
         * shown asking whether to save or drop the changes.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that will be resolved if the application can be closed
         *  (either if it is unchanged, or the user has chosen to save or lose
         *  the changes), or will be rejected if the application must remain
         *  alive (user has cancelled the dialog, save operation failed).
         */
        function quitHandler() {

            var // the deferred returned to the framework
                def = $.Deferred().done(self.destroy);

            win.busy();

            // Wait for all registered quit delays ($.when() resolves immediately,
            // if the array is empty). All deferreds will resolve with a boolean
            // result (never reject, see createQuitDelay() function).
            $.when.apply(this, quitDelays).done(function () {

                var // each deferred returns its result as a boolean
                    resolved = _(arguments).all(_.identity),
                    // finally send any pending operations (but not in debug offline mode)
                    sendDef = (syncMode && operationsBuffer.length) ? sendOperations() : $.when();

                // wait for the final synchronization
                sendDef.always(function () {

                    // notify server about quitting the application
                    // TODO: one-way call, alternative to GET?
                    if (self.hasFileDescriptor()) {
                        $.ajax({
                            type: 'GET',
                            url: self.getDocumentFilterUrl('closedocument'),
                            dataType: 'json'
                        });
                    }

                    win.idle();
                    def[resolved ? 'resolve' : 'reject']();
                });
            });

            return def;
        }

        /**
         * Applies the passed operations at the editor and logs them in the
         * output console.
         *
         * @param {Object[]} operations
         *  An array of operations to be applied.
         */
        function applyOperations(operations) {
            editor.applyOperations(operations, false, false);
            controller.update();
            view.logOperations(operations);
        }

        /**
         * Loads the document described in the current file descriptor of this
         * application, and shows the application window.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that reflects the result of the load operation.
         */
        function loadAndShow() {

            var // initialize the deferred to be returned
                def = $.Deferred().always(function () {
                    win.idle();
                    editor.grabFocus(true);
                });

            // show application window
            win.show(function () {
                win.busy();
                $(window).resize();
                updateTitles();

                editor.initDocument();
                operationsBuffer = []; // initDocument will result in an operation

                // load the file
                if (self.hasFileDescriptor()) {

                    $.ajax({
                        type: 'GET',
                        url: self.getDocumentFilterUrl('importdocument'),
                        dataType: 'json'
                    })
                    .pipe(extractOperationsList)
                    .done(function (operations) {
                        if (operations) {
                            editor.enableUndo(false);
                            applyOperations(operations);
                            editor.enableUndo(true);
                            startOperationsTimer();
                            def.resolve();
                        } else {
                            showError(gt('An error occurred while importing the document.'), gt('Load Error'));
                            def.reject();
                        }
                    })
                    .fail(function (response) {
                        showAjaxError(response);
                        def.reject();
                    });

                } else {
                    // no file descriptor: just show an empty editor
                    def.resolve();
                }
            });

            return def;
        }

        /**
         * Saves the document to its origin.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that reflects the result of the save operation.
         */
        function saveOrFlush(action) {

            var // initialize the deferred to be returned
                def = $.Deferred().always(function () {
                    win.idle();
                    editor.grabFocus();
                });

            // do not try to save, if file descriptor is missing
            if (!self.hasFileDescriptor()) {
                return def.reject();
            }

            win.busy();

            receiveAndSendOperations()
            .done(function () {
                $.ajax({
                    type: 'GET',
                    url: self.getDocumentFilterUrl(action),
                    dataType: 'json'
                })
                .done(function (response) {
                    FilesAPI.caches.get.clear(); // TODO
                    FilesAPI.caches.versions.clear();
                    FilesAPI.trigger('refresh.all');
                    def.resolve();
                })
                .fail(function (response) {
                    showAjaxError(response);
                    def.reject();
                });
            })
            .fail(function () {
                def.reject();
            });

            return def;
        }

        /**
         * Downloads the document in the specified format.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that reflects the result of the operation.
         */
        function download(format) {

            // the deferred to be returned
            var def = $.Deferred().always(function () {
                win.idle();
                editor.grabFocus();
            });

            //  do not try to save, if file descriptor is missing
            if (!self.hasFileDescriptor()) {
                return def.reject();
            }

            win.busy();

            receiveAndSendOperations()
            .done(function () {
                var url = self.getDocumentFilterUrl('getdocument', { filter_format: format || '' }),
                    title = self.getFileDescriptor().title || 'file';
                window.open(url, title);
                def.resolve();
            })
            .fail(function () {
                def.reject();
            });

            return def;
        }

        /**
         * Sends all operations contained in the operationsBuffer array to the
         * server, and creates a quit delay object causing the quit handler to
         * wait for the AJAX request.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that will be resolved or rejected when the AJAX request
         *  has returned.
         */
        var sendOperations = (function () { // local scope for the deferred

            var // the result deferred
                def = null;

            // create and return the actual sendOperations() function
            return function () {

                // return existing deferred if the AJAX request is still running
                if (def && (def.state() === 'pending')) {
                    return def;
                }

                var // deep copy of the current buffer
                    sendOps = _.copy(operationsBuffer, true),
                    // the data object to be passed to the AJAX request
                    dataObject = { operations: JSON.stringify(sendOps) },
                    // a deferred that will cause the quit handler to wait for the AJAX request
                    quitDelay = createQuitDelay();

                // create a new result deferred
                def = $.Deferred();

                // We might receive new operations while sending the current ones...
                operationsBuffer = [];

                $.ajax({
                    type: 'POST',
                    url: self.getDocumentFilterUrl('pushoperationupdates'),
                    dataType: 'json',
                    data: dataObject,
                    beforeSend: function (xhr) {
                        if (xhr && xhr.overrideMimeType) {
                            xhr.overrideMimeType('application/j-son;charset=UTF-8');
                        }
                    }
                })
                .done(function (response) {
                    quitDelay.resolve();
                    def.resolve(response);
                })
                .fail(function (response) {
                    // Try again later. TODO: NOT TESTED YET!
                    operationsBuffer = $.extend(true, operationsBuffer, sendOps);
                    // TODO: reject? (causing the application to stay alive?)
                    quitDelay.resolve();
                    def.reject(response);
                });

                return def;
            };

        }());

        var receiveAndSendOperations = (function () { // local scope for the deferred

            var // the result deferred
                def = null;

            // create and return the actual receiveAndSendOperations() function
            return function () {

                // return existing deferred if the AJAX request is still running
                if (def && (def.state() === 'pending')) {
                    return def;
                }

                var // a deferred that will cause the quit handler to wait for the AJAX request
                    quitDelay = createQuitDelay(),
                    // the deferred waiting for the GET operation
                    getDef = $.Deferred(),
                    // the deferred waiting for sendOperations()
                    sendDef = $.Deferred().always(startOperationsTimer);

                // the result deferred
                def = $.when(getDef, sendDef);

                // first, check if the server has new operations for me
                $.ajax({
                    type: 'GET',
                    url: self.getDocumentFilterUrl('pulloperationupdates'),
                    dataType: 'json'
                })
                .done(function (response) {
                    if (response && response.data) {
                        var operations = JSON.parse(response.data);
                        if (operations.length) {
                            // We might need to do some "T" here!
                            applyOperations(operations);
                        }
                    }
                    // Then, send our operations in case we have some...
                    if (operationsBuffer.length) {
                        // We might first need to do some "T" here!
                        // resolving sendDef starts the operations timer
                        sendOperations().then(
                            function () { sendDef.resolve(); },
                            function () { sendDef.reject(); }
                        );
                    } else {
                        // nothing to send, but the deferred must be resolved
                        sendDef.resolve();
                    }
                    getDef.resolve(response);
                })
                .fail(function (response) {
                    getDef.reject(response);
                })
                .always(function () {
                    // always resolve the quit delay, ignore failed GET operation
                    quitDelay.resolve();
                });

                return def;
            };

        }());

        function startOperationsTimer(timeout) {

            // restart running timer, prevents sending too many updates while the user is typing
            if (operationsTimer) {
                window.clearTimeout(operationsTimer);
            }

            // offline mode: do not start a new timer
            if (syncMode) {
                operationsTimer = window.setTimeout(function () {
                    operationsTimer = null;
                    receiveAndSendOperations();
                }, timeout || 1000);
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the editor instance.
         */
        this.getEditor = function () {
            return editor;
        };

        /**
         * Returns the controller.
         */
        this.getController = function () {
            return controller;
        };

        /**
         * Returns the global view object.
         */
        this.getView = function () {
            return view;
        };

        /**
         * Shows the application window and activates the editor.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that is resolved if the application has been made
         *  visible, or rejected if the application is in an invalid state.
         */
        this.show = function () {
            var def = $.Deferred();

            if (win && editor) {
                win.show(function () {
                    updateTitles();
                    editor.grabFocus();
                    def.resolve();
                });
            } else {
                def.reject();
            }

            return def;
        };

        this.save = function () {
            return saveOrFlush('exportdocument');
        };

        this.flush = function () {
            return saveOrFlush('savedocument');
        };

        this.download = function () {
            return download();
        };

        this.print = function () {
            return download('pdf');
        };

        /**
         * Renames the currently edited file and updates the UI accordingly
         */
        this.rename = function (newFilename) {

            var file = this.getFileDescriptor();

            if (newFilename && newFilename.length && file && (newFilename !== file.filename)) {
                $.ajax({
                    type: 'GET',
                    url: this.getDocumentFilterUrl('renamedocument', { filename: newFilename }),
                    dataType: 'json'
                })
                .pipe(function (response) {
                    // TODO clear cachesupdate UI
                    if (response && response.data) {
                        FilesAPI.caches.all.grepRemove(response.data.folder_id + '\t')
                            .pipe(function () { FilesAPI.trigger("create.file refresh.all"); });
                    }

                    return response;
                })
                .done(function (response) {
                    if (response && response.data && response.data.filename) {
                        file.filename = response.data.filename;

                        updateTitles();

                        // TODO clear cachesupdate UI
                        FilesAPI.caches.get.clear();
                        FilesAPI.caches.versions.clear()
                            .pipe(function () {
                                FilesAPI.trigger('refresh.all');
                                FilesAPI.trigger('update refresh.all', { id: response.data.id, folder: response.data.folder_id });
                            });
                    }
                });
            }
        };

        /**
         * Set a new current file version
         */
        this.newVersion = function (newVersion) {
            var file = this.getFileDescriptor();

            if (file) {
                file.version = newVersion;
            }
        };

        this.failSave = function () {
            var point = {
                file: this.getFileDescriptor(),
                toolBarId: view.getToolPane().getVisibleToolBarId(),
                debugMode: debugMode,
                syncMode: syncMode
            };
            return { module: MODULE_NAME, point: point };
        };

        this.failRestore = function (point) {
            initializeFromOptions(point);
            this.newVersion(0);  // Get top-level version
            updateDebugMode();
            return loadAndShow().always(function () {
                view.getToolPane().showToolBar(Utils.getStringOption(point, 'toolBarId'));
            });
        };

        /**
         * Returns whether the application is in debug mode. See method
         * setDebugMode() for details.
         */
        this.isDebugMode = function () {
            return debugMode;
        };

        /**
         * Enables or disables the debug mode. In debug mode, displays colored
         * borders and background for 'p' and 'span' elements in the rich-text
         * editor, and shows a plain-text editor and an output console for
         * processed operations.
         */
        this.setDebugMode = function (state) {
            if (debugMode !== state) {
                debugMode = state;
                updateDebugMode();
            }
            return this;
        };

        this.isSynchronizedMode = function () {
            return syncMode;
        };

        this.setSynchronizedMode = function (state) {
            if (syncMode !== state) {
                syncMode = state;
                startOperationsTimer();
            }
            return this;
        };

        /**
         * Destroys the application. Will be called automatically in a forced
         * quit, but has to be called manually for a regular quit (e.g. from
         * window close button).
         */
        this.destroy = function () {
            if (operationsTimer) {
                window.clearTimeout(operationsTimer);
                operationsTimer = null;
            }
            controller.destroy();
            view.destroy();
            editor.destroy();
            win = editor = view = controller = null;
        };

        // initialization -----------------------------------------------------

        // create the editor model
        editor = new Editor(this);

        // cache operations from editor
        editor.on('operation', function (event, operation) {
            operationsBuffer.push(operation);
        });

        // configure application
        initializeFromOptions(options);
        this.setLauncher(launchHandler).setQuit(quitHandler);

    } // class Application

    // global initialization --------------------------------------------------

    AppHelper.configureWindowToolBar(MODULE_NAME)
        .addButtonGroup('file')
            .addButton('download', function (app) { app.download(); }, { label: gt('Download') })
            .addButton('print',    function (app) { app.print(); },    { label: gt('Print') })
            .end()
        .addRadioGroup('showtoolbar', function (app, id) { app.getView().getToolPane().showToolBar(id); })
            .addButton('insert', { label: gt('Insert') })
            .addButton('format', { label: gt('Format') })
            .addButton('table',  { label: gt('Table') })
            .addButton('image',  { label: gt('Image') })
            .addButton('debug',  { label: gt('Debug'), active: Config.isDebugAvailable() })
            .end();

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (options) {
            return AppHelper.getOrCreateApplication(MODULE_NAME, Application, options);
        }
    };

});
