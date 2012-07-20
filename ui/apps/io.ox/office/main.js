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

define('io.ox/office/main',
    ['io.ox/files/api',
     'io.ox/office/tk/utils',
     'io.ox/office/editor',
     'io.ox/office/view',
     'io.ox/office/controller',
     'gettext!io.ox/office/main',
     'io.ox/office/actions',
     'less!io.ox/office/main.css'
    ], function (filesApi, Utils, Editor, View, Controller, gt) {

    'use strict';

    var // application identifier
        MODULE_NAME = 'io.ox/office';

    // createApplication() ====================================================

    function createApplication(options) {

        var // OX application object
            app = ox.ui.createApp({ name: MODULE_NAME }),

            // application window
            win = null,

            // connection to infostore file
            file = null,

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
            debugMode = false;

        // private functions --------------------------------------------------

        function initializeApp(options) {
            file = Utils.getObjectOption(options, 'file', null);
            debugMode = Utils.getBooleanOption(options, 'debugMode', false);
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
         * Returns the URL passed to the AJAX calls used to convert a document
         * file from and to an operations list.
         */
        function getFilterUrl(action, format) {
            return file && (ox.apiRoot +
                '/oxodocumentfilter' +
                '?action=' + action +
                '&id=' + file.id +
                '&folder_id=' + file.folder_id +
                '&version=' + file.version +
                '&filename=' + file.filename +
                '&session=' + ox.session +
                '&uid=' + app.getUniqueId() +
                (format ? ('&filter_format=' + format) : ''));
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
            var fileName = (file && file.filename) ? file.filename : gt('Unnamed');
            app.setTitle(fileName);
            win.setTitle(gt('OX Office') + ' - ' + fileName);
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
                search: false,
                toolbar: true
            });
            app.setWindow(win);

            // do not detach when hiding to keep editor selection alive
            win.detachable = false;

            // create panes and attach them to the main window
            win.nodes.main.addClass('io-ox-office-main').append(
                // top pane for tool bars
                win.nodes.toolPane = view.getToolPane(),
                // main application container
                win.nodes.appPane = $('<div>').addClass('io-ox-office-apppane').append(editor.getNode()),
                // bottom pane for debug output
                win.nodes.debugPane = view.getDebugPane()
            );
            updateDebugMode();

            // register window event handlers
            win.on('show', function () {
                    // listen to resize events, initially execute all listeners
                    $(window).on('resize', windowResizeHandler).resize();
                })
                .on('hide', function () {
                    // unbind resize handler when window is hidden
                    $(window).off('resize', windowResizeHandler);
                });

            // disable Firfox spell checking. TODO: better solution...
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
         * Extracts the operations list from the passed response object of an
         * AJAX import request.
         *
         * @param {Object} response
         *  The response object of the AJAX request.
         *
         * @return {jQuery.Deferred}
         *  A deferred indicating the success or failure of the operations
         *  import. On success, passes an array of operations to the done
         *  handler. On failure, passes an exception object or a string to the
         *  fail handler.
         */
        function importOperations(response) {

            var // the deferred return value
                def = $.Deferred();

            // big try/catch, exception handler will reject the deferred with the exception
            try {

                // check that the passed AJAX result is an object
                if (!_.isObject(response)) {
                    throw 'Missing AJAX result.';
                }

                // convert JSON result string to object (may throw)
                if (_.isString(response.data)) {
                    response.data = JSON.parse(response.data);
                }

                // check that a result object exists and contains an operations array
                if (!_.isObject(response.data) || !_.isArray(response.data.operations)) {
                    throw 'Missing AJAX result data.';
                }

                // check all operation objects in the array
                _(response.data.operations).each(function (operation) {
                    if (!_.isObject(operation) || !_.isString(operation.name)) {
                        throw 'Invalid element in operations list.';
                    }
                });

            } catch (ex) {
                // reject deferred on error
                return def.reject(ex);
            }

            // resolve the deferred with the operations list
            return def.resolve(response.data.operations);
        }

        /**
         * Loads the document described in the file descriptor passed to the
         * constructor of this application, and shows the application window.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that reflects the result of the load operation.
         */
        function load() {
            var def = null;

            // show application window
            win.show().busy();
            $(window).resize();
            updateTitles();

            editor.initDocument();
            operationsBuffer = []; // initDocument will result in an operation

            // initialize the deferred to be returned
            def = $.Deferred().always(function () {
                win.idle();
                editor.setModified(false);
                editor.grabFocus(true);
            });

            // load the file
            $.ajax({
                type: 'GET',
                url: getFilterUrl('importdocument'),
                dataType: 'json'
            })
            .done(function (response) {
                importOperations(response)
                .done(function (operations) {
                    editor.enableUndo(false);
                    applyOperations(operations);
                    editor.enableUndo(true);
                    startOperationsTimer();
                    def.resolve();
                })
                .fail(function (ex) {
                    showExceptionError(ex);
                    def.reject();
                });
            })
            .fail(function (response) {
                showAjaxError(response);
                def.reject();
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
            if (!file) {
                return def.reject();
            }

            win.busy();
            // var allOperations = editor.getOperations();
            // var dataObject = { operations: JSON.stringify(allOperations) };

            $.ajax({
                type: 'GET',
                url: getFilterUrl(action),
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
                // editor.setModified(false);
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
            if (!file) {
                return def.reject();
            }

            win.busy();
            // load the file
            $.ajax({
                type: 'GET',
                url: getFilterUrl('importdocument', 'pdf'),
                dataType: 'json'
            })
            .done(function (response) {
                showError('Printing is not implemented yet.');
                def.reject();
            })
            .fail(function (response) {
                showAjaxError(response);
                def.reject();
            });

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
        var sendOperations = Utils.makeNoRecursionGuard(function (silent) {

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
                url: getFilterUrl('pushoperationupdates'),
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

        var receiveAndSendOperations = Utils.makeNoRecursionGuard(function () {

            var // a deferred that will cause the quit handler to wait for the AJAX request
                quitDelay = createQuitDelay();

            // first, check if the server has new operations for me
            $.ajax({
                type: 'GET',
                url: getFilterUrl('pulloperationupdates'),
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

            // In debug mode, stop polling.
            // Advantage 1: Less debug output in FireBug (http-get)
            // Advantage 2: Simulate a slow/lost connection
            if (!debugMode) {
                timeout = timeout || 1000;

                if (operationsTimer) {                      // If it running, restart - don't send too many updates while the user is typing.
                    window.clearTimeout(operationsTimer);   // If we change this, and decide to not restart, then make sure that we don't start twice
                }
                operationsTimer = window.setTimeout(function () {
                    operationsTimer = null;
                    receiveAndSendOperations();
                }, timeout);
            }
        }

        // methods ============================================================

        /**
         * Returns the infostore file descriptor of the edited document.
         */
        app.getFileDescriptor = function () {
            return file;
        };

        /**
         * Returns the editor instance.
         */
        app.getEditor = function () {
            return editor;
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
                win.show();
                updateTitles();
                editor.grabFocus();
                def.resolve();
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
            return file ? load() : app.show();
        };

        app.save = function () {
            return saveOrFlush('exportdocument');
        };

        app.flush = function () {
            return saveOrFlush('savedocument');
        };

        app.print = print;

        app.failSave = function () {
            var point = { file: file, debugMode: debugMode };
            return { module: MODULE_NAME, point: point };
        };

        app.failRestore = function (point) {
            initializeApp(point);
            updateDebugMode();
            return app.load();
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

        /**
         * Destructs the application. Will be called automatically in a forced
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

        // craete controller and register editors
        controller = new Controller(app)
            .registerEditor(editors[Editor.TextMode.RICH])
            .registerEditor(editors[Editor.TextMode.PLAIN], /^(view|action|debug)\//);

        // editor view
        view = new View(controller);

        // add plain-text editor and operations output console to debug table
        view.getDebugTable().append(
            $('<tr>').append(
                $('<td>').append(editors[Editor.TextMode.PLAIN].getNode()),
                $('<td>').append(editors.output.node)
            )
        );

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

    } // createApplication()

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (options) {

            var // get file descriptor from options
                file = Utils.getObjectOption(options, 'file', null),

                // find running editor application
                runningApps = file ? ox.ui.App.get(MODULE_NAME).filter(function (app) {
                    var appFile = app.getFileDescriptor();
                    // TODO: check file version too?
                    return _.isObject(appFile) &&
                        (file.id === appFile.id) &&
                        (file.folder_id === appFile.folder_id);
                }) : [];

            return runningApps.length ? runningApps[0] : createApplication(options);
        }
    };

});
