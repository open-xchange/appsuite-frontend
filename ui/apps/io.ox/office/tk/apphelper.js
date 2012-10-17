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

define('io.ox/office/tk/apphelper',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/toolbarconfig'
     ], function (Utils, ToolBarConfiguration) {

    'use strict';

    // class ApplicationBase ==================================================

    /**
     * A mix-in class that defines common public methods for an office
     * application object.
     *
     * @constructor
     *
     * @extends ox.ui.App
     *
     * @param {Object} options
     *  A map of options containing initialization data for the new application
     *  object.
     */
    function ApplicationBase(options) {

        var // FileStore file descriptor of the document edited by this application
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
         */
        this.setFileDescriptor = function (newFile) {
            // only set new file descriptor, do not change it
            if (_.isNull(file) && _.isObject(newFile)) {
                file = newFile;
            }
        };

        this.getFileName = function () {
            return (file && _.isString(file.filename)) ? file.filename : null;
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
         * @returns {String}
         *  The created URL.
         */
        this.buildServiceUrl = function (service, options) {

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
         *  Additional options that affect the creation of the filter URL. Each
         *  option will be inserted into the URL as name/value pair separated
         *  by an equality sign. The different options are separated by
         *  ampersand characters.
         *
         * @returns {String}
         *  The filter URL.
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
         * @return {ApplicationBase}
         *  A reference to this application object.
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

    } // class ApplicationBase

    // static class AppHelper =================================================

    var AppHelper = {};

    // AJAX and file system ---------------------------------------------------

    /**
     * Extracts the result data object from the passed response object of
     * an AJAX import request.
     *
     * @param {Object} response
     *  The response object of the AJAX request.
     *
     * @return {Object|Undefined}
     *  The result data object, if existing, otherwise undefined.
     */
    AppHelper.extractAjaxResultData = function (response) {

        // check that the AJAX response is an object
        if (!_.isObject(response)) {
            return;
        }

        // convert JSON result string to object (may throw)
        if (_.isString(response.data)) {
            try {
                response.data = JSON.parse(response.data);
            } catch (ex) {
                return;
            }
        }

        // check that the data attribute is an object
        if (!_.isObject(response.data)) {
            return;
        }

        // response data object is valid, return it
        return response.data;
    };

    /**
     * Extracts a string attribute from the passed response object of an AJAX
     * import request.
     *
     * @param {Object} response
     *  The response object of the AJAX request.
     *
     * @param {String} attribName
     *  The name of the attribute contained in the response data object.
     *
     * @return {String|Undefined}
     *  The attribute value, if existing, otherwise undefined.
     */
    AppHelper.extractAjaxStringResult = function (response, attribName) {

        var // the result data
            data = AppHelper.extractAjaxResultData(response);

        // check that the result data object contains a string attribute
        if (!_.isObject(data) || !_.isString(data[attribName])) {
            return;
        }

        // the result data object is valid, return the attribute value
        return data[attribName];
    };

    /**
     * Reads the specified file and returns a deferred's promise that will be
     * resolved or rejected depending on the result of the read operation. The
     * file will be converted to a data URL containing the file contents as
     * Base-64 encoded data and passed to the promise object.
     *
     * @param {File} file
     *  The file descriptor.
     *
     * @returns {jQuery.Promise}
     *  The promise of a deferred that will be resolved with the result object
     *  containing the data URL, or rejected if the read operation failed.
     */
    AppHelper.readFileAsDataUrl = function (file) {

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
            reader.readAsDataURL(file);

        } else {
            // file reader not supported
            def.reject();
        }

        // return the deferred result
        return def.promise();
    };

    // application ------------------------------------------------------------

    /**
     * Returns a configuration object that allows to register buttons and other
     * control elements in the header tool bar of the application window.
     * Registration is done once for all instances of the specified application
     * type. The elements in the tool bar will be generated according to this
     * registration every time an application window becomes visible.
     *
     * @param {String} moduleName
     *  The application type identifier.
     */
    AppHelper.configureWindowToolBar = function (moduleName) {
        return new ToolBarConfiguration(moduleName);
    };

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
    AppHelper.getRunningApplication = function (moduleName, options) {

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
            Utils.warn('AppHelper.getRunningApplication(): found multiple applications for the same file.');
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
     * @param {Function} ApplicationClass
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
    AppHelper.createApplication = function (moduleName, ApplicationClass, options) {

        var // the base application object
            app = ox.ui.createApp({ name: moduleName });

        // mix-in constructor for common methods
        ApplicationBase.call(app, options);
        // mix-in constructor for methods specific for the application type
        ApplicationClass.call(app, options);

        return app;
    };

    /**
     * Tries to find a running application which is working on a file described
     * in the passed options object (see method AppHelper.getRunningApplication()
     * for details). If no such application exists, creates a new application
     * object (see method AppHelper.createApplication() for details).
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
    AppHelper.getOrCreateApplication = function (moduleName, initAppHandler, options) {

        var // try to find a running application
            app = AppHelper.getRunningApplication(moduleName, options);

        // no running application: create and initialize a new application object
        if (!_.isObject(app)) {
            app = AppHelper.createApplication(moduleName, initAppHandler, options);
        }

        return app;
    };

    // exports ================================================================

    return AppHelper;

});
