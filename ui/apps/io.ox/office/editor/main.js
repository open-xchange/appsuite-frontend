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
     'io.ox/office/tk/application',
     'io.ox/office/tk/config',
     'io.ox/office/tk/view/alert',
     'io.ox/office/editor/actions',
     'io.ox/office/editor/editor',
     'io.ox/office/editor/view/view',
     'io.ox/office/editor/controller',
     'gettext!io.ox/office/main',
     'less!io.ox/office/editor/style.css'
    ], function (FilesAPI, Utils, Application, Config, Alert, Actions, EditorModel, EditorView, EditorController, gt) {

    'use strict';

    // static functions =======================================================

    /**
     * Extracts the operations list from the passed response object of an
     * AJAX import request.
     *
     * @param {Object} response
     *  The response object of the AJAX request.
     *
     * @returns {Object[]|Undefined}
     *  The operations array, if existing, otherwise undefined.
     */
    function extractOperationsList(response) {

        var // the result data
            data = Application.extractAjaxResultData(response);

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

    // class EditorApplication ================================================

    function EditorApplication(options) {

        var // self reference
            self = this,

            // the editor model
            editor = null,

            // controller as single connection point between editor and view elements
            controller = null,

            // editor view, contains panes, tool bars, etc.
            view = null,

            // buffer for user operations
            operationsBuffer = [],

            // browser timer for operations handling
            operationsTimer = null,

            // invalidate local storage cache in case a new document might be written
            invalidateDriveCacheOnClose = false,

            // if true, debug mode is active (second editor and operations output console)
            debugMode = false,

            // if true, editor synchronizes operations with backend server
            syncMode = true,

            // if true, the synchronization of operations with the server failed
            serverSyncError = false;

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
         * Sets application title (launcher) and window title according to the
         * current file name but without any extension.
         */
        function updateTitles() {
            var file = self.getFileDescriptor(),
                filename = (file && file.filename) ? file.filename : gt('Unnamed'),
                extensionPos = filename.lastIndexOf('.'),
                displayName = (extensionPos !== -1 && extensionPos > 0) ? filename.substring(0, extensionPos) : filename;

            self.setTitle(displayName);
            self.getWindow().setTitle(displayName);
        }

        /**
         * Updates the view according to the current state of the debug mode.
         */
        function updateDebugMode() {
            if (Config.isDebugAvailable()) {
                editor.getNode().toggleClass('debug-highlight', debugMode);
                view.togglePane('debugpane', debugMode);
                controller.update('debug/toggle');
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
            editor.applyOperations(operations, { silent: true });
            controller.update();
            view.logOperations(operations);
        }

        /**
         * Creates a new document in the Drive.
         *
         * @param {Number} folderId
         *  The identifier of the Drive folder for the new document.
         *
         * @param {Object} fileTemplateData
         *  The file data of an optional template file
         *
         * @returns {jQuery.Promise}
         *  The promise of a deferred that will be resolved with the file
         *  descriptor of the new document when the document has been created.
         */
        function createNewDocument(folderId, fileTemplateData) {

            var // the result deferred
                def = null;

            if (!_.isUndefined(folderId)) {
                var args = { action: 'createdefaultdocument', folder_id: folderId, document_type: 'text' };

                if (!_.isUndefined(fileTemplateData)) {
                    args.template_id = fileTemplateData.id;
                    args.version = fileTemplateData.version;
                }

                def = $.ajax({
                    type: 'GET',
                    url: self.buildServiceUrl('oxodocumentfilter', args),
                    dataType: 'json'
                })
                .pipe(function (response) {
                    // creation succeeded: receive file descriptor and set it
                    self.setFileDescriptor(response.data);
                    return FilesAPI.propagate('new', response.data);
                });
            } else {
                Utils.error('EditorApplication.createNewDocument(): cannot create new document without folder identifier');
                def = $.Deferred().reject();
            }

            return def.promise();
        }

        /**
         * Loads the document described in the current file descriptor of this
         * application, and shows the application window.
         *
         * @returns {jQuery.Promise}
         *  The promise of a deferred that reflects the result of the load
         *  operation.
         */
        function loadAndShow() {

            var // initialize the deferred to be returned
                def = $.Deferred().always(function () {
                    editor.grabFocus(true);
                    // let editor post-process (via window timeout), then leave busy state
                    window.setTimeout(function () {
                        self.getWindow().idle();
                        editor.grabFocus();
                    }, 0);
                }),

                // start time of the import process (for profiling)
                time = 0;

            // dumps elapsed time (difference of current time and 'time') to console
            function dumpElapsedTime(msg) {
                var now = new Date().getTime();
                Utils.info('EditorApplication.loadAndShow(): ' + msg + ' in ' + (now - time) + 'ms');
                time = now;
            }

            // show application window
            self.getWindow().show(function () {
                self.getWindow().busy();
                $(window).resize();
                updateTitles();

                editor.initDocument();
                operationsBuffer = [];

                // load the file
                if (self.hasFileDescriptor()) {
                    time = new Date().getTime();

                    $.ajax({
                        type: 'GET',
                        url: self.getDocumentFilterUrl('importdocument'),
                        dataType: 'json'
                    })
                    .pipe(extractOperationsList)
                    .always(function () {
                        dumpElapsedTime('document imported');
                    })
                    .done(function (operations) {
                        if (_.isArray(operations)) {
                            editor.enableUndo(false);
                            applyOperations(operations);
                            dumpElapsedTime('operations applied');
                            editor.documentLoaded();
                            window.setTimeout(function () { dumpElapsedTime('postprocessing finished'); }, 0);
                            editor.enableUndo(true);
                            startOperationsTimer(0);
                            def.resolve();
                        } else {
                            Alert.showGenericError(view.getToolPane().getNode(), gt('An error occurred while importing the document.'), gt('Load Error'));
                            def.reject();
                        }
                    })
                    .fail(function (response) {
                        Alert.showAjaxError(view.getToolPane().getNode(), response);
                        def.reject();
                    });

                } else {
                    // no file descriptor (restored from save point): just show an empty editor
                    def.resolve();
                }
            });

            return def.promise();
        }

        /**
         * Downloads the document in the specified format.
         *
         * @returns {jQuery.Promise}
         *  The promise of a deferred that reflects the result of the
         *  operation.
         */
        function download(format) {

            // the deferred to be returned
            var def = $.Deferred().always(function () {
                self.getWindow().idle();
                editor.grabFocus();
            });

            //  do not try to save, if file descriptor is missing
            if (!self.hasFileDescriptor()) {
                return def.reject();
            }

            self.getWindow().busy();

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

            return def.promise();
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
                            data = Application.extractAjaxResultData(response),
                            // operations
                            operations;

                        if (data && !data.serverIsBusy) {

                            if (data.writeProtected)
                                controller.setWriteProtected();
                            else {
                                controller.setEditUser(data.editUser);
                                controller.setEditMode(data.canEdit);
                            }

                            operations = extractOperationsList(response);
                            if (_.isArray(operations) && (operations.length > 0)) {
                                // We might need to do some "T" here!
                                applyOperations(operations);
                            }
                        }

                        if (data && data.hasOwnProperty('hasErrors')) {
                            if (data.hasErrors && !serverSyncError) {
                                Alert.showGenericError(view.getToolPane().getNode(), gt('Synchronization to the server has been lost.'), gt('Server Error'));
                            }
                            serverSyncError = data.hasErrors;
                        }
                    }
                });
                // check if network connection is still alive.
                // verify the ajax error response for browsers that don't support the 'offline' event.
                request.fail(function (response, text) {
                    var readOnlyMode = response && response.status === 0 && response.readyState === 0;
                    if (readOnlyMode && editor.isEditMode()) {
                        controller.setEditMode(false);

                        Alert.showWarning(gt('Network Problems'), gt('Switched to read only mode.'), true, view.getToolPane().getNode(), controller, 10000);
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
                    .done(function () { view.logSyncState('synchronized'); controller.update('file/connection/state'); })
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
                }, _.isNumber(timeout) ? timeout : 3000);
            }
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

            // create the editor model
            editor = new EditorModel(self);

            // create the controller
            controller = new EditorController(self);

            // create the view (creates application window)
            view = new EditorView(self);
            updateDebugMode();

            // do not detach when hiding for several reasons:
            // - keep editor selection alive
            // - prevent resize handles for tables and objects (re-enabled after detach/insert)
            self.getWindow().detachable = false;

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

            // disable dropping of images onto the apps background area
            self.getWindow().nodes.main.on('drop', false);

            if (Utils.getStringOption(options, 'action') === 'new') {
                // 'new document' action: create the new file in InfoStore (optionally based on a template file)
                initFileDef = createNewDocument(Utils.getOption(options, 'folder_id'), Utils.getOption(options, 'template'));
            }
            else {
                initFileDef = $.when();
            }

            // load the file
            initFileDef.done(function () {
                loadAndShow().then(function () { def.resolve(); }, function () { def.reject(); });
            }).fail(function () {
                def.reject();
            });

            return def.promise();
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

            self.getWindow().busy();

            def.fail(function () {
                // back to living application
                self.getWindow().idle();
                startOperationsTimer(0);
            });

            // send any pending operations (but not in debug offline mode)
            syncDef = syncMode ? synchronizeOperations(true) : $.when();
            // stop the operations timer started by the synchronizeOperations() method
            stopOperationsTimer();

            // wait for the operations received from server
            syncDef.always(function () {

                // still pending operations: ask user whether to close the application
                if (self.hasUnsavedChanges()) {
                    require(['io.ox/office/tk/view/dialogs'], function (Dialogs) {

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
         * Returns the document model of this editor application.
         *
         * @returns {EditorModel}
         *  The document model of this editor application.
         */
        this.getEditor = this.getModel = function () {
            return editor;
        };

        /**
         * Returns the controller of this editor application.
         *
         * @returns {EditorController}
         *  The controller of this editor application.
         */
        this.getController = function () {
            return controller;
        };

        /**
         * Returns the view of this editor application.
         *
         * @returns {EditorView}
         *  The view of this editor application.
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

            if (self.getWindow() && editor) {
                self.getWindow().show(function () {
                    updateTitles();
                    editor.grabFocus();
                    def.resolve();
                });
            } else {
                def.reject();
            }

            return def;
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
         * Returns true once the first operation has been sent to the server.
         */
        this.isLocallyModified = function () {
            return invalidateDriveCacheOnClose;
        };

        /**
         * Returns the current application state.
         *
         * @returns {String}
         *  A string representing the editor application state. Will be one of
         *  the following values:
         *  - 'nofile': no document file loaded in editor,
         *  - 'offline': network connection missing,
         *  - 'readonly': the document cannot be changed,
         *  - 'initial': the document has not been changed yet,
         *  - 'ready': all local changes have been sent to the server,
         *  - 'sending': local changes are currently being sent to the server.
         */
        this.getConnectionState = function () {
            return !this.hasFileDescriptor() ? 'nofile' :
                (!ox.online || !syncMode) ? 'offline' :
                !editor.isEditMode() ? 'readonly' :
                this.hasUnsavedChanges() ? 'sending' :
                this.isLocallyModified() ? 'ready' :
                'initial';
        };

        /**
         * Will be called automatically from the OX framework to create and
         * return a restore point containing the current state of the
         * application.
         *
         * @returns {Object}
         *  The restore point containing the application state.
         */
        this.failSave = function () {
            var point = {
                file: this.getFileDescriptor(),
                toolBarId: view.getToolPane().getVisibleToolBarId(),
                debugMode: debugMode,
                syncMode: syncMode
            };
            return { module: self.getName(), point: point };
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
                controller.update('file/connection/state');
                startOperationsTimer(0);
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
                    Alert.showAjaxError(view.getToolPane().getNode(), response);
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
            editor.destroy();
            view.destroy();
            editor = controller = view = null;
        };

        // initialization -----------------------------------------------------

        // configure application
        initializeFromOptions(options);
        this.setLauncher(launchHandler).setQuit(quitHandler);

    } // class EditorApplication

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (options) {
            return Application.getOrCreateApplication(Actions.MODULE_NAME, EditorApplication, options);
        }
    };

});
