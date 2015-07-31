/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/util', [
    'io.ox/core/http'
], function (CoreHTTP) {

    'use strict';

    var Util = {};

    // constants --------------------------------------------------------------
    /**
     * Maps the file categories of the OX Viewer model to Font Awesome icon classes.
     */
    Util.CATEGORY_ICON_MAP = {
        'file': 'fa-file-o',
        'txt': 'fa-file-text-o',
        'doc': 'fa-file-word-o',
        'ppt': 'fa-file-powerpoint-o',
        'xls': 'fa-file-excel-o',
        'image': 'fa-file-image-o',
        'video': 'fa-file-video-o',
        'audio': 'fa-file-audio-o',
        'pdf': 'fa-file-pdf-o'
    };

    /**
     * Shortens a String and returns a result object containing the original
     * and two Strings clipped to normal and short max length.
     *
     * @param {String} str
     *  The input String.
     *
     * @param {Object} options
     *  Additional parameters
     *
     * @param {Number} [options.maxNormal = 40]
     *  The max length for the String clipped to normal length.
     *
     * @param {Number} [options.maxShort = 26]
     *  The max length for the String clipped to short length.
     *
     * @param {String} [options.charpos = 'middle']
     *  The position of the ellipsis char, 'end' or 'middle'.
     *
     * @param {String} [options.char = '\u2026']
     *  The ellipsis char.
     *
     * @returns {Object}
     *  {String} title: the original or an empty String
     *  {String} data-label-normal: the String clipped to normal length
     *  {String} data-label-short: the String clipped to short length
     */
    Util.getClippedLabels = function (str, options) {

        var opt = _.extend({
                maxNormal: 40,
                maxShort: 26,
                charpos: 'middle'
            }, options || {}),

            text = String(str || '').trim(),

            normal = _.noI18n(_.ellipsis(text, _.extend(opt, { max: opt.maxNormal }))),
            short = _.noI18n(_.ellipsis(text, _.extend(opt, { max: opt.maxShort })));

        return {
            title: text,
            'aria-label': text,
            'data-label-normal': normal,
            'data-label-short': short
        };
    };

    /**
     * Set a clipped label and the title to the given node according to the device type.
     *
     * Shortens a String and returns a result object containing the original
     * and two clipped Strings.
     *
     * @param {jQuery|DOM} node
     *  The node to be labeled.
     *
     * @param {String} str
     *  The label String.
     *
     * @param {String} [charpos = 'middle']
     *  The position of the ellipsis char, 'middle' or 'end'.
     */
    Util.setClippedLabel = function (node, str, charpos) {

        var attr = Util.getClippedLabels (str, charpos);

        node = (node instanceof $) ? node : $(node);
        node.attr(attr).addClass('viewer-responsive-label');
    };

    /**
     * Sets a CSS to indicate if current device is a 'smartphone' or 'tablet'
     * to the given DOM node.
     *
     * @param {jQuery|DOM} node
     *  The node to be labeled.
     */
    Util.setDeviceClass = function (node) {
        node = (node instanceof $) ? node : $(node);
        node.addClass( _.device('smartphone') ? 'smartphone' : (_.device('tablet') ? 'tablet' : '') );
    };

    /**
     * Returns the Font Awesome icon class for the file category of the
     * given OX Viewer model.
     *
     * @param {Object} model
     *  The OX Viewer model.
     *
     * @returns {String}
     *  The Font Awesome icon class String.
     */
    Util.getIconClass = function (model) {
        if (!model) {
            return Util.CATEGORY_ICON_MAP.file;
        }
        var fileType = model.getFileType(),
            iconClass = Util.CATEGORY_ICON_MAP[fileType] || Util.CATEGORY_ICON_MAP.file;

        return iconClass;
    };

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
     *  @param {String} source
     *   the source of the file model.
     */
    Util.getConvertParams = function (model, extraData) {
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
            case 'guard':
                paramExtension = {
                    source: 'guard',
                    guardUrl: encodeURIComponent(model.get('guardUrl')),
                    mimetype: (model.get('meta').OrigMime === undefined ?
                        encodeURIComponent(model.get('file_mimetype')) :
                        encodeURIComponent(model.get('meta').OrigMime))
                };
                break;
            default: break;
        }

        // return the default params, combined with possible
        // paramExtension, combined with possible addtional data
        if (paramExtension && paramExtension.length) {
            defaultParams = _.extend(defaultParams, paramExtension);
        }

        if (extraData && extraData.length) {
            defaultParams = _.extend(defaultParams, extraData);
        }

        return defaultParams;
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

    /**
     * Restricts the passed value to the specified numeric range.
     *
     * @param {Number} value
     *  The value to be restricted to the given range.
     *
     * @param {Number} min
     *  The lower border of the range.
     *
     * @param {Number} max
     *  The upper border of the range.
     *
     * @returns {Number}
     *  The passed value, if inside the given range, otherwise either the lower
     *  or upper border.
     */
    Util.minMax = function (value, min, max) {
        return Math.min(Math.max(value, min), max);
    };

    return Util;
});
