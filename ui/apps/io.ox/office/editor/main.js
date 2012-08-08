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
     'io.ox/office/editor/editor',
     'io.ox/office/editor/view',
     'io.ox/office/editor/controller',
     'gettext!io.ox/office/main',
     'io.ox/office/editor/actions',
     'less!io.ox/office/editor/main.css'
    ], function (filesApi, Utils, AppHelper, Editor, View, Controller, gt) {

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

    // initializeApplication() ================================================

    function initializeApplication(app, options) {

        var // application window
            win = null,

            // editors mapped by text mode
            editors = {},

            // primary editor used in save, quit, etc.
            editor = null,

            // editor view, contains panes, tool bars, etc.
            view = null,

            // controller as single connection point between editors and view elements
            controller = null,

            // deferred objects causing the quit handler to delay destruction of the application
            quitDelays = [],

            // buffer for user operations. One should be enough, as the editors here are always in sync
            operationsBuffer = [],

            // browser timer for operations handling
            operationsTimer = null,

            // if true, debug mode is active (second editor and operations output console)
            debugMode = false,

            // if true, editor synchronizes operations with backend server
            syncMode = true;

        // private methods ----------------------------------------------------

        function initializeApp(options) {
            app.setFileDescriptor(options);
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

            var // the alert box
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
         * current file name.
         */
        function updateTitles() {
            var file = app.getFileDescriptor(),
                fileName = (file && file.filename) ? file.filename : gt('Unnamed');
            app.setTitle(fileName);
            win.setTitle(gt('Editor') + ' - ' + fileName);
        }

        /**
         * Updates the view according to the current state of the debug mode.
         */
        function updateDebugMode() {
            editor.getNode().toggleClass('debug-highlight', debugMode);
            win.nodes.debugPane.toggle(debugMode);
            controller.update('debug/toggle');
            // resize editor pane
            windowResizeHandler();
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

            // create the application window
            win = ox.ui.createWindow({
                name: MODULE_NAME,
                close: true,
                search: true,
                toolbar: true
            });
            app.setWindow(win);

            // do not detach when hiding for several reasons:
            // - keep editor selection alive
            // - prevent resize handles for tables and objects (re-enabled after detach/insert)
            win.detachable = false;

            // create controller and register editors
            controller = new Controller(app)
                .registerEditor(editors[Editor.TextMode.RICH])
                .registerEditor(editors[Editor.TextMode.PLAIN], /^(action|insert|debug)\//);

            // editor view
            view = new View(win, controller, editors);
            updateDebugMode();

            // register window event handlers
            Utils.registerWindowResizeHandler(win, windowResizeHandler);
            win.on('show', function () { controller.done(); });

            // disable Firefox spell checking. TODO: better solution...
            $('body').attr('spellcheck', false);
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
                def = $.Deferred().done(app.destroy);

            win.busy();

            // silently send pending operations (no new quit delay, no operations timer)
            if (operationsBuffer.length) {
                sendOperations(true);
            }

            // Wait for all registered quit delays ($.when() resolves immediately,
            // if the array is empty). All deferreds will resolve with a boolean
            // result (never reject, see createQuitDelay() function).
            $.when.apply(this, quitDelays).done(function () {

                var // each deferred returns its result as a boolean
                    resolved = _(arguments).all(_.identity);

                win.idle();
                if (resolved) { def.resolve(); } else { def.reject(); }
            });

            return def;
        }

        /**
         * Applies the passed operations at all known editor objects but the
         * editor specified as event source.
         *
         * @param {Object|Object[]} operations
         *  An operation or an array of operations to be applied.
         *
         * @param {Editor} [eventSource]
         *  The editor that has called the function. This editor will not
         *  receive the passed operations again. May be omitted to apply the
         *  operations to all editors.
         */
        function applyOperations(operations, eventSource) {

            // normalize operations parameter
            if (!_.isArray(operations)) {
                operations = [operations];
            }

            // apply operations to all editors
            _(editors).each(function (editor) {
                if (editor !== eventSource) {
                    editor.applyOperations(operations, false, false);
                }
            });
        }

        /**
         * Loads the document described in the file descriptor passed to the
         * constructor of this application, and shows the application window.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that reflects the result of the load operation.
         */
        function load() {

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
                $.ajax({
                    type: 'GET',
                    url: AppHelper.getDocumentFilterUrl(app, 'importdocument'),
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
            if (!app.hasFileDescriptor()) {
                return def.reject();
            }

            win.busy();
            // var allOperations = editor.getOperations();
            // var dataObject = { operations: JSON.stringify(allOperations) };

            $.ajax({
                type: 'GET',
                url: AppHelper.getDocumentFilterUrl(app, action),
                dataType: 'json'
                /* data: dataObject,
                beforeSend: function (xhr) {
                    if (xhr && xhr.overrideMimeType) {
                        xhr.overrideMimeType('application/j-son;charset=UTF-8');
                    }
                }*/
            })
            .done(function (response) {
                filesApi.caches.get.clear(); // TODO
                filesApi.caches.versions.clear();
                filesApi.trigger('refresh.all');
                def.resolve();
            })
            .fail(function (response) {
                showAjaxError(response);
                def.reject();
            });

            return def;
        }

        /**
         * Creates a PDF preview for printing.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that reflects the result of the operation.
         */
        function print() {

            var // initialize the deferred to be returned
                def = $.Deferred().always(function () {
                    win.idle();
                    editor.grabFocus();
                });

            // do not try to print, if file descriptor is missing
            if (!app.hasFileDescriptor()) {
                return def.reject();
            }

            win.busy();
            // load the file
            window.open(AppHelper.getDocumentFilterUrl(app, 'importdocument', 'pdf_document'));
            /*
            $.ajax({
                type: 'GET',
                url: AppHelper.getDocumentFilterUrl(app, 'importdocument', 'pdf'),
                dataType: 'json'
            })
            .pipe(function (response) {
                return AppHelper.extractAjaxStringResult(response, 'PDFDoc');
            })
            .done(function (document) {
                if (_.isString(document)) {
                    showError('Printing is not implemented yet.', gt('Print Error'));
                    def.reject();
                } else {
                    showError(gt('An error occurred while printing the document.'), gt('Print Error'));
                    def.reject();
                }
            })
            .fail(function (response) {
                showAjaxError(response);
                def.reject();
            });
            */

            return def;
        }

        /**
         * Sends all operations contained in the operationsBuffer array to the
         * server, creates a quit delay object causing the quit handler to wait
         * for the AJAX request, and starts the operations timer.
         *
         * @param {Boolean} [silent]
         *  If set to true, the AJAX request will be sent silently, without
         *  creating a quit delay, and without restarting the operations timer.
         */
        var sendOperations = AppHelper.makeNoRecursionGuard(function (silent) {

            var // deep copy of the current buffer
                sendOps = _.copy(operationsBuffer, true),
                // the data object to be passed to the AJAX request
                dataObject = { operations: JSON.stringify(sendOps) },
                // a deferred that will cause the quit handler to wait for the AJAX request
                quitDelay = (silent === true) ? null : createQuitDelay();

            // We might receive new operations while sending the current ones...
            operationsBuffer = [];

            $.ajax({
                type: 'POST',
                url: AppHelper.getDocumentFilterUrl(app, 'pushoperationupdates'),
                dataType: 'json',
                data: dataObject,
                beforeSend: function (xhr) {
                    if (xhr && xhr.overrideMimeType) {
                        xhr.overrideMimeType('application/j-son;charset=UTF-8');
                    }
                }
            })
            .done(function (response) {
                if (quitDelay) { quitDelay.resolve(); }
            })
            .fail(function (response) {
                // Try again later. TODO: NOT TESTED YET!
                operationsBuffer = $.extend(true, operationsBuffer, sendOps);
                // TODO: reject? (causing the application to stay alive?)
                if (quitDelay) { quitDelay.resolve(); }
            })
            .always(function () {
                if (silent !== true) { startOperationsTimer(); }
            });
        });

        var receiveAndSendOperations = AppHelper.makeNoRecursionGuard(function () {

            var // a deferred that will cause the quit handler to wait for the AJAX request
                quitDelay = createQuitDelay();

            // first, check if the server has new operations for me
            $.ajax({
                type: 'GET',
                url: AppHelper.getDocumentFilterUrl(app, 'pulloperationupdates'),
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
                    sendOperations(); // will start the operations timer
                } else {
                    startOperationsTimer();
                }
            })
            .always(function () {
                quitDelay.resolve(); // always resolve, ignore failed GET
            });
        });

        function startOperationsTimer(timeout) {

            // restart running timer, prevents sending too many updates while the user is typing
            if (operationsTimer) {
                window.clearTimeout(operationsTimer);
            }

            // offline mode: do not start a new timer
            if (!syncMode) {
                return;
            }

            operationsTimer = window.setTimeout(function () {
                operationsTimer = null;
                receiveAndSendOperations();
            }, timeout || 1000);
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the editor instance.
         */
        app.getEditor = function () {
            return editor;
        };

        /**
         * Returns the global view object.
         */
        app.getView = function () {
            return view;
        };

        /**
         * Shows the application window and activates the editor.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that is resolved if the application has been made
         *  visible, or rejected if the application is in an invalid state.
         */
        app.show = function () {
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

        /**
         * Loads the document described in the file descriptor passed to the
         * constructor of this application, and shows the application window.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that reflects the result of the load operation.
         */
        app.load = function () {
            // do not load twice (may be called repeatedly from app launcher)
            app.load = app.show;
            // do not try to load, if file descriptor is missing
            return app.hasFileDescriptor() ? load() : app.show();
        };

        app.save = function () {
            return saveOrFlush('exportdocument');
        };

        app.flush = function () {
            return saveOrFlush('savedocument');
        };

        app.print = print;

        app.failSave = function () {
            var point = {
                file: app.getFileDescriptor(),
                toolBarId: view.getToolPane().getVisibleToolBarId(),
                debugMode: debugMode,
                syncMode: syncMode
            };
            return { module: MODULE_NAME, point: point };
        };

        app.failRestore = function (point) {
            initializeApp(point);
            updateDebugMode();
            return app.load().always(function () {
                view.getToolPane().showToolBar(Utils.getStringOption(point, 'toolBarId'));
            });
        };

        /**
         * Returns whether the application is in debug mode. See method
         * setDebugMode() for details.
         */
        app.isDebugMode = function () {
            return debugMode;
        };

        /**
         * Enables or disables the debug mode. In debug mode, displays colored
         * borders and background for 'p' and 'span' elements in the rich-text
         * editor, and shows a plain-text editor and an output console for
         * processed operations.
         */
        app.setDebugMode = function (state) {
            if (debugMode !== state) {
                debugMode = state;
                updateDebugMode();
            }
            return this;
        };

        app.isSynchronizedMode = function () {
            return syncMode;
        };

        app.setSynchronizedMode = function (state) {
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
        app.destroy = function () {
            if (operationsTimer) {
                window.clearTimeout(operationsTimer);
                operationsTimer = null;
            }
            controller.destroy();
            view.destroy();
            _(editors).invoke('destroy');
            app = win = editors = editor = view = controller = null;
        };

        // initialization -----------------------------------------------------

        // create the rich-text and plain-text editor
        _(Editor.TextMode).each(function (textMode) {
            var // class names for the editor
                classes = 'io-ox-office-editor user-select-text ' + textMode,
                // the editor root node
                node = $('<div>', { contenteditable: true }).addClass(classes);
            editors[textMode] = new Editor(node, textMode);
        });

        // operations output console
        editors.output = {
            node: $('<div>').addClass('io-ox-office-editor user-select-text output'),
            getNode: function () { return this.node; },
            on: function () { return this; },
            applyOperation: function (operation) {
                this.node.append($('<p>').text(JSON.stringify(operation)));
                this.node.scrollTop(this.node.get(0).scrollHeight);
            },
            applyOperations: function (operations) {
                if (_.isArray(operations)) {
                    _(operations).each(_.bind(this.applyOperation, this));
                } else {
                    this.applyOperation(operations);
                }
            },
            destroy: $.noop
        };

        // primary editor for global operations (e.g. save)
        editor = editors[Editor.TextMode.RICH];

        // listen to operations and deliver them to editors and output console
        _(editors).each(function (editor) {
            editor.on('operation', function (event, operation) {
                // buffer operations for sending them later on...
                operationsBuffer.push(operation);
                applyOperations(operation, editor);
            });
        });

        // configure OX application
        initializeApp(options);
        return app.setLauncher(launchHandler).setQuit(quitHandler);

    } // initializeApplication()

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (options) {
            return AppHelper.getOrCreateApplication(MODULE_NAME, initializeApplication, options);
        }
    };

});
