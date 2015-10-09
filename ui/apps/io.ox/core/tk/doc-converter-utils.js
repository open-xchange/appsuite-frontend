/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/tk/doc-converter-utils', [
    'io.ox/core/http'
], function (CoreHTTP) {

    'use strict';

    /**
     * Provides static methods for communication with the document converter.
     */
    var Utils = {};

    // constants --------------------------------------------------------------

    /**
     * The name of the document converter server module.
     */
    Utils.CONVERTER_MODULE_NAME = 'oxodocumentconverter';

    /**
     * The magic module id to source map.
     */
    Utils.MODULE_SOURCE_MAP = {
        1: 'calendar',
        4: 'tasks',
        7: 'contacts'
    };

    // static methods ---------------------------------------------------------

    /**
     * Creates and returns the URL of a document converter request.
     *
     * @param {Object} [params]
     *  Additional parameters to be inserted into the URL (optional).
     *
     * @param {Object} [options]
     *  Optional parameters:
     *  @param {Boolean} [options.encodeUrl=false]
     *      If set to true, special characters not allowed in URLs will be
     *      encoded.
     *
     * @returns {String|Undefined}
     *  The final URL of the server request; or undefined,
     *  if the current session is invalid.
     */
    Utils.getConverterUrl = function (params, options) {

        // return nothing if no session is present
        if (!ox.session || !ox.ui.App.getCurrentApp()) {
            return;
        }

        var currentAppUniqueID = ox.ui.App.getCurrentApp().get('uniqueID'),
            encodeUrl = options && options.encodeUrl,
            module = Utils.CONVERTER_MODULE_NAME;

        // add default parameters (session and UID), and file parameters
        params = _.extend({ session: ox.session, uid: currentAppUniqueID }, params);

        // build and return the resulting URL
        return ox.apiRoot + '/' + module + '?' + _.map(params, function (value, name) { return name + '=' + (encodeUrl ? encodeURIComponent(value) : value); }).join('&');
    };

    /**
     * Creates and returns the URL of a document converter request.
     * Special characters not allowed in URLs will be encoded.
     *
     * @param {FilesAPI.Model} model
     *  The Drive file model.
     *
     * @param {Object} [params]
     *  Additional parameters to be inserted into the URL (optional).
     *
     * @returns {String|Undefined}
     *  The final URL of the server request; or undefined,
     *  if the current session is invalid.
     */
    Utils.getEncodedConverterUrl = function (model, params) {
        return Utils.getConverterUrl(Utils.getConvertParams(model, params), { encodeUrl: true });
    };

    /**
     * Starts the thumbnail conversion job.
     *
     * @param {FilesAPI.Model} model
     *  The Drive file model.
     *
     * @returns {jQuery.Promise}
     *  The promise from document converter request.
     */
    Utils.beginConvert = function (model) {

        var params = {
            action: 'convertdocument',
            convert_format: 'image',
            convert_action: 'beginconvert'
        };

        return Utils.sendConverterRequest(model, params);
    };

    /**
     * Ends the thumbnail conversion job.
     *
     * @param {FilesAPI.Model} model
     *  The Drive file model.
     *
     * @param {String} jobId
     *  The conversion job ID.
     *
     * @returns {jQuery.Promise}
     *  The promise from document converter request.
     */
    Utils.endConvert = function (model, jobId) {
        if (!jobId) {
            return $.Deferred().reject();
        }

        var params = {
            action: 'convertdocument',
            convert_action: 'endconvert',
            job_id: jobId
        };

        return Utils.sendConverterRequest(model, params);
    };

    /**
     * Sends a request to the document converter.
     *
     * @param {Object} [params]
     *  An object containing additional converter parameters.
     *
     * @returns {jQuery.Promise}
     *  The promise from the Ajax request enriched with an abort method.
     */
    Utils.sendConverterRequest = function (model, params) {

        if (!model || !ox.ui.App.getCurrentApp()) {
            return $.Deferred().reject();
        }

        var // converter parameters passed to the server request
            converterParams = Utils.getConvertParams(model, params),
            // properties passed to the server request
            requestProps = { module: Utils.CONVERTER_MODULE_NAME, params: converterParams },
            // the Deferred object representing the core AJAX request
            ajaxRequest = null,
            // the Promise returned by this method
            promise = null;

        // send the AJAX request
        ajaxRequest = CoreHTTP.GET(requestProps);

        // reject, if the response contains an error; otherwise resolve.
        // e.g. the document endconvert request does not return a response in case of success.
        promise = ajaxRequest.then(function (response) {
            return (response && response.error) ? $.Deferred().reject(response) : $.Deferred().resolve(response);
        });

        // add an abort() method, forward invocation to AJAX request
        return _.extend(promise, { abort: function () { ajaxRequest.abort(); } });
    };

    /**
     * Build necessary parameters for the document conversion to PDF.
     * Also add proprietary parameters for Mail attachments, PIM attachments and Guard files.
     *
     * @param {FilesAPI.Model} model
     *  The Drive file model.
     *
     * @param {Object} [extraParams]
     *  An object with additional parameters to add.
     *
     * @returns {Object}
     *  An object containing the converter parameters.
     */
    Utils.getConvertParams = function (model, extraParams) {

        var // proprietary parameters for Mail, PIM or Guard
            proprietaryParams = Utils.getProprietaryParams(model),
            // default converter parameters
            defaultParams = {
                action: 'getdocument',
                documentformat: 'pdf',
                priority: 'instant',
                session: ox.session,
                filename: model.get('filename'),
                id: model.get('id'),
                folder_id: model.get('folder_id'),
                mimetype: model.get('file_mimetype'),
                version: model.get('version'),
                nocache: _.uniqueId() // needed to trick the browser
            };

        // add application UID
        if (ox.ui.App.getCurrentApp()) {
            defaultParams.uid = ox.ui.App.getCurrentApp().get('uniqueID');
        }

        // return the combined parameters
        return _.extend(defaultParams, proprietaryParams, extraParams);
    };

    /**
     * Returns the proprietary converter parameters for the given model
     * if the model represents a mail attachment, PIM attachment or a Guard file.
     *
     * @param {FilesAPI.Model} model
     *  The Drive file model.
     *
     * @returns {Object|null}
     *  An object containing the proprietary converter parameters or null.
     */
    Utils.getProprietaryParams = function (model) {

        var // the original mail and PIM attachment model data
            originalModel = model.get('origData'),
            // the PIM module id
            moduleId = model.get('module');

        if (model.isMailAttachment()) {
            return {
                id: originalModel.mail.id,
                source: 'mail',
                attached: model.get('id')
            };

        } else if (model.isPIMAttachment()) {
            return {
                source: Utils.MODULE_SOURCE_MAP[moduleId],
                attached: originalModel.attached,
                module: moduleId
            };

        } else if (model.isGuard()) {
            return {
                source: 'guard',
                guardUrl: model.get('guardUrl'),
                mimetype: model.get('meta').OrigMime || model.get('file_mimetype')
            };
        }

        return null;
    };

    return Utils;
});
