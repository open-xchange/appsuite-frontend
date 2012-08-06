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

    // functional -------------------------------------------------------------

    /**
     * Wraps the passed function, protecting it from being called
     * recursively.
     *
     * @param {Function} func
     *  The original function that needs to be protected against recursive
     *  calls.
     *
     * @param {Object} [context]
     *  The calling context used to invoke the wrapped function.
     *
     * @returns {Function}
     *  A wrapper function that initially calls the wrapped function and
     *  returns its value. When called recursively while running (directly
     *  or indirectly in the same call stack, or even asynchronously), it
     *  simply returns undefined instead of calling the wrapped function
     *  again.
     */
    AppHelper.makeNoRecursionGuard = function (func, context) {
        var running = false;
        return function () {
            if (!running) {
                try {
                    running = true;
                    return func.apply(context, arguments);
                } finally {
                    running = false;
                }
            }
        };
    };

    // document filters -------------------------------------------------------

    /**
     * Returns the URL passed to AJAX calls used to convert a document file
     * with the 'oxodocumentfilter' service.
     *
     * @param {Object} app
     *  The OX application object.
     *
     * @param {String} action
     *  The name of the action to be passed to the document filter.
     *
     * @param {String} [format]
     *  The file format name, used by specific actions.
     *
     * @returns {String}
     *  The filter URL.
     */
    AppHelper.getDocumentFilterUrl = function (app, action, format) {

        var // the descriptor of the file loaded by the application
            file = app.getFileDescriptor();

        return ox.apiRoot +
            '/oxodocumentfilter' +
            '?action=' + action +
            '&id=' + file.id +
            '&folder_id=' + file.folder_id +
            '&version=' + file.version +
            '&filename=' + file.filename +
            '&session=' + ox.session +
            '&uid=' + app.getUniqueId() +
            (format ? ('&filter_format=' + format) : '');
    };

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

    AppHelper.getRunningApplication = function (moduleName, options) {

        var // get file descriptor from options
            file = Utils.getObjectOption(options, 'file', null),

            // find running editor application
            runningApps = file ? ox.ui.App.get(moduleName).filter(function (app) {
                var appFile = app.getFileDescriptor();
                // TODO: check file version too?
                return _.isObject(appFile) &&
                    (file.id === appFile.id) &&
                    (file.folder_id === appFile.folder_id);
            }) : [];

        return runningApps.length ? runningApps[0] : null;
    };

    AppHelper.createApplication = function (moduleName, initAppHandler, options) {

        var // the OX application object
            app = ox.ui.createApp({ name: moduleName });

        // call the initialization handler
        initAppHandler(app, options);

        return app;
    };

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
