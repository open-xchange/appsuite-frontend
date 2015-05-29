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

        // reject, if the response contains 'hasErrors:true'
        promise = ajaxRequest.then(function (response) {
            return response.error ? $.Deferred().reject(response) : response;
        });

        // add an abort() method, forward invocation to AJAX request
        return _.extend(promise, { abort: function () { ajaxRequest.abort(); } });
    };

    /**
     * Creates thumbnail image of a document page.
     *
     * @param {Object} file
     *  an OX Viewer file descriptor.
     *
     * @param {Object} params
     *  @param {String} params.jobID
     *   conversion job ID from the document converter.
     *  @param {String} params.pageNumber
     *   a document page number
     *  @param {String} params.width
     *   thumbnail width in pixels.
     *  @param {String} params.height
     *   thumbnail height in pixels.
     *  @param {String} params.zoom
     *   thumbnail image zoon level.
     *
     * @returns {jQuery} image
     *  the image node as jQuery element.
     */
    Util.createDocumentThumbnailImage = function (file, params) {
        var imageUrlParams = _.extend({
                action: 'convertdocument',
                convert_action: 'getpage',
                id: file.id,
                folder_id: file.folder_id,
                filename: file.filename,
                version: file.version
            }, {
                job_id: params.jobID,
                page_number: params.pageNumber,
                target_format: params.format,
                target_width: params.width,
                target_height: params.height,
                target_zoom: params.zoom
            }),
            image = $('<img class="thumbnail-image">'),
            imageUrl = Util.getConverterUrl(imageUrlParams);
        image.attr('src', imageUrl);
        return image;
    };

    /**
     * Ends the thumbnail conversion job.
     *
     * @param {String} jobId
     *  the conversion job ID
     *
     * @returns {jQuery.Promise}
     */
    Util.endConvertJob = function (jobId) {
        if (!jobId) {
            return;
        }
        var params = {
            action: 'convertdocument',
            convert_action: 'endconvert',
            job_id: jobId
        };
        return Util.sendConverterRequest(params);
    };

    return Util;
});
