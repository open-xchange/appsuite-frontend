/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/core/viewer/io', [
    'io.ox/core/http',
    'io.ox/core/viewer/util'
], function (CoreHTTP, Util) {

    var IO = {};

    //The name of the document converter server module.
    IO.CONVERTER_MODULE_NAME = 'oxodocumentconverter';

    /**
     * Sends a request to the server and returns the promise of a Deferred
     * object waiting for the response.
     *
     * @param {String} module
     *  The name of the server module that will receive the request.
     *
     * @param {Object} params
     *  Parameters that will be inserted into the request URL (method GET), or
     *  into the request body (method POST).
     *
     * @param {Object} [options]
     *  Optional parameters:
     *  @param {String} [options.method='GET']
     *      The request method. Must be an upper-case string (for example,
     *      'GET', 'POST', etc.). Defaults to 'GET'.
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
     *  promise will be rejected. Contains the additional method 'abort()' that
     *  allows to abort the running request which rejects the promise. Calling
     *  this method has no effect, if the request is finished already.
     */
    IO.sendRequest = function (module, params, options) {

        var // extract the request method
            method = Util.getStringOption(options, 'method', 'GET'),
            // extract the result filter callback
            resultFilter = Util.getFunctionOption(options, 'resultFilter'),
            // properties passed to the server request
            requestProps = { module: module, params: params },
            // the Deferred object representing the core AJAX request
            ajaxRequest = null,
            // the Promise returned by this method
            promise = null;

        // send the AJAX request
        ajaxRequest = CoreHTTP[method](requestProps);

        // reject, if the response contains 'hasErrors:true'
        promise = ajaxRequest.then(function (response) {
            return Util.getBooleanOption(response, 'hasErrors', false) ? $.Deferred().reject(response) : response;
        });

        // filter the result of the original request according to the passed filter callback
        if (_.isFunction(resultFilter)) {
            promise = promise.then(IO.createDeferredFilter(resultFilter));
        }

        // add an abort() method, forward invocation to AJAX request
        return _.extend(promise, {
            abort: function () {
                ajaxRequest.abort();
            }
        });
    };

    return IO;
});
