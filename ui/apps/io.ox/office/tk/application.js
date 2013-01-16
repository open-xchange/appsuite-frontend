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
     'gettext!io.ox/office/main'
    ], function (FilesAPI, Utils, gt) {

    'use strict';

    // class FileBasedApplication =============================================

    /**
     * A mix-in class that defines common public methods for an application
     * that is based on a document file.
     *
     * @constructor
     *
     * @extends ox.ui.App
     *
     * @param {Object} options
     *  A map of options containing initialization data for the new application
     *  object.
     */
    function FileBasedApplication(options) {

        var // self reference
            self = this,

            // FileStore file descriptor of the document edited by this application
            file = Utils.getObjectOption(options, 'file', null);

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
         * @returns {FileBasedApplication}
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
         * Returns an URL that can be passed to AJAX calls to communicate with
         * a specific server-side service.
         *
         * @param {String} service
         *  The name of the service.
         *
         * @param {Object} [options]
         *  Additional options that affect the creation of the URL. Each option
         *  will be inserted into the URL as name/value pair separated by an
         *  equality sign. The different options are separated by ampersand
         *  characters.
         *
         * @returns {String|Undefined}
         *  The created URL with the current session identifier (parameter
         *  'session') and unique application identifier (parameter 'uid'); or
         *  undefined, if there is no valid session identifier.
         */
        this.buildServiceUrl = function (service, options) {

            if (!ox.session) {
                Utils.warn('FileBasedApplication.buildServiceUrl(): missing session');
                return;
            }

            // build a default options map, and add the passed options
            options = Utils.extendOptions({
                session: ox.session,
                uid: this.get('uniqueID')
            }, options);

            // build and return the resulting URL
            return ox.apiRoot + '/' + service + '?' + _(options).map(function (value, name) { return name + '=' + value; }).join('&');
        };

        /**
         * Returns the URL passed to AJAX calls used to convert a document file
         * with the 'oxodocumentfilter' service.
         *
         * @param {String} action
         *  The name of the action to be passed to the document filter.
         *
         * @param {Object} [options]
         *  Additional options that affect the creation of the filter URL. See
         *  method FileBasedApplication.buildServiceUrl() for details.
         *  Information about the file currently edited will be inserted
         *  automatically.
         *
         * @returns {String|Undefined}
         *  The final filter URL; or undefined, if there is no valid session
         *  identifier available.
         */
        this.getDocumentFilterUrl = function (action, options) {

            // build a default options map, and add the passed options
            options = Utils.extendOptions({
                action: action,
                id: file.id,
                folder_id: file.folder_id,
                filename: file.filename,
                version: file.version
            }, options);

            // build and return the resulting URL
            return this.buildServiceUrl('oxodocumentfilter', options);
        };

        /**
         * Sends an AJAX request to the specified URL and returns a deferred
         * waiting for the result. By default, a GET request with data type set
         * to the value 'json' will be sent.
         *
         * @param {Object} [options]
         *  Additional options that will be passed to the AJAX request. Expects
         *  the target URL in the option 'options.url'. If the URL is missing
         *  or empty, no AJAX request will be sent, and the returned deferred
         *  will be rejected immediately.
         *
         * @returns {jQuery.Promise}
         *  The promise object of the AJAX request.
         */
        this.sendAjaxRequest = function (options) {

            var // the URL from the passed options object
                url = Utils.getStringOption(options, 'url', ''),
                // the result deferred
                def = null;

            // URL must be a non-empty string
            if (url.length === 0) {
                def = $.Deferred().reject();
            } else {
                def = $.ajax(Utils.extendOptions({ type: 'GET', dataType: 'json' }, options));
            }

            return def.promise();
        };

        /**
         * Extracts the result data object from the passed response object of
         * an AJAX request.
         *
         * @param {Object} response
         *  The response object of the AJAX request.
         *
         * @return {Object|Undefined}
         *  The result data object, if existing, otherwise undefined.
         */
        this.extractAjaxResultData = function (response) {

            var // the data object of the passed AJAX response
                data = Utils.getOption(response, 'data');

            // convert JSON result string to object (may throw), TODO: still required?
            if (_.isString(data)) {
                try {
                    data = JSON.parse(data);
                } catch (ex) {
                    return;
                }
            }

            // check that the data attribute is an object
            return _.isObject(data) ? data : undefined;
        };

        /**
         * Reads the specified file and returns the promise of a deferred that
         * will be resolved or rejected depending on the result of the read
         * operation. The file will be converted to a data URL containing the
         * file contents as Base-64 encoded data and passed to the resolved
         * promise.
         *
         * @param {File} fileDesc
         *  The descriptor of the file to be loaded.
         *
         * @returns {jQuery.Promise}
         *  The promise of a deferred that will be resolved with the result object
         *  containing the data URL, or rejected if the read operation failed.
         */
        this.readClientFileAsDataUrl = function (fileDesc) {

            var // deferred result object
                def = $.Deferred(),
                // create a browser file reader instance
                reader = window.FileReader ? new window.FileReader() : null;

            if (reader) {

                // register the load event handler, deferred will be resolved with data URL
                reader.onload = function (event) {
                    if (event && event.target && _.isString(event.target.result)) {
                        def.resolve(event.target.result);
                    } else {
                        def.reject();
                    }
                };

                // register error event handlers, deferred will be rejected
                reader.onerror = reader.onabort = function (event) {
                    def.reject();
                };

                // register progress handler, deferred will be notified with percentage
                reader.onprogress = function (event) {
                    if (event.lengthComputable) {
                        def.notify(Math.round((event.loaded / event.total) * 100));
                    }
                };

                // read the file and generate a data URL
                reader.readAsDataURL(fileDesc);

            } else {
                // file reader not supported
                def.reject();
            }

            // return the deferred result
            return def.promise();
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
         * Renames the current file and updates the GUI accordingly.
         *
         * @param {String} shortName
         *  The new short file name (without extension).
         *
         * @returns {jQuery.Promise}
         *  The promise of a deferred object that will be resolved when the
         *  file has been renamed successfully (the new full file name will be
         *  passed); or that will be rejected, if renaming the file has failed.
         */
        this.rename = function (shortName) {

            var // the file extension
                extension = this.getFileExtension(),

                // the result deferred
                def = $.Deferred().done(function (fileName) {
                    file.filename = fileName;
                    self.updateTitle();
                });

            if (_.isString(shortName) && (shortName.length > 0) && file) {
                if (shortName === this.getShortFileName()) {
                    def.resolve(file.filename);
                } else {
                    this.sendAjaxRequest({
                        url: this.getDocumentFilterUrl('renamedocument', { filename: shortName + '.' + extension })
                    })
                    .pipe(function (response) {
                        var data = self.extractAjaxResultData(response);
                        return Utils.getStringOption(data, 'filename');
                    })
                    .done(function (fileName) {
                        if (fileName) {
                            FilesAPI.propagate('change', file).then(
                                function () { def.resolve(fileName); },
                                function () { def.reject(); }
                            );
                        } else {
                            def.reject();
                        }
                    })
                    .fail(function () {
                        def.reject();
                    });
                }
            } else {
                def.reject();
            }

            return def.promise();
        };

        /**
         * Updates the application title according to the current file name. If
         * the application does not contain a file descriptor, shows the
         * localized word 'Unnamed' as title.
         *
         * @returns {FileBasedApplication}
         *  A reference to this application instance.
         */
        this.updateTitle = function () {
            this.setTitle(this.getShortFileName() || gt('Unnamed'));
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
         * @returns {FileBasedApplication}
         *  A reference to this application instance.
         */
        this.registerEventHandler = function (target, events, handler) {

            // bind event handler to events
            $(target).on(events, handler);

            // unbind handler when the application window triggers the 'quit' event
            this.getWindow().on('quit', function () {
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
         * @returns {FileBasedApplication}
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

        // initialization -----------------------------------------------------

        // set application title to current file name
        this.updateTitle();

    } // class FileBasedApplication

    // static class Application ===============================================

    var Application = {};

    /**
     * Tries to find a running application which is working on a file described
     * in the passed options object.
     *
     * @param {String} moduleName
     *  The application type identifier.
     *
     * @param {Object} [options]
     *  A map of options that may contain a file descriptor in 'options.file'.
     *  If existing, compares it with the file descriptors of all running
     *  applications with the specified module identifier (returned by their
     *  getFileDescriptor() method).
     *
     * @returns {ox.ui.App}
     *  A running application of the specified type with a matching file
     *  descriptor.
     */
    Application.getRunningApplication = function (moduleName, options) {

        var // get file descriptor from options
            file = Utils.getObjectOption(options, 'file', null),

            // find running editor application
            runningApps = file ? ox.ui.App.get(moduleName).filter(function (app) {
                var appFile = _.isFunction(app.getFileDescriptor) ? app.getFileDescriptor() : null;
                // TODO: check file version too?
                return _.isObject(appFile) &&
                    (file.id === appFile.id) &&
                    (file.folder_id === appFile.folder_id);
            }) : [];

        if (runningApps.length > 1) {
            Utils.warn('Application.getRunningApplication(): found multiple applications for the same file.');
        }
        return runningApps.length ? runningApps[0] : null;
    };

    /**
     * Creates a new ox.ui.App application object of the specified type, and
     * performs basic initialization steps.
     *
     * @param {String} moduleName
     *  The application type identifier.
     *
     * @param {Function} ApplicationMixinClass
     *  The constructor function of a mix-in class that will extend the core
     *  application object. Receives the passed options map as first parameter.
     *
     * @param {Object} [options]
     *  A map of options containing initialization data for the new application
     *  object.
     *
     * @returns {ox.ui.App}
     *  The new application object.
     */
    Application.createApplication = function (moduleName, ApplicationMixinClass, options) {

        var // the icon shown in the top bar launcher
            icon = Utils.getStringOption(options, 'icon'),
            // the base application object
            app = ox.ui.createApp({ name: moduleName, userContent: _.isString(icon), userContentIcon: icon });

        // mix-in constructor for common methods
        FileBasedApplication.call(app, options);
        // mix-in constructor for methods specific for the application type
        ApplicationMixinClass.call(app, options);

        return app;
    };

    /**
     * Tries to find a running application which is working on a file described
     * in the passed options object (see method Application.getRunningApplication()
     * for details). If no such application exists, creates a new application
     * object (see method Application.createApplication() for details).
     *
     * @param {String} moduleName
     *  The application type identifier.
     *
     * @param {Function} initAppHandler
     *  A callback function intended to initialize the new application object.
     *  Will not be used, if a running application has been found. Receives the
     *  new application object as first parameter, and the passed options map
     *  as second parameter.
     *
     * @param {Object} [options]
     *  A map of options containing initialization data for the new application
     *  object.
     *
     * @returns {ox.ui.App}
     *  A running application of the specified type with a matching file
     *  descriptor, or a newly created application object.
     */
    Application.getOrCreateApplication = function (moduleName, initAppHandler, options) {

        var // try to find a running application
            app = Application.getRunningApplication(moduleName, options);

        // no running application: create and initialize a new application object
        if (!_.isObject(app)) {
            app = Application.createApplication(moduleName, initAppHandler, options);
        }

        return app;
    };

    // exports ================================================================

    return Application;

});
