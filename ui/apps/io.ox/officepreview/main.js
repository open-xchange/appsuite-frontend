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
 * @author Kai Ahrens <kai.ahrens@open-xchange.com>
 */

define('io.ox/officepreview/main',
    ['io.ox/files/api',
     'io.ox/officepreview/toolbar',
     'io.ox/officepreview/controller',
     'io.ox/officepreview/preview',
     'gettext!io.ox/office/main',
     'io.ox/office/actions',
     'less!io.ox/office/main.css'
    ], function (FilesApi, ToolBar, Controller, Preview, gt) {

    'use strict';

    var // application identifier
        MODULE_NAME = 'io.ox/officepreview';

    // class PreviewToolBar ======================================================

    /**
     * Creates and returns a new instance of the main preview tool bar.
     *
     * @constructor
     */
    var PreviewToolBar = ToolBar.extend({

        constructor: function () {

            // call base constructor
            ToolBar.call(this);

            // add all tool bar controls
            this
            .addButtonGroup()
                .addButton('action/first', { icon: gt('icon-officepreview-first'), tooltip: gt('Go to first page') })
                .addButton('action/previous', { icon: gt('icon-officepreview-previous'), tooltip: gt('Go to previous page') })
                .addButton('action/next', { icon: gt('icon-officepreview-next'), tooltip: gt('Go to next page') })
                .addButton('action/last', { icon: gt('icon-officepreview-last'), tooltip: gt('Go to last page') })
            .end();

        } // end of constructor

    }); // class PreviewToolBar

    // class PreviewController =================================================

    var PreviewController = Controller.extend({

        constructor: function (app) {

            var // current preview having the focus
                preview = null;

            // base constructor -----------------------------------------------

            Controller.call(this, {

                'action/first': {
                    enable: function () { return preview.hasFirst(); },
                    set: function (list) { preview.first(); preview.grabFocus(); }
                },
                'action/previous': {
                    enable: function () { return preview.hasPrevious(); },
                    set: function (list) { preview.left(); preview.grabFocus(); }
                },
                'action/next': {
                    enable: function () { return preview.hasNext(); },
                    set: function (list) { preview.right(); preview.grabFocus(); }
                },
                'action/last': {
                    enable: function () { return preview.hasLast(); },
                    set: function (list) {preview.last(); preview.grabFocus(); }
                }

            });

            // methods --------------------------------------------------------

            /**
             * Registers a new preview instance. If the preview has the browser
             * focus, this controller will use it as target for item actions
             * triggered by any registered view component.
             */
            this.registerPreview = function (newPreview, supportedItems) {
                newPreview
                    .on('focus', _.bind(function (event, focused) {
                        if (focused && (preview !== newPreview)) {
                            // set as current preview
                            preview = newPreview;
                            // update view components
                            this.enableAndDisable(supportedItems);
                        }
                    }, this));
                    /*
                    .on('operation', _.bind(function () {
                        this.update(['action/undo', 'action/redo', /^character\//, /^paragraph\//]);
                    }, this))
                    .on('selectionChanged', _.bind(function () {
                        this.update([/^character\//, /^paragraph\//]);
                    }, this));
                    */
                return this;
            };

        } // end of constructor

    }); // class PreviewController

    // createApplication() ====================================================

    function createApplication(options) {

        var // OX application object
            app = ox.ui.createApp({ name: MODULE_NAME }),

            // application window
            win = null,

            // connection to infostore file
            file = null,

            // controller as single connection point between preview and view elements
            controller = new PreviewController(app),

            // main tool bar
            toolbar = new PreviewToolBar(),

            // primary preview used in actions.
            preview = null;
           
        // private functions --------------------------------------------------

        function initializeApp(options) {
            file = _.isObject(options) ? options.file : null;
        }

        /**
         * Returns the URL passed to the AJAX calls used to convert a document
         * file into an HTML document.
         */
        function getFilterUrl(action) {
            return file && (ox.apiRoot +
                '/oxodocumentfilter' +
                '?action=' + action +
                '&id=' + file.id +
                '&folder_id=' + file.folder_id +
                '&version=' + file.version +
                '&filename=' + file.filename +
                '&session=' + ox.session);
        }

        /**
         * Shows a closable error message above the preview.
         *
         * @param {String} message
         *  The message text.
         *
         * @param {String} [title='Error']
         *  The title of the error message. Defaults to 'Error'.
         */
        function showError(message, title) {
            win.nodes.appPane
                .find('.alert').remove().end()
                .prepend($.alert(title || gt('Error'), message));
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
            win.setTitle(gt('OX OfficePreview') + ' - ' + fileName);
        }

        /**
         * Recalculates the size of the preview frame according to the current
         * view port size.
         */
        function windowResizeHandler() {
            win.nodes.appPane.height(window.innerHeight - win.nodes.appPane.offset().top);
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

            // do not detach when hiding to keep edit selection alive
            win.detachable = false;

            // create panes and attach them to the main window
            win.nodes.main.addClass('io-ox-officepreview-main').append(
                // top pane for tool bars
                win.nodes.toolPane = $('<div>').addClass('io-ox-officepreview-tool-pane').append(toolbar.getNode()),
                // main application container
                win.nodes.appPane = $('<div>').addClass('container').append(preview.getNode())
            );

            // update preview 'div' on window size change
            $(window).resize(windowResizeHandler);

            // trigger all window resize handlers on 'show' events
            win.on('show', function () {
                $(window).resize();
                // disable FF spell checking. TODO: better solution...
                $('body').attr('spellcheck', false);
            });
        }

        /**
         * The handler function that will be called when the application shuts
         * down. 
         *
         * @returns {jQuery.Deferred}
         *  A deferred that will be resolved if the application can be closed
         *  (either if it is unchanged, or the user has chosen to save or lose
         *  the changes), or will be rejected if the application must remain
         *  alive (user has cancelled the dialog, save operation failed).
         */
        function quitHandler() {
            var def = $.Deferred().done(app.destroy);
            def.resolve();

            return def;
        }

        function importHTML(response) {

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
                /*_(response.data.operations).each(function (operation) {
                    if (!_.isObject(operation) || !_.isString(operation.name)) {
                        throw 'Invalid element in operations list.';
                    }
                });
                */

            } catch (ex) {
                // reject deferred on error
                return def.reject(ex);
            }

            // resolve the deferred with the operations list
            return def.resolve(response.data);
        }
        
        // methods ============================================================

        /**
         * Returns the infostore file descriptor of the edited document.
         */
        app.getFileDescriptor = function () {
            return file;
        };

        /**
         * Returns the preview instance.
         */
        app.getPreview = function () {
            return preview;
        };

        /**
         * Shows the application window and activates the preview.
         *
         * @returns {jQuery.Deferred}
         *  A deferred that is resolved if the application has been made
         *  visible, or rejected if the application is in an invalid state.
         */
        app.show = function () {
            var def = $.Deferred();

            if (win && preview) {
                win.show();
                updateTitles();
                preview.grabFocus();
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
            var def = null;

            // do not load twice (may be called repeatedly from app launcher)
            app.load = app.show;

            // do not try to load, if file descriptor is missing
            if (!file) {
                return app.show();
            }

            // show application window
            win.show().busy();
            $(window).resize();
            updateTitles();

            // initialize the deferred to be returned
            def = $.Deferred().always(function () {
                win.idle();
                preview.setModified(false);
                preview.grabFocus(true);
            });

            // load the file
            $.ajax({
                type: 'GET',
                url: getFilterUrl('importdocument'),
                dataType: 'json'
            })
            .done(function (response) {
                importHTML(response)
                .done(function (operations) {
                    preview.applyOperations(operations, false, true);
                    def.resolve();
                })
                .fail(function (ex) {
                    showExceptionError(ex);
                    preview.initDocument();
                    def.reject();
                });
            })
            .fail(function (response) {
                showAjaxError(response);
                preview.initDocument();
                def.reject();
            });

            return def;
        };

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
         * Destructs the application. Will be called automatically in a forced
         * quit, but has to be called manually for a regular quit (e.g. from
         * window close button).
         */
        app.destroy = function () {
            $(window).off('resize', windowResizeHandler);
            controller.destroy();
            toolbar.destroy();
            app = win = toolbar = controller = preview = null;
        };

        // initialization -----------------------------------------------------

        // create the preview
        /*
         
         _(Editor.TextMode).each(function (textMode) {
            var // class names for the editor
                classes = 'io-ox-office-editor user-select-text ' + textMode,
                // the editor root node
                node = $('<div>', { contenteditable: true }).addClass(classes);
            editors[textMode] = new Editor(node, textMode);
        });
        */
        preview = new Preview();

        // register GUI elements and preview at the controller
        controller
            .registerViewComponent(toolbar)
            .registerPreview(preview);

        // configure OX application
        initializeApp(options);

        return app.setLauncher(launchHandler).setQuit(quitHandler);

    } // createApplication()

    // exports ================================================================

    // io.ox.launch() expects an object with the method getApp()
    return {
        getApp: function (options) {

            var // get file descriptor from options
                file = _.isObject(options) ? options.file : null,

                // find running preview application
                running = _.isObject(file) ? ox.ui.App.get(MODULE_NAME).filter(function (app) {
                    var appFile = app.getFileDescriptor();
                    // TODO: check file version too?
                    return _.isObject(appFile) &&
                        (file.id === appFile.id) &&
                        (file.folder_id === appFile.folder_id);
                }) : [];

            return running.length ? running[0] : createApplication(options);
        }
    };

});
