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

define('io.ox/office/tk/apphelper', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // static class AppHelper =================================================

    var AppHelper = {};

    // document filters -------------------------------------------------------

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

    // application object -----------------------------------------------------

    /**
     * Tries to find a running application which is working on a file described
     * in the passed options object.
     *
     * @param {String} moduleName
     *  The application type identifier.
     *
     * @param {Object} options
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

        return runningApps.length ? runningApps[0] : null;
    };

    /**
     * Creates a new ox.ui.App application object of the specified type, and
     * performs basic initialization steps.
     *
     * @param {String} moduleName
     *  The application type identifier.
     *
     * @param {Function} initAppHandler
     *  A callback function intended to initialize the application object.
     *  Receives the new application object as first parameter, and the passed
     *  options map as second parameter.
     *
     * @param options
     *  A map of options containing initialization data for the new application
     *  object.
     *
     * @returns {ox.ui.App}
     *  The new application object.
     */
    AppHelper.createApplication = function (moduleName, initAppHandler, options) {

        var // the OX application object
            app = ox.ui.createApp({ name: moduleName }),

            // file descriptor created by the Files application (InfoStore)
            file = null;

        // methods ------------------------------------------------------------

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
        app.getDocumentFilterUrl = function (action, options) {

            var // the descriptor of the file loaded by the application
                file = app.getFileDescriptor();

            // build a default options map, and add the passed options
            options = Utils.extendOptions({
                action: action,
                session: ox.session,
                uid: app.getUniqueId(),
                id: file.id,
                folder_id: file.folder_id,
                filename: file.filename
            }, options);

            // build and return the result URL
            return ox.apiRoot + '/oxodocumentfilter?' + _(options).map(function (value, name) { return name + '=' + value; }).join('&');
        };

        app.hasFileDescriptor = function () {
            return _.isObject(file);
        };

        app.getFileDescriptor = function () {
            return file;
        };

        app.setFileDescriptor = function (options) {
            // only set new file descriptor, do not change it
            if (_.isNull(file)) {
                file = Utils.getObjectOption(options, 'file', null);
            }
        };

        // initialization -----------------------------------------------------

        // initialize file descriptor (options may be empty yet, e.g. in fail restore)
        app.setFileDescriptor(options);

        // call the initialization handler
        initAppHandler(app, options);

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
     * @param options
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
