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

define('io.ox/office/tk/application',
    ['io.ox/files/api',
     'io.ox/office/tk/utils',
     'io.ox/office/tk/io',
     'gettext!io.ox/office/main'
    ], function (FilesAPI, Utils, IO, gt) {

    'use strict';

    // class Application ======================================================

    /**
     * A mix-in class that defines common public methods for an application
     * that is based on a document file.
     *
     * @constructor
     *
     * @extends ox.ui.App
     *
     * @param {Object} launchOptions
     *  A map of options containing initialization data for the new application
     *  object.
     */
    function Application(launchOptions) {

        var // self reference
            self = this,

            // file descriptor of the document edited by this application
            file = Utils.getObjectOption(launchOptions, 'file', null),

            // all registered launch handlers
            launchHandlers = [],

            // all registered quit handlers
            quitHandlers = [];

        // private methods ----------------------------------------------------

        function callDeferredHandlers(handlers) {

            var // execute all handlers and store their results in an array
                results = _(handlers).map(function (handler) { return handler.call(self); });

            // accumulate all results into a single Deferred object
            return $.when.apply($, results);
        }

        // public methods -----------------------------------------------------

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
         * @returns {Application}
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
         * @returns {Application}
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
                module: Application.FILTER_MODULE_NAME,
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
            return ox.apiRoot + '/' + Application.FILTER_MODULE_NAME + '?' + _(options).map(function (value, name) { return name + '=' + value; }).join('&');
        };

        // application setup --------------------------------------------------

        /**
         * Registers a launch handler function that will be executed when the
         * application will be launched.
         *
         * @param {Function} launchHandler
         *  A function that will be called when the application launches. Will
         *  be called in the context of this application instance. May return a
         *  Deferred object, which must be resolved or rejected by the launch
         *  handler function.
         *
         * @returns {Application}
         *  A reference to this application instance.
         */
        this.registerLaunchHandler = function (launchHandler) {
            launchHandlers.push(launchHandler);
            return this;
        };

        /**
         * Registers a quit handler function that will be executed before the
         * application will be closed.
         *
         * @param {Function} quitHandler
         *  A function that will be called before the application will be
         *  closed. Will be called in the context of this application instance.
         *  May return a Deferred object, which must be resolved or rejected by
         *  the quit handler function. If the Deferred object will be rejected,
         *  the application remains alive.
         *
         * @returns {Application}
         *  A reference to this application instance.
         */
        this.registerQuitHandler = function (quitHandler) {
            quitHandlers.push(quitHandler);
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
         * @returns {Application}
         *  A reference to this application instance.
         */
        this.registerEventHandler = function (target, events, handler) {

            // bind event handler to events
            $(target).on(events, handler);

            // unbind handler when application is closed
            this.on('docs:app:quit', function () {
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
         * @returns {Application}
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

        // application runtime ------------------------------------------------

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

        this.destroy = function () {
        };

        // initialization -----------------------------------------------------

        // call all registered launch handlers
        this.setLauncher(function () {
            return callDeferredHandlers(launchHandlers).then(
                function () { self.trigger('docs:app:launch'); },
                function () { self.trigger('docs:app:launch:error'); }
            ).promise();
        });
        delete this.setLauncher;

        // call all registered quit handlers
        this.setQuit(function () {
            return callDeferredHandlers(quitHandlers).then(
                function () { self.trigger('docs:app:quit').destroy(); },
                function () { self.trigger('docs:app:quit:veto'); }
            ).promise();
        });
        delete this.setQuit;

        // set application title to current file name
        this.updateTitle();

    } // class Application

    // constants --------------------------------------------------------------

    /**
     * The name of the document filter server module.
     */
    Application.FILTER_MODULE_NAME = 'oxodocumentfilter';


    // exports ================================================================

    return _.makeExtendable(Application);

});
