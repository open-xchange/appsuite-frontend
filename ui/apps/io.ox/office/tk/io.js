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

define('io.ox/office/tk/io',
    ['io.ox/core/http',
     'io.ox/office/tk/utils',
     'gettext!io.ox/office/main'
    ], function (http, Utils, gt) {

    'use strict';

    // static class IO ========================================================

    /**
     * Provides static methods for server/client communication and host file
     * system access.
     */
    var IO = {};

    // public methods ---------------------------------------------------------

    /**
     * Creates a function that returns a Deferred object which will be resolved
     * or rejected depending on the result of the passed filter callback
     * function. Intended to be used in Deferred chains to modify the state of
     * a Deferred object depending on the result data.
     *
     * @param {Function} filter
     *  A function that receives and filters the response of a resolved
     *  Deferred object as first parameter. If this function returns undefined,
     *  the Deferred object created by the method will be rejected. Otherwise,
     *  the Deferred object will be resolved with the return value of this
     *  filter function.
     *
     * @param {Object} [context]
     *  The context object that will be bound to the passed filter fucntion.
     *
     * @returns {Function}
     *  A new function that returns a Deferred object that has been resolved or
     *  rejected depending on the result of the passed filter callback
     *  function.
     */
    IO.createDeferredFilter = function (filter, context) {
        return function (response) {
            var def = $.Deferred(),
                value = _.isObject(response) ? filter.call(context, response) : undefined;
            return _.isUndefined(value) ? def.reject() : def.resolve(value);
        };
    };

    /**
     * Sends a request to the server and returns the promise of a Deferred
     * object waiting for the response.
     *
     * @param {Object} options
     *  Additional options. The following options are supported:
     *  @param {String} [options.method='GET']
     *      The request method. Must be an upper-case string (for example,
     *      'GET', 'POST', etc.). Defaults to 'GET'.
     *  @param {String} options.module
     *      The name of the server module that will receive the request.
     *  @param {Object} [options.params]
     *      Parameters that will be inserted into the request URL (method GET),
     *      or into the request body (method POST).
     *  @param {Function} [options.resultFilter]
     *      A function that will be called if the request returns successfully,
     *      and filters the resulting 'data' object returned by the request.
     *      Receives the 'data' object as first parameter. If this function
     *      returns undefined, the entire request will be rejected. Otherwise,
     *      the request will be resolved with the return value of this function
     *      instead of the complete 'data' object.
     *
     * @returns {jQuery.Promise}
     *  The promise of the request. Will be resolved with the 'data' object
     *  returned by the response, if available; or the valid return value of
     *  the result filter callback function, if specified. Otherwise, the
     *  promise will be rejected.
     */
    IO.sendRequest = function (options) {

        var // extract the request method
            method = Utils.getStringOption(options, 'method', 'GET'),
            // extract the result filter callback
            resultFilter = Utils.getFunctionOption(options, 'resultFilter'),
            // the Deferred object result of the core request
            request = null;

        // remove the internal options
        delete options.method;
        delete options.resultFilter;

        // send the request
        request = http[method](options);

        // filter the returned data object
        if (_.isFunction(resultFilter)) {
            // convert passed filter to a function that returns a Deferred object based on the filter
            resultFilter = IO.createDeferredFilter(resultFilter);
            // filter the result of the original request
            request = request.then(resultFilter);
        }

        return request.promise();
    };

    /**
     * Reads the specified file and returns the promise of a Deferred object
     * that will be resolved or rejected depending on the result of the read
     * operation. The file will be converted to a data URL containing the file
     * contents as Base-64 encoded data and passed to the resolved Promise.
     *
     * @param {File} fileDesc
     *  The descriptor of the file to be loaded.
     *
     * @returns {jQuery.Promise}
     *  The Promise of a Deferred object that will be resolved with the result
     *  object containing the data URL, or rejected if the read operation
     *  failed. If the file size is known, the Promise will be notified about
     *  the progress of the operation (a floating-point number between 0.0 and
     *  1.0).
     */
    IO.readClientFileAsDataUrl = function (fileDesc) {

        var // Deferred result object
            def = $.Deferred(),
            // create a browser file reader instance
            reader = window.FileReader ? new window.FileReader() : null;

        if (reader) {

            // register the load event handler, Deferred object will be resolved with data URL
            reader.onload = function (event) {
                if (event && event.target && _.isString(event.target.result)) {
                    def.resolve(event.target.result);
                } else {
                    def.reject();
                }
            };

            // register error event handlers, Deferred object will be rejected
            reader.onerror = reader.onabort = function (event) {
                def.reject();
            };

            // register progress handler, Deferred object will be notified
            reader.onprogress = function (event) {
                if (event.lengthComputable) {
                    def.notify(event.loaded / event.total);
                }
            };

            // read the file and generate a data URL
            reader.readAsDataURL(fileDesc);

        } else {
            // file reader not supported
            def.reject();
        }

        // return the Deferred result object
        return def.promise();
    };

    // exports ================================================================

    return IO;

});
