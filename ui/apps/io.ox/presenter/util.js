/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/presenter/util', [
    'io.ox/core/http'
], function (CoreHTTP) {

    'use strict';

    var Util = {};

    /**
     * Creates and returns the URL of a server request.
     *
     * @param {Object} [params]
     *  Additional parameters inserted into the URL.
     *
     * @returns {String|Undefined}
     *  The final URL of the server request; or undefined, if the
     *  application is not connected to a document file, or the current
     *  session is invalid.
     */
    Util.getConverterUrl = function (params) {

        // return nothing if no file is present
        if (!ox.session) {
            return;
        }

        var currentAppUniqueID = ox.ui.App.getCurrentApp().get('uniqueID'),
            module = 'oxodocumentconverter';

        // add default parameters (session and UID), and file parameters
        params = _.extend({ session: ox.session, uid: currentAppUniqueID }, params);

        // build and return the resulting URL
        return ox.apiRoot + '/' + module + '?' + _.map(params, function (value, name) { return name + '=' + value; }).join('&');

    };

    /**
     * Sends a request to the document converter.
     *
     * @params {Object} params
     *  an object containing converter parameters.
     *
     * @returns {jQuery.Promise}
     *  the promise from the Ajax request enriched with an abort method.
     */
    Util.sendConverterRequest = function (file, params) {

        if (!ox.ui.App.getCurrentApp()) {
            return;
        }

        var converterParams = _.extend(params, {
                session: ox.session,
                uid: ox.ui.App.getCurrentApp().get('uniqueID'),
                id: file.id,
                folder_id: file.folder_id,
                filename: file.filename,
                version: file.version
            }),
            // properties passed to the server request
            requestProps = { module:'oxodocumentconverter', params: converterParams },
            // the Deferred object representing the core AJAX request
            ajaxRequest = null,
            // the Promise returned by this method
            promise = null;

        // send the AJAX request
        ajaxRequest = CoreHTTP.GET(requestProps);

        promise = ajaxRequest.then(function (response) {
            var def = $.Deferred();
            // TODO temp workaround, because document endconvert request does not return any response
            if (!response) {
                return { data: {} };
            }
            return response.error ? def.reject(response).promise() : response;
        });

        // add an abort() method, forward invocation to AJAX request
        return _.extend(promise, { abort: function () { ajaxRequest.abort(); } });
    };

    /**
     * Starts the thumbnail conversion job.
     *
     * @param {String} jobId
     *  the conversion job ID.
     *
     * @returns {jQuery.Promise}
     *  the promise from document converter request.
     */
    Util.beginConvert = function (file) {
        if (!file) {
            return;
        }
        var params = {
            action: 'convertdocument',
            convert_format: 'image',
            convert_action: 'beginconvert'
        };
        return Util.sendConverterRequest(file, params);
    };

    /**
     * Ends the thumbnail conversion job.
     *
     * @param {String} jobId
     *  the conversion job ID.
     *
     * @returns {jQuery.Promise}
     *  the promise from document converter request.
     */
    Util.endConvert = function (file, jobId) {
        if (!jobId) {
            return;
        }
        var params = {
            action: 'convertdocument',
            convert_action: 'endconvert',
            job_id: jobId
        };
        return Util.sendConverterRequest(file, params);
    };

    /**
     *  Build necessary params for the document conversion to PDF.
     *  Also adds proprietary properties of Mail and PIM attachment objects.
     *
     *  @param {Object} model
     *   the file model (Files API).
     */
    Util.getConvertParams = function (model) {
        var originalModel = model.get('origData'),
            defaultParams = {
                action: 'getdocument',
                filename: encodeURIComponent(model.get('filename')),
                id: encodeURIComponent(model.get('id')),
                folder_id: encodeURIComponent(model.get('folder_id')),
                documentformat: 'pdf',
                priority: 'instant',
                mimetype: encodeURIComponent(model.get('file_mimetype')),
                nocache: _.uniqueId() // needed to trick the browser
            },
            paramExtension;
        switch (model.get('source')) {
            case 'mail':
                paramExtension = {
                    id: originalModel.mail.id,
                    source: 'mail',
                    attached: model.get('id')
                };
                break;
            case 'pim':
                var moduleId = model.get('module');
                paramExtension = {
                    source: this.MODULE_SOURCE_MAP[moduleId],
                    attached: originalModel.attached,
                    module: moduleId
                };
                break;
            default:
                return defaultParams;
        }
        return _.extend(defaultParams, paramExtension);
    };

    /**
     * Detect visible nodes from given nodes array.
     *
     * @returns {Array} visibleNodes
     *  an array of indices of visible nodes.
     */
    Util.getVisibleNodes = function (nodes) {
        var visibleNodes = [];
        // Whether the page element is visible in the viewport, wholly or partially.
        function isNodeVisible(node) {
            var nodeBoundingRect = node.getBoundingClientRect();
            function isInWindow(verticalPosition) {
                return verticalPosition >= 0 && verticalPosition <= window.innerHeight;
            }
            return isInWindow(nodeBoundingRect.top) ||
                isInWindow(nodeBoundingRect.bottom) ||
                (nodeBoundingRect.top < 0 && nodeBoundingRect.bottom > window.innerHeight);
        }
        // return the visible pages
        _.each(nodes, function (element, index) {
            if (!isNodeVisible(element)) { return; }
            visibleNodes.push(index + 1);
        });
        return visibleNodes;
    };

    Util.createAbortableDeferred = function (abortFunction) {
        return _.extend($.Deferred(), {
            abort: abortFunction
        });
    };

    return Util;

});
