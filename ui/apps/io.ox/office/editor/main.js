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
     'io.ox/office/tk/component/toolpane',
     'io.ox/office/editor/editor',
     'io.ox/office/editor/view/view',
     'io.ox/office/editor/controller',
     'io.ox/office/tk/alert',
     'gettext!io.ox/office/main',
     'less!io.ox/office/editor/style.css'
    ], function (FilesAPI, Utils, AppHelper, Config, ToolPane, Editor, View, Controller, Alert, gt) {

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

            // buffer for user operations
            operationsBuffer = [],

            // browser timer for operations handling
            operationsTimer = null,

            // invalidate local storage cache in case a new document ,ight be written
            invalidateDriveCacheOnClose = false,

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
         * Sends a 'closedocument' notification to the server.
         *
         * @param {Boolean} [synchronous=false]
         *     If set to true, the notification will be sent synchronously.
         * @returns {jQuery.Deferred}
         */
        function sendCloseNotification(synchronous) {
            // TODO: one-way call, alternative to GET?
            if (self.hasFileDescriptor()) {
                return $.ajax({
                    type: 'GET',
                    url: self.getDocumentFilterUrl('closedocument'),
                    dataType: 'json',
                    async: !synchronous
                })
                .pipe(function () {
                    if (invalidateDriveCacheOnClose === true) {
                        var file = self.getFileDescriptor();
                        return FilesAPI.propagate('change', file);
                    } else {
                        return $.when();
                    }
                });
            } else {
                return $.when();
            }
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
                        if (_.isArray(operations)) {
                            editor.enableUndo(false);
                            applyOperations(operations);
                            editor.documentLoaded();
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

            synchronizeOperations()
            .done(function () {
                $.ajax({
                    type: 'GET',
                    url: self.getDocumentFilterUrl(action),
                    dataType: 'json'
                })
                .done(function (response) {
                    var file = Utils.getObjectOption(options, 'file', null);
                    // TODO: did not test this; getObjectOption is suspicious
                    FilesAPI.propagate('change', file).done(function () {
                        def.resolve();
                    });
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

            synchronizeOperations()
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
         * Reads new operations from the server, applies them in the editor,
         * sends all local operations to the server, and restarts the timer
         * that re-triggers this method automatically.
         *
         * @param {Boolean} [sendOnly=false]
         *  If set to true, operations will not be read from the server, only
         *  the own operations will be sent to the server.
         *
         * @returns {jQuery.Promise}
         *  The promise object of a deferred that will be resolved when all
         *  operations have been synchronized with the server.
         */
        var synchronizeOperations = (function () {

            /**
             * Reads new operations from the server, and applies them in the
             * editor.
             *
             * @returns {jQuery.Promise}
             *  The promise object of a deferred that will be resolved or
             *  rejected according to the AJAX request.
             */
            function receiveOperations() {

                var // read operations from server
                    request = $.ajax({
                        type: 'GET',
                        url: self.getDocumentFilterUrl('pulloperationupdates'),
                        dataType: 'json'
                    });

                // log the state in the debug view
                view.logSyncState('receiving');

                // apply received operations in the editor
                request.done(function (response) {
                    if (response && response.data) {
                        var // response data
                            data = AppHelper.extractAjaxResultData(response),
                            // operations
                            operations = extractOperationsList(response);

                        controller.setEditUser(data && data.editUser);
                        controller.setEditMode(data && data.canEdit);

                        if (_.isArray(operations) && (operations.length > 0)) {
                            // We might need to do some "T" here!
                            applyOperations(operations);
                        }
                    }
                });
                // check if network connection is still alive.
                // verify the ajax error response for browsers that don't support the 'offline' event.
                request.fail(function (response, text) {
                    var readOnlyMode = response && response.status === 0 && response.readyState === 0;
                    if (readOnlyMode && editor.isEditMode()) {
                        controller.setEditMode(false);
                        Alert.showWarning(gt('Network Problems'), gt('Switched to read only mode.'), win.nodes.appPane, 10000);
                    }
                });

                return request.promise();
            }

            /**
             * Sends all operations contained in the operations buffer to the
             * server.
             *
             * @returns {jQuery.Promise}
             *  The promise object of a deferred that will be resolved or
             *  rejected according to the AJAX request.
             */
            function sendOperations() {

                var // local deep copy of the current operations buffer
                    sendOps = _.copy(operationsBuffer, true),
                    // the data object to be passed to the AJAX request
                    dataObject = { operations: JSON.stringify(sendOps) },
                    // the AJAX request
                    request = null;

                // we might receive new operations while sending the current ones
                operationsBuffer = [];

                invalidateDriveCacheOnClose = true;

                // log the state in the debug view
                view.logSyncState('sending');

                // send operations to server
                request = $.ajax({
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
                .fail(function () {
                    // Try again later. TODO: NOT TESTED YET!
                    operationsBuffer = sendOps.concat(operationsBuffer);
                });
                return request.promise();
            }

            var // the result deferred
                syncDef = null;

            // return the actual synchronizeOperations() function
            return function (sendOnly) {

                // return existing deferred if the AJAX request is still running
                if (syncDef && (syncDef.state() === 'pending')) {
                    return syncDef.promise();
                }

                // create a new result deferred
                syncDef = $.Deferred()
                    .always(startOperationsTimer)
                    .done(function () { view.logSyncState('synchronized'); })
                    .fail(function () { view.logSyncState('failed'); });

                // first, check if the server has new operations
                (sendOnly ? $.when() : receiveOperations())
                .done(function (response) {
                    // send own operations
                    if (operationsBuffer.length) {
                        // We might first need to do some "T" here!
                        // resolving sendDef starts the operations timer
                        sendOperations().then(
                            function () { syncDef.resolve(); },
                            function () { syncDef.reject(); }
                        );
                    } else {
                        // nothing to send, but the deferred must be resolved
                        syncDef.resolve();
                    }
                })
                .fail(function () {
                    syncDef.reject();
                });

                return syncDef.promise();
            };

        }());

        /**
         * Clears the timer that calls the method synchronizeOperations()
         * periodically.
         */
        function stopOperationsTimer() {
            if (operationsTimer) {
                window.clearTimeout(operationsTimer);
                operationsTimer = null;
                view.logSyncState('offline');
            }
        }

        /**
         * Starts a timer that calls the method synchronizeOperations()
         * periodically.
         *
         * @param {Number} [timeout=3000]
         *  The time period, in milliseconds.
         */
        function startOperationsTimer(timeout) {

            // clear running timer, prevents sending too many updates while the user is typing
            stopOperationsTimer();

            // do not start a new timer in debug offline mode
            if (syncMode && self.hasFileDescriptor()) {
                operationsTimer = window.setTimeout(function () {
                    operationsTimer = null;
                    synchronizeOperations();
                }, timeout || 3000);
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
                classic: true,
                search: true,
                toolbar: true
            });
            self.setWindow(win);

            // do not detach when hiding for several reasons:
            // - keep editor selection alive
            // - prevent resize handles for tables and objects (re-enabled after detach/insert)
            win.detachable = false;

            // create the editor model
            editor = new Editor(self);

            // create controller
            controller = new Controller(self);

            // editor view
            view = new View(win, controller, editor);
            updateDebugMode();

            // register window event handlers
            Utils.registerWindowResizeHandler(win, windowResizeHandler);

            // cache operations from editor
            editor.on('operation', function (event, operation) {
                operationsBuffer.push(operation);
            });

            // wait for unload events and send notification to server
            self.registerEventHandler(window, 'unload', function () {
                sendCloseNotification(true);
            });

            // set into read only mode on browser 'offline' event
            self.registerEventHandler(window, 'offline', function () {
                controller.setEditMode(false);
            });

            // disable Firefox spell checking. TODO: better solution...
            $('body').attr('spellcheck', false);

            // 'new document' action: create the new file in InfoStore
            if (Utils.getStringOption(options, 'file') === 'new') {
                initFileDef = $.ajax({
                    type: 'GET',
                    url: self.buildServiceUrl('oxodocumentfilter', { action: 'createdefaultdocument', folder_id: Utils.getOption(options, 'folder_id'), document_type: 'text' }),
                    dataType: 'json'
                })
                .pipe(function (response) {
                    // creation succeeded: receive file descriptor and set it
                    self.setFileDescriptor(response.data);
                    return FilesAPI.propagate('new', response.data);
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

            var // the deferred used to synchronize operations
                syncDef = null,
                // the deferred returned to the framework
                def = $.Deferred();

            win.busy();

            def.fail(function () {
                // back to living application
                win.idle();
                startOperationsTimer();
            });

            // send any pending operations (but not in debug offline mode)
            syncDef = syncMode ? synchronizeOperations(true) : $.when();
            // stop the operations timer started by the synchronizeOperations() method
            stopOperationsTimer();

            // wait for the operations received from server
            syncDef.always(function () {

                // still pending operations: ask user whether to close the application
                if (self.hasUnsavedChanges()) {
                    require(['io.ox/office/tk/dialogs'], function (Dialogs) {

                        Dialogs.showYesNoDialog({
                            message: gt('This document contains unsaved changes. Do you really want to close?')
                        }).then(
                            function () { def.resolve(); },
                            function () { def.reject(); }
                        );
                    });
                } else {
                    // all operations saved, close application without dialog
                    def.resolve();
                }
            });

            return def.pipe(function () {
                // deinitialize application on quit
                return sendCloseNotification().done(function () {
                    self.destroy();
                });
            });
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
         * @returns {jQuery.Deferred}
         */
        this.rename = function (newFilename) {

            var file = this.getFileDescriptor();

            if (newFilename && newFilename.length && file && (newFilename !== file.filename)) {
                return $.ajax({
                    type: 'GET',
                    url: this.getDocumentFilterUrl('renamedocument', { filename: newFilename }),
                    dataType: 'json'
                })
                .pipe(function (response) {
                    if (response && response.data && response.data.filename) {
                        file.filename = response.data.filename;
                        updateTitles();
                        return FilesAPI.propagate('change', file);
                    } else {
                        return $.when();
                    }
                });
            } else {
                return $.when();
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

        /**
         * Returns whether there are unsaved operations left.
         */
        this.hasUnsavedChanges = function () {
            return operationsBuffer.length > 0;
        };

        /**
         * Will be called automatically from the OX framework to create and
         * return a restore point containing the current state of the
         * application.
         *
         * @return {Object}
         *  The restore point containing the application state.
         */
        this.failSave = function () {
            var point = {
                file: this.getFileDescriptor(),
                toolBarId: view.getToolPane().getVisibleToolBarId(),
                debugMode: debugMode,
                syncMode: syncMode
            };
            return { module: MODULE_NAME, point: point };
        };

        /**
         * Will be called automatically from the OX framework to restore the
         * state of the application after a browser refresh.
         *
         * @param {Object} point
         *  The restore point containing the application state.
         */
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
         * Triggers the acquire edit rights action. If the edit rights were
         * aquired is determined by the server response to the pull operation
         * action.
         */
        this.acquireEditRights = function () {

            if (this.hasFileDescriptor()) {
                $.ajax({
                    type: 'GET',
                    url: self.getDocumentFilterUrl('acquireeditrights'),
                    dataType: 'json'
                })
                .fail(function (response) {
                    showAjaxError(response);
                });
            }
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

        // configure application
        initializeFromOptions(options);
        this.setLauncher(launchHandler).setQuit(quitHandler);

    } // class Application

    // global initialization --------------------------------------------------

    AppHelper.configureWindowToolBar(MODULE_NAME)
        .addButtonGroup('file')
            .addButton('file/download', { label: gt('Download') })
            .addButton('file/print',    { label: gt('Print') })
            .end()
        .addRadioGroup(ToolPane.KEY_SHOW_TOOLBAR)
            .addButton('insert', { label: gt('Insert'), active: false })
            .addButton('format', { label: gt('Format') })
            .addButton('table',  { label: gt('Table') })
            .addButton('image',  { label: gt('Image') })
            .addButton('debug',  { label: gt('Debug'), active: Config.isDebugAvailable() })
            .end()
        .addButtonGroup('quit')
            .addButton('file/quit', { label: gt('Close') })
            .end();

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (options) {
            return AppHelper.getOrCreateApplication(MODULE_NAME, Application, options);
        }
    };

});
